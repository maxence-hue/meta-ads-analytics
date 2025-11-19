// Application principale Meta Ads Creative Generator
class MetaAdsGenerator {
  constructor() {
    // Modules
    this.brandManager = null;
    this.templates = null;
    this.imageHandler = null;
    this.creativeGenerator = null;
    
    // État de l'application
    this.currentStep = 'brand';
    this.currentData = {
      brand: null,
      images: [],
      content: {},
      selectedTemplates: {}
    };
    
    // Configuration
    this.config = {
      geminiApiKey: '',
      autoSave: true,
      defaultLanguage: 'fr'
    };
  }

  // Initialiser l'application
  init(config = {}) {
    this.config = { ...this.config, ...config };
    
    // Initialiser les modules
    this.brandManager = new BrandManager();
    this.templates = new CreativeTemplates();
    this.imageHandler = new ImageHandler();
    this.creativeGenerator = new CreativeGenerator();
    
    // Connecter les modules
    this.creativeGenerator.init(this.brandManager, this.templates, this.imageHandler);
    this.imageHandler.init(this.config.geminiApiKey);
    
    // Charger les données sauvegardées
    this.loadSavedData();
    
    // Configurer l'interface
    this.setupUI();
    this.attachEventListeners();
    
    console.log('✅ Meta Ads Generator initialisé');
  }

  // Configurer l'interface utilisateur
  setupUI() {
    // Afficher l'étape initiale
    this.showStep('brand');
    
    // Configurer la zone d'upload
    this.imageHandler.setupUploadZone('uploadZone');
    
    // Charger les templates disponibles
    this.displayTemplates();
    
    // Afficher les marques sauvegardées
    this.displaySavedBrands();
  }

  // Attacher les événements
  attachEventListeners() {
    // Navigation entre les étapes
    document.querySelectorAll('[data-step]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const step = e.target.dataset.step;
        this.showStep(step);
      });
    });

    // Formulaire de marque
    const brandForm = document.getElementById('brandForm');
    if (brandForm) {
      brandForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveBrandSettings();
      });
    }

    // Scraper de site web
    const scrapeBtn = document.getElementById('scrapeWebsite');
    if (scrapeBtn) {
      scrapeBtn.addEventListener('click', () => this.scrapeWebsite());
    }

    // Génération de créatives
    const generateBtn = document.getElementById('generateCreatives');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateCreatives());
    }

    // Génération d'images IA
    const aiImageBtn = document.getElementById('generateAiImage');
    if (aiImageBtn) {
      aiImageBtn.addEventListener('click', () => this.showAiImageModal());
    }

    // Export
    const exportBtn = document.getElementById('exportAll');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportAllCreatives());
    }

    // Écouteur pour la sélection d'image
    window.addEventListener('imageSelected', (e) => {
      this.currentData.selectedImage = e.detail;
      this.updateImagePreview(e.detail);
    });

    // Auto-save
    if (this.config.autoSave) {
      setInterval(() => this.saveCurrentState(), 30000); // Toutes les 30 secondes
    }
  }

  // Afficher une étape spécifique
  showStep(step) {
    // Cacher toutes les sections
    document.querySelectorAll('.step-section').forEach(section => {
      section.classList.add('hidden');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(`${step}Section`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }
    
    // Mettre à jour la navigation
    document.querySelectorAll('.step-nav').forEach(nav => {
      nav.classList.remove('active');
    });
    document.querySelector(`.step-nav[data-step="${step}"]`)?.classList.add('active');
    
    this.currentStep = step;
  }

  // Sauvegarder les paramètres de marque
  saveBrandSettings() {
    const formData = new FormData(document.getElementById('brandForm'));
    const brandData = {
      brandName: formData.get('brandName'),
      websiteUrl: formData.get('websiteUrl'),
      industry: formData.get('industry'),
      targetAudience: formData.get('targetAudience'),
      colors: {
        primary: formData.get('primaryColor'),
        secondary: formData.get('secondaryColor'),
        accent: formData.get('accentColor'),
        text: formData.get('textColor'),
        background: formData.get('backgroundColor')
      },
      typography: {
        headingFont: formData.get('headingFont'),
        bodyFont: formData.get('bodyFont')
      },
      ctas: formData.get('ctas')?.split(',').map(cta => cta.trim()) || [],
      brandPersonality: Array.from(document.querySelectorAll('input[name="personality"]:checked'))
        .map(input => input.value),
      visualStyle: {
        useGradients: formData.get('useGradients') === 'on',
        borderRadius: formData.get('borderRadius'),
        shadowIntensity: formData.get('shadowIntensity')
      }
    };
    
    const brand = this.brandManager.createBrandGuidelines(brandData);
    this.brandManager.saveBrand(brand);
    this.currentData.brand = brand;
    
    this.showNotification('Marque sauvegardée avec succès', 'success');
    this.showStep('images');
  }

  // Scraper un site web
  async scrapeWebsite() {
    const url = document.getElementById('websiteUrl').value;
    if (!url) {
      this.showNotification('Veuillez entrer une URL', 'error');
      return;
    }
    
    this.showLoading(true);
    
    try {
      const brandData = await this.brandManager.scrapeBrandFromWebsite(url);
      this.fillBrandForm(brandData);
      this.showNotification('Informations récupérées avec succès', 'success');
    } catch (error) {
      this.showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // Remplir le formulaire avec les données de marque
  fillBrandForm(brandData) {
    document.getElementById('brandName').value = brandData.brandName || '';
    document.getElementById('websiteUrl').value = brandData.websiteUrl || '';
    document.getElementById('industry').value = brandData.industry || '';
    document.getElementById('targetAudience').value = brandData.targetAudience || '';
    
    // Couleurs
    if (brandData.colors) {
      document.getElementById('primaryColor').value = brandData.colors.primary || '#1877F2';
      document.getElementById('secondaryColor').value = brandData.colors.secondary || '#42B883';
      document.getElementById('accentColor').value = brandData.colors.accent || '#667eea';
      document.getElementById('textColor').value = brandData.colors.text || '#1C1E21';
      document.getElementById('backgroundColor').value = brandData.colors.background || '#FFFFFF';
    }
    
    // Typographie
    if (brandData.typography) {
      document.getElementById('headingFont').value = brandData.typography.headingFont || 'Inter';
      document.getElementById('bodyFont').value = brandData.typography.bodyFont || 'Inter';
    }
  }

  // Afficher les templates disponibles
  displayTemplates() {
    const formats = ['landscape', 'square', 'story'];
    
    formats.forEach(format => {
      const container = document.getElementById(`${format}Templates`);
      if (!container) return;
      
      const templates = this.templates.getTemplatesByFormat(format);
      if (!templates) return;
      
      container.innerHTML = templates.layouts.map(template => `
        <div class="template-card" data-format="${format}" data-template-id="${template.id}">
          <i class="fas ${template.icon}"></i>
          <h4>${template.name}</h4>
          <p>${template.description}</p>
        </div>
      `).join('');
      
      // Ajouter les événements de sélection
      container.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', () => {
          // Retirer la sélection précédente
          container.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
          // Ajouter la sélection
          card.classList.add('selected');
          // Sauvegarder la sélection
          this.currentData.selectedTemplates[format] = card.dataset.templateId;
        });
      });
      
      // Sélectionner le premier par défaut
      container.querySelector('.template-card')?.click();
    });
  }

  // Générer les créatives
  async generateCreatives() {
    // Vérifier les prérequis
    if (!this.brandManager.currentBrand) {
      this.showNotification('Veuillez d\'abord configurer votre marque', 'error');
      this.showStep('brand');
      return;
    }
    
    // Récupérer les données du formulaire de contenu
    const contentData = this.getContentFormData();
    
    // Ajouter les templates sélectionnés
    contentData.templates = this.currentData.selectedTemplates;
    
    // Ajouter l'image sélectionnée
    if (this.currentData.selectedImage) {
      contentData.image = this.currentData.selectedImage.url || this.currentData.selectedImage.dataUrl;
    }
    
    this.showLoading(true);
    
    try {
      // Générer les créatives
      const result = await this.creativeGenerator.generateAllFormats(contentData);
      
      // Afficher les prévisualisations
      this.displayPreviews(result.creatives);
      
      // Afficher les résultats de validation
      this.displayValidationResults(result.validationResults);
      
      this.showNotification('Créatives générées avec succès', 'success');
      this.showStep('preview');
      
    } catch (error) {
      this.showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // Récupérer les données du formulaire de contenu
  getContentFormData() {
    const formData = new FormData(document.getElementById('contentForm'));
    
    return {
      headline: formData.get('headline'),
      description: formData.get('description'),
      cta: formData.get('cta'),
      productName: formData.get('productName'),
      price: formData.get('price'),
      oldPrice: formData.get('oldPrice'),
      discount: formData.get('discount'),
      urgency: formData.get('urgency'),
      badge: formData.get('badge'),
      testimonial: formData.get('testimonial'),
      customerName: formData.get('customerName'),
      customerTitle: formData.get('customerTitle')
    };
  }

  // Afficher les prévisualisations
  displayPreviews(creatives) {
    Object.entries(creatives).forEach(([format, creative]) => {
      const previewFrame = document.getElementById(`preview-${format}`);
      if (!previewFrame || !creative.html) return;
      
      // Créer un iframe pour isoler les styles
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      previewFrame.innerHTML = '';
      previewFrame.appendChild(iframe);
      
      // Écrire le contenu dans l'iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { margin: 0; padding: 0; overflow: hidden; }
          </style>
        </head>
        <body>
          ${creative.html}
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // Appliquer le scale pour la prévisualisation
      const scale = this.getPreviewScale(format);
      iframe.style.transform = `scale(${scale})`;
      iframe.style.transformOrigin = 'top left';
      iframe.style.width = `${100 / scale}%`;
      iframe.style.height = `${100 / scale}%`;
    });
  }

  // Obtenir l'échelle de prévisualisation
  getPreviewScale(format) {
    const scales = {
      'landscape': 0.333,
      'square': 0.333,
      'story': 0.25
    };
    return scales[format] || 0.333;
  }

  // Afficher les résultats de validation
  displayValidationResults(validationResults) {
    Object.entries(validationResults).forEach(([format, validation]) => {
      const statusElement = document.getElementById(`validation-${format}`);
      if (!statusElement) return;
      
      statusElement.className = `validation-status ${validation.valid ? 'valid' : 'invalid'}`;
      
      if (validation.valid) {
        statusElement.innerHTML = '✅ Créative valide';
      } else {
        statusElement.innerHTML = `
          ⚠️ Problèmes détectés:
          <ul>
            ${validation.errors.map(error => `<li>${error}</li>`).join('')}
            ${validation.warnings?.map(warning => `<li style="opacity:0.7;">${warning}</li>`).join('') || ''}
          </ul>
        `;
      }
    });
  }

  // Modal pour générer une image IA
  showAiImageModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Générer une image avec l'IA</h3>
        <div class="form-group">
          <label>Description de l'image (prompt)</label>
          <textarea id="aiPrompt" rows="4" placeholder="Décrivez l'image que vous souhaitez générer..."></textarea>
        </div>
        <div class="form-group">
          <label>Style</label>
          <select id="aiStyle">
            <option value="photorealistic">Photoréaliste</option>
            <option value="illustration">Illustration</option>
            <option value="minimalist">Minimaliste</option>
            <option value="abstract">Abstrait</option>
            <option value="cartoon">Cartoon</option>
          </select>
        </div>
        <div class="form-group">
          <label>Format</label>
          <select id="aiFormat">
            <option value="landscape">Paysage (1200x628)</option>
            <option value="square">Carré (1080x1080)</option>
            <option value="story">Story (1080x1920)</option>
          </select>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="app.generateAiImage()">Générer</button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Annuler</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Générer une image IA
  async generateAiImage() {
    const prompt = document.getElementById('aiPrompt').value;
    const style = document.getElementById('aiStyle').value;
    const format = document.getElementById('aiFormat').value;
    
    if (!prompt) {
      this.showNotification('Veuillez entrer une description', 'error');
      return;
    }
    
    const dimensions = this.imageHandler.getRecommendedDimensions(format);
    
    this.showLoading(true);
    document.querySelector('.modal').remove();
    
    try {
      const image = await this.imageHandler.generateImageWithAI(prompt, style, dimensions);
      this.showNotification('Image générée avec succès', 'success');
    } catch (error) {
      this.showNotification(`Erreur: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  // Exporter toutes les créatives
  exportAllCreatives() {
    const lastBatch = this.creativeGenerator.generatedCreatives[this.creativeGenerator.generatedCreatives.length - 1];
    if (!lastBatch) {
      this.showNotification('Aucune créative à exporter', 'error');
      return;
    }
    
    const projectName = this.brandManager.currentBrand?.brandName?.toLowerCase().replace(/\s+/g, '-') || 'meta-ads';
    this.creativeGenerator.exportAllCreatives(lastBatch.creatives, projectName);
    this.showNotification('Export réussi', 'success');
  }

  // Afficher les marques sauvegardées
  displaySavedBrands() {
    const brands = this.brandManager.loadSavedBrands();
    const container = document.getElementById('savedBrands');
    
    if (!container) return;
    
    if (brands.length === 0) {
      container.innerHTML = '<p class="text-center">Aucune marque sauvegardée</p>';
      return;
    }
    
    container.innerHTML = brands.map(brand => `
      <div class="brand-item">
        <h4>${brand.brandName}</h4>
        <p>${brand.industry || 'Non défini'}</p>
        <div class="btn-group">
          <button class="btn btn-sm" onclick="app.loadBrand('${brand.brandName}')">Charger</button>
          <button class="btn btn-sm btn-danger" onclick="app.deleteBrand('${brand.brandName}')">Supprimer</button>
        </div>
      </div>
    `).join('');
  }

  // Charger une marque
  loadBrand(brandName) {
    const brand = this.brandManager.loadBrand(brandName);
    if (brand) {
      this.fillBrandForm(brand);
      this.currentData.brand = brand;
      this.showNotification(`Marque "${brandName}" chargée`, 'success');
    }
  }

  // Supprimer une marque
  deleteBrand(brandName) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la marque "${brandName}" ?`)) {
      this.brandManager.deleteBrand(brandName);
      this.displaySavedBrands();
      this.showNotification('Marque supprimée', 'success');
    }
  }

  // Afficher/cacher le chargement
  showLoading(show) {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  // Afficher une notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: ${type === 'success' ? '#42B883' : type === 'error' ? '#F02849' : '#1877F2'};
      color: white;
      border-radius: 8px;
      z-index: 9999;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Sauvegarder l'état actuel
  saveCurrentState() {
    try {
      localStorage.setItem('metaAdsCurrentState', JSON.stringify(this.currentData));
    } catch (error) {
      console.error('Erreur sauvegarde état:', error);
    }
  }

  // Charger les données sauvegardées
  loadSavedData() {
    try {
      // Charger l'état
      const state = localStorage.getItem('metaAdsCurrentState');
      if (state) {
        this.currentData = JSON.parse(state);
      }
      
      // Charger les modules
      this.brandManager.loadSavedBrands();
      this.imageHandler.loadFromLocalStorage();
      this.creativeGenerator.loadFromLocalStorage();
      
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  }

  // Mettre à jour la prévisualisation d'image
  updateImagePreview(imageObj) {
    const preview = document.getElementById('selectedImagePreview');
    if (preview) {
      preview.innerHTML = `
        <img src="${imageObj.url || imageObj.dataUrl}" alt="${imageObj.name}" style="max-width: 200px; max-height: 150px; object-fit: cover; border-radius: 8px;">
        <p>${imageObj.name}</p>
      `;
    }
  }
}

// Instance globale
window.app = null;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
  window.app = new MetaAdsGenerator();
  window.app.init({
    geminiApiKey: 'AIzaSyDB0hFKhcO0kACrDHpRn1IGNSWOO-odYw8',
    autoSave: true,
    defaultLanguage: 'fr'
  });
});

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
