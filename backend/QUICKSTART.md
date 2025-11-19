# 🚀 Quick Start - Meta Ads Generator Backend

## Installation rapide (Mac)

### 1. Installer PostgreSQL et Redis avec Homebrew

```bash
# Installer Homebrew si non installé
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Installer Redis
brew install redis
brew services start redis

# Créer la base de données
createdb meta_ads_generator
```

### 2. Initialiser la base de données

```bash
# Se connecter à PostgreSQL
psql meta_ads_generator

# Dans psql, exécuter:
\i migrations/001_create_tables.sql
\q
```

### 3. Configurer les clés API

Éditer le fichier `.env` et ajouter vos clés:

```bash
# Minimum requis pour démarrer:
OPENAI_API_KEY=sk-votre-cle-openai
```

Les autres clés sont optionnelles pour le développement.

### 4. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur http://localhost:3000

## Alternative: Installation avec Docker

Si vous préférez Docker:

```bash
# Installer Docker Desktop depuis https://www.docker.com/products/docker-desktop/

# Démarrer les services
npm run docker:up

# Attendre 10 secondes puis créer les tables
sleep 10
PGPASSWORD=password psql -h localhost -U postgres -d meta_ads_generator -f migrations/001_create_tables.sql
```

## Vérification

1. **Health Check**: http://localhost:3000/health
2. **API Info**: http://localhost:3000/api/v1/ws/info
3. **Stats**: http://localhost:3000/api/v1/stats

## Test rapide de l'API

```bash
# Scraper un site web
curl -X POST http://localhost:3000/api/v1/brands/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.apple.com"}'

# Créer une marque
curl -X POST http://localhost:3000/api/v1/brands \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Brand",
    "colors": {"primary": "#667eea"},
    "typography": {"heading": "Inter"}
  }'

# Lister les templates
curl http://localhost:3000/api/v1/templates
```

## Troubleshooting

### PostgreSQL ne démarre pas
```bash
brew services restart postgresql@15
brew services list
```

### Redis ne démarre pas
```bash
brew services restart redis
redis-cli ping  # Devrait retourner PONG
```

### Port 3000 déjà utilisé
Modifier `PORT=3001` dans le fichier `.env`

### Erreur "Cannot connect to database"
Vérifier que PostgreSQL est lancé:
```bash
psql -l
```

## Mode développement sans DB (WIP)

Pour tester sans installer PostgreSQL/Redis, un mode mock est en développement.

## Prochaines étapes

1. ✅ Installation terminée
2. ✅ Serveur lancé
3. 📝 Configurer le frontend pour pointer vers `http://localhost:3000`
4. 🎨 Générer votre première creative!

## Support

Consultez le README.md complet pour plus d'informations.
