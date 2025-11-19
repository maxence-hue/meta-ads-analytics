# 🚂 Guide DÉPLOIEMENT - Utiliser ton Projet Railway Existant

## 📋 PRÉREQUIS
- ✅ Projet Railway "metaadscreativegenerator" déjà existant
- ✅ Repository GitHub avec le code backend
- 10-15 minutes

---

## 🎯 ÉTAPE 1 - Connecter ton Repository au Projet Existant

### 1.1 Accès à ton projet Railway
1. Va sur https://railway.app
2. Connecte-toi
3. Clique sur ton projet **"metaadscreativegenerator"**

### 1.2 Ajouter un nouveau service
1. Dans le dashboard du projet, clique sur **"New Service"** (bouton en haut)
2. Choisis **"Deploy from GitHub repo"**
3. Sélectionne ton repository GitHub (celui avec le dossier `backend`)
4. **Root directory**: tape `backend`
5. Clique sur **"Next"**

---

## 🎯 ÉTAPE 2 - Configuration du Nouveau Service

### 2.1 Configuration Build
1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Port**: `5001`
4. Clique sur **"Next"**

### 2.2 Nom du service
1. Donnes un nom clair: `meta-analytics-backend`
2. Clique sur **"Create Service"**

---

## 🎯 ÉTAPE 3 - Réutiliser tes Services Existants

### 3.1 Récupérer URLs de tes services existants
1. Dans ton projet Railway, clique sur ton service **PostgreSQL** existant
2. Clique sur **"Connect"** → copie l'URL **DATABASE_URL**
3. Clique sur ton service **Redis** existant  
4. Clique sur **"Connect"** → copie l'URL **REDIS_URL**

### 3.2 Installation TimescaleDB (si pas déjà fait)
1. Clique sur ton service PostgreSQL
2. Onglet **"Logs"** → **"New Command"**
3. Commande:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```
4. Exécute et vérifie "TimescaleDB installed"

---

## 🎯 ÉTAPE 4 - Configuration Variables d'Environnement

### 4.1 Accès aux variables
1. Retourne sur ton nouveau service `meta-analytics-backend`
2. Clique sur l'onglet **"Variables"**

### 4.2 Variables de base
```bash
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://frontend-h9watnkmy-marketia.vercel.app
ENABLE_WEBSOCKET=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.3 Variables Database (réutiliser existants)
```bash
DATABASE_URL=COLLE_ICI_TON_URL_POSTGRES_EXISTANT
REDIS_URL=COLLE_ICI_TON_URL_REDIS_EXISTANT
```

### 4.4 Variables Meta (à remplir)
```bash
META_APP_ID=TON_META_APP_ID
META_APP_SECRET=TON_META_APP_SECRET
META_REDIRECT_URI=https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback
```

### 4.5 Variables API (à remplir)
```bash
OPENAI_API_KEY=TA_CLE_OPENAI
GOOGLE_VISION_API_KEY=TA_CLE_GOOGLE_VISION
```

### 4.6 JWT Secret
```bash
JWT_SECRET=GENERE_UN_UUID_ALÉATOIRE_ICI
```

### 4.7 Variables Optionnelles
```bash
CLOUDINARY_CLOUD_NAME=TON_CLOUDINARY
CLOUDINARY_API_KEY=TA_CLE
CLOUDINARY_API_SECRET=TON_SECRET
```

---

## 🎯 ÉTAPE 5 - Déploiement

### 5.1 Lancer le déploiement
1. Clique sur **"Deploy"** sur ton service `meta-analytics-backend`
2. Patiente 3-5 minutes
3. Vérifie statut **"Running"**

### 5.2 Récupérer l'URL
1. Une fois "Running", clique sur le service
2. Copie l'URL publique: `https://meta-analytics-backend-production.up.railway.app`
3. Note cette URL: **BACKEND_URL**

---

## 🎯 ÉTAPE 6 - Exécuter les Migrations

### 6.1 Créer service temporaire pour migrations
1. Clique **"New Service"** → **"Deploy from GitHub repo"**
2. Sélectionne le même repository, root: `backend`
3. Nom: `database-migration`
4. Copie TOUTES les variables du service analytics
5. **Start Command**:
```bash
node -e "require('./src/config/database').initializeDatabase()"
```
6. Déploie, attends fin, puis supprime ce service

---

## 🎯 ÉTAPE 7 - Test du Backend

### 7.1 Health Check
Ouvre dans ton navigateur:
```
https://BACKEND_URL/api/v1/health
```
Devrais voir:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": "...",
  "environment": "production"
}
```

### 7.2 Test Meta OAuth
Test l'endpoint d'auth:
```
https://BACKEND_URL/api/v1/meta/auth-url
```
Devrais voir une URL Meta générée.

---

## 🎯 ÉTAPE 8 - Configuration Meta Developers

### 8.1 Meta App Setup
1. Va sur https://developers.facebook.com
2. Sélectionne ton application Meta
3. **App Domains**: `frontend-h9watnkmy-marketia.vercel.app`
4. **Valid OAuth Redirect URIs**: 
   ```
   https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback
   ```

---

## 🎯 ÉTAPE 9 - Mise à Jour Frontend Vercel

### 9.1 Variables Vercel
1. Va sur https://vercel.com/marketia/frontend/settings/environment-variables
2. Ajoute/modifie:
```bash
NEXT_PUBLIC_API_URL=https://BACKEND_URL/api/v1
NEXT_PUBLIC_WS_URL=wss://BACKEND_URL
```
Remplace `BACKEND_URL` avec ton URL Railway.

### 9.2 Redéploiement
```bash
cd /Users/maxencealehause/CascadeProjects/windsurf-project/frontend
npx vercel --prod --yes
```

---

## 🎯 ÉTAPE 10 - Test Final Complet

### 10.1 Test Connexion Meta
1. Va sur: https://frontend-h9watnkmy-marketia.vercel.app/analytics/connect
2. Clique **"Se connecter à Meta"**
3. Authentifie-toi
4. Devrais voir "Connexion Meta établie avec succès !"

### 10.2 Test Dashboard Analytics
1. Va sur: https://frontend-h9watnkmy-marketia.vercel.app/analytics
2. Devrais voir tes campagnes Meta
3. Graphiques et métriques devraient s'afficher

### 10.3 Test WebSocket
1. Ouvre dev tools (F12) → onglet Network
2. Devrais voir connexion WebSocket établie

---

## 🔧 AVANTAGES DE CETTE APPROCHE

✅ **Économie**: Réutilise PostgreSQL et Redis existants  
✅ **Rapidité**: Pas besoin de créer nouveaux services  
✅ **Simplicité**: Un seul projet pour tout  
✅ **Coût**: Pas de frais supplémentaires  

---

## 📊 STRUCTURE FINALE

Ton projet Railway contiendra:
- `metaadscreativegenerator` (ton service existant)
- `PostgreSQL` (réutilisé pour analytics)
- `Redis` (réutilisé pour cache/queues)
- `meta-analytics-backend` (nouveau service analytics)

---

## 🆘 SI PROBLÈMES

### Build échoue:
- Vérifie logs: onglet "Logs" du service
- Variables manquantes?

### Database erreur:
- DATABASE_URL correctement copié?
- Extension TimescaleDB installée?

### Meta OAuth échoue:
- URL callback exacte dans Meta Developers?
- App ID et Secret corrects?

### Frontend ne se connecte pas:
- Variables Vercel mises à jour?
- NEXT_PUBLIC_API_URL correcte?

---

## ✅ VALIDATION FINALE

- [ ] Health check backend OK
- [ ] Migrations database exécutées  
- [ ] Meta OAuth fonctionnel
- [ ] Dashboard analytics affiche les données
- [ ] WebSocket connecté

---

**Temps estimé: 15-20 minutes** (plus rapide que projet neuf !)

**URLs finales:**
- Frontend: https://frontend-h9watnkmy-marketia.vercel.app
- Backend: https://TON_URL_RAILWAY.app
- Callback: https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback

---

Félicitations ! Tu as maintenant un système analytics Meta Ads intégré à ton infrastructure Railway existante ! 🎉
