"use client"

import { useState } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import * as z from "zod"
import Image from "next/image"
import { toast } from "sonner"
import { useCreatives } from "@/lib/hooks/useCreatives"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  Sparkles,
  Upload,
  ChevronLeft,
  Layout,
  Monitor,
  Square,
  Check,
  ChevronRight,
  Loader2,
  Download,
  Image as ImageIcon,
  Smartphone,
  Wand2,
} from "lucide-react"
import { useCreativeStore } from "@/lib/stores/creative-store"
import { CreativePreview } from "@/components/creatives/creative-preview"
import { ColorPicker } from "@/components/ui/color-picker"

const formSchema = z.object({
  brandId: z.string({ required_error: "Sélectionnez une marque" }),
  templateId: z.string({ required_error: "Sélectionnez un template" }),
  headline: z.string().min(10).max(120),
  description: z.string().min(20).max(500),
  cta: z.string().min(2).max(30),
  primaryColor: z.string(),
  accentColor: z.string(),
  images: z.array(z.any()).optional(),
  format: z.enum(["all", "landscape", "square", "story"]),
  useAI: z.boolean().default(false),
  aiProvider: z.enum(["dalle", "stability"]).default("dalle"),
  imagePrompt: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const TEMPLATE_OPTIONS = ["modern", "minimal", "bold", "elegant", "playful", "urgent"]

export default function CreateCreativePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const { createCreative } = useCreatives()

  // Charger les brands et templates
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: api.brands.list,
  })

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.templates.list(),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandId: "",
      templateId: "",
      headline: "",
      description: "",
      cta: "En savoir plus",
      primaryColor: "#667eea",
      accentColor: "#42B883",
      images: [],
      format: "all",
      useAI: false,
      aiProvider: "dalle",
      imagePrompt: "",
    },
  })

  const onDrop = form.watch("images")

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      form.setValue("images", acceptedFiles)
    },
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: 10,
  })

  async function onSubmit(values: FormData) {
    try {
      setIsGenerating(true)

      // Préparer les données pour l'API
      const creativeData = {
        brandId: values.brandId,
        templateId: values.templateId,
        data: {
          headline: values.headline,
          description: values.description,
          cta: values.cta,
          primaryColor: values.primaryColor,
          accentColor: values.accentColor,
          format: values.format,
          generateImages: values.useAI,
          aiProvider: values.aiProvider,
          mainPrompt: values.imagePrompt,
          images: values.images,
        }
      }

      // Appel API pour créer la créative
      createCreative(creativeData, {
        onSuccess: (response: any) => {
          toast.success('Créative en cours de génération!')
          // Rediriger vers la liste des créatives
          router.push('/dashboard/creatives')
        },
        onError: () => {
          toast.error('Erreur lors de la génération')
          setIsGenerating(false)
        }
      } as any)
    } catch (error) {
      toast.error('Une erreur est survenue')
      setIsGenerating(false)
    }
  }

  return (
    <div className="container max-w-7xl space-y-8 py-10">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary">Nouveau workflow IA</p>
          <h1 className="text-3xl font-bold tracking-tight">Générateur intelligent de créatives</h1>
          <p className="text-muted-foreground">Configurez, personnalisez, prévisualisez puis exportez vos créatives Meta en moins de 2 minutes.</p>
        </div>
        <Badge variant="secondary" className="px-4 py-1 text-sm">
          <Sparkles className="mr-2 h-4 w-4" /> Mode collaboratif bientôt dispo
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid gap-6 md:grid-cols-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Configuration principale</CardTitle>
                    <CardDescription>Définissez la base de votre créative</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="brandId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marque</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une marque" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {brands?.brands?.map((brand: any) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              )) || [
                                <SelectItem key="1" value="1">ADSolar</SelectItem>,
                                <SelectItem key="2" value="2">Marketia</SelectItem>,
                                <SelectItem key="3" value="3">NeoFit</SelectItem>
                              ]}
                            </SelectContent>
                          </Select>
                          <FormDescription>La marque pour laquelle créer la créative</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="templateId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {templates?.templates?.map((template: any) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              )) || [
                                <SelectItem key="product-showcase" value="product-showcase">Product Showcase</SelectItem>,
                                <SelectItem key="sales-promotion" value="sales-promotion">Sales Promotion</SelectItem>,
                                <SelectItem key="social-proof" value="social-proof">Social Proof</SelectItem>,
                                <SelectItem key="minimal" value="minimal">Minimal</SelectItem>,
                                <SelectItem key="story-carousel" value="story-carousel">Story Carousel</SelectItem>
                              ]}
                            </SelectContent>
                          </Select>
                          <FormDescription>Le template pour la créative</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Economisez 30% sur vos factures" {...field} />
                          </FormControl>
                          <FormDescription>{field.value?.length ?? 0}/120 caractères</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea rows={5} {...field} />
                          </FormControl>
                          <FormDescription>{field.value?.length ?? 0}/500 caractères</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CTA</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Images & IA</CardTitle>
                    <CardDescription>Upload ou génération IA</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div>
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                          isDragActive ? "border-primary bg-primary/5" : "border-muted"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez des images ou cliquez pour sélectionner"}
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG jusqu'à 10 Mo</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="useAI"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-xl border px-4 py-3">
                            <div>
                              <FormLabel>Générer avec l'IA</FormLabel>
                              <FormDescription>Utilise DALL-E 3 ou Stability</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {form.watch("useAI") && (
                        <FormField
                          control={form.control}
                          name="aiProvider"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fournisseur IA</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="dalle">DALL-E 3</SelectItem>
                                  <SelectItem value="stability">Stability</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      {form.watch("useAI") && (
                        <FormField
                          control={form.control}
                          name="imagePrompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prompt IA</FormLabel>
                              <FormControl>
                                <Textarea rows={4} placeholder="Décrire l'image à générer..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Palette & styles</CardTitle>
                    <CardDescription>Respectez les couleurs de marque</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Couleur principale</FormLabel>
                          <div className="flex gap-3">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <ColorPicker color={field.value} onChange={field.onChange} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Couleur secondaire</FormLabel>
                          <div className="flex gap-3">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <ColorPicker color={field.value} onChange={field.onChange} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormLabel>Rayon des boutons</FormLabel>
                      <Slider defaultValue={[12]} max={32} step={1} />
                      <p className="text-xs text-muted-foreground">12px - Recommandé pour le style modern</p>
                    </div>

                    <div className="space-y-3">
                      <FormLabel>Intensité des ombres</FormLabel>
                      <Slider defaultValue={[60]} max={100} step={10} />
                    </div>
                  </CardContent>
                </Card>

                <div className="md:col-span-2 flex justify-end">
                  <Button type="button" size="lg" onClick={() => setCurrentStep(2)}>
                    Continuer
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Choix du template</CardTitle>
                    <CardDescription>Basé sur les performances réelles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((template) => (
                        <button
                          key={template}
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className={`relative aspect-[4/5] rounded-2xl border p-3 transition hover:border-primary`}
                        >
                          <div className="flex h-full items-center justify-center rounded-xl bg-muted">
                            <Layout className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <span className="absolute bottom-3 left-3 text-xs font-medium">Template #{template}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Retour
                  </Button>
                  <Button type="submit" size="lg" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" /> Générer les créatives
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu final</CardTitle>
                    <CardDescription>Vos créatives sont prêtes pour Meta Ads Manager</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        <TabsTrigger value="landscape">
                          <Monitor className="mr-2 h-4 w-4" /> Paysage
                        </TabsTrigger>
                        <TabsTrigger value="square">
                          <Square className="mr-2 h-4 w-4" /> Carré
                        </TabsTrigger>
                        <TabsTrigger value="story">
                          <Smartphone className="mr-2 h-4 w-4" /> Story
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="all" className="mt-6">
                        <div className="grid grid-cols-3 gap-6">
                          <CreativePreview format="landscape" data={MOCK_PREVIEWS.landscape} />
                          <CreativePreview format="square" data={MOCK_PREVIEWS.square} />
                          <CreativePreview format="story" data={MOCK_PREVIEWS.story} />
                        </div>
                      </TabsContent>
                      <TabsContent value="landscape">
                        <CreativePreview format="landscape" data={MOCK_PREVIEWS.landscape} />
                      </TabsContent>
                      <TabsContent value="square">
                        <CreativePreview format="square" data={MOCK_PREVIEWS.square} />
                      </TabsContent>
                      <TabsContent value="story">
                        <CreativePreview format="story" data={MOCK_PREVIEWS.story} />
                      </TabsContent>
                    </Tabs>
                    <div className="mt-6 flex justify-end">
                      <Button>
                      <Download className="mr-2 h-4 w-4" /> Exporter HTML/CSS
                    </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Form>
    </div>
  )
}

const MOCK_PREVIEWS = {
  landscape: {
    previewUrl: "/creative-1.png",
    validation: {
      valid: true,
      score: 96,
      warnings: ["Texte CTA légèrement long", "Ajouter un badge de promo"],
    },
  },
  square: {
    previewUrl: "/creative-2.png",
    validation: {
      valid: true,
      score: 92,
      warnings: ["Contraste texte/fond à améliorer"],
    },
  },
  story: {
    previewUrl: "/creative-3.png",
    validation: {
      valid: true,
      score: 94,
      warnings: [],
    },
  },
}
