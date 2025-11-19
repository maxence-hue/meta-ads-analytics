// Générateur de créatives et système de validation
class CreativeGenerator {
  constructor() {
    this.brandManager = null;
    this.templates = null;
    this.imageHandler = null;
    this.generatedCreatives = [];
    this.currentProject = null;
  }

  // Initialiser avec les autres modules
  init(brandManager, templates, imageHandler) {
    this.brandManager = brandManager;
    this.templates = templates;
    this.imageHandler = imageHandler;
  }

  // Créer un nouveau projet de créatives
  createProject(projectData) {
    this.currentProject = {
      id: this.generateProjectId(),
      name: projectData.name || 'Nouveau Projet',
      createdAt: new Date().toISOString(),
      brandGuidelines: this.brandManager.currentBrand,
      campaignObjective: projectData.objective,
      targetAudience: projectData.targetAudience,
      platforms: projectData.platforms || ['facebook', 'instagram'],
      creatives: []
    };
    
    return this.currentProject;
  }

  // Générer des créatives pour tous les formats
  async generateAllFormats(data) {
    const formats = ['landscape', 'square', 'story'];
    const creatives = {};
    const validationResults = {};

    for (const format of formats) {
      try {
        // Obtenir le template sélectionné ou le premier par défaut
        const templateId = data.templates?.[format] || this.templates.getTemplatesByFormat(format).layouts[0].id;
        const template = this.templates.getTemplate(format, templateId);
        
        if (!template) {
          throw new Error(`Template non trouvé pour le format ${format}`);
        }

        // Préparer les variables avec les valeurs de la marque
        const variables = this.prepareVariables(data, format);
        
        // Générer le HTML
        let html = template.html;
        
        // Remplacer toutes les variables
        Object.keys(variables).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, variables[key]);
        });

        // Valider la créative
        const validation = this.validateCreative(html, format);
        
        creatives[format] = {
          id: this.generateCreativeId(),
          format: format,
          templateId: templateId,
          templateName: template.name,
          html: html,
          variables: variables,
          valid: validation.valid,
          errors: validation.errors,
          createdAt: new Date().toISOString()
        };
        
        validationResults[format] = validation;

      } catch (error) {
        console.error(`Erreur génération format ${format}:`, error);
        creatives[format] = {
          error: error.message,
          valid: false
        };
      }
    }

    // Sauvegarder les créatives générées
    this.generatedCreatives.push({
      id: this.generateBatchId(),
      projectId: this.currentProject?.id,
      creatives: creatives,
      generatedAt: new Date().toISOString()
    });

    this.saveToLocalStorage();
    
    return {
      creatives,
      validationResults
    };
  }

  // Préparer les variables pour le template
  prepareVariables(data, format) {
    const brand = this.brandManager.currentBrand || {};
    const defaultImage = 'https://via.placeholder.com/1200x628/667eea/ffffff?text=Image';
    const defaultLogo = 'https://via.placeholder.com/200x60/ffffff/667eea?text=Logo';

    // Variables de base
    const baseVariables = {
      // Contenu
      headline: data.headline || 'Découvrez notre offre',
      description: data.description || 'Une solution parfaite pour vos besoins',
      cta: data.cta || brand.ctas?.[0] || 'En savoir plus',
      secondaryCta: data.secondaryCta || 'Contactez-nous',
      
      // Images
      image: data.image || defaultImage,
      bgImage: data.bgImage || data.image || defaultImage,
      productImage: data.productImage || data.image || defaultImage,
      logo: brand.logos?.lightBg || defaultLogo,
      
      // Couleurs de la marque
      primaryColor: brand.colors?.primary || '#1877F2',
      secondaryColor: brand.colors?.secondary || '#42B883',
      accentColor: brand.colors?.accent || '#667eea',
      textColor: brand.colors?.text || '#1C1E21',
      backgroundColor: brand.colors?.background || '#FFFFFF',
      
      // Typographie
      headingFont: brand.typography?.headingFont || 'Inter',
      bodyFont: brand.typography?.bodyFont || 'Inter',
      
      // E-commerce
      price: data.price || '29,99€',
      oldPrice: data.oldPrice || '49,99€',
      discount: data.discount || '-40%',
      urgency: data.urgency || 'Offre limitée !',
      badge: data.badge || 'Nouveau',
      tag: data.tag || 'Best Seller',
      
      // Produit
      productName: data.productName || 'Notre Produit',
      productDescription: data.productDescription || 'Description du produit',
      
      // Social proof
      testimonial: data.testimonial || 'Ce produit a changé ma vie !',
      customerName: data.customerName || 'Marie Dupont',
      customerTitle: data.customerTitle || 'Cliente satisfaite',
      customerImage: data.customerImage || 'https://via.placeholder.com/60/cccccc/666666?text=Avatar',
      
      // Features (pour les templates grid)
      icon1: data.icon1 || '✨',
      feature1Title: data.feature1Title || 'Qualité Premium',
      feature1Desc: data.feature1Desc || 'Matériaux de haute qualité',
      icon2: data.icon2 || '🚀',
      feature2Title: data.feature2Title || 'Livraison Rapide',
      feature2Desc: data.feature2Desc || 'Expédition en 24h',
      icon3: data.icon3 || '💎',
      feature3Title: data.feature3Title || 'Garantie',
      feature3Desc: data.feature3Desc || 'Satisfait ou remboursé',
      icon4: data.icon4 || '🌟',
      feature4Title: data.feature4Title || 'Support 24/7',
      feature4Desc: data.feature4Desc || 'Une équipe à votre écoute',
      
      // Autres
      bgLetter: data.bgLetter || data.headline?.charAt(0) || 'A',
      icon: data.icon || '🎯',
      subtitle: data.subtitle || 'Sous-titre accrocheur',
      days: data.days || '2',
      hours: data.hours || '12',
      minutes: data.minutes || '47',
      seconds: data.seconds || '59'
    };

    // Ajustements spécifiques par format
    if (format === 'story') {
      baseVariables.headline = this.truncateText(baseVariables.headline, 50);
      baseVariables.description = this.truncateText(baseVariables.description, 100);
    } else if (format === 'square') {
      baseVariables.headline = this.truncateText(baseVariables.headline, 60);
      baseVariables.description = this.truncateText(baseVariables.description, 120);
    }

    return baseVariables;
  }

  // Système de validation des créatives
  validateCreative(html, format) {
    const errors = [];
    const warnings = [];
    
    // Créer un conteneur temporaire pour validation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    const mainContainer = tempDiv.firstElementChild;
    if (!mainContainer) {
      errors.push('Aucun conteneur principal trouvé');
      document.body.removeChild(tempDiv);
      return { valid: false, errors, warnings };
    }

    // Obtenir les dimensions attendues
    const expectedDimensions = this.templates.getFormatDimensions(format);
    
    // Vérifier les dimensions
    const computedStyle = window.getComputedStyle(mainContainer);
    const width = parseInt(computedStyle.width);
    const height = parseInt(computedStyle.height);
    
    if (Math.abs(width - expectedDimensions.width) > 1) {
      errors.push(`Largeur incorrecte: ${width}px au lieu de ${expectedDimensions.width}px`);
    }
    
    if (Math.abs(height - expectedDimensions.height) > 1) {
      errors.push(`Hauteur incorrecte: ${height}px au lieu de ${expectedDimensions.height}px`);
    }

    // Vérifier le texte
    this.validateText(mainContainer, format, errors, warnings);
    
    // Vérifier les images
    this.validateImages(mainContainer, errors, warnings);
    
    // Vérifier le contraste des couleurs
    this.validateContrast(mainContainer, warnings);
    
    // Vérifier les CTA
    this.validateCTA(mainContainer, errors, warnings);

    // Nettoyer
    document.body.removeChild(tempDiv);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Valider le texte
  validateText(container, format, errors, warnings) {
    const textElements = container.querySelectorAll('h1, h2, h3, p, span, button');
    
    // Tailles minimales recommandées par format
    const minSizes = {
      landscape: { h1: 32, h2: 24, p: 16, button: 16 },
      square: { h1: 40, h2: 32, p: 18, button: 18 },
      story: { h1: 48, h2: 36, p: 24, button: 20 }
    };

    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const fontSize = parseInt(styles.fontSize);
      const tagName = el.tagName.toLowerCase();
      
      // Vérifier la taille du texte
      if (minSizes[format][tagName]) {
        const minSize = minSizes[format][tagName];
        if (fontSize < minSize) {
          warnings.push(`Texte potentiellement trop petit: ${tagName} (${fontSize}px < ${minSize}px recommandé)`);
        }
      }

      // Vérifier la longueur du texte
      const textLength = el.textContent.trim().length;
      if (tagName === 'h1' && textLength > 100) {
        warnings.push('Titre principal trop long (> 100 caractères)');
      }
      if (tagName === 'p' && textLength > 200) {
        warnings.push('Paragraphe potentiellement trop long (> 200 caractères)');
      }

      // Vérifier les variables non remplacées
      if (el.textContent.includes('{{')) {
        errors.push(`Variable non remplacée trouvée: ${el.textContent.match(/{{[^}]+}}/)?.[0]}`);
      }
    });
  }

  // Valider les images
  validateImages(container, errors, warnings) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
      // Vérifier la source
      if (!img.src || img.src === 'undefined' || img.src === 'null') {
        errors.push('Image avec source manquante');
      }
      
      // Vérifier l'accessibilité
      if (!img.alt) {
        warnings.push('Image sans attribut alt pour l\'accessibilité');
      }
    });

    // Vérifier les backgrounds
    const elementsWithBg = container.querySelectorAll('[style*="background"]');
    elementsWithBg.forEach(el => {
      const style = el.getAttribute('style');
      if (style && style.includes('url(') && (style.includes('undefined') || style.includes('null'))) {
        errors.push('Image de fond avec URL invalide');
      }
    });
  }

  // Valider le contraste
  validateContrast(container, warnings) {
    // Fonction simple pour calculer la luminance relative
    const getLuminance = (color) => {
      // Convertir la couleur en RGB si nécessaire
      const rgb = this.colorToRgb(color);
      if (!rgb) return 0.5; // Valeur par défaut
      
      const [r, g, b] = rgb.map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    // Vérifier le contraste du texte
    const textElements = container.querySelectorAll('h1, h2, h3, p, span, button');
    textElements.forEach(el => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      if (color && bgColor && bgColor !== 'transparent') {
        const textLuminance = getLuminance(color);
        const bgLuminance = getLuminance(bgColor);
        const contrast = (Math.max(textLuminance, bgLuminance) + 0.05) / (Math.min(textLuminance, bgLuminance) + 0.05);
        
        if (contrast < 4.5) {
          warnings.push(`Contraste potentiellement insuffisant (ratio: ${contrast.toFixed(2)})`);
        }
      }
    });
  }

  // Valider les CTA
  validateCTA(container, errors, warnings) {
    const buttons = container.querySelectorAll('button, a[style*="button"], [role="button"]');
    
    if (buttons.length === 0) {
      warnings.push('Aucun bouton CTA trouvé');
    }
    
    buttons.forEach(button => {
      const text = button.textContent.trim();
      
      // Vérifier que le bouton a du texte
      if (!text) {
        errors.push('Bouton CTA sans texte');
      }
      
      // Vérifier la longueur du texte
      if (text.length > 30) {
        warnings.push('Texte de CTA trop long (> 30 caractères)');
      }
      
      // Vérifier la taille cliquable
      const rect = button.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        warnings.push('Zone cliquable du CTA potentiellement trop petite (< 44px)');
      }
    });
  }

  // Exporter une créative en HTML
  exportAsHTML(creative, filename = 'creative') {
    const fullHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${filename} - ${creative.format}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f0f2f5;
        }
        .creative-container {
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="creative-container">
        ${creative.html}
    </div>
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${creative.format}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Exporter toutes les créatives
  exportAllCreatives(creatives, projectName = 'meta-ads') {
    Object.entries(creatives).forEach(([format, creative]) => {
      if (creative.html) {
        this.exportAsHTML(creative, `${projectName}-${format}`);
      }
    });
  }

  // Générer une variation d'une créative
  generateVariation(originalCreative, variations = {}) {
    const newVariables = { ...originalCreative.variables, ...variations };
    const template = this.templates.getTemplate(originalCreative.format, originalCreative.templateId);
    
    if (!template) return null;
    
    let html = template.html;
    Object.keys(newVariables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, newVariables[key]);
    });
    
    const validation = this.validateCreative(html, originalCreative.format);
    
    return {
      ...originalCreative,
      id: this.generateCreativeId(),
      html,
      variables: newVariables,
      valid: validation.valid,
      errors: validation.errors,
      isVariation: true,
      originalId: originalCreative.id,
      createdAt: new Date().toISOString()
    };
  }

  // Helpers
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
  }

  colorToRgb(color) {
    // Convertir hex en RGB
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return [r, g, b];
    }
    
    // Parser rgb() ou rgba()
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    
    return null;
  }

  generateProjectId() {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCreativeId() {
    return `creative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sauvegarder dans localStorage
  saveToLocalStorage() {
    try {
      localStorage.setItem('metaAdsCreatives', JSON.stringify({
        currentProject: this.currentProject,
        generatedCreatives: this.generatedCreatives
      }));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  }

  // Charger depuis localStorage
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('metaAdsCreatives');
      if (data) {
        const parsed = JSON.parse(data);
        this.currentProject = parsed.currentProject;
        this.generatedCreatives = parsed.generatedCreatives || [];
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  }
}

// Export pour utilisation
window.CreativeGenerator = CreativeGenerator;
