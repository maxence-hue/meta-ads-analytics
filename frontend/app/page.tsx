'use client';

import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-gray-900">Meta Ads Analytics</h1>
        <p className="text-xl text-gray-600 max-w-md">
          Système complet d'analytics connecté à Meta Ads avec analyse IA
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg">
              Accéder au Dashboard
            </Button>
          </Link>
          <Link href="/analytics">
            <Button size="lg" variant="outline">
              Analytics
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
