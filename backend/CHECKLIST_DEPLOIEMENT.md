# ✅ CHECKLIST DÉPLOIEMENT RAILWAY - IMPRIMEZ CECI

## 🎯 ÉTAPE 1 - PRÉPARATION (5 min)
- [ ] Compte Railway créé: https://railway.app
- [ ] Repository GitHub synchronisé avec ton code local
- [ ] Clés API disponibles:
  - [ ] META_APP_ID (Meta Developers)
  - [ ] META_APP_SECRET (Meta Developers) 
  - [ ] OPENAI_API_KEY (OpenAI)
  - [ ] GOOGLE_VISION_API_KEY (Google Cloud)

---

## 🎯 ÉTAPE 2 - CRÉATION PROJET RAILWAY (3 min)
- [ ] Login sur Railway.app avec GitHub
- [ ] Clique "New Project" → "Deploy from GitHub repo"
- [ ] Sélectionne ton repository
- [ ] Root directory: `backend`
- [ ] Clique "Next"

---

## 🎯 ÉTAPE 3 - CONFIGURATION SERVICE (2 min)
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Port: `5001`
- [ ] Clique "Next"

---

## 🎯 ÉTAPE 4 - AJOUT SERVICES DATABASE (5 min)
- [ ] Clique "New" → "Database" → "Add PostgreSQL"
- [ ] Patienter création (2 min)
- [ ] Copier DATABASE_URL depuis "Connect"
- [ ] Clique "New" → "Database" → "Add Redis"
- [ ] Patienter création (1 min)
- [ ] Copier REDIS_URL depuis "Connect"

---

## 🎯 ÉTAPE 5 - VARIABLES ENVIRONNEMENT (5 min)
- [ ] Retourne sur service backend
- [ ] Onglet "Variables"
- [ ] Ajoute TOUS les éléments suivants:

### Variables fixes:
```
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://frontend-h9watnkmy-marketia.vercel.app
ENABLE_WEBSOCKET=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Variables API (remplace avec tes clés):
```
META_APP_ID=______TON_APP_ID______
META_APP_SECRET=______TON_APP_SECRET______
META_REDIRECT_URI=https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback
OPENAI_API_KEY=______TA_CLE_OPENAI______
GOOGLE_VISION_API_KEY=______TA_CLE_GOOGLE______
```

### Variables Database (colle les URLs):
```
DATABASE_URL=______URL_POSTGRES______
REDIS_URL=______URL_REDIS______
JWT_SECRET=______UUID_ALÉATOIRE______
```

---

## 🎯 ÉTAPE 6 - DÉPLOIEMENT (3 min)
- [ ] Clique "Deploy" sur service backend
- [ ] Attendre fin du build (3-5 min)
- [ ] Vérifier statut "Running"
- [ ] Copier URL publique: _______________

---

## 🎯 ÉTAPE 7 - TEST HEALTH CHECK (1 min)
- [ ] Ouvre: `https://TON_URL/api/v1/health`
- [ ] Devrais voir: `{"status": "ok", ...}`
- [ ] Si erreur: vérifie logs Railway

---

## 🎯 ÉTAPE 8 - MIGRATIONS DATABASE (2 min)
- [ ] Crée service temporaire "database-migration"
- [ ] Copie TOUTES les variables du backend
- [ ] Start Command: `node -e "require('./src/config/database').initializeDatabase()"`
- [ ] Déploie et attend fin
- [ ] Supprime service temporaire

---

## 🎯 ÉTAPE 9 - CONFIGURATION META (3 min)
- [ ] Va sur https://developers.facebook.com
- [ ] Sélectionne ton app Meta
- [ ] App Domains: `frontend-h9watnkmy-marketia.vercel.app`
- [ ] OAuth Redirect URI: `https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback`

---

## 🎯 ÉTAPE 10 - MISE À JOUR VERCEL (2 min)
- [ ] Va sur https://vercel.com/marketia/frontend/settings/environment-variables
- [ ] Ajoute:
  ```
  NEXT_PUBLIC_API_URL=https://TON_URL_RAILWAY/api/v1
  NEXT_PUBLIC_WS_URL=wss://TON_URL_RAILWAY
  ```
- [ ] Terminal local: `cd frontend && npx vercel --prod --yes`

---

## 🎯 ÉTAPE 11 - TEST FINAL (5 min)
- [ ] Frontend: https://frontend-h9watnkmy-marketia.vercel.app/analytics/connect
- [ ] Clique "Se connecter à Meta"
- [ ] Authentifie-toi
- [ ] Vérifie redirection "Connexion établie"
- [ ] Dashboard: https://frontend-h9watnkmy-marketia.vercel.app/analytics
- [ ] Vérifie affichage des données

---

## 🔧 URLS FINALES (à noter)
- Frontend: https://frontend-h9watnkmy-marketia.vercel.app
- Backend: _________________________
- Meta Callback: https://frontend-h9watnkmy-marketia.vercel.app/api/v1/meta/callback

---

## ✅ VALIDATION FINALE
- [ ] Health check backend OK
- [ ] Migrations database exécutées
- [ ] Meta OAuth fonctionnel
- [ ] Dashboard analytics affiche les données
- [ ] WebSocket connecté (voir dev tools F12)

---

**Temps total estimé: 30-40 minutes**
**Difficulté: Intermédiaire**
**Support: Guide complet disponible dans RAILWAY_WEB_GUIDE.md**

---

## 🆘 SI PROBLÈME

### Build échoue:
- Vérifie onglet "Logs" sur Railway
- Variables manquantes?

### Database erreur:
- DATABASE_URL correct?
- Service PostgreSQL "Running"?

### Meta OAuth échoue:
- URL callback exacte?
- App ID et Secret corrects?

### Frontend ne se connecte pas:
- Variables Vercel mises à jour?
- NEXT_PUBLIC_API_URL correcte?

---

**Coche chaque case au fur et à mesure ! 🎯**
