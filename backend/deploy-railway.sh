#!/bin/bash

# Script de déploiement Railway pour le backend Meta Ads Analytics
# Ce script configure et déploie automatiquement le backend sur Railway

set -e

echo "🚂 Déploiement du backend Meta Ads Analytics sur Railway"
echo "=========================================================="

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installation..."
    npm install -g @railway/cli
fi

# Vérifier l'authentification
echo "🔑 Vérification de l'authentification Railway..."
if ! railway whoami &> /dev/null; then
    echo "⚠️  Vous devez vous connecter à Railway"
    railway login
fi

# Se placer dans le dossier backend
cd "$(dirname "$0")"

# Initialiser ou lier le projet Railway si nécessaire
if [ ! -d ".railway" ]; then
    echo "📦 Initialisation du projet Railway..."
    railway init
fi

# Lier le service
echo "🔗 Liaison du service Railway..."
railway service

# Configuration des variables d'environnement
echo "⚙️  Configuration des variables d'environnement..."

# Variables critiques (vous devez les renseigner)
read -p "META_APP_ID: " META_APP_ID
read -p "META_APP_SECRET: " META_APP_SECRET
read -p "OPENAI_API_KEY: " OPENAI_API_KEY
read -p "DATABASE_URL (PostgreSQL): " DATABASE_URL
read -p "REDIS_URL: " REDIS_URL

# Variables avec valeurs par défaut
FRONTEND_URL="https://frontend-h9watnkmy-marketia.vercel.app"
NODE_ENV="production"
PORT="5001"

echo "📝 Configuration des variables..."

railway variables --set "NODE_ENV=$NODE_ENV"
railway variables --set "PORT=$PORT"
railway variables --set "FRONTEND_URL=$FRONTEND_URL"
railway variables --set "META_APP_ID=$META_APP_ID"
railway variables --set "META_APP_SECRET=$META_APP_SECRET"
railway variables --set "META_REDIRECT_URI=$FRONTEND_URL/api/v1/meta/callback"
railway variables --set "OPENAI_API_KEY=$OPENAI_API_KEY"
railway variables --set "DATABASE_URL=$DATABASE_URL"
railway variables --set "REDIS_URL=$REDIS_URL"
railway variables --set "JWT_SECRET=$(openssl rand -base64 32)"
railway variables --set "ENABLE_WEBSOCKET=true"
railway variables --set "RATE_LIMIT_WINDOW_MS=900000"
railway variables --set "RATE_LIMIT_MAX_REQUESTS=100"

echo "✅ Variables d'environnement configurées"

# Déploiement
echo "🚀 Lancement du déploiement..."
railway up

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📊 Pour voir le statut:"
echo "   railway status"
echo ""
echo "🌐 Pour obtenir l'URL publique:"
echo "   railway domain"
echo ""
echo "📝 Pour voir les logs:"
echo "   railway logs"
