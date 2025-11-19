"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Palette,
  Sparkles,
  CreditCard,
  BarChart3,
  Settings,
  Building2,
  SquareStack,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campagnes", icon: SquareStack },
  { href: "/dashboard/creatives", label: "Créatives", icon: Sparkles },
  { href: "/dashboard/brands", label: "Marques", icon: Building2 },
  { href: "/dashboard/templates", label: "Templates", icon: Palette },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
  { href: "/dashboard/settings/billing", label: "Facturation", icon: CreditCard },
]

function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = pathname?.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition",
              active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 border-r bg-background px-6 py-10 lg:flex lg:flex-col">
        <div className="mb-10 text-2xl font-display font-bold">Meta Ads AI</div>
        <SidebarNav />
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-primary to-purple-500 p-5 text-white">
          <p className="text-sm opacity-80">Besoin de plus de puissance ?</p>
          <h3 className="mt-1 text-lg font-semibold">Passez au plan Pro</h3>
          <Button size="sm" variant="secondary" className="mt-4 w-full" asChild>
            <Link href="/dashboard/settings/billing">Voir les plans</Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  )
}
