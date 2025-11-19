# Guide de Déploiement Backend Railway

## ✅ Frontend déployé
**URL Production:** https://frontend-h9watnkmy-marketia.vercel.app

## 🚂 Déploiement Backend sur Railway

### Option 1: Script Automatique (Recommandé)

```bash
cd backend
./deploy-railway.sh
```

Le script vous demandera:
- META_APP_ID
- META_APP_SECRET  
- OPENAI_API_KEY
- DATABASE_URL (PostgreSQL avec TimescaleDB)
- REDIS_URL

### Option 2: Commandes Manuelles

```bash
cd backend

# 1. Authentification (si pas encore fait)
railway login

# 2. Initialiser le projet
railway init

# 3. Lier le service
railway service

# 4. Configurer les variables d'environnement
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=5001"
railway variables --set "FRONTEND_URL=https://frontend-h9watnkmy-marketia.vercel.app"
railway variables --set "META_APP_ID=<your_meta_app_id>"
railway variables --set "META_APP_SECRET=<your_meta_app_secret>"
railway variables --set "META_REDIRECT_URI=https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback"
railway variables --set "OPENAI_API_KEY=<your_openai_key>"
railway variables --set "GOOGLE_VISION_API_KEY=<your_google_vision_key>"
railway variables --set "CLOUDINARY_CLOUD_NAME=<your_cloudinary_name>"
railway variables --set "CLOUDINARY_API_KEY=<your_cloudinary_key>"
railway variables --set "CLOUDINARY_API_SECRET=<your_cloudinary_secret>"
railway variables --set "DATABASE_URL=<your_postgres_url>"
railway variables --set "REDIS_URL=<your_redis_url>"
railway variables --set "JWT_SECRET=$(openssl rand -base64 32)"
railway variables --set "ENABLE_WEBSOCKET=true"

# 5. Déployer
railway up

# 6. Obtenir l'URL publique
railway domain
```

## 📊 Services requis

### PostgreSQL avec TimescaleDB
Railway propose PostgreSQL. Pour TimescaleDB:
```bash
railway add
# Sélectionner PostgreSQL
# Une fois créé, se connecter et installer TimescaleDB:
# CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

### Redis
```bash
railway add
# Sélectionner Redis
```

## 🔗 Après le déploiement

1. **Récupérer l'URL du backend:**
   ```bash
   railway status
   ```

2. **Mettre à jour le frontend Vercel:**
   - Aller sur https://vercel.com/marketia/frontend/settings/environment-variables
   - Ajouter/Modifier:
     - `NEXT_PUBLIC_API_URL` = `https://<railway-url>/api/v1`
     - `NEXT_PUBLIC_WS_URL` = `wss://<railway-url>`
   - Redéployer: `npx vercel --prod` dans le dossier frontend

3. **Exécuter les migrations:**
   ```bash
   # Se connecter en SSH au conteneur Railway
   railway run bash
   # Ou exécuter directement
   railway run "node -e \"require('./src/config/database').initializeDatabase()\""
   ```

4. **Vérifier le health check:**
   ```bash
   curl https://<railway-url>/api/v1/health
   ```

## 🔍 Monitoring

```bash
# Voir les logs en temps réel
railway logs

# Voir le statut
railway status

# Voir les variables
railway variables
```

## ⚠️ Troubleshooting

### Build échoue
- Vérifier que `Dockerfile` et `railway.json` sont bien présents
- Vérifier les logs: `railway logs`

### Base de données non accessible
- Vérifier que `DATABASE_URL` est correctement configurée
- Tester la connexion: `railway run "psql $DATABASE_URL -c 'SELECT 1'"`

### Redis non accessible
- Vérifier que `REDIS_URL` est correctement configurée
- Tester: `railway run "redis-cli -u $REDIS_URL ping"`

## 📝 Variables d'environnement complètes

Voir `.env.example` pour la liste complète des variables disponibles.

Variables **obligatoires**:
- `NODE_ENV=production`
- `PORT=5001`
- `FRONTEND_URL`
- `META_APP_ID`
- `META_APP_SECRET`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`

Variables **optionnelles**:
- `GOOGLE_VISION_API_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `CLOUDINARY_*`
- `NEOBANANA_API_KEY`, `STABILITY_API_KEY`, etc.
