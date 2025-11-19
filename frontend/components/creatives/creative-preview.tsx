"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CreativePreviewProps {
  format: "landscape" | "square" | "story"
  data?: {
    previewUrl?: string
    validation?: {
      valid: boolean
      score?: number
      warnings?: string[]
    }
  }
}

const formatLabel: Record<CreativePreviewProps["format"], string> = {
  landscape: "Paysage 1200x628",
  square: "Carré 1080x1080",
  story: "Story 1080x1920",
}

export function CreativePreview({ format, data }: CreativePreviewProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Format {formatLabel[format]}</CardTitle>
            <CardDescription>Validation Meta & aperçu haute fidélité</CardDescription>
          </div>
          <Badge variant={data?.validation?.valid === false ? "destructive" : "default"}>
            Score {data?.validation?.score ?? 98}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative w-full overflow-hidden rounded-2xl border bg-muted" style={{ aspectRatio: format === "landscape" ? "1200/628" : format === "square" ? "1" : "9/16" }}>
          {data?.previewUrl ? (
            <Image src={data.previewUrl} alt={`${format} preview`} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aperçu généré ici
            </div>
          )}
        </div>
        {data?.validation?.warnings && data.validation.warnings.length > 0 && (
          <ul className="list-inside list-disc text-xs text-muted-foreground">
            {data.validation.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
