// Brand Guidelines Manager
class BrandManager {
  constructor() {
    this.currentBrand = null;
    this.savedBrands = this.loadSavedBrands();
  }

  // Structure des brand guidelines
  createBrandGuidelines(data = {}) {
    return {
      // Informations de base
      brandName: data.brandName || '',
      websiteUrl: data.websiteUrl || '',
      industry: data.industry || '',
      targetAudience: data.targetAudience || '',
      
      // Identité visuelle
      logos: {
        lightBg: data.logos?.lightBg || null,
        darkBg: data.logos?.darkBg || null,
        favicon: data.logos?.favicon || null
      },
      
      // Couleurs
      colors: {
        primary: data.colors?.primary || '#1877F2',
        secondary: data.colors?.secondary || '#42B883',
        accent: data.colors?.accent || '#667eea',
        text: data.colors?.text || '#1C1E21',
        background: data.colors?.background || '#FFFFFF'
      },
      
      // Typographie
      typography: {
        headingFont: data.typography?.headingFont || 'Inter',
        bodyFont: data.typography?.bodyFont || 'Inter',
        sizes: {
          h1: data.typography?.sizes?.h1 || '48px',
          h2: data.typography?.sizes?.h2 || '36px',
          body: data.typography?.sizes?.body || '16px'
        }
      },
      
      // Ton et style
      brandPersonality: data.brandPersonality || [],
      keywords: data.keywords || [],
      
      // Call-to-actions préférés
      ctas: data.ctas || ['En savoir plus', 'Acheter maintenant', 'Découvrir', 'Commencer', 'S\'inscrire'],
      
      // Éléments visuels
      visualStyle: {
        useGradients: data.visualStyle?.useGradients || false,
        usePatterns: data.visualStyle?.usePatterns || false,
        borderRadius: data.visualStyle?.borderRadius || 'medium',
        shadowIntensity: data.visualStyle?.shadowIntensity || 'light'
      },
      
      // Métadonnées
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Scraper automatique pour récupérer les infos depuis un site web
  async scrapeBrandFromWebsite(url) {
    try {
      // Utiliser un proxy CORS pour éviter les problèmes de cross-origin
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const brandData = {
        websiteUrl: url,
        brandName: this.extractBrandName(doc),
        colors: this.extractColors(doc),
        typography: this.extractFonts(doc),
        logos: await this.extractLogos(doc, url),
        keywords: this.extractKeywords(doc)
      };
      
      return this.createBrandGuidelines(brandData);
    } catch (error) {
      console.error('Erreur lors du scraping:', error);
      throw new Error('Impossible de récupérer les informations du site web');
    }
  }

  // Extraire le nom de la marque
  extractBrandName(doc) {
    // Essayer plusieurs méthodes pour trouver le nom
    const title = doc.querySelector('title')?.textContent;
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]')?.content;
    const applicationName = doc.querySelector('meta[name="application-name"]')?.content;
    
    return ogSiteName || applicationName || title?.split('-')[0]?.split('|')[0]?.trim() || 'Ma Marque';
  }

  // Extraire les couleurs principales
  extractColors(doc) {
    const colors = {
      primary: '#1877F2',
      secondary: '#42B883',
      accent: '#667eea',
      text: '#1C1E21',
      background: '#FFFFFF'
    };
    
    // Essayer de trouver les couleurs dans les meta tags
    const themeColor = doc.querySelector('meta[name="theme-color"]')?.content;
    if (themeColor) colors.primary = themeColor;
    
    // Analyser les styles inline pour trouver des couleurs récurrentes
    const allElements = doc.querySelectorAll('*');
    const colorMap = new Map();
    
    allElements.forEach(el => {
      const style = el.getAttribute('style');
      if (style) {
        // Extraire les couleurs hex
        const hexColors = style.match(/#[0-9A-Fa-f]{6}/g);
        if (hexColors) {
          hexColors.forEach(color => {
            colorMap.set(color, (colorMap.get(color) || 0) + 1);
          });
        }
      }
    });
    
    // Prendre les couleurs les plus utilisées
    if (colorMap.size > 0) {
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);
      
      if (sortedColors[0]) colors.primary = sortedColors[0];
      if (sortedColors[1]) colors.secondary = sortedColors[1];
      if (sortedColors[2]) colors.accent = sortedColors[2];
    }
    
    return colors;
  }

  // Extraire les polices
  extractFonts(doc) {
    const typography = {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      sizes: {
        h1: '48px',
        h2: '36px',
        body: '16px'
      }
    };
    
    // Chercher les fonts dans les link tags
    const fontLinks = doc.querySelectorAll('link[href*="fonts"]');
    fontLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        // Extraire le nom de la font depuis Google Fonts
        const fontMatch = href.match(/family=([^:&]+)/);
        if (fontMatch) {
          const fontName = fontMatch[1].replace(/\+/g, ' ');
          typography.headingFont = fontName;
          typography.bodyFont = fontName;
        }
      }
    });
    
    return typography;
  }

  // Extraire les logos
  async extractLogos(doc, baseUrl) {
    const logos = {
      lightBg: null,
      darkBg: null,
      favicon: null
    };
    
    // Chercher le favicon
    const favicon = doc.querySelector('link[rel="icon"]') || 
                    doc.querySelector('link[rel="shortcut icon"]');
    if (favicon) {
      logos.favicon = this.resolveUrl(favicon.getAttribute('href'), baseUrl);
    }
    
    // Chercher le logo principal
    const logoSelectors = [
      'img[class*="logo"]',
      'img[id*="logo"]',
      'img[alt*="logo"]',
      'header img',
      'nav img',
      '.logo img',
      '#logo img'
    ];
    
    for (const selector of logoSelectors) {
      const logo = doc.querySelector(selector);
      if (logo) {
        logos.lightBg = this.resolveUrl(logo.getAttribute('src'), baseUrl);
        logos.darkBg = logos.lightBg; // Par défaut, même logo
        break;
      }
    }
    
    return logos;
  }

  // Extraire les mots-clés
  extractKeywords(doc) {
    const metaKeywords = doc.querySelector('meta[name="keywords"]')?.content;
    const metaDescription = doc.querySelector('meta[name="description"]')?.content;
    
    let keywords = [];
    
    if (metaKeywords) {
      keywords = metaKeywords.split(',').map(k => k.trim()).slice(0, 10);
    }
    
    if (metaDescription && keywords.length < 5) {
      // Extraire des mots importants de la description
      const words = metaDescription
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4)
        .slice(0, 5);
      keywords = [...new Set([...keywords, ...words])];
    }
    
    return keywords;
  }

  // Résoudre les URLs relatives
  resolveUrl(url, baseUrl) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return base.origin + url;
    }
    return base.origin + '/' + url;
  }

  // Sauvegarder la marque actuelle
  saveBrand(brandData) {
    this.currentBrand = brandData;
    
    // Sauvegarder dans localStorage
    const brands = this.loadSavedBrands();
    const existingIndex = brands.findIndex(b => b.brandName === brandData.brandName);
    
    if (existingIndex !== -1) {
      brands[existingIndex] = brandData;
    } else {
      brands.push(brandData);
    }
    
    localStorage.setItem('metaAdsGeneratorBrands', JSON.stringify(brands));
    return brandData;
  }

  // Charger les marques sauvegardées
  loadSavedBrands() {
    try {
      const saved = localStorage.getItem('metaAdsGeneratorBrands');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  // Charger une marque spécifique
  loadBrand(brandName) {
    const brands = this.loadSavedBrands();
    const brand = brands.find(b => b.brandName === brandName);
    if (brand) {
      this.currentBrand = brand;
      return brand;
    }
    return null;
  }

  // Supprimer une marque
  deleteBrand(brandName) {
    const brands = this.loadSavedBrands();
    const filtered = brands.filter(b => b.brandName !== brandName);
    localStorage.setItem('metaAdsGeneratorBrands', JSON.stringify(filtered));
    
    if (this.currentBrand?.brandName === brandName) {
      this.currentBrand = null;
    }
  }

  // Exporter les brand guidelines
  exportBrandGuidelines(brandData) {
    const dataStr = JSON.stringify(brandData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `brand-guidelines-${brandData.brandName.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Importer des brand guidelines
  async importBrandGuidelines(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const brandData = JSON.parse(e.target.result);
          const validated = this.createBrandGuidelines(brandData);
          resolve(validated);
        } catch (error) {
          reject(new Error('Format de fichier invalide'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsText(file);
    });
  }

  // Appliquer les couleurs de la marque à un HTML
  applyBrandColors(html) {
    if (!this.currentBrand) return html;
    
    const colors = this.currentBrand.colors;
    
    // Remplacer les variables de couleur
    html = html.replace(/\{\{primaryColor\}\}/g, colors.primary);
    html = html.replace(/\{\{secondaryColor\}\}/g, colors.secondary);
    html = html.replace(/\{\{accentColor\}\}/g, colors.accent);
    html = html.replace(/\{\{textColor\}\}/g, colors.text);
    html = html.replace(/\{\{backgroundColor\}\}/g, colors.background);
    
    // Appliquer les fonts
    const typography = this.currentBrand.typography;
    html = html.replace(/\{\{headingFont\}\}/g, typography.headingFont);
    html = html.replace(/\{\{bodyFont\}\}/g, typography.bodyFont);
    
    return html;
  }

  // Obtenir un style CSS basé sur les brand guidelines
  generateBrandCSS() {
    if (!this.currentBrand) return '';
    
    const { colors, typography, visualStyle } = this.currentBrand;
    
    const borderRadiusMap = {
      none: '0',
      small: '4px',
      medium: '8px',
      large: '16px'
    };
    
    const shadowMap = {
      none: 'none',
      light: '0 2px 4px rgba(0,0,0,0.1)',
      medium: '0 4px 8px rgba(0,0,0,0.15)',
      strong: '0 8px 16px rgba(0,0,0,0.2)'
    };
    
    return `
      :root {
        --brand-primary: ${colors.primary};
        --brand-secondary: ${colors.secondary};
        --brand-accent: ${colors.accent};
        --brand-text: ${colors.text};
        --brand-background: ${colors.background};
        --brand-heading-font: '${typography.headingFont}', sans-serif;
        --brand-body-font: '${typography.bodyFont}', sans-serif;
        --brand-h1-size: ${typography.sizes.h1};
        --brand-h2-size: ${typography.sizes.h2};
        --brand-body-size: ${typography.sizes.body};
        --brand-border-radius: ${borderRadiusMap[visualStyle.borderRadius]};
        --brand-shadow: ${shadowMap[visualStyle.shadowIntensity]};
      }
    `;
  }
}

// Export pour utilisation dans d'autres modules
window.BrandManager = BrandManager;
