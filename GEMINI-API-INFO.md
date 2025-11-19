# 🎨 Intégration Google Gemini Imagen - Guide Technique

## Configuration actuelle

### Clé API
```
AIzaSyDB0hFKhcO0kACrDHpRn1IGNSWOO-odYw8
```

### Endpoint utilisé
```
https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict
```

## Fonctionnalités implémentées

### 1. Génération d'images IA
L'application utilise **Google Gemini Imagen 3.0** pour générer des images basées sur des prompts textuels.

### 2. Styles disponibles
- **Photorealistic** : Images photoréalistes haute qualité
- **Illustration** : Illustrations digitales artistiques
- **Minimalist** : Designs épurés et simples
- **Abstract** : Art abstrait moderne
- **Cartoon** : Style cartoon coloré

### 3. Formats supportés
- **Paysage** : 1200x628 (ratio 16:9)
- **Carré** : 1080x1080 (ratio 1:1)
- **Story** : 1080x1920 (ratio 9:16)

## Architecture technique

### Fichier : `js/imageHandler.js`

#### Méthode principale : `generateImageWithAI()`
```javascript
async generateImageWithAI(prompt, style, dimensions)
```

**Paramètres :**
- `prompt` : Description textuelle de l'image souhaitée
- `style` : Style visuel (photorealistic, illustration, etc.)
- `dimensions` : Objet avec width et height

**Retour :**
- Objet image avec URL, dataURL, métadonnées

#### Enrichissement du prompt
Le système enrichit automatiquement les prompts avec :
- Descripteurs de style
- Ratio d'aspect
- Qualité souhaitée

Exemple :
```
Input: "Chaussures de sport rouges"
Output: "Chaussures de sport rouges, photorealistic, high quality, detailed, 1200x628 aspect ratio"
```

#### Gestion des ratios d'aspect
La méthode `getAspectRatio()` convertit les dimensions en ratios supportés par Gemini :
- 1:1 (carré)
- 3:4 (portrait)
- 4:3 (paysage)
- 9:16 (story vertical)
- 16:9 (paysage large)

### Paramètres de l'API

```javascript
{
  instances: [{
    prompt: enrichedPrompt
  }],
  parameters: {
    sampleCount: 1,
    aspectRatio: "16:9",
    negativePrompt: "blurry, low quality, distorted",
    safetyFilterLevel: "block_some",
    personGeneration: "allow_adult"
  }
}
```

## Système de fallback

### Mode simulation
Si l'API Gemini n'est pas disponible ou retourne une erreur, l'application bascule automatiquement en **mode simulation**.

**Fonctionnalités du mode simulation :**
- Génération de placeholders avec gradients
- Indication visuelle du style sélectionné
- Dimensions correctes respectées
- Aucune interruption de l'expérience utilisateur

### Détection automatique
```javascript
if (!response.ok) {
  console.warn('API Gemini non disponible, utilisation du mode simulation');
  return await this.simulateGeminiAPI(payload);
}
```

## Utilisation dans l'application

### 1. Interface utilisateur
- Bouton "Générer avec l'IA" dans l'onglet Images
- Modal avec champs :
  - Description (prompt)
  - Style (dropdown)
  - Format (dropdown)

### 2. Workflow
```
User Input → Enrichissement → API Call → Image Processing → Display
```

### 3. Stockage
Les images générées sont :
- Stockées dans `this.generatedImages`
- Sauvegardées dans localStorage
- Affichées dans la galerie avec badge "IA"

## Sécurité et bonnes pratiques

### 1. Clé API
- ✅ Clé configurée côté client (pour prototype)
- ⚠️ Pour production : déplacer vers un backend sécurisé

### 2. Negative prompts
Filtrage automatique de contenu indésirable :
- "blurry" (flou)
- "low quality" (basse qualité)
- "distorted" (déformé)

### 3. Safety filters
- Niveau : `block_some`
- Protection contre contenu inapproprié
- Génération de personnes : autorisée pour adultes

## Limites et considérations

### Quotas API
- Vérifier les limites de votre clé API
- Implémenter un système de cache si nécessaire

### Temps de génération
- Délai moyen : 3-10 secondes
- Affichage d'un loader pendant la génération

### Qualité des prompts
Pour de meilleurs résultats :
- Soyez spécifique et descriptif
- Incluez des détails visuels
- Mentionnez le contexte d'utilisation

**Exemples de bons prompts :**
```
✅ "Modern smartphone on white background, professional product photography, studio lighting"
✅ "Happy woman using laptop in bright office, natural light, candid moment"
✅ "Abstract geometric shapes in blue and purple gradient, minimalist design"

❌ "Phone"
❌ "Person working"
❌ "Nice colors"
```

## Debugging

### Logs console
L'application affiche des logs pour :
- Erreurs API
- Basculement en mode simulation
- Détails des requêtes

### Vérification
```javascript
// Dans la console du navigateur
console.log(app.imageHandler.geminiApiKey); // Vérifier la clé
console.log(app.imageHandler.generatedImages); // Voir les images générées
```

## Documentation officielle

- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Image Generation Guide](https://ai.google.dev/gemini-api/docs/image-generation?hl=fr)
- [API Reference](https://ai.google.dev/api)

## Améliorations futures possibles

1. **Variations d'images** : Générer plusieurs versions d'un même prompt
2. **Édition d'images** : Modifier des images existantes
3. **Upscaling** : Améliorer la résolution
4. **Batch generation** : Générer plusieurs images en parallèle
5. **Historique de prompts** : Sauvegarder les prompts réussis
6. **Templates de prompts** : Bibliothèque de prompts pré-configurés

---

**Note** : Cette intégration est fonctionnelle et prête pour le développement. Pour une utilisation en production, considérez la sécurisation de la clé API via un backend.
