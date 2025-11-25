'use client';

import { useState } from 'react';
import { X, Check, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  loading: boolean;
  originalPrompt: string;
  onClose: () => void;
  onValidate: () => void;
  onRegenerate: (newPrompt: string) => void;
}

export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  loading,
  originalPrompt,
  onClose,
  onValidate,
  onRegenerate
}: ImagePreviewModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [newPrompt, setNewPrompt] = useState(originalPrompt);

  const handleRegenerate = () => {
    onRegenerate(newPrompt);
    setEditMode(false);
  };

  const handleValidate = () => {
    onValidate();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop avec effet blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          onClick={!loading ? onClose : undefined}
        />

        {/* Contenu du modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative z-10 w-full max-w-5xl mx-4"
        >
          <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-2xl font-bold">
                  {loading ? 'Génération en cours...' : 'Prévisualisation de l\'image'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {loading
                    ? 'Gemini Imagen 4.0 génère votre image'
                    : 'Validez ou régénérez avec un nouveau prompt'}
                </p>
              </div>
              {!loading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Image */}
            <div className="p-8">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/50 border-4 border-border shadow-xl">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      <Sparkles className="h-16 w-16 text-primary mb-4" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                      <p className="text-lg font-medium text-foreground">
                        Génération de votre image...
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Cela peut prendre 10-30 secondes
                      </p>
                    </motion.div>

                    {/* Barre de progression animée */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{
                          duration: 20,
                          ease: 'linear'
                        }}
                      />
                    </div>
                  </div>
                ) : imageUrl ? (
                  <motion.img
                    src={imageUrl}
                    alt="Generated image"
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">Aucune image disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!loading && imageUrl && (
              <div className="p-6 border-t border-border bg-muted/30 space-y-4">
                {/* Mode édition du prompt */}
                {editMode ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label htmlFor="newPrompt">Modifier le prompt</Label>
                    <Textarea
                      id="newPrompt"
                      value={newPrompt}
                      onChange={(e) => setNewPrompt(e.target.value)}
                      placeholder="Décrivez les modifications souhaitées..."
                      rows={3}
                      className="resize-none"
                    />
                  </motion.div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Prompt utilisé:</p>
                    <p className="text-sm">{originalPrompt}</p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Annuler
                  </Button>

                  {editMode ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false);
                          setNewPrompt(originalPrompt);
                        }}
                        className="flex-1"
                      >
                        Retour
                      </Button>
                      <Button
                        onClick={handleRegenerate}
                        disabled={!newPrompt.trim()}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Régénérer
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(true)}
                        className="flex-1"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Modifier le prompt
                      </Button>
                      <Button
                        onClick={handleValidate}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Valider cette image
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
