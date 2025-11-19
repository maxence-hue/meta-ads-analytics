"use client"

import { CreativeLibrary } from "@/components/creatives/creative-library"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles, Plus } from "lucide-react"


export default function CreativesPage() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wider text-primary">Création</p>
          <h1 className="text-3xl font-bold tracking-tight">Mes créatives</h1>
          <p className="text-muted-foreground">Gérez et optimisez vos créatives Meta Ads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" /> Assistant IA
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/dashboard/creatives/new">
              <Plus className="h-4 w-4" /> Nouvelle créative
            </Link>
          </Button>
        </div>
      </div>

      <CreativeLibrary showFolders={true} viewMode="grid" />
    </div>
  )
}
