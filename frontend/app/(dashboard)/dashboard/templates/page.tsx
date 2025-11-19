"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Star, Flame, Plus } from "lucide-react"
import Image from "next/image"

const templates = [
  {
    id: "tpl1",
    name: "Modern Gradient",
    category: "conversion",
    formats: ["Feed", "Stories", "Reels"],
    avgCtr: 3.8,
    rating: 4.9,
    description: "Design vibrant avec CTA accentué",
    image: "/template-1.png",
  },
  {
    id: "tpl2",
    name: "Minimal Luxury",
    category: "premium",
    formats: ["Feed", "Stories"],
    avgCtr: 3.2,
    rating: 4.7,
    description: "Esthétique épurée pour marques luxueuses",
    image: "/template-2.png",
  },
  {
    id: "tpl3",
    name: "UGC Impact",
    category: "ugc",
    formats: ["Reels", "Stories"],
    avgCtr: 4.1,
    rating: 4.8,
    description: "Structure idéale pour témoignages vidéo",
    image: "/template-3.png",
  },
]

export default function TemplatesPage() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary">Créativité</p>
          <h1 className="text-3xl font-bold tracking-tight">Templates haute performance</h1>
          <p className="text-muted-foreground">Bibliothèque optimisée grâce à 1M+ de publicités analysées.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/creatives/new">
              <Sparkles className="h-4 w-4" /> Générer avec IA
            </Link>
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Créer un template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="conversion">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="conversion">Conversion</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="ugc">UGC</TabsTrigger>
            <TabsTrigger value="reels">Reels</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Input placeholder="Rechercher un template..." className="w-64" />
          </div>
        </div>

        <TabsContent value="conversion" className="mt-6 space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            {templates.map((template) => (
              <motion.div key={template.id} whileHover={{ scale: 1.01 }} className="rounded-2xl border bg-background">
                <Card className="h-full border-0 shadow-none">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{template.name}</CardTitle>
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400" /> {template.rating}
                      </Badge>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative h-48 w-full overflow-hidden rounded-xl border bg-muted">
                      <Image src={template.image} alt={template.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.formats.map((format) => (
                        <Badge key={format} variant="outline">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                      CTR moyen : <span className="font-semibold text-foreground">{template.avgCtr}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Voir les stats
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/creatives/new?template=${template.id}`}>Utiliser</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
