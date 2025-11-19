"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import toast from "react-hot-toast"

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Votre mot de passe doit contenir 6 caractères minimum"),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "demo@metaads.com", password: "demo1234" } })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      // TODO: appeler l'API auth
      await new Promise((resolve) => setTimeout(resolve, 1200))
      toast.success("Connexion réussie")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Impossible de se connecter")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-4 text-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="mr-1 h-3 w-3" /> Accès sécurisé
        </div>
        <div>
          <CardTitle className="text-3xl font-display">Connexion</CardTitle>
          <CardDescription>Reprenez la création de vos créatives IA</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="vous@entreprise.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Mot de passe</FormLabel>
                    <Link href="/auth/forgot-password" className="text-xs text-primary">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ? {" "}
          <Link href="/auth/signup" className="text-primary">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
