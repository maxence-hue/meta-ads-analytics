"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useCreatives, useCreativeLibrary } from "@/lib/hooks/useCreatives"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Folder,
  FolderOpen,
  Star,
  StarOff,
  MoreVertical,
  Download,
  Copy,
  Trash,
  Share2,
  Eye,
  Plus,
  Search,
  Grid3X3,
  List,
  Filter,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreativeLibraryProps {
  brandId?: string
  showFolders?: boolean
  viewMode?: "grid" | "list"
}

export function CreativeLibrary({ 
  brandId, 
  showFolders = true,
  viewMode: initialViewMode = "grid" 
}: CreativeLibraryProps) {
  const [viewMode, setViewMode] = useState(initialViewMode)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  
  const { 
    creatives, 
    isLoading, 
    deleteCreative, 
    duplicateCreative,
    exportCreative,
    publishCreative 
  } = useCreatives(brandId)
  
  const {
    folders,
    favorites,
    createFolder,
    moveCreative,
    toggleFavorite
  } = useCreativeLibrary()

  // Filtrer les créatives
  const filteredCreatives = creatives?.filter((creative: any) => {
    if (searchQuery && !creative.brand_name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (selectedFolder && creative.folder_id !== selectedFolder) {
      return false
    }
    return true
  }) || []

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder({ name: newFolderName, parentId: selectedFolder || undefined })
      setNewFolderName("")
      setIsCreatingFolder(false)
    }
  }

  const handleMoveToFolder = (creativeId: string, folderId: string) => {
    moveCreative({ creativeId, folderId })
  }

  const handleToggleFavorite = (creative: any) => {
    toggleFavorite({ creativeId: creative.id, isFavorite: creative.is_favorite })
  }

  const handleExport = async (creative: any, format?: string) => {
    await exportCreative(creative.id, format)
  }

  const handlePublish = (creative: any) => {
    publishCreative({ 
      id: creative.id, 
      platforms: ['facebook', 'instagram'] 
    })
  }

  const handleDuplicate = (creative: any) => {
    duplicateCreative(creative.id)
  }

  const handleDelete = (creative: any) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette créative ?')) {
      deleteCreative(creative.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher une créative..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Toutes les créatives</DropdownMenuItem>
              <DropdownMenuItem>Actives</DropdownMenuItem>
              <DropdownMenuItem>Brouillons</DropdownMenuItem>
              <DropdownMenuItem>En pause</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button asChild>
          <Link href="/dashboard/creatives/new">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle créative
          </Link>
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar avec dossiers */}
        {showFolders && (
          <aside className="w-64 space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Dossiers</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsCreatingFolder(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {isCreatingFolder && (
                <div className="mb-3 flex gap-2">
                  <Input
                    placeholder="Nom du dossier"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <Button size="sm" onClick={handleCreateFolder}>OK</Button>
                </div>
              )}

              <div className="space-y-1">
                <Button
                  variant={selectedFolder === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder(null)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Toutes les créatives
                </Button>

                {folders?.map((folder: any) => (
                  <Button
                    key={folder.id}
                    variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    {folder.name}
                    {folder.creatives_count > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {folder.creatives_count}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              <div className="mt-4 border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder('favorites')}
                >
                  <Star className="mr-2 h-4 w-4 text-yellow-500" />
                  Favoris
                  {favorites?.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {favorites.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </aside>
        )}

        {/* Grille/Liste de créatives */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : filteredCreatives.length === 0 ? (
            <Card>
              <CardContent className="flex h-96 flex-col items-center justify-center">
                <p className="text-xl font-medium">Aucune créative trouvée</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Créez votre première créative pour commencer
                </p>
                <Button asChild className="mt-6">
                  <Link href="/dashboard/creatives/new">
                    <Plus className="mr-2 h-4 w-4" /> Créer une créative
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCreatives.map((creative: any) => (
                <motion.div
                  key={creative.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="overflow-hidden">
                    <div className="relative aspect-video bg-muted">
                      {creative.preview_urls?.landscape ? (
                        <Image
                          src={creative.preview_urls.landscape}
                          alt={creative.brand_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Eye className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Actions overlay */}
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="sm" variant="secondary" onClick={() => handleExport(creative)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDuplicate(creative)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handlePublish(creative)}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Favorite button */}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-2 bg-white/80 backdrop-blur"
                        onClick={() => handleToggleFavorite(creative)}
                      >
                        {creative.is_favorite ? (
                          <Star className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Status badge */}
                      <Badge 
                        className="absolute left-2 top-2"
                        variant={creative.status === 'active' ? 'default' : 'secondary'}
                      >
                        {creative.status}
                      </Badge>
                    </div>

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{creative.brand_name}</CardTitle>
                          <CardDescription className="text-xs">
                            {creative.template_name} • {new Date(creative.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport(creative)}>
                              <Download className="mr-2 h-4 w-4" /> Exporter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(creative)}>
                              <Copy className="mr-2 h-4 w-4" /> Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePublish(creative)}>
                              <Share2 className="mr-2 h-4 w-4" /> Publier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(creative)}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium">Créative</th>
                      <th className="p-4 text-left text-sm font-medium">Template</th>
                      <th className="p-4 text-left text-sm font-medium">Status</th>
                      <th className="p-4 text-left text-sm font-medium">Créée le</th>
                      <th className="p-4 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCreatives.map((creative: any) => (
                      <tr key={creative.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-16 rounded bg-muted"></div>
                            <div>
                              <p className="font-medium">{creative.brand_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Score: {creative.validation_score}/100
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{creative.template_name}</td>
                        <td className="p-4">
                          <Badge variant={creative.status === 'active' ? 'default' : 'secondary'}>
                            {creative.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(creative.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleExport(creative)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDuplicate(creative)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDelete(creative)}
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
