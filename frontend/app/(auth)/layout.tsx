import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-display font-bold">
          Meta Ads AI
        </Link>
        <Button variant="ghost" asChild>
          <Link href="/">Retour au site</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10">{children}</main>
    </div>
  )
}
