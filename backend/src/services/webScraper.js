const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { OpenAI } = require('openai');
const sharp = require('sharp');
const axios = require('axios');

class WebScraper {
    constructor() {
        this.browser = null;
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    
    async scrapeBrandFromWebsite(url) {
        let browser;
        
        try {
            console.log(`🔍 Début scraping de ${url}...`);
            
            // Lancer Puppeteer
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
            
            const page = await browser.newPage();
            
            // Configurer la page
            await page.setViewport({ width: 1920, height: 1080 });
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Bloquer les ressources inutiles pour accélérer
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['font', 'media'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });
            
            // Aller sur le site avec timeout
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            console.log('📄 Page chargée, extraction des données...');
            
            // Extraire toutes les informations via JavaScript dans le browser
            const brandData = await page.evaluate(() => {
                const data = {
                    meta: {},
                    colors: {},
                    typography: {},
                    images: {},
                    content: {}
                };
                
                // === MÉTADONNÉES ===
                data.meta.title = document.title;
                data.meta.description = document.querySelector('meta[name="description"]')?.content || '';
                data.meta.keywords = document.querySelector('meta[name="keywords"]')?.content || '';
                
                // Open Graph
                data.meta.ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
                data.meta.ogDescription = document.querySelector('meta[property="og:description"]')?.content || '';
                data.meta.ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
                data.meta.ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content || '';
                
                // Twitter Card
                data.meta.twitterTitle = document.querySelector('meta[name="twitter:title"]')?.content || '';
                data.meta.twitterDescription = document.querySelector('meta[name="twitter:description"]')?.content || '';
                
                // === LOGOS ET FAVICONS ===
                data.images.favicon = document.querySelector('link[rel="icon"]')?.href || 
                                     document.querySelector('link[rel="shortcut icon"]')?.href || '';
                data.images.appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')?.href || '';
                
                // Chercher les logos dans le header
                const header = document.querySelector('header, nav, .header, .navbar');
                if (header) {
                    const logos = header.querySelectorAll('img');
                    data.images.headerLogos = Array.from(logos)
                        .filter(img => img.width > 0 && img.height > 0)
                        .map(img => ({
                            src: img.src,
                            alt: img.alt || '',
                            width: img.naturalWidth || img.width,
                            height: img.naturalHeight || img.height
                        }))
                        .slice(0, 5);
                }
                
                // === COULEURS DU CSS ===
                const colors = new Set();
                const colorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b|rgb\([0-9, ]+\)|rgba\([0-9, .]+\)/g;
                
                // Extraire depuis les feuilles de style
                try {
                    const styles = Array.from(document.styleSheets);
                    styles.forEach(sheet => {
                        try {
                            const rules = Array.from(sheet.cssRules || sheet.rules || []);
                            rules.forEach(rule => {
                                if (rule.style) {
                                    const cssText = rule.style.cssText;
                                    const matches = cssText.match(colorRegex);
                                    if (matches) {
                                        matches.forEach(color => colors.add(color));
                                    }
                                }
                            });
                        } catch (e) {
                            // Ignorer les erreurs CORS
                        }
                    });
                } catch (e) {
                    console.warn('Erreur extraction couleurs CSS:', e);
                }
                
                // Extraire depuis les styles inline
                document.querySelectorAll('[style]').forEach(el => {
                    const style = el.getAttribute('style');
                    const matches = style.match(colorRegex);
                    if (matches) {
                        matches.forEach(color => colors.add(color));
                    }
                });
                
                data.colors.fromCSS = Array.from(colors).slice(0, 20);
                
                // === TYPOGRAPHIE ===
                const computedBody = window.getComputedStyle(document.body);
                data.typography.bodyFont = computedBody.fontFamily;
                data.typography.bodySize = computedBody.fontSize;
                data.typography.bodyWeight = computedBody.fontWeight;
                data.typography.bodyColor = computedBody.color;
                
                // Analyser les headings
                const h1 = document.querySelector('h1');
                if (h1) {
                    const h1Styles = window.getComputedStyle(h1);
                    data.typography.headingFont = h1Styles.fontFamily;
                    data.typography.headingSize = h1Styles.fontSize;
                    data.typography.headingWeight = h1Styles.fontWeight;
                    data.typography.headingColor = h1Styles.color;
                }
                
                // Chercher les Google Fonts
                const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
                data.typography.googleFonts = Array.from(fontLinks).map(link => {
                    const href = link.href;
                    const fontMatch = href.match(/family=([^:&]+)/);
                    return fontMatch ? fontMatch[1].replace(/\+/g, ' ') : '';
                }).filter(f => f);
                
                // === CONTENU TEXTUEL ===
                // Headlines
                data.content.headlines = Array.from(document.querySelectorAll('h1, h2, h3'))
                    .map(h => h.innerText.trim())
                    .filter(text => text.length > 0 && text.length < 200)
                    .slice(0, 10);
                
                // Paragraphes importants
                data.content.paragraphs = Array.from(document.querySelectorAll('p'))
                    .map(p => p.innerText.trim())
                    .filter(text => text.length > 50 && text.length < 500)
                    .slice(0, 10);
                
                // CTAs (boutons et liens)
                const ctaSelectors = 'button, a.button, a.btn, .cta, .call-to-action, [class*="button"], [class*="btn"]';
                data.content.ctas = Array.from(document.querySelectorAll(ctaSelectors))
                    .map(btn => btn.innerText.trim())
                    .filter(text => text.length > 0 && text.length < 50)
                    .slice(0, 15);
                
                // === IMAGES PRINCIPALES ===
                const images = document.querySelectorAll('img');
                data.images.all = Array.from(images)
                    .filter(img => {
                        const width = img.naturalWidth || img.width;
                        const height = img.naturalHeight || img.height;
                        return width > 150 && height > 150;
                    })
                    .map(img => ({
                        src: img.src,
                        alt: img.alt || '',
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height,
                        loading: img.loading || 'eager'
                    }))
                    .slice(0, 20);
                
                // === STRUCTURE DE LA PAGE ===
                data.content.hasHero = !!document.querySelector('.hero, [class*="hero"], #hero');
                data.content.hasNavbar = !!document.querySelector('nav, .navbar, .navigation');
                data.content.hasFooter = !!document.querySelector('footer, .footer');
                data.content.hasSidebar = !!document.querySelector('aside, .sidebar, [class*="sidebar"]');
                
                return data;
            });
            
            console.log('📸 Capture de screenshots...');
            
            // Prendre des screenshots
            const screenshots = {
                fullPage: await page.screenshot({
                    fullPage: true,
                    type: 'jpeg',
                    quality: 70
                }),
                viewport: await page.screenshot({
                    type: 'jpeg',
                    quality: 85
                })
            };
            
            await browser.close();
            
            console.log('🎨 Extraction des couleurs dominantes...');
            
            // Analyser les couleurs dominantes du screenshot
            const dominantColors = await this.extractDominantColors(screenshots.viewport);
            
            // Nettoyer et normaliser les couleurs CSS
            const cleanedColors = this.cleanColors([...brandData.colors.fromCSS]);
            
            // Combiner les couleurs
            const allColors = [...cleanedColors, ...dominantColors.map(c => c.hex)];
            const uniqueColors = [...new Set(allColors)].slice(0, 10);
            
            console.log('🤖 Enrichissement avec l\'IA...');
            
            // Enrichir avec l'IA
            const enrichedData = await this.enrichWithAI(brandData, url);
            
            return {
                url,
                ...brandData,
                screenshots: {
                    fullPage: `data:image/jpeg;base64,${screenshots.fullPage.toString('base64')}`,
                    viewport: `data:image/jpeg;base64,${screenshots.viewport.toString('base64')}`
                },
                dominantColors,
                colors: {
                    ...brandData.colors,
                    dominant: dominantColors,
                    cleaned: uniqueColors
                },
                enriched: enrichedData,
                scrapedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Erreur scraping:', error);
            throw new Error(`Impossible de scraper le site: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    
    async extractDominantColors(imageBuffer) {
        try {
            // Redimensionner l'image pour accélérer l'analyse
            const resized = await sharp(imageBuffer)
                .resize(200, 200, { fit: 'inside' })
                .raw()
                .toBuffer({ resolveWithObject: true });
            
            // Extraire les couleurs dominantes (algorithme simplifié)
            const colors = this.analyzePalette(resized.data, resized.info.width, resized.info.height);
            
            return colors.slice(0, 5);
        } catch (error) {
            console.error('Erreur extraction couleurs:', error);
            return [];
        }
    }
    
    analyzePalette(pixelData, width, height) {
        const colorMap = new Map();
        const step = 4; // RGBA
        
        // Compter les occurrences de couleurs
        for (let i = 0; i < pixelData.length; i += step * 10) { // Sample every 10th pixel
            const r = pixelData[i];
            const g = pixelData[i + 1];
            const b = pixelData[i + 2];
            
            // Ignorer les couleurs trop claires ou trop sombres
            const brightness = (r + g + b) / 3;
            if (brightness < 20 || brightness > 235) continue;
            
            // Quantifier les couleurs (regrouper les similaires)
            const quantR = Math.round(r / 32) * 32;
            const quantG = Math.round(g / 32) * 32;
            const quantB = Math.round(b / 32) * 32;
            
            const colorKey = `${quantR},${quantG},${quantB}`;
            colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
        }
        
        // Trier par fréquence
        const sortedColors = Array.from(colorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([color]) => {
                const [r, g, b] = color.split(',').map(Number);
                return {
                    rgb: `rgb(${r}, ${g}, ${b})`,
                    hex: this.rgbToHex(r, g, b),
                    frequency: colorMap.get(color)
                };
            });
        
        return sortedColors;
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }
    
    cleanColors(colors) {
        const cleaned = [];
        
        for (const color of colors) {
            try {
                // Convertir rgb/rgba en hex
                if (color.startsWith('rgb')) {
                    const matches = color.match(/\d+/g);
                    if (matches && matches.length >= 3) {
                        const r = parseInt(matches[0]);
                        const g = parseInt(matches[1]);
                        const b = parseInt(matches[2]);
                        cleaned.push(this.rgbToHex(r, g, b));
                    }
                } else if (color.startsWith('#')) {
                    // Normaliser les codes hex courts
                    if (color.length === 4) {
                        const r = color[1];
                        const g = color[2];
                        const b = color[3];
                        cleaned.push(`#${r}${r}${g}${g}${b}${b}`.toUpperCase());
                    } else if (color.length === 7) {
                        cleaned.push(color.toUpperCase());
                    }
                }
            } catch (e) {
                // Ignorer les couleurs invalides
            }
        }
        
        return [...new Set(cleaned)];
    }
    
    async enrichWithAI(brandData, url) {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('⚠️ OPENAI_API_KEY non configurée, skip enrichissement IA');
            return {};
        }
        
        try {
            const prompt = `
Analyse ces données extraites du site web ${url} et génère un profil de marque complet et professionnel.

DONNÉES EXTRAITES:
- Titre: ${brandData.meta.title}
- Description: ${brandData.meta.description}
- Headlines: ${brandData.content.headlines?.join(', ')}
- CTAs: ${brandData.content.ctas?.join(', ')}
- Polices: ${brandData.typography.googleFonts?.join(', ') || brandData.typography.headingFont}

Génère un JSON structuré avec:
{
  "name": "nom court de la marque",
  "industry": "secteur d'activité précis",
  "targetAudience": "description détaillée de l'audience cible",
  "brandPersonality": ["trait1", "trait2", "trait3"],
  "valueProposition": "proposition de valeur unique en 1-2 phrases",
  "tone": "ton de communication (ex: professionnel, décontracté, etc.)",
  "suggestedColors": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE"
  },
  "suggestedFonts": {
    "heading": "nom de police",
    "body": "nom de police"
  },
  "marketingAngles": ["angle1", "angle2", "angle3"],
  "competitiveAdvantages": ["avantage1", "avantage2"],
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"],
  "recommendedCTAs": ["CTA1", "CTA2", "CTA3"]
}

Sois précis et actionnable. Base-toi uniquement sur les données fournies.
`;
            
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 1500
            });
            
            const enriched = JSON.parse(completion.choices[0].message.content);
            console.log('✅ Enrichissement IA terminé');
            
            return enriched;
        } catch (error) {
            console.error('Erreur enrichissement IA:', error.message);
            return {};
        }
    }
}

module.exports = WebScraper;
