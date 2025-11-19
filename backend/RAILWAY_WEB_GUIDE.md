# 🚂 Guide HYPER-DÉTAILLÉ - Déploiement Backend sur Railway (Interface Web)

## 📋 PRÉREQUIS

- Compte Railway (gratuit): https://railway.app
- Compte GitHub (pour connecter le repo)
- 5-10 minutes

---

## 🎯 ÉTAPE 1 - Création du Projet Railway

### 1.1 Connexion à Railway
1. Va sur https://railway.app
2. Clique sur **"Login"** en haut à droite
3. Connecte-toi avec **GitHub** (recommandé) ou email

### 1.2 Création Nouveau Projet
1. Une fois connecté, clique sur **"New Project"** (bouton bleu en haut)
2. Choisis **"Deploy from GitHub repo"**

### 1.3 Connexion du Repository
1. Cherche ton repository GitHub:
   - Si déjà sur GitHub: sélectionne-le dans la liste
   - Sinon: clique **"Configure GitHub App"** → autorise Railway → sélectionne le repo
2. Sélectionne le dossier **`backend`** comme racine:
   - Dans **"Root directory"**, tape: `backend`
3. Clique sur **"Next"**

---

## 🎯 ÉTAPE 2 - Configuration du Service Backend

### 2.1 Configuration du Build
1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Port**: `5001`
4. Clique sur **"Next"**

### 2.2 Vérification du Dockerfile
Railway devrait détecter automatiquement ton `Dockerfile`. Si ce n'est pas le cas:
1. Coche **"Use Dockerfile"**
2. Confirme que `Dockerfile` est bien sélectionné

---

## 🎯 ÉTAPE 3 - Ajout des Services (Base de données + Redis)

### 3.1 Ajout PostgreSQL avec TimescaleDB
1. Dans le dashboard du projet, clique sur **"New"** (bouton en haut)
2. Sélectionne **"Database"** → **"Add PostgreSQL"**
3. Patientez 1-2 minutes pendant la création
4. Une fois créé, clique sur le service PostgreSQL
5. Clique sur **"Connect"** → copie l'URL **DATABASE_URL**

### 3.2 Installation TimescaleDB
1. Clique sur **"New"** → **"Service"**
2. Nomme-le: `timescale-setup`
3. Dans les variables d'environnement, ajoute:
   - `DATABASE_URL`: (l'URL copiée de PostgreSQL)
4. **Start Command**: `node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;').then(() => console.log('TimescaleDB installed')).catch(console.error).finally(() => process.exit(0));"`
5. Déploie, attends la fin, puis supprime ce service temporaire

### 3.3 Ajout Redis
1. Clique sur **"New"** → **"Database"** → **"Add Redis"**
2. Patientez la création
3. Clique sur le service Redis → **"Connect"** → copie l'URL **REDIS_URL**

---

## 🎯 ÉTAPE 4 - Configuration des Variables d'Environnement

### 4.1 Accès aux Variables
1. Retourne sur ton service backend principal
2. Clique sur l'onglet **"Variables"** (ou "Environment")

### 4.2 Variables Obligatoires
Copie-colle ces variables une par une:

```bash
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://frontend-h9watnkmy-marketia.vercel.app
ENABLE_WEBSOCKET=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.3 Variables Meta (à remplir)
```bash
META_APP_ID=TON_META_APP_ID
META_APP_SECRET=TON_META_APP_SECRET
META_REDIRECT_URI=https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback
```

### 4.4 Variables API (à remplir)
```bash
OPENAI_API_KEY=TA_CLE_OPENAI
GOOGLE_VISION_API_KEY=TA_CLE_GOOGLE_VISION
```

### 4.5 Variables Base de Données
```bash
DATABASE_URL=L_URL_DE_TON_POSTGRES
REDIS_URL=L_URL_DE_TON_REDIS
```

### 4.6 Variable JWT Secret
Génère un secret aléatoire:
1. Va sur https://www.uuidgenerator.net/api/version4
2. Copie l'UUID généré
3. Ajoute: `JWT_SECRET=COPIE_L_UUID_ICI`

### 4.7 Variables Optionnelles (Cloudinary)
```bash
CLOUDINARY_CLOUD_NAME=TON_CLOUDINARY_NAME
CLOUDINARY_API_KEY=TA_CLE_CLOUDINARY
CLOUDINARY_API_SECRET=TON_SECRET_CLOUDINARY
```

---

## 🎯 ÉTAPE 5 - Déploiement et Vérification

### 5.1 Lancement du Déploiement
1. Clique sur **"Deploy"** sur ton service backend
2. Patiente 3-5 minutes pendant le build
3. Vérifie que le statut passe à **"Running"**

### 5.2 Récupération de l'URL
1. Une fois "Running", clique sur le service
2. Copie l'URL publique (ex: `https://mon-backend.railway.app`)
3. Note cette URL: **BACKEND_URL**

### 5.3 Test du Health Check
Ouvre un nouvel onglet et teste:
```
https://BACKEND_URL/api/v1/health
```
Tu devrais voir:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": "...",
  "environment": "production"
}
```

---

## 🎯 ÉTAPE 6 - Exécution des Migrations

### 6.1 Création Tables Database
1. Dans ton service backend Railway, clique sur **"Logs"**
2. Clique sur **"New"** → **"Service"**
3. Nom: `database-migration`
4. Variables: copie TOUTES les variables du backend (y compris DATABASE_URL)
5. **Start Command**:
```bash
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migrations', '001_create_meta_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Exécuter la migration
    await pool.query(migrationSQL);
    console.log('✅ Migrations exécutées avec succès');
  } catch (error) {
    console.error('❌ Erreur migration:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
"
```
6. Déploie, attends la fin, puis supprime ce service temporaire

---

## 🎯 ÉTAPE 7 - Configuration Meta Developers

### 7.1 Accès Meta Developers
1. Va sur https://developers.facebook.com
2. Connecte-toi avec ton compte Meta

### 7.3 Configuration App
1. Sélectionne ton application Meta
2. Va dans **"Products"** → **"Marketing API"**
3. Dans **"App Domains"**, ajoute: `frontend-h9watnkmy-marketia.vercel.app`
4. Dans **"Valid OAuth Redirect URIs"**, ajoute:
   ```
   https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback
   ```

---

## 🎯 ÉTAPE 8 - Mise à Jour Frontend Vercel

### 8.1 Accès Vercel Dashboard
1. Va sur https://vercel.com/marketia/frontend/settings/environment-variables
2. Connecte-toi si nécessaire

### 8.2 Ajout Variables Backend
Ajoute/modifie ces variables:

```bash
NEXT_PUBLIC_API_URL=https://BACKEND_URL/api/v1
NEXT_PUBLIC_WS_URL=wss://BACKEND_URL
```

Remplace `BACKEND_URL` par ton URL Railway.

### 8.3 Redéploiement
1. Retourne dans ton terminal local:
```bash
cd /Users/maxencealehause/CascadeProjects/windsurf-project/frontend
npx vercel --prod --yes
```

---

## 🎯 ÉTAPE 9 - Test Final End-to-End

### 9.1 Test Connexion Meta
1. Va sur: https://frontend-h9watnkmy-marketia.vercel.app/analytics/connect
2. Clique sur **"Se connecter à Meta"**
3. Authentifie-toi avec Meta
4. Devrais être redirigé avec "Connexion établie"

### 9.2 Test Dashboard
1. Va sur: https://frontend-h9watnkmy-marketia.vercel.app/analytics
2. Devrais voir les données de tes campagnes Meta
3. Les graphiques devraient s'afficher

### 9.3 Test WebSocket
1. Ouvre les outils de développement du navigateur (F12)
2. Va dans l'onglet "Network"
3. Devrais voir une connexion WebSocket établie

---

## 🔧 TROUBLESHOOTING

### ❌ Build échoue
- Vérifie les logs Railway: onglet "Logs"
- Erreur commune: variables manquantes

### ❌ Database connection failed
- Vérifie `DATABASE_URL` correctement copiée
- Teste la connexion avec un client PostgreSQL

### ❌ Redis connection failed  
- Vérifie `REDIS_URL` correctement copiée
- Assure-toi que le service Redis est "Running"

### ❌ Meta OAuth échoue
- Vérifie l'URL de callback dans Meta Developers
- Vérifie `META_APP_ID` et `META_APP_SECRET`

### ❌ Frontend ne se connecte pas au backend
- Vérifie les variables Vercel (`NEXT_PUBLIC_API_URL`)
- Teste le backend directement: `https://BACKEND_URL/api/v1/health`

---

## 📊 RÉCAPITULATIF URLs

- **Frontend Production:** https://frontend-h9watnkmy-marketia.vercel.app
- **Backend Production:** https://VOTRE_URL_RAILWAY.app
- **Meta App Callback:** https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback

---

## 🎉 FÉLICITATIONS !

Ton système Meta Ads Analytics est maintenant complètement déployé et fonctionnel !

**Fonctionnalités disponibles:**
- ✅ Connexion OAuth2 Meta Ads
- ✅ Synchronisation automatique des données
- ✅ Analytics avec graphiques temps réel
- ✅ Analyse IA avec GPT-4
- ✅ WebSocket pour mises à jour live
- ✅ Export CSV/JSON
- ✅ Recommandations personnalisées

---

**Support:**
- Guide créé le 19 novembre 2025
- Temps estimé: 15-30 minutes
- Difficulté: Intermédiaire

N'hésite pas si tu as des questions sur une étape spécifique !
