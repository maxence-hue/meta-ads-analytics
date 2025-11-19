// Gestionnaire d'images et intégration avec API de génération IA
class ImageHandler {
  constructor() {
    this.uploadedImages = [];
    this.generatedImages = [];
    this.geminiApiKey = null;
    this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  }

  // Initialiser avec la clé API
  init(apiKey) {
    this.geminiApiKey = apiKey;
  }

  // Configuration de la zone d'upload
  setupUploadZone(elementId) {
    const uploadZone = document.getElementById(elementId);
    if (!uploadZone) return;

    // Événements drag & drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await this.handleFileUpload(file);
      }
    });

    // Click pour ouvrir le sélecteur de fichiers
    uploadZone.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
          await this.handleFileUpload(file);
        }
      };
      input.click();
    });
  }

  // Traiter l'upload d'un fichier
  async handleFileUpload(file) {
    // Vérifier le type de fichier
    if (!this.acceptedTypes.includes(file.type)) {
      this.showError(`Type de fichier non supporté: ${file.type}`);
      return null;
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      this.showError(`Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)`);
      return null;
    }

    try {
      const imageData = await this.readFile(file);
      const optimizedImage = await this.optimizeImage(imageData, file.type);
      
      const imageObj = {
        id: this.generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        url: optimizedImage.url,
        dataUrl: optimizedImage.dataUrl,
        width: optimizedImage.width,
        height: optimizedImage.height,
        uploadedAt: new Date().toISOString()
      };

      this.uploadedImages.push(imageObj);
      this.saveToLocalStorage();
      this.displayImage(imageObj);
      
      return imageObj;
    } catch (error) {
      this.showError(`Erreur lors de l'upload: ${error.message}`);
      return null;
    }
  }

  // Lire un fichier
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Optimiser une image
  async optimizeImage(dataUrl, mimeType) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Limiter la taille maximale
        const maxSize = 1920;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en JPEG si nécessaire pour réduire la taille
        const outputType = mimeType === 'image/png' ? mimeType : 'image/jpeg';
        const quality = 0.85;
        
        canvas.toBlob(
          (blob) => {
            const optimizedUrl = URL.createObjectURL(blob);
            const optimizedDataUrl = canvas.toDataURL(outputType, quality);
            
            resolve({
              url: optimizedUrl,
              dataUrl: optimizedDataUrl,
              width,
              height
            });
          },
          outputType,
          quality
        );
      };
      img.src = dataUrl;
    });
  }

  // API Gemini pour génération d'images IA
  async generateImageWithAI(prompt, style = 'photorealistic', dimensions = { width: 1200, height: 628 }) {
    if (!this.geminiApiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    try {
      // Construire le prompt enrichi avec le style
      const stylePrompts = {
        'photorealistic': 'photorealistic, high quality, detailed',
        'illustration': 'digital illustration, artistic, vibrant colors',
        'minimalist': 'minimalist design, clean, simple',
        'abstract': 'abstract art, creative, modern',
        'cartoon': 'cartoon style, fun, colorful'
      };
      
      const enrichedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts.photorealistic}, ${dimensions.width}x${dimensions.height} aspect ratio`;
      
      // Appel à l'API Gemini Imagen
      const response = await fetch(
        `${this.geminiBaseUrl}/models/imagen-3.0-generate-001:predict?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [
              {
                prompt: enrichedPrompt
              }
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: this.getAspectRatio(dimensions),
              negativePrompt: 'blurry, low quality, distorted',
              safetyFilterLevel: 'block_some',
              personGeneration: 'allow_adult'
            }
          })
        }
      );

      if (!response.ok) {
        // Si l'API Gemini ne fonctionne pas, utiliser le fallback
        console.warn('API Gemini non disponible, utilisation du mode simulation');
        return await this.simulateGeminiAPI({ prompt: enrichedPrompt, style, width: dimensions.width, height: dimensions.height });
      }

      const data = await response.json();
      
      // Extraire l'image générée
      let imageUrl, imageDataUrl;
      
      if (data.predictions && data.predictions[0]) {
        const prediction = data.predictions[0];
        
        // L'API Gemini retourne l'image en base64
        if (prediction.bytesBase64Encoded) {
          imageDataUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
          const blob = await (await fetch(imageDataUrl)).blob();
          imageUrl = URL.createObjectURL(blob);
        } else if (prediction.mimeType && prediction.image) {
          imageDataUrl = `data:${prediction.mimeType};base64,${prediction.image}`;
          const blob = await (await fetch(imageDataUrl)).blob();
          imageUrl = URL.createObjectURL(blob);
        }
      }
      
      if (!imageUrl) {
        throw new Error('Aucune image générée par l\'API');
      }
      
      const imageObj = {
        id: this.generateId(),
        name: `gemini-${Date.now()}.png`,
        type: 'image/png',
        prompt: prompt,
        style: style,
        url: imageUrl,
        dataUrl: imageDataUrl,
        width: dimensions.width,
        height: dimensions.height,
        generatedAt: new Date().toISOString(),
        isGenerated: true
      };

      this.generatedImages.push(imageObj);
      this.saveToLocalStorage();
      this.displayImage(imageObj);
      
      return imageObj;
    } catch (error) {
      console.error('Erreur API Gemini:', error);
      // Fallback vers la simulation
      return await this.simulateGeminiAPI({ prompt, style, width: dimensions.width, height: dimensions.height });
    }
  }

  // Obtenir le ratio d'aspect pour Gemini
  getAspectRatio(dimensions) {
    const ratio = dimensions.width / dimensions.height;
    
    // Gemini supporte: 1:1, 3:4, 4:3, 9:16, 16:9
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 0.75) < 0.1) return '3:4';
    if (Math.abs(ratio - 1.33) < 0.1) return '4:3';
    if (Math.abs(ratio - 0.56) < 0.1) return '9:16';
    if (Math.abs(ratio - 1.78) < 0.1) return '16:9';
    
    // Par défaut, choisir le plus proche
    if (ratio < 1) return '9:16';
    if (ratio > 1.5) return '16:9';
    return '1:1';
  }

  // Simuler l'API Gemini (fallback si l'API ne fonctionne pas)
  async simulateGeminiAPI(payload) {
    // Simulation d'un délai d'API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Créer un canvas avec un placeholder
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = payload.width;
    canvas.height = payload.height;
    
    // Gradient de fond basé sur le style
    const gradients = {
      'photorealistic': ['#4A90E2', '#7B68EE'],
      'illustration': ['#FF6B6B', '#FFE66D'],
      'minimalist': ['#E0E0E0', '#FFFFFF'],
      'abstract': ['#FF0080', '#7928CA'],
      'cartoon': ['#FF6B9D', '#FEC163']
    };
    
    const colors = gradients[payload.style] || gradients.photorealistic;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texte
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎨 Gemini AI', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '24px Inter';
    ctx.fillText(`Style: ${payload.style}`, canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.font = '16px Inter';
    ctx.fillText('(Mode simulation)', canvas.width / 2, canvas.height / 2 + 40);
    
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    const blob = await (await fetch(dataUrl)).blob();
    const url = URL.createObjectURL(blob);
    
    const imageObj = {
      id: this.generateId(),
      name: `gemini-sim-${Date.now()}.png`,
      type: 'image/png',
      prompt: payload.prompt,
      style: payload.style,
      url: url,
      dataUrl: dataUrl,
      width: payload.width,
      height: payload.height,
      generatedAt: new Date().toISOString(),
      isGenerated: true
    };

    this.generatedImages.push(imageObj);
    this.saveToLocalStorage();
    this.displayImage(imageObj);
    
    return imageObj;
  }

  // Générer des prompts suggérés basés sur le produit
  generatePromptSuggestions(productInfo) {
    const { productName, industry, style, targetAudience } = productInfo;
    
    const suggestions = [
      {
        category: 'Product Shots',
        prompts: [
          `${productName} professional product photography, white background, studio lighting, high resolution`,
          `${productName} lifestyle shot, ${style} style, natural lighting, ${targetAudience} using product`,
          `${productName} close-up detail shot, macro photography, premium quality`
        ]
      },
      {
        category: 'Lifestyle',
        prompts: [
          `Happy ${targetAudience} using ${productName}, ${style} environment, candid moment`,
          `${productName} in real-world setting, ${industry} context, natural interaction`,
          `Group of ${targetAudience} enjoying ${productName}, social setting, authentic emotion`
        ]
      },
      {
        category: 'Abstract/Conceptual',
        prompts: [
          `Abstract representation of ${productName} benefits, ${style} color palette, modern design`,
          `Conceptual art showing ${industry} innovation, futuristic, ${style} aesthetic`,
          `Minimalist composition featuring ${productName}, geometric shapes, brand colors`
        ]
      }
    ];
    
    return suggestions;
  }

  // Afficher une image dans la galerie
  displayImage(imageObj) {
    const gallery = document.getElementById('imageGallery');
    if (!gallery) return;

    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.dataset.imageId = imageObj.id;
    
    imageItem.innerHTML = `
      <img src="${imageObj.url}" alt="${imageObj.name}">
      <button class="delete-btn" onclick="imageHandler.deleteImage('${imageObj.id}')">
        <i class="fas fa-times"></i>
      </button>
      ${imageObj.isGenerated ? '<span class="ai-badge">IA</span>' : ''}
    `;
    
    // Click pour sélectionner
    imageItem.addEventListener('click', (e) => {
      if (!e.target.closest('.delete-btn')) {
        this.selectImage(imageObj);
      }
    });
    
    gallery.appendChild(imageItem);
  }

  // Sélectionner une image
  selectImage(imageObj) {
    // Retirer la sélection précédente
    document.querySelectorAll('.image-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Ajouter la sélection
    const item = document.querySelector(`[data-image-id="${imageObj.id}"]`);
    if (item) {
      item.classList.add('selected');
    }
    
    // Émettre un événement
    window.dispatchEvent(new CustomEvent('imageSelected', { detail: imageObj }));
  }

  // Supprimer une image
  deleteImage(imageId) {
    // Supprimer de la liste
    this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);
    this.generatedImages = this.generatedImages.filter(img => img.id !== imageId);
    
    // Supprimer de l'affichage
    const item = document.querySelector(`[data-image-id="${imageId}"]`);
    if (item) {
      item.remove();
    }
    
    this.saveToLocalStorage();
  }

  // Obtenir toutes les images
  getAllImages() {
    return [...this.uploadedImages, ...this.generatedImages];
  }

  // Obtenir une image par ID
  getImageById(imageId) {
    return this.getAllImages().find(img => img.id === imageId);
  }

  // Sauvegarder dans localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('metaAdsImages', JSON.stringify({
        uploaded: this.uploadedImages,
        generated: this.generatedImages
      }));
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  }

  // Charger depuis localStorage
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('metaAdsImages');
      if (data) {
        const parsed = JSON.parse(data);
        this.uploadedImages = parsed.uploaded || [];
        this.generatedImages = parsed.generated || [];
        
        // Réafficher les images
        [...this.uploadedImages, ...this.generatedImages].forEach(img => {
          this.displayImage(img);
        });
      }
    } catch (error) {
      console.error('Erreur chargement localStorage:', error);
    }
  }

  // Nettoyer les images (libérer la mémoire)
  cleanup() {
    this.getAllImages().forEach(img => {
      if (img.url && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    this.uploadedImages = [];
    this.generatedImages = [];
  }

  // Générer un ID unique
  generateId() {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Afficher une erreur
  showError(message) {
    console.error(message);
    // Vous pouvez ajouter une notification visuelle ici
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Obtenir les dimensions recommandées pour un format
  getRecommendedDimensions(format) {
    const dimensions = {
      'landscape': { width: 1200, height: 628 },
      'square': { width: 1080, height: 1080 },
      'story': { width: 1080, height: 1920 },
      'banner': { width: 1200, height: 300 },
      'thumbnail': { width: 1280, height: 720 }
    };
    
    return dimensions[format] || dimensions.landscape;
  }
}

// Export pour utilisation dans d'autres modules
window.ImageHandler = ImageHandler;
