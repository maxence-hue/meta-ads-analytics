# Meta Ads Generator Backend API

Backend Node.js professionnel pour la génération de créatives Meta Ads avec IA, scraping web, et système de queue.

## 🚀 Fonctionnalités

- **Multi-providers IA**: NeoBanana, DALL-E 3, Stability AI, Ideogram, Leonardo
- **Scraping intelligent**: Extraction automatique des brand guidelines avec Puppeteer
- **Génération HTML optimisée**: Templates performants avec validation
- **Job Queue**: Génération asynchrone avec Bull et Redis
- **WebSocket**: Mises à jour en temps réel
- **Cache Redis**: Performance optimale
- **CDN Cloudinary**: Gestion optimisée des images
- **API REST complète**: Tous les endpoints nécessaires
- **Sécurité**: JWT, rate limiting, validation
- **Analytics**: Tracking des performances

## 📋 Prérequis

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm ou yarn

## 🛠️ Installation

### 1. Cloner et installer les dépendances

```bash
cd backend
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` avec vos vraies clés API:
- `OPENAI_API_KEY`: Clé OpenAI pour DALL-E et GPT-4
- `CLOUDINARY_*`: Credentials Cloudinary
- `DATABASE_URL`: Connection string PostgreSQL
- `REDIS_URL`: Connection string Redis

### 3. Démarrer PostgreSQL et Redis avec Docker

```bash
# PostgreSQL
docker run -d \
  --name meta-ads-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=meta_ads_generator \
  -p 5432:5432 \
  postgres:15

# Redis
docker run -d \
  --name meta-ads-redis \
  -p 6379:6379 \
  redis:7-alpine
```

Ou avec les scripts npm:

```bash
npm run docker:postgres
npm run docker:redis
```

### 4. Créer la base de données

```bash
# Se connecter à PostgreSQL
psql -h localhost -U postgres

# Créer la base
CREATE DATABASE meta_ads_generator;

# Exécuter les migrations
\c meta_ads_generator
\i migrations/001_create_tables.sql
```

### 5. Démarrer le serveur

```bash
# Développement (avec hot-reload)
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📡 API Endpoints

### Brands

```bash
POST   /api/v1/brands/scrape        # Scraper un site web
POST   /api/v1/brands                # Créer une marque
GET    /api/v1/brands                # Liste des marques
GET    /api/v1/brands/:id            # Détails d'une marque
PUT    /api/v1/brands/:id            # Modifier une marque
DELETE /api/v1/brands/:id            # Supprimer une marque
```

### Creatives

```bash
POST   /api/v1/creatives                  # Générer une creative (async)
GET    /api/v1/creatives                  # Liste des creatives
GET    /api/v1/creatives/:id              # Détails d'une creative
POST   /api/v1/creatives/:id/variations   # Générer des variations
GET    /api/v1/creatives/:id/analytics    # Analytics de performance
POST   /api/v1/creatives/:id/export       # Exporter une creative
```

### Templates

```bash
GET    /api/v1/templates              # Liste des templates
GET    /api/v1/templates/categories   # Catégories disponibles
GET    /api/v1/templates/:id          # Détails d'un template
```

### AI

```bash
POST   /api/v1/ai/generate-image      # Générer une image avec IA
POST   /api/v1/ai/generate-copy       # Générer du copy avec IA
```

### Jobs

```bash
GET    /api/v1/jobs                   # Liste des jobs
GET    /api/v1/jobs/:jobId            # Status d'un job
```

### System

```bash
GET    /health                        # Health check
GET    /api/v1/stats                  # Statistiques utilisateur
GET    /api/v1/ws/info                # Info WebSocket
```

## 🔌 WebSocket Events

### Client → Server

- `authenticate` : Authentifier avec un JWT token
- `subscribe:job` : S'abonner aux updates d'un job
- `subscribe:creative` : S'abonner aux updates d'une creative
- `preview:update` : Mettre à jour un preview en temps réel

### Server → Client

- `authenticated` : Confirmation d'authentification
- `job:started` : Job démarré
- `job:progress` : Progression du job (0-100)
- `job:completed` : Job terminé
- `job:failed` : Job échoué
- `creative:generated` : Creative générée
- `validation:complete` : Validation terminée

## 📊 Structure de la Base de Données

```sql
users               # Utilisateurs
brands              # Marques
templates           # Templates de créatives
creatives           # Créatives générées
assets              # Images et assets
campaigns           # Campagnes publicitaires
jobs                # Jobs asynchrones
analytics           # Métriques de performance
```

## 🧪 Exemples d'utilisation

### 1. Scraper un site web

```bash
curl -X POST http://localhost:3000/api/v1/brands/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.apple.com"
  }'
```

### 2. Créer une marque

```bash
curl -X POST http://localhost:3000/api/v1/brands \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Apple",
    "website_url": "https://www.apple.com",
    "industry": "tech",
    "colors": {
      "primary": "#000000",
      "secondary": "#FFFFFF"
    }
  }'
```

### 3. Générer une creative

```bash
curl -X POST http://localhost:3000/api/v1/creatives \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "uuid-here",
    "templateId": "uuid-here",
    "data": {
      "headline": "Découvrez iPhone 15",
      "description": "Le smartphone le plus puissant",
      "cta": "Acheter maintenant"
    }
  }'
```

### 4. WebSocket (JavaScript)

```javascript
const socket = io('http://localhost:3000');

// Authentifier
socket.emit('authenticate', 'your-jwt-token');

// S'abonner à un job
socket.on('authenticated', ({ userId }) => {
  socket.emit('subscribe:job', 'job-id-here');
});

// Écouter les updates
socket.on('job:progress', ({ progress, status }) => {
  console.log(`Progress: ${progress}% - ${status}`);
});

socket.on('creative:generated', ({ creativeId, previews }) => {
  console.log('Creative générée:', creativeId);
});
```

## 🔧 Configuration Avancée

### Multi-providers IA

L'API supporte plusieurs providers d'IA pour la génération d'images:

```javascript
// DALL-E 3 (OpenAI)
{
  "provider": "dalle",
  "prompt": "A beautiful landscape",
  "style": "photorealistic"
}

// Stability AI
{
  "provider": "stability",
  "prompt": "A beautiful landscape",
  "negativePrompt": "blurry, low quality"
}

// NeoBanana
{
  "provider": "neobanana",
  "prompt": "A beautiful landscape",
  "dimensions": { "width": 1200, "height": 628 }
}
```

### Job Queue Configuration

Modifier `process.env.BULL_QUEUE_CONCURRENCY` pour ajuster le nombre de jobs simultanés:

```bash
BULL_QUEUE_CONCURRENCY=10  # 10 jobs en parallèle
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # 100 requêtes max
RATE_LIMIT_AI_MAX=20           # 20 requêtes IA max
RATE_LIMIT_SCRAPING_MAX=10     # 10 scraping max
```

## 📈 Performance

- **Cache Redis**: 5min pour les listes, 24h pour le scraping
- **Job Queue**: Jusqu'à 5 jobs simultanés par défaut
- **Compression**: Gzip activé pour toutes les réponses
- **Images**: Optimisation automatique avec Sharp
- **CDN**: Cloudinary pour delivery optimisé

## 🐛 Debugging

### Logs

```bash
# Voir les logs en temps réel
npm run dev

# Logs détaillés
LOG_LEVEL=debug npm run dev
```

### Database

```bash
# Se connecter à PostgreSQL
psql -h localhost -U postgres -d meta_ads_generator

# Voir les creatives
SELECT * FROM creatives ORDER BY created_at DESC LIMIT 10;

# Voir les jobs en cours
SELECT * FROM jobs WHERE status IN ('pending', 'processing');
```

### Redis

```bash
# Se connecter à Redis
redis-cli

# Voir les jobs
KEYS bull:creative-generation:*

# Voir les caches
KEYS scrape:*
```

## 🚀 Déploiement Production

### 1. Variables d'environnement

```bash
NODE_ENV=production
# Utiliser des secrets forts
JWT_SECRET=strong-random-secret
ENCRYPTION_KEY=32-character-encryption-key
```

### 2. Database migrations

```bash
npm run migrate up
```

### 3. PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start src/app.js --name meta-ads-api
pm2 save
pm2 startup
```

### 4. Monitoring

```bash
pm2 monit
pm2 logs meta-ads-api
```

## 🤝 Contributing

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changes (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT

## 📧 Support

Pour toute question ou problème, ouvrir une issue sur GitHub.
