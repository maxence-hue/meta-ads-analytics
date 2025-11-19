"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Wand2, Palette, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

interface Brand {
  id: string
  name: string
  industry: string
  website: string
  colors: string[]
  typography: string
  description: string
  templatesUsed: number
}

const mockBrands: Brand[] = [
  {
    id: "brand1",
    name: "ADSolar",
    industry: "Énergie",
    website: "https://adsolar.fr",
    colors: ["#0F62FE", "#34A853", "#F4B400"],
    typography: "Inter / Poppins",
    description: "Solutions solaires intelligentes pour particuliers",
    templatesUsed: 23,
  },
  {
    id: "brand2",
    name: "Marketia",
    industry: "SaaS",
    website: "https://marketia.ai",
    colors: ["#7C3AED", "#FF80B5", "#FFD600"],
    typography: "Cal Sans / Inter",
    description: "Suite marketing IA pour e-commerce",
    templatesUsed: 18,
  },
]

export default function BrandsPage() {
  const [search, setSearch] = useState("")
  const { data } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      try {
        const res = await api.brands.list()
        return res.brands ?? mockBrands
      } catch {
        return mockBrands
      }
    },
  })

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary">Identité</p>
          <h1 className="text-3xl font-bold tracking-tight">Bibliothèque de marques</h1>
          <p className="text-muted-foreground">Scraper, harmoniser et déployer vos chartes graphiques.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/brands/scrape">
              <Wand2 className="h-4 w-4" /> Scraper un site
            </Link>
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nouvelle marque
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marques</CardTitle>
          <CardDescription>Centralisez logos, palettes, typographies et guidelines.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            placeholder="Rechercher une marque ou un site..."
            className="max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            {(data ?? mockBrands)
              .filter((brand: Brand) => brand.name.toLowerCase().includes(search.toLowerCase()))
              .map((brand: Brand) => (
                <motion.div whileHover={{ scale: 1.01 }} key={brand.id} className="rounded-2xl border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{brand.name}</h3>
                      <p className="text-sm text-muted-foreground">{brand.industry}</p>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" /> {brand.templatesUsed} templates
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{brand.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="flex gap-1">
                      {brand.colors.map((color: string) => (
                        <span key={color} className="h-6 w-6 rounded-full border" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Palette className="mr-1 inline h-3.5 w-3.5" /> {brand.typography}
                    </div>
                    <Link href={brand.website} className="text-xs text-primary">
                      {brand.website.replace("https://", "")}
                    </Link>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> Générer des créatives
                    </Button>
                    <Button size="sm">Ouvrir</Button>
                  </div>
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
