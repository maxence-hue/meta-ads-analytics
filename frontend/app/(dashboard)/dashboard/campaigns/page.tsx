"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  BarChart3,
  Filter,
  Search,
  Plus,
} from "lucide-react"

const campaigns = [
  {
    id: "cmp1",
    name: "ADSolar – Winter Conversion",
    objective: "conversion",
    status: "active",
    spend: 4500,
    budget: 8000,
    ctr: 3.4,
    roas: 4.2,
    startDate: "2025-01-01",
    endDate: "2025-02-15",
  },
  {
    id: "cmp2",
    name: "Marketia – Awareness Reels",
    objective: "awareness",
    status: "paused",
    spend: 2200,
    budget: 5000,
    ctr: 1.8,
    roas: 0,
    startDate: "2024-12-10",
    endDate: "2025-01-10",
  },
  {
    id: "cmp3",
    name: "NeoFit – UGC Stories",
    objective: "engagement",
    status: "draft",
    spend: 0,
    budget: 3000,
    ctr: 0,
    roas: 0,
    startDate: "2025-02-20",
    endDate: "2025-03-20",
  },
]

const objectiveLabels: Record<string, string> = {
  awareness: "Notoriété",
  traffic: "Trafic",
  conversion: "Conversion",
  engagement: "Engagement",
}

const statusVariants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  paused: { label: "En pause", variant: "secondary" },
  draft: { label: "Brouillon", variant: "outline" },
}

export default function CampaignsPage() {
  const [filter, setFilter] = useState("all")

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary">Pilotage</p>
          <h1 className="text-3xl font-bold tracking-tight">Campagnes Meta Ads</h1>
          <p className="text-muted-foreground">Surveillez vos objectifs, budgets et variations IA.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filtres avancés
          </Button>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" /> Assistant IA
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/dashboard/creatives/new">
              <Plus className="h-4 w-4" /> Nouvelle campagne
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-6 md:grid-cols-4">
          {["Spend", "Budget", "CTR moyen", "ROAS"].map((title, idx) => (
            <div key={title} className="rounded-2xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-semibold">
                {idx === 0 ? "€4.5k" : idx === 1 ? "€12k" : idx === 2 ? "2.9%" : "3.8x"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campagnes</CardTitle>
          <CardDescription>Vue synthétique des campagnes cross-plateformes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher une campagne..." className="max-w-sm" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {campaigns
              .filter((campaign) => filter === "all" || campaign.status === filter)
              .map((campaign) => (
                <motion.div whileHover={{ scale: 1.01 }} key={campaign.id} className="rounded-2xl border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{campaign.name}</h3>
                        <Badge variant={statusVariants[campaign.status].variant}>{statusVariants[campaign.status].label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Objectif : {objectiveLabels[campaign.objective]}</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="text-sm text-muted-foreground">
                        Spend: <span className="font-semibold text-foreground">€{campaign.spend.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        CTR: <span className="font-semibold text-foreground">{campaign.ctr}%</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ROAS: <span className="font-semibold text-foreground">{campaign.roas || "-"}x</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className=" text-xs text-muted-foreground">Budget consommé</p>
                      <Progress value={(campaign.spend / campaign.budget) * 100} className="mt-1" />
                      <p className="text-xs text-muted-foreground">
                        €{campaign.spend.toLocaleString()} / €{campaign.budget.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                      <p>Période: {campaign.startDate} → {campaign.endDate}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
