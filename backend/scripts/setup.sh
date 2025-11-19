#!/bin/bash

echo "🚀 Installation du Meta Ads Generator Backend"
echo "=============================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Installer les dépendances
echo -e "${BLUE}📦 Installation des dépendances npm...${NC}"
npm install

# Vérifier PostgreSQL
echo -e "${BLUE}🔍 Vérification PostgreSQL...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}⚠️  Docker n'est pas installé. Installez PostgreSQL manuellement.${NC}"
else
    echo -e "${BLUE}🐳 Démarrage PostgreSQL avec Docker...${NC}"
    docker run -d \
      --name meta-ads-postgres \
      -e POSTGRES_PASSWORD=password \
      -e POSTGRES_DB=meta_ads_generator \
      -p 5432:5432 \
      postgres:15 2>/dev/null || echo -e "${GREEN}✅ Container PostgreSQL déjà en cours${NC}"
    
    echo -e "${BLUE}🐳 Démarrage Redis avec Docker...${NC}"
    docker run -d \
      --name meta-ads-redis \
      -p 6379:6379 \
      redis:7-alpine 2>/dev/null || echo -e "${GREEN}✅ Container Redis déjà en cours${NC}"
    
    sleep 3
fi

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Création du fichier .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Fichier .env créé. Modifiez-le avec vos clés API!${NC}"
fi

# Attendre que PostgreSQL soit prêt
echo -e "${BLUE}⏳ Attente du démarrage de PostgreSQL...${NC}"
sleep 5

# Créer les tables
echo -e "${BLUE}🗄️  Création des tables de base de données...${NC}"
PGPASSWORD=password psql -h localhost -U postgres -d meta_ads_generator -f migrations/001_create_tables.sql 2>/dev/null || {
    echo -e "${RED}⚠️  Impossible de créer les tables automatiquement${NC}"
    echo -e "${BLUE}💡 Exécutez manuellement:${NC}"
    echo "   PGPASSWORD=password psql -h localhost -U postgres -d meta_ads_generator -f migrations/001_create_tables.sql"
}

echo ""
echo -e "${GREEN}✅ Installation terminée!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Modifier .env avec vos clés API (OPENAI_API_KEY, CLOUDINARY_*, etc.)"
echo "  2. Démarrer le serveur: npm run dev"
echo "  3. Tester l'API: http://localhost:3000/health"
echo ""
echo -e "${BLUE}🚀 Pour démarrer maintenant:${NC}"
echo "   npm run dev"
