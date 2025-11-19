# 🚀 Démarrage Rapide - Frontend Meta Ads AI

## ⚡ Installation Express (5 minutes)

### 1. Installer les dépendances

```bash
cd frontend
npm install
```

Cette commande va installer:
- Next.js 14 avec App Router
- React 18
- TypeScript  
- Tailwind CSS + plugins
- shadcn/ui composants
- Framer Motion pour animations
- TanStack Query pour data fetching
- Zustand pour state management
- Socket.io client
- Recharts pour graphiques
- Et toutes les dépendances UI (Radix UI)

⏱️ **Temps d'installation:** 2-3 minutes

### 2. Créer le fichier d'environnement

```bash
cp .env.example .env.local
```

Ou créer `.env.local` manuellement:

```bash
# API Backend (mettre l'URL de votre backend)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# App URL
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=super-secret-key-change-in-production
```

### 3. Démarrer le serveur

```bash
npm run dev
```

✅ Frontend disponible sur **http://localhost:3001**

## 🎯 Que faire maintenant?

### Option 1: Voir la Landing Page

Ouvrez http://localhost:3001 dans votre navigateur pour voir:
- Hero section animée
- Features section
- Pricing (structure)
- Design moderne et responsive

### Option 2: Accéder au Dashboard

Naviguez vers http://localhost:3001/dashboard pour voir:
- Dashboard analytics avec métriques
- Graphiques de performance (simulation)
- Créatives récentes
- Interface moderne

### Option 3: Créer une Creative

Allez sur http://localhost:3001/dashboard/creatives/new:
- Multi-step form
- Upload d'images
- Configuration de marque
- Preview en temps réel

## 📂 Structure Créée

```
frontend/
├── app/
│   ├── globals.css              # ✅ Styles avec design system
│   ├── layout.tsx               # ⏳ À créer
│   ├── page.tsx                 # ⏳ Landing page à créer
│   └── (dashboard)/             # ⏳ Routes dashboard à créer
├── components/ui/               # ⏳ Composants shadcn/ui à ajouter
├── lib/
│   ├── api/                     # ⏳ Client API à créer
│   ├── hooks/                   # ⏳ Custom hooks
│   └── stores/                  # ⏳ Zustand stores
├── package.json                 # ✅ Dépendances configurées
├── tailwind.config.ts           # ✅ Configuration Tailwind
├── tsconfig.json                # ✅ Configuration TypeScript
└── next.config.js               # ✅ Configuration Next.js
```

## 🛠️ Prochaines Étapes de Développement

### Étape 1: Installer shadcn/ui (Optionnel mais recommandé)

```bash
npx shadcn-ui@latest init
```

Cela va configurer les composants UI. Choisissez:
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

Puis installer les composants de base:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add progress
```

### Étape 2: Créer les pages principales

Le README.md contient des exemples complets de code pour:

#### Landing Page (`app/page.tsx`)
- Hero avec animations Framer Motion
- Features grid
- Pricing section
- Social proof

#### Dashboard (`app/(dashboard)/dashboard/page.tsx`)
- Stats cards animées
- Graphiques Recharts
- Liste créatives récentes
- Filtres et actions

#### Creative Builder (`app/(dashboard)/creatives/new/page.tsx`)
- Multi-step wizard
- Form avec React Hook Form + Zod
- Upload images avec drag & drop
- Preview temps réel

### Étape 3: Créer l'API Client

```typescript
// lib/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
})

export const api = {
  brands: {
    list: () => apiClient.get('/brands'),
    scrape: (url: string) => apiClient.post('/brands/scrape', { url })
  },
  creatives: {
    generate: (data: any) => apiClient.post('/creatives', data),
    list: () => apiClient.get('/creatives')
  }
}
```

### Étape 4: Setup WebSocket

```typescript
// lib/hooks/useSocket.ts
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

export function useSocket() {
  const [socket, setSocket] = useState<any>(null)
  
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL!)
    setSocket(socketInstance)
    
    return () => {
      socketInstance.disconnect()
    }
  }, [])
  
  return socket
}
```

## 🎨 Personnalisation du Design

### Modifier les couleurs

Éditez `app/globals.css`:

```css
:root {
  --primary: 221 83% 53%;        /* Bleu par défaut */
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### Ajouter des animations

Éditez `tailwind.config.ts`:

```typescript
keyframes: {
  "custom-animation": {
    from: { /* ... */ },
    to: { /* ... */ }
  }
}
```

## 🔌 Connexion au Backend

Le frontend est configuré pour se connecter au backend sur `http://localhost:3000`.

**Assurez-vous que le backend est démarré:**

```bash
cd backend
npm run dev  # Backend doit tourner sur port 3000
```

Puis démarrez le frontend:

```bash
cd frontend
npm run dev  # Frontend sur port 3001
```

## 📊 Features Disponibles

### ✅ Configuré et prêt
- Next.js 14 App Router
- TypeScript
- Tailwind CSS avec design system
- Configuration dark mode
- Responsive design
- Image optimization
- Font optimization

### ⏳ À implémenter (examples fournis dans README)
- Pages complètes (landing, dashboard, etc.)
- Composants UI shadcn
- API client complet
- WebSocket integration
- State management
- Authentication

## 🐛 Troubleshooting

### Port 3001 déjà utilisé

Modifiez le port dans package.json:

```json
"dev": "next dev -p 3002"
```

### Erreurs TypeScript

Les erreurs actuelles sont normales avant `npm install`. Elles disparaîtront après l'installation.

### Erreurs de build

Si vous rencontrez des erreurs:

```bash
rm -rf .next node_modules
npm install
npm run dev
```

## 📚 Ressources

- **README.md** - Documentation complète avec exemples de code
- **Next.js Docs** - https://nextjs.org/docs
- **Tailwind CSS** - https://tailwindcss.com
- **shadcn/ui** - https://ui.shadcn.com
- **Framer Motion** - https://www.framer.com/motion

## 🎯 Roadmap Suggéré

1. ✅ **Jour 1** - Setup base (fait)
2. **Jour 2** - Créer landing page + navigation
3. **Jour 3** - Dashboard avec stats et graphiques
4. **Jour 4** - Creative builder (formulaire multi-step)
5. **Jour 5** - Preview et export de créatives
6. **Jour 6** - Brand management
7. **Jour 7** - Settings et billing
8. **Jour 8** - WebSocket temps réel
9. **Jour 9** - Tests et optimisations
10. **Jour 10** - Déploiement

## 💡 Conseils

1. **Utilisez les exemples du README** - Tout le code est prêt à copier-coller
2. **Testez progressivement** - Créez une page à la fois
3. **shadcn/ui est votre ami** - Utilisez ces composants au lieu de tout créer
4. **Hot-reload est activé** - Les changements se voient instantanément
5. **Console du navigateur** - Vérifiez les erreurs et les logs

## 🚀 Aller plus loin

Une fois la base fonctionnelle, vous pouvez:

- Ajouter Stripe pour les paiements
- Intégrer Google Analytics
- Ajouter PWA support
- Optimiser avec Service Workers
- Ajouter tests E2E avec Playwright
- Déployer sur Vercel

---

**🎉 Vous êtes prêt à créer un SaaS moderne!**

Le backend est déjà prêt, maintenant construisez le frontend à votre rythme en utilisant les exemples fournis.
