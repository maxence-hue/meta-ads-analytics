import type { Metadata } from "next"
import localFont from "next/font/local"
import { Inter, Calistoga } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { QueryProvider } from "@/components/shared/query-provider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const cal = Calistoga({ subsets: ["latin"], weight: "400", variable: "--font-cal" })

export const metadata: Metadata = {
  title: "Meta Ads AI Generator",
  description: "Le Canva des publicités Meta propulsé par l'IA",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${cal.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            {children}
            <Toaster position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
