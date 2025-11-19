# 🚀 Meta Ads Creative Generator - Guide d'utilisation

## Description
Application web complète pour générer automatiquement des créatives publicitaires pour Meta (Facebook & Instagram) avec système de brand guidelines intégré et génération d'images IA.

## 📋 Fonctionnalités

### ✅ Complétées
- **Gestion de marque** : Configuration complète des brand guidelines (couleurs, typographie, personnalité)
- **Scraping de site web** : Extraction automatique des informations de marque depuis une URL
- **Templates de créatives** : 15+ templates professionnels pour 3 formats
  - Paysage (1200x628) - Feed Facebook/Instagram
  - Carré (1080x1080) - Feed Instagram
  - Story (1080x1920) - Stories/Reels
- **Gestion d'images** : Upload, stockage et sélection d'images
- **Génération IA** : Interface pour génération d'images avec NeoBanana API
- **Validation automatique** : Vérification des dimensions, textes et couleurs
- **Export HTML** : Export des créatives en fichiers HTML autonomes
- **Sauvegarde locale** : Persistance des données dans localStorage

## 🚀 Démarrage rapide

### 1. Ouvrir l'application
Ouvrez le fichier `index.html` dans votre navigateur (Chrome recommandé).

### 2. Configuration de la marque
- Cliquez sur l'onglet **"Marque"**
- Remplissez les informations de votre marque ou utilisez le scraper
- Définissez vos couleurs, typographie et personnalité
- Cliquez sur **"Sauvegarder et continuer"**

### 3. Ajouter des images
- Allez dans l'onglet **"Images"**
- Glissez-déposez vos images ou cliquez pour uploader
- Ou utilisez le bouton **"Générer avec l'IA"** (nécessite clé API)

### 4. Créer le contenu
- Dans l'onglet **"Contenu"**
- Remplissez les textes : titre, description, CTA, prix, etc.

### 5. Sélectionner les templates
- Onglet **"Templates"**
- Choisissez un template pour chaque format
- Templates disponibles : Split Screen, Ugly Ads, Gradient Modern, Minimalist, etc.

### 6. Générer et exporter
- Cliquez sur **"Générer les Créatives"**
- Visualisez les 3 formats dans **"Prévisualisation"**
- Exportez en HTML avec **"Exporter tout"**

## 🛠️ Configuration API Google Gemini

La génération d'images IA utilise **Google Gemini Imagen 3.0**.

✅ **Clé API déjà configurée** : `AIzaSyDB0hFKhcO0kACrDHpRn1IGNSWOO-odYw8`

L'application est prête à générer des images avec l'IA ! Si vous souhaitez utiliser votre propre clé :

1. Obtenez une clé API sur [Google AI Studio](https://ai.google.dev/)
2. Ouvrez `js/app.js`
3. Ligne 597, remplacez la clé existante par la vôtre
4. Sauvegardez et rechargez la page

**Note** : Si l'API Gemini n'est pas disponible, l'application bascule automatiquement en mode simulation avec des placeholders.

## 📁 Structure du projet

```
/meta-ads-generator/
├── index.html           # Page principale
├── css/
│   └── styles.css       # Styles de l'application
├── js/
│   ├── app.js           # Application principale
│   ├── brandManager.js  # Gestion des marques
│   ├── creativeGenerator.js # Génération et validation
│   ├── imageHandler.js  # Upload et gestion d'images
│   └── templates.js     # Bibliothèque de templates
└── README-GUIDE.md      # Ce fichier
```

## 🎨 Templates disponibles

### Format Paysage (1200x628)
- **Split Screen** : Texte et image côte à côte
- **Ugly Ads** : Style "qui convertit" avec couleurs vives
- **Gradient Modern** : Design avec dégradé moderne

### Format Carré (1080x1080)
- **Centered Modern** : Design centré avec gradient
- **Bold Typography** : Focus sur la typographie
- **Minimalist** : Design épuré

### Format Story (1080x1920)
- **Full Screen Impact** : Impact visuel plein écran
- **Gradient Story** : Story avec dégradé moderne
- **Product Story** : Focus sur le produit

## 🔍 Système de validation

L'application vérifie automatiquement :
- ✅ Dimensions correctes pour chaque format
- ✅ Taille minimale du texte pour la lisibilité
- ✅ Contraste des couleurs
- ✅ Présence de CTA
- ✅ Variables non remplacées

## 💾 Données sauvegardées

Les données suivantes sont automatiquement sauvegardées dans le navigateur :
- Brand guidelines configurées
- Images uploadées
- Créatives générées
- Projets en cours

## 🚀 Fonctionnalités avancées

### Scraping de site web
Le scraper extrait automatiquement :
- Nom de la marque
- Couleurs principales
- Typographie
- Logo et favicon
- Mots-clés

### Génération de variations
- Créez plusieurs variations d'une créative
- Testez différents textes et couleurs
- A/B testing facile

### Export en masse
- Exportez les 3 formats en un clic
- Fichiers HTML autonomes
- Prêts pour l'upload sur Meta

## ⚠️ Notes importantes

1. **Images** : Utilisez des images haute qualité (min. 1200px de large)
2. **Textes** : Gardez les titres courts et percutants
3. **Couleurs** : Assurez un bon contraste pour la lisibilité
4. **API Gemini** : Clé déjà configurée et prête à l'emploi
5. **Génération IA** : Les images sont générées avec Google Gemini Imagen 3.0

## 📞 Support

Pour toute question ou amélioration, consultez le code source commenté dans les fichiers JavaScript.

## 🎯 Prochaines améliorations possibles

- Intégration directe avec Meta Business API
- Analytics et tracking des performances
- Bibliothèque de créatives sauvegardées
- Templates additionnels
- Export en images (PNG/JPG)
- Prévisualisation responsive

---

**Créé avec ❤️ pour optimiser vos campagnes publicitaires Meta**
