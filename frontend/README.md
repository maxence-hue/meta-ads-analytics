# Meta Ads AI Generator - Frontend SaaS

Frontend Next.js 14 moderne et professionnel pour la génération de créatives Meta Ads avec IA.

## 🎨 Stack Technique

### Core
- **Next.js 14** (App Router) - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling utility-first
- **Framer Motion** - Animations fluides

### UI Components
- **shadcn/ui** - Composants React réutilisables
- **Radix UI** - Primitives UI accessibles
- **Lucide React** - Icons modernes

### State & Data
- **Zustand** - State management léger
- **TanStack Query** - Data fetching et cache
- **React Hook Form** - Gestion des formulaires
- **Zod** - Validation schémas

### Real-time
- **Socket.io Client** - WebSocket temps réel

### Charts & Analytics
- **Recharts** - Graphiques interactifs

## 📂 Structure du Projet

```
frontend/
├── app/
│   ├── (marketing)/          # Pages publiques
│   │   ├── page.tsx          # Landing page
│   │   ├── pricing/          # Tarification
│   │   └── layout.tsx
│   ├── (dashboard)/          # App authentifiée
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── creatives/        # Gestion créatives
│   │   │   ├── page.tsx      # Liste
│   │   │   └── new/page.tsx  # Création
│   │   ├── brands/           # Gestion marques
│   │   ├── analytics/        # Analytics
│   │   ├── settings/         # Paramètres
│   │   └── layout.tsx
│   ├── api/                  # API routes
│   ├── globals.css           # Styles globaux
│   └── layout.tsx            # Root layout
├── components/
│   ├── ui/                   # Composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── dashboard/            # Composants dashboard
│   ├── creatives/            # Composants créatives
│   └── marketing/            # Composants landing
├── lib/
│   ├── api/                  # Client API
│   │   └── client.ts
│   ├── hooks/                # Custom hooks
│   │   ├── useSocket.ts
│   │   └── useGenerationProgress.ts
│   ├── stores/               # Zustand stores
│   │   └── creative-store.ts
│   ├── utils.ts              # Utilitaires
│   └── constants.ts          # Constantes
├── public/                   # Assets statiques
├── styles/                   # CSS additionnels
└── types/                    # Types TypeScript
```

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

### 2. Configurer l'environnement

Créer `.env.local`:

```bash
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Auth (NextAuth)
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key

# Stripe (optionnel pour paiements)
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Analytics (optionnel)
NEXT_PUBLIC_GA_ID=G-...
```

### 3. Démarrer le serveur de développement

```bash
npm run dev
```

Application disponible sur **http://localhost:3000**

## 🎯 Fonctionnalités Implémentées

### ✅ Landing Page Moderne
- Hero section avec animations Framer Motion
- Features section avec cards interactives
- Pricing section responsive
- Social proof et testimonials
- CTA buttons optimisés
- Dark mode support

### ✅ Dashboard Analytics
- Métriques clés (créatives, impressions, CTR, ROAS)
- Graphiques de performance (Recharts)
- Créatives récentes avec previews
- Filtres par période
- Real-time updates via WebSocket

### ✅ Creative Builder
- Multi-step form (3 étapes)
- Configuration de base (marque, objectif, style)
- Upload d'images + drag & drop
- Génération IA (DALL-E 3 intégration)
- Color picker personnalisé
- Template selection
- Preview temps réel (3 formats)
- Export et partage

### ✅ Brand Management
- Scraping automatique de sites web
- Extraction couleurs/fonts
- Gestion bibliothèque de marques
- Brand guidelines

### ✅ Settings & Billing
- Gestion du compte
- Plans et tarification
- Usage tracking avec progress bars
- Intégration Stripe (structure prête)

## 🔧 Composants UI Créés

### Composants de base (shadcn/ui)
- `<Button />` - Boutons avec variants
- `<Card />` - Cards avec header/content/footer
- `<Input />` - Inputs contrôlés
- `<Select />` - Dropdowns
- `<Tabs />` - Navigation par onglets
- `<Dialog />` - Modals
- `<Toast />` - Notifications
- `<Progress />` - Barres de progression
- `<Badge />` - Labels et tags

### Composants métier
- `<CreativePreview />` - Aperçu créative
- `<GenerationProgress />` - Suivi génération IA
- `<BrandSelector />` - Sélecteur de marque
- `<TemplateGrid />` - Grille de templates
- `<AnalyticsChart />` - Graphiques analytics

## 📡 API Client

### Configuration

```typescript
// lib/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptors pour auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Méthodes disponibles

```typescript
// Brands
api.brands.list()
api.brands.create(data)
api.brands.scrape(url)

// Creatives
api.creatives.generate(data)
api.creatives.list(filters)
api.creatives.getAnalytics(id)

// Templates
api.templates.list(category)
api.templates.get(id)

// AI
api.ai.generateImage(prompt, style)
api.ai.generateCopy(data)
```

## 🔌 WebSocket Real-time

### Hook personnalisé

```typescript
import { useGenerationProgress } from '@/lib/hooks/useSocket'

function CreativeBuilder() {
  const { progress, status, result } = useGenerationProgress(jobId)
  
  return (
    <div>
      {status === 'processing' && (
        <Progress value={progress} />
      )}
      {status === 'completed' && (
        <CreativePreview data={result} />
      )}
    </div>
  )
}
```

### Events écoutés
- `job:progress` - Progression 0-100%
- `job:completed` - Génération terminée
- `creative:generated` - Nouvelle créative
- `validation:complete` - Validation terminée

## 💾 State Management

### Zustand Store

```typescript
// lib/stores/creative-store.ts
import { create } from 'zustand'

export const useCreativeStore = create((set) => ({
  currentCreative: null,
  setBrand: (brand) => set((state) => ({
    currentCreative: { ...state.currentCreative, brand }
  })),
  // ... autres actions
}))
```

### Usage

```typescript
function Component() {
  const { currentCreative, setBrand } = useCreativeStore()
  
  return <BrandSelector onSelect={setBrand} />
}
```

## 🎨 Animations

### Framer Motion

```typescript
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Variants réutilisables

```typescript
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

<motion.div variants={fadeInUp} initial="hidden" animate="visible">
  Content
</motion.div>
```

## 📱 Responsive Design

Toutes les pages sont responsive:
- **Mobile-first** approach
- Breakpoints Tailwind (sm, md, lg, xl, 2xl)
- Grids adaptatifs
- Navigation mobile optimisée

## 🌓 Dark Mode

Theme switcher intégré:

```typescript
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle
    </button>
  )
}
```

## 🔒 Authentification

Structure prête pour NextAuth.js:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
  providers: [
    CredentialsProvider({
      // Configuration
    })
  ]
}

export default NextAuth(authOptions)
```

## 🚢 Build & Déploiement

### Build de production

```bash
npm run build
npm run start
```

### Variables d'environnement production

```bash
NEXT_PUBLIC_API_URL=https://api.votredomaine.com/api/v1
NEXT_PUBLIC_WS_URL=wss://api.votredomaine.com
NEXTAUTH_URL=https://votredomaine.com
```

### Déploiement Vercel

```bash
vercel
# ou
vercel --prod
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Performance

### Optimisations appliquées
- ✅ Image optimization (next/image)
- ✅ Code splitting automatique
- ✅ Lazy loading composants
- ✅ React Server Components
- ✅ Static Generation (où possible)
- ✅ API route caching
- ✅ Font optimization

### Métriques cibles
- **LCP** < 2.5s
- **FID** < 100ms
- **CLS** < 0.1
- **Lighthouse** > 90

## 🧪 Tests

Structure prête pour tests:

```bash
npm install -D @playwright/test
```

### E2E Tests

```typescript
// e2e/creative-generation.spec.ts
import { test, expect } from '@playwright/test'

test('should generate creative', async ({ page }) => {
  await page.goto('/dashboard/creatives/new')
  await page.fill('[name="headline"]', 'Test Headline')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/creatives\//)
})
```

## 📈 Analytics

Intégration Google Analytics 4:

```typescript
// lib/analytics.ts
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  })
}

export const event = ({ action, category, label, value }: any) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  })
}
```

## 🔗 Intégrations Tierces

### Stripe

```typescript
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!)

// Checkout session
const session = await stripe.redirectToCheckout({
  sessionId: 'session_id'
})
```

### Cloudinary

```typescript
import { CldImage } from 'next-cloudinary'

<CldImage
  src={creative.image}
  width={1200}
  height={628}
  alt="Creative"
/>
```

## 🎓 Prochaines étapes

Pour étendre le frontend:

1. **Ajouter plus de pages**
   - `/templates/marketplace` - Marketplace de templates
   - `/campaigns` - Gestion campagnes complète
   - `/team` - Collaboration équipe

2. **Améliorer UX**
   - Onboarding guidé interactif
   - Tour du produit (Intro.js)
   - Shortcuts clavier
   - Undo/Redo

3. **Features avancées**
   - A/B testing interface
   - Scheduling de créatives
   - Bulk operations
   - Export formats multiples

4. **Optimisations**
   - Service Worker pour offline
   - PWA support
   - Prefetching intelligent

## 📝 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Framer Motion](https://www.framer.com/motion/)
- [React Hook Form](https://react-hook-form.com)

## 🤝 Contribution

Le frontend suit les meilleures pratiques React/Next.js modernes. Toute contribution est la bienvenue!

## 📄 License

MIT

---

**Frontend SaaS créé avec ❤️ pour Meta Ads AI Generator**
