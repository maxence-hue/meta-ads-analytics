'use client';

import { useState, useRef, useEffect } from 'react';
import { Image, Upload, Sparkles, Loader2, Palette, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import ImagePreviewModal from './ImagePreviewModal';

interface ImageGeneratorProps {
  campaign: any;
  onGenerate: (prompt: string, style: string) => void;
  generatedImage: string | null;
  loading: boolean;
  onUploadLogo: (file: File) => void;
  logoUrl: string | null;
  onImageValidated?: (imageUrl: string) => void;
}

export default function ImageGenerator({
  campaign,
  onGenerate,
  generatedImage,
  loading,
  onUploadLogo,
  logoUrl,
  onImageValidated
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(
    campaign?.visualConcept ||
    `${campaign?.theme || 'Modern'} advertising background for ${campaign?.name || 'product'}`
  );
  const [style, setStyle] = useState('realistic');
  const [customImage, setCustomImage] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [validatedImage, setValidatedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Ouvrir le modal automatiquement quand on clique sur générer
  useEffect(() => {
    if (loading) {
      setShowModal(true);
    }
  }, [loading]);

  // Fermer le modal et afficher l'image validée quand la génération est terminée
  useEffect(() => {
    if (!loading && generatedImage && showModal) {
      // L'image est générée, on garde le modal ouvert pour validation
      setImageLoading(false);
    }
  }, [loading, generatedImage, showModal]);

  const imageStyles = [
    { value: 'realistic', label: 'Réaliste', description: 'Photo professionnelle' },
    { value: 'illustration', label: 'Illustration', description: 'Art digital' },
    { value: 'abstract', label: 'Abstrait', description: 'Formes et couleurs' },
    { value: 'minimal', label: 'Minimaliste', description: 'Épuré et simple' },
    { value: 'vibrant', label: 'Vibrant', description: 'Couleurs vives' },
    { value: 'corporate', label: 'Corporate', description: 'Professionnel' },
    { value: 'lifestyle', label: 'Lifestyle', description: 'Vie quotidienne' },
    { value: '3d', label: '3D', description: 'Rendu 3D moderne' }
  ];

  const promptSuggestions = [
    `${campaign?.theme} background with abstract shapes`,
    `Professional ${campaign?.industry || 'business'} setting`,
    `Minimalist design with ${campaign?.visualStyle?.colors?.[0] || 'blue'} accents`,
    `Dynamic composition with energy and movement`,
    `Elegant and sophisticated product showcase`,
    `Nature-inspired background with organic elements`
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        // Handle custom image preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadLogo(file);
    }
  };

  const handleGenerate = () => {
    setImageLoading(true);
    setShowModal(true);
    onGenerate(prompt, style);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleValidateImage = () => {
    if (generatedImage) {
      setValidatedImage(generatedImage);
      setShowModal(false);
      if (onImageValidated) {
        onImageValidated(generatedImage);
      }
    }
  };

  const handleRegenerateImage = (newPrompt: string) => {
    setPrompt(newPrompt);
    onGenerate(newPrompt, style);
  };

  return (
    <>
      {/* Modal de prévisualisation */}
      <ImagePreviewModal
        isOpen={showModal}
        imageUrl={generatedImage}
        loading={loading}
        originalPrompt={prompt}
        onClose={handleCloseModal}
        onValidate={handleValidateImage}
        onRegenerate={handleRegenerateImage}
      />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Image de fond</h3>
          <p className="text-sm text-muted-foreground">
            Générez une image avec Gemini AI ou uploadez la vôtre
          </p>
        </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Générer avec IA</TabsTrigger>
          <TabsTrigger value="upload">Uploader</TabsTrigger>
        </TabsList>

        {/* Génération IA */}
        <TabsContent value="generate" className="space-y-4">
          <div>
            <Label htmlFor="prompt">Description de l'image (prompt)</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez l'image que vous souhaitez..."
              rows={3}
              className="mt-2"
            />

            {/* Suggestions de prompts */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setPrompt(suggestion)}
                  >
                    {suggestion.substring(0, 40)}...
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="style">Style d'image</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner un style" />
              </SelectTrigger>
              <SelectContent>
                {imageStyles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div>
                      <div className="font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {campaign?.visualStyle?.colors && (
            <div>
              <Label>Couleurs de la marque (détectées)</Label>
              <div className="flex gap-2 mt-2">
                {campaign.visualStyle.colors.map((color: string, i: number) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg border-2 border-border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ces couleurs seront utilisées dans la génération
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer l'image avec Gemini
              </>
            )}
          </Button>
        </TabsContent>

        {/* Upload personnalisé */}
        <TabsContent value="upload" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Uploader une image</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG ou WEBP • Max 10MB • Min 1080x1080px
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Sélectionner une image
                </Button>
              </div>
            </CardContent>
          </Card>

          {customImage && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Image sélectionnée:</p>
              <p className="text-sm text-muted-foreground">{customImage.name}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload du logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo de la marque</CardTitle>
        </CardHeader>
        <CardContent>
          {logoUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 w-auto object-contain bg-muted rounded p-2"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Logo uploadé</p>
                  <p className="text-xs text-muted-foreground">Sera ajouté sur les créatives</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                >
                  Changer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Optionnel • Le logo sera placé selon le layout choisi
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Uploader le logo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image générée */}
      {(generatedImage || loading) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Image générée</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Régénérer
                  </Button>
                  {generatedImage && !loading && !imageLoading && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={generatedImage} download>
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {(loading || imageLoading) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {loading ? 'Génération de l\'image...' : 'Chargement du rendu...'}
                    </p>
                  </div>
                )}
                {generatedImage && (
                  <img
                    src={generatedImage}
                    alt="Generated background"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                    onLoad={handleImageLoad}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </div>
    </>
  );
}
