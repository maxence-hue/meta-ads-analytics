"use client"

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useSocket } from './useSocket'
import { toast } from 'sonner'

export interface Creative {
  id: string
  brand_id: string
  template_id: string
  brand_name?: string
  template_name?: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  formats: {
    landscape?: string
    square?: string
    story?: string
  }
  form_data: any
  validation_score: number
  preview_urls?: {
    landscape?: string
    square?: string
    story?: string
  }
  created_at: string
  folder_id?: string
  is_favorite?: boolean
  campaign_ids?: string[]
}

export interface CreativeFolder {
  id: string
  name: string
  parent_id?: string
  creatives_count: number
  created_at: string
}

export function useCreatives(brandId?: string) {
  const queryClient = useQueryClient()
  const { connected, subscribe } = useSocket()

  // Liste des créatives
  const { data: creatives, isLoading } = useQuery({
    queryKey: ['creatives', brandId],
    queryFn: () => api.creatives.list({ brandId }),
  })

  // Créer une nouvelle créative
  const createMutation = useMutation({
    mutationFn: (data: { brandId: string; templateId: string; data: any }) => 
      api.creatives.create(data),
    onSuccess: (response) => {
      toast.success('Génération de créative lancée')
      // Surveiller le job via WebSocket
      if (response.jobId) {
        subscribe(`job:${response.jobId}`, (progress) => {
          console.log('Progression:', progress)
        })
      }
    },
    onError: (error) => {
      toast.error('Erreur lors de la création')
    }
  })

  // Générer des variations
  const generateVariationsMutation = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) => 
      api.creatives.generateVariations(id, count),
    onSuccess: () => {
      toast.success('Génération de variations lancée')
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
    }
  })

  // Dupliquer une créative
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.creatives.duplicate(id),
    onSuccess: () => {
      toast.success('Créative dupliquée')
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
    }
  })

  // Supprimer une créative
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.creatives.delete(id),
    onSuccess: () => {
      toast.success('Créative supprimée')
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
    }
  })

  // Exporter une créative
  const exportCreative = useCallback(async (id: string, format?: string) => {
    try {
      const response = await api.creatives.export(id, format)
      // Télécharger les fichiers
      if (response.data) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], 
          { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `creative-${id}-${format || 'all'}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Créative exportée')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
  }, [])

  // Publier sur les plateformes
  const publishMutation = useMutation({
    mutationFn: ({ id, platforms }: { id: string; platforms: string[] }) => 
      api.creatives.publish(id, platforms),
    onSuccess: () => {
      toast.success('Publication lancée')
    }
  })

  // Écouter les événements WebSocket
  useEffect(() => {
    if (connected) {
      const unsubscribe = subscribe('creative:generated', (data) => {
        queryClient.invalidateQueries({ queryKey: ['creatives'] })
        toast.success('Créative générée avec succès!')
      })
      return unsubscribe
    }
  }, [connected, subscribe, queryClient])

  return {
    creatives: creatives?.creatives || [],
    isLoading,
    createCreative: createMutation.mutate,
    generateVariations: generateVariationsMutation.mutate,
    duplicateCreative: duplicateMutation.mutate,
    deleteCreative: deleteMutation.mutate,
    exportCreative,
    publishCreative: publishMutation.mutate,
    isCreating: createMutation.isPending,
  }
}

// Hook pour la bibliothèque de créatives
export function useCreativeLibrary() {
  const queryClient = useQueryClient()

  // Dossiers
  const { data: folders } = useQuery({
    queryKey: ['library', 'folders'],
    queryFn: api.library.folders,
  })

  // Favoris
  const { data: favorites } = useQuery({
    queryKey: ['library', 'favorites'],
    queryFn: api.library.favorites,
  })

  // Créer un dossier
  const createFolderMutation = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) => 
      api.library.createFolder(name, parentId),
    onSuccess: () => {
      toast.success('Dossier créé')
      queryClient.invalidateQueries({ queryKey: ['library', 'folders'] })
    }
  })

  // Déplacer une créative
  const moveCreativeMutation = useMutation({
    mutationFn: ({ creativeId, folderId }: { creativeId: string; folderId: string }) => 
      api.library.moveCreative(creativeId, folderId),
    onSuccess: () => {
      toast.success('Créative déplacée')
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
    }
  })

  // Gérer les favoris
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ creativeId, isFavorite }: { creativeId: string; isFavorite: boolean }) => 
      isFavorite 
        ? api.library.removeFavorite(creativeId)
        : api.library.addFavorite(creativeId),
    onSuccess: (_, variables) => {
      toast.success(variables.isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris')
      queryClient.invalidateQueries({ queryKey: ['library', 'favorites'] })
    }
  })

  return {
    folders: folders || [],
    favorites: favorites || [],
    createFolder: createFolderMutation.mutate,
    moveCreative: moveCreativeMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
  }
}

// Hook pour une créative unique
export function useCreative(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['creative', id],
    queryFn: () => api.creatives.get(id),
    enabled: !!id,
  })

  const { data: analytics } = useQuery({
    queryKey: ['creative', id, 'analytics'],
    queryFn: () => api.creatives.analytics(id),
    enabled: !!id,
  })

  return {
    creative: data?.creative,
    analytics: analytics,
    isLoading,
  }
}
