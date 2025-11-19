"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Check,
  X,
  Sparkles,
  Crown,
  CreditCard,
  Download,
} from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: 29,
    description: "Parfait pour démarrer",
    features: [
      "100 créatives/mois",
      "3 marques",
      "Templates essentiels",
      "Exports HD",
      "Support email",
    ],
    limitations: ["Sans IA avancée", "Pas d'API"],
    popular: false,
  },
  {
    name: "Pro",
    price: 99,
    description: "Pour les marketers exigeants",
    features: [
      "500 créatives/mois",
      "10 marques",
      "Tous les templates",
      "IA GPT-4 & DALL-E 3",
      "API accès",
      "Support prioritaire",
      "Analytics avancés",
      "A/B testing IA",
    ],
    limitations: [],
    popular: true,
  },
  {
    name: "Enterprise",
    price: null,
    description: "Solutions custom",
    features: [
      "Créatives illimitées",
      "Marques illimitées",
      "Templates sur-mesure",
      "IA dédiée",
      "SLA & support 24/7",
      "Onboarding équipe",
      "Gestion multi-sites",
      "Workspace sécurisé",
    ],
    limitations: [],
    popular: false,
  },
]

export default function BillingPage() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly")

  const currentUsage = {
    creatives: 234,
    limit: 500,
    brands: 6,
    brandsLimit: 10,
  }

  return (
    <div className="space-y-8 p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Plan actuel : Pro</CardTitle>
            <CardDescription>Renouvellement le 15 décembre 2025</CardDescription>
          </div>
          <Badge className="px-4 py-2 text-base">
            <Crown className="mr-2 h-4 w-4" /> Pro
          </Badge>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Créatives utilisées</span>
                <span>
                  {currentUsage.creatives} / {currentUsage.limit}
                </span>
              </div>
              <Progress value={(currentUsage.creatives / currentUsage.limit) * 100} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Marques actives</span>
                <span>
                  {currentUsage.brands} / {currentUsage.brandsLimit}
                </span>
              </div>
              <Progress value={(currentUsage.brands / currentUsage.brandsLimit) * 100} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <CreditCard className="mr-2 h-4 w-4" /> Gérer la carte
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Télécharger les factures
            </Button>
            <Button variant="ghost">Historique des paiements</Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="mb-4 inline-flex items-center rounded-full border px-2 py-1 text-xs">
          <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-primary">Nouveau</span>
          Payez annuellement et économisez 20%
        </div>
        <div className="inline-flex items-center rounded-full border p-1">
          <Button
            variant={interval === "monthly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setInterval("monthly")}
          >
            Mensuel
          </Button>
          <Button
            variant={interval === "yearly" ? "default" : "ghost"}
            size="sm"
            onClick={() => setInterval("yearly")}
          >
            Annuel -20%
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <motion.div key={plan.name} whileHover={{ y: -6 }} className="relative">
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 w-max -translate-x-1/2">
                <Badge className="px-3 py-1">
                  <Sparkles className="mr-1 h-3 w-3" /> Populaire
                </Badge>
              </div>
            )}
            <Card className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  {plan.price ? (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">
                          €{interval === "yearly" ? Math.floor(plan.price * 0.8) : plan.price}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">/mois</span>
                      </div>
                      {interval === "yearly" && <p className="text-xs text-green-500">Facturation annuelle</p>}
                    </>
                  ) : (
                    <div className="text-3xl font-bold">Sur devis</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start gap-2 text-muted-foreground">
                      <X className="mt-0.5 h-4 w-4" />
                      <span>{limitation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.price ? "Choisir ce plan" : "Contacter l'équipe"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
