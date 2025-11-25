import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCreativeStudioStore } from '@/store/creativeStudioStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import ImagePreviewModal from '@/components/creatives/ImagePreviewModal';

const STYLES = [
  { id: 'realistic', name: 'Photorealistic' },
  { id: 'minimal', name: 'Minimalist' },
  { id: '3d', name: '3D Render' },
  { id: 'illustration', name: 'Illustration' },
  { id: 'studio', name: 'Studio Lighting' },
];

export function AIGenPanel() {
  const { selectedBrand, updateCustomization, setIsGeneratingImage } = useCreativeStudioStore();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [showModal, setShowModal] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingImage(true);
      setShowModal(true); // Ouvrir le modal au début de la génération

      console.log('🚀 Démarrage génération image Gemini...', { prompt, style });

      // Appel correct à l'API factory.generateBackground
      const response = await api.factory.generateBackground(
        prompt,
        style,
        { theme: 'modern', visualStyle: { colors: selectedBrand?.colors } }, // campaign
        selectedBrand // brand
      );

      console.log('✅ Réponse API:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('✅ Image générée avec succès:', data);
      // L'API retourne imageUrl ou localPath
      setGeneratedImageUrl(data.imageUrl || data.localPath);
      setIsGeneratingImage(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur génération:', error);
      setIsGeneratingImage(false);
      setShowModal(false);
    }
  });

  const handleValidateImage = () => {
    if (generatedImageUrl) {
      updateCustomization('backgroundImage', generatedImageUrl);
      setShowModal(false);
    }
  };

  const handleRegenerateImage = (newPrompt: string) => {
    setPrompt(newPrompt);
    generateMutation.mutate();
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Modal de prévisualisation */}
      <ImagePreviewModal
        isOpen={showModal}
        imageUrl={generatedImageUrl}
        loading={generateMutation.isPending}
        originalPrompt={prompt}
        onClose={handleCloseModal}
        onValidate={handleValidateImage}
        onRegenerate={handleRegenerateImage}
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLES.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prompt</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the background image..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-slate-500">
            Tip: Mention lighting, textures, and mood.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending || !prompt}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Image with Gemini
            </>
          )}
        </Button>
      </div>
    </>
  );
}
