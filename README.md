# Générateur de Créatives Meta avec Scraping Automatique

Un outil web moderne pour générer des créatives marketing pour les plateformes Meta (Facebook, Instagram, Stories) avec **configuration automatique de la marque par scraping de site web**.

## 🚀 Fonctionnalités

- **🤖 Scraping Automatique**: Analysez n'importe quel site web pour extraire automatiquement:
  - Couleurs de la marque
  - Polices utilisées
  - Images du site
  - Contenu et descriptions
- **✏️ Modification Manuelle**: Tous les éléments extraits sont modifiables avant génération
- **🎨 Génération Multi-plateformes**: Créez des créatives pour Facebook, Instagram et Stories
- **🎯 Templates Personnalisés**: Adaptez le contenu selon l'objectif de campagne
- **💾 Export Facile**: Exportez toutes vos créatives au format JSON
- **📱 Interface Moderne**: Design responsive avec TailwindCSS

## 🛠️ Installation et Démarrage

### Prérequis
- Node.js (v18+)
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer le serveur backend
npm start
```

Le serveur backend démarre sur `http://localhost:3000`

### Ouvrir l'application

Ouvrez `index.html` dans votre navigateur ou utilisez un serveur local:

```bash
# Option 1: Serveur Python
python3 -m http.server 8000

# Option 2: Serveur Node simple
npx http-server -p 8000
```

Puis accédez à `http://localhost:8000`

## 📋 Comment Utiliser

### Étape 1: Configuration Automatique de la Marque

1. **Entrez l'URL de votre site web**:
   - Ex: `https://www.nike.com` ou `https://www.airbnb.com`
   
2. **Cliquez sur "Analyser le site"**:
   - L'outil va automatiquement extraire:
     - Les couleurs principales du site
     - Les polices utilisées
     - Les images disponibles
     - Le nom et la description de la marque

3. **Vérifiez et modifiez les informations**:
   - Tous les champs sont éditables manuellement
   - Cliquez sur une couleur pour la copier
   - Sélectionnez une image pour l'utiliser dans vos créatives

### Étape 2: Génération des Créatives

1. **Remplir les informations du produit/service**:
   - Nom du produit (pré-rempli avec le nom de la marque)
   - Description détaillée
   - Objectif de campagne

2. **Configurer l'audience et les plateformes**:
   - Définir votre audience cible
   - Choisir les plateformes (Facebook, Instagram, Stories)
   - Sélectionner le style visuel

3. **Générer les créatives**:
   - Cliquer sur "Générer les Créatives"
   - Examiner les résultats générés
   - Copier ou exporter les créatives

## 🎨 Styles Visuels Disponibles

- **Moderne**: Design épuré et contemporain
- **Minimaliste**: Simple et élegant
- **Vibrant**: Couleurs vives et énergiques
- **Élégant**: Sophistiqué et premium
- **Amusant**: Décontracté et ludique

## 📊 Objectifs de Campagne

- **Notoriété**: Augmenter la visibilité de la marque
- **Trafic**: Diriger vers votre site web
- **Engagement**: Encourager les interactions
- **Conversions**: Générer des actions spécifiques
- **Ventes**: Promouvoir des achats

## 🛠️ Technologies Utilisées

- **HTML5**: Structure sémantique
- **TailwindCSS**: Design moderne et responsive
- **JavaScript ES6+**: Logique de génération
- **Font Awesome**: Icônes professionnelles

## 📱 Formats Supportés

- **Facebook**: 1200×628px (1.91:1)
- **Instagram**: 1080×1080px (1:1)
- **Stories**: 1080×1920px (9:16)

## 💾 Export

Les créatives peuvent être exportées au format JSON avec toutes les informations nécessaires:
- Titres et descriptions
- Appels à l'action
- Suggestions d'images
- Hashtags (Instagram)
- Dimensions techniques

## 🌐 Démarrage Rapide

1. Clonez ou téléchargez le projet
2. Ouvrez `index.html` dans votre navigateur
3. Commencez à générer des créatives!

Aucune installation requise - fonctionne directement dans le navigateur.

## 📈 Prochaines Améliorations

- [ ] Intégration avec l'API Meta
- [ ] Générateur d'images IA
- [ ] Templates personnalisables
- [ ] Analytics des performances
- [ ] Mode collaboration d'équipe

---

Créé avec ❤️ pour les marketeurs et créateurs de contenu.
