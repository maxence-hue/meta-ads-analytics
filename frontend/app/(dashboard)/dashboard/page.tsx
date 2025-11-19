"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Sparkles,
  Eye,
  MousePointer,
  DollarSign,
  Download,
  Share2,
  BarChart3,
  Calendar,
} from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import Image from "next/image"

const stats = [
  {
    title: "Créatives Générées",
    value: "1,284",
    change: "+12.5%",
    trend: "up" as const,
    icon: Sparkles,
  },
  {
    title: "Impressions",
    value: "2.4M",
    change: "+8.2%",
    trend: "up" as const,
    icon: Eye,
  },
  {
    title: "CTR",
    value: "3.24%",
    change: "+0.8%",
    trend: "up" as const,
    icon: MousePointer,
  },
  {
    title: "ROAS",
    value: "4.2x",
    change: "+15%",
    trend: "up" as const,
    icon: DollarSign,
  },
]

const performanceData = [
  { date: "Lun", ctr: 2.4, conversions: 130 },
  { date: "Mar", ctr: 2.8, conversions: 150 },
  { date: "Mer", ctr: 3.1, conversions: 170 },
  { date: "Jeu", ctr: 3.4, conversions: 200 },
  { date: "Ven", ctr: 3.9, conversions: 240 },
  { date: "Sam", ctr: 4.1, conversions: 260 },
  { date: "Dim", ctr: 4.3, conversions: 280 },
]

const formatData = [
  { name: "Feed", value: 45, color: "hsl(var(--primary))" },
  { name: "Stories", value: 35, color: "hsl(var(--secondary))" },
  { name: "Reels", value: 20, color: "hsl(var(--accent))" },
]

const creatives = [
  {
    id: "cr1",
    name: "ADSolar – Offre Hiver",
    thumbnail: "/creative-1.png",
    ctr: 3.8,
    roas: 4.5,
  },
  {
    id: "cr2",
    name: "Marketia – Template Stories",
    thumbnail: "/creative-2.png",
    ctr: 4.1,
    roas: 5.2,
  },
  {
    id: "cr3",
    name: "NeoFit – Reels",
    thumbnail: "/creative-3.png",
    ctr: 3.6,
    roas: 3.9,
  },
]

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("7d")

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bonjour, Maxence 👋</h1>
          <p className="text-muted-foreground">Voici vos performances publicitaires aujourd'hui.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Créative
          </Button>
        </div>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs flex items-center ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {stat.trend === "up" ? <ArrowUp className="mr-1 h-4 w-4" /> : <ArrowDown className="mr-1 h-4 w-4" />}
                  {stat.change} vs période précédente
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performance des créatives</CardTitle>
            <CardDescription>CTR et conversions sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
                <Tooltip cursor={{ stroke: "hsl(var(--primary))" }} contentStyle={{ borderRadius: 12 }} />
                <Line type="monotone" dataKey="ctr" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--destructive))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Formats performants</CardTitle>
            <CardDescription>Répartition par type de format</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie dataKey="value" data={formatData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8}>
                  {formatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créatives récentes</CardTitle>
          <CardDescription>Vos dernières créations et leurs performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {creatives.map((creative) => (
              <motion.div key={creative.id} whileHover={{ scale: 1.02 }} className="group">
                <div className="relative aspect-square overflow-hidden rounded-2xl border">
                  <Image src={creative.thumbnail} alt={creative.name} fill className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">{creative.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>CTR: {creative.ctr}%</span>
                    <span>•</span>
                    <span>ROAS: {creative.roas}x</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aperçu Insights IA</CardTitle>
          <CardDescription>Recommandations générées automatiquement</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Vue générale</TabsTrigger>
              <TabsTrigger value="creative">Créatives</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6">
              <div className="grid gap-4 md:grid-cols-3">
                {["Augmenter l'urgence", "Optimiser CTA", "Tester un fond clair"].map((insight) => (
                  <Card key={insight} className="border-dashed">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-primary">
                        <BarChart3 className="h-4 w-4" /> Insight IA
                      </div>
                      <CardTitle className="text-lg">{insight}</CardTitle>
                      <CardDescription>
                        {insight === "Augmenter l'urgence"
                          ? "Les créatives avec compte à rebours convertissent 22% mieux"
                          : insight === "Optimiser CTA"
                          ? "CTA actionnable augmente le CTR de 0.4 points"
                          : "Fonds clairs = +18% d'engagement sur la cible Women 25-34"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="creative" className="mt-6">
              <p className="text-sm text-muted-foreground">
                L'IA recommande de lancer 3 variations basées sur votre top template "Modern Gradient".
              </p>
            </TabsContent>
            <TabsContent value="audience" className="mt-6">
              <p className="text-sm text-muted-foreground">
                Nouvelle audience performante identifiée: "Lookalike 5% + Intérêt Sustainability" (ROAS 4.8x).
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
