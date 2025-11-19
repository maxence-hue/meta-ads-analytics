const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { uploadImage } = require('../config/cloudinary');
const { query } = require('../config/database');

class HTMLGenerator {
    constructor() {
        this.validator = new CreativeValidator();
        this.optimizer = new PerformanceOptimizer();
    }
    
    async generateCreative(brand, template, data) {
        try {
            console.log(`🎨 Génération créative pour ${brand.name}...`);
            
            // Préparer les variables
            const variables = this.prepareVariables(brand, data);
            
            // Générer le HTML pour chaque format
            const formats = {};
            for (const format of ['landscape', 'square', 'story']) {
                formats[format] = await this.generateFormat(format, template, variables);
            }
            
            console.log('✅ HTML généré pour tous les formats');
            
            // Valider chaque format
            const validationResults = {};
            for (const [format, html] of Object.entries(formats)) {
                validationResults[format] = await this.validator.validate(html, format);
            }
            
            console.log('✅ Validation terminée');
            
            // Optimiser pour la performance
            const optimizedFormats = {};
            for (const [format, html] of Object.entries(formats)) {
                optimizedFormats[format] = await this.optimizer.optimize(html);
            }
            
            console.log('✅ Optimisation terminée');
            
            // Générer les previews
            const previews = await this.generatePreviews(optimizedFormats);
            
            console.log('✅ Previews générées');
            
            return {
                formats: optimizedFormats,
                validation: validationResults,
                previews
            };
        } catch (error) {
            console.error('❌ Erreur génération creative:', error);
            throw error;
        }
    }
    
    prepareVariables(brand, data) {
        return {
            // Brand variables
            brandName: brand.name || 'Ma Marque',
            logo: brand.logo_light_url || '',
            logoDark: brand.logo_dark_url || '',
            
            // Colors
            primaryColor: brand.colors?.primary || '#667eea',
            secondaryColor: brand.colors?.secondary || '#764ba2',
            accentColor: brand.colors?.accent || '#42B883',
            textColor: brand.colors?.text || '#1C1E21',
            backgroundColor: brand.colors?.background || '#FFFFFF',
            
            // Typography
            headingFont: brand.typography?.heading || 'Inter',
            bodyFont: brand.typography?.body || 'Inter',
            
            // Content variables
            headline: data.headline || this.generateHeadline(brand, data),
            subheadline: data.subheadline || '',
            description: data.description || brand.target_audience || '',
            cta: data.cta || brand.preferred_ctas?.[0] || 'En savoir plus',
            
            // Images
            mainImage: data.mainImage || '',
            backgroundImage: data.backgroundImage || '',
            productImage: data.productImage || '',
            
            // Product info
            productName: data.productName || '',
            price: data.price || '',
            oldPrice: data.oldPrice || '',
            discount: data.discount || '',
            urgency: data.urgency || '',
            badge: data.badge || '',
            
            // Social proof
            testimonial: data.testimonial || '',
            customerName: data.customerName || '',
            customerTitle: data.customerTitle || '',
            rating: data.rating || '',
            reviewCount: data.reviewCount || '',
            
            // Features
            features: data.features || [],
            benefits: data.benefits || [],
            
            // Visual style
            borderRadius: this.getBorderRadiusValue(brand.visual_style?.borderRadius),
            shadowStyle: this.getShadowStyle(brand.visual_style?.shadowIntensity),
            useGradients: brand.visual_style?.useGradients || false
        };
    }
    
    generateHeadline(brand, data) {
        const templates = [
            `Découvrez ${brand.name}`,
            `${brand.name} - ${data.productName || 'Nouveauté'}`,
            `Transformez votre quotidien avec ${brand.name}`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    getBorderRadiusValue(size) {
        const values = {
            none: '0px',
            small: '4px',
            medium: '8px',
            large: '16px'
        };
        return values[size] || values.medium;
    }
    
    getShadowStyle(intensity) {
        const shadows = {
            none: 'none',
            light: '0 2px 4px rgba(0,0,0,0.1)',
            medium: '0 4px 6px rgba(0,0,0,0.15)',
            strong: '0 10px 15px rgba(0,0,0,0.2)'
        };
        return shadows[intensity] || shadows.light;
    }
    
    async generateFormat(format, template, variables) {
        const dimensions = {
            landscape: { width: 1200, height: 628 },
            square: { width: 1080, height: 1080 },
            story: { width: 1080, height: 1920 }
        };
        
        // Sélectionner le template approprié pour ce format
        const templateHtml = await this.getTemplateHtml(format, template.category);
        const templateCss = await this.getTemplateCss(format, template.category);
        
        // Remplacer les variables
        let html = this.replaceVariables(templateHtml, variables);
        let css = this.replaceVariables(templateCss, variables);
        
        // Injecter les dimensions
        html = html.replace(/{{width}}/g, dimensions[format].width);
        html = html.replace(/{{height}}/g, dimensions[format].height);
        css = css.replace(/{{width}}/g, dimensions[format].width + 'px');
        css = css.replace(/{{height}}/g, dimensions[format].height + 'px');
        
        // Générer le gradient si activé
        if (variables.useGradients) {
            css += `\n.gradient-bg { background: linear-gradient(135deg, ${variables.primaryColor} 0%, ${variables.secondaryColor} 100%); }`;
        }
        
        // Combiner HTML et CSS
        const finalHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=${variables.headingFont.replace(' ', '+')}:wght@400;600;700&family=${variables.bodyFont.replace(' ', '+')}:wght@400;500&display=swap');
        
        .meta-ad-container {
            width: ${dimensions[format].width}px;
            height: ${dimensions[format].height}px;
            overflow: hidden;
            position: relative;
            font-family: '${variables.bodyFont}', sans-serif;
            background: ${variables.backgroundColor};
        }
        
        ${css}
    </style>
</head>
<body>
    <div class="meta-ad-container" data-format="${format}">
        ${html}
    </div>
</body>
</html>
        `;
        
        return finalHTML;
    }
    
    async getTemplateHtml(format, category) {
        try {
            // Chercher un template en base de données
            const result = await query(
                `SELECT html_template FROM templates 
                 WHERE format = $1 AND category = $2 AND is_public = true 
                 ORDER BY avg_ctr DESC, usage_count DESC 
                 LIMIT 1`,
                [format, category]
            );
            
            if (result.rows.length > 0) {
                return result.rows[0].html_template;
            }
        } catch (error) {
            console.warn('Impossible de charger template depuis DB:', error.message);
        }
        
        // Fallback sur template par défaut
        return this.getDefaultTemplate(format);
    }
    
    async getTemplateCss(format, category) {
        try {
            const result = await query(
                `SELECT css_template FROM templates 
                 WHERE format = $1 AND category = $2 AND is_public = true 
                 ORDER BY avg_ctr DESC 
                 LIMIT 1`,
                [format, category]
            );
            
            if (result.rows.length > 0 && result.rows[0].css_template) {
                return result.rows[0].css_template;
            }
        } catch (error) {
            console.warn('Impossible de charger CSS depuis DB:', error.message);
        }
        
        return this.getDefaultCss(format);
    }
    
    getDefaultTemplate(format) {
        // Template HTML simple et efficace
        return `
        <div class="ad-content">
            {{#if mainImage}}
            <div class="image-container">
                <img src="{{mainImage}}" alt="{{headline}}" class="main-image" />
            </div>
            {{/if}}
            
            <div class="text-content">
                {{#if logo}}
                <img src="{{logo}}" alt="{{brandName}}" class="brand-logo" />
                {{/if}}
                
                <h1 class="headline">{{headline}}</h1>
                
                {{#if subheadline}}
                <h2 class="subheadline">{{subheadline}}</h2>
                {{/if}}
                
                {{#if description}}
                <p class="description">{{description}}</p>
                {{/if}}
                
                {{#if price}}
                <div class="price-container">
                    {{#if oldPrice}}
                    <span class="old-price">{{oldPrice}}</span>
                    {{/if}}
                    <span class="price">{{price}}</span>
                    {{#if discount}}
                    <span class="discount">{{discount}}</span>
                    {{/if}}
                </div>
                {{/if}}
                
                <button class="cta-button">{{cta}}</button>
            </div>
        </div>
        `;
    }
    
    getDefaultCss(format) {
        return `
        .ad-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: ${format === 'story' ? 'column' : 'row'};
            align-items: center;
            justify-content: center;
            padding: 40px;
        }
        
        .image-container {
            flex: 1;
            width: 100%;
            height: ${format === 'story' ? '50%' : '100%'};
            overflow: hidden;
            border-radius: {{borderRadius}};
        }
        
        .main-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .text-content {
            flex: 1;
            padding: 20px;
            text-align: ${format === 'landscape' ? 'left' : 'center'};
        }
        
        .brand-logo {
            height: 40px;
            margin-bottom: 20px;
        }
        
        .headline {
            font-family: '{{headingFont}}', sans-serif;
            font-size: ${format === 'story' ? '42px' : '32px'};
            font-weight: 700;
            color: {{textColor}};
            margin-bottom: 15px;
            line-height: 1.2;
        }
        
        .subheadline {
            font-size: 20px;
            font-weight: 600;
            color: {{secondaryColor}};
            margin-bottom: 10px;
        }
        
        .description {
            font-size: 16px;
            color: {{textColor}};
            opacity: 0.8;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .price-container {
            margin: 20px 0;
            font-size: 24px;
            font-weight: 700;
        }
        
        .old-price {
            text-decoration: line-through;
            color: #999;
            margin-right: 10px;
            font-size: 18px;
        }
        
        .price {
            color: {{primaryColor}};
        }
        
        .discount {
            background: {{accentColor}};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 16px;
            margin-left: 10px;
        }
        
        .cta-button {
            background: {{primaryColor}};
            color: white;
            padding: 16px 32px;
            border: none;
            border-radius: {{borderRadius}};
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: {{shadowStyle}};
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.2);
        }
        `;
    }
    
    replaceVariables(template, variables) {
        let result = template;
        
        // Remplacer les variables simples {{variable}}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, value || '');
        }
        
        // Gérer les conditionnels {{#if variable}}...{{/if}}
        result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
            return variables[varName] ? content : '';
        });
        
        // Gérer les boucles {{#each array}}...{{/each}}
        result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, varName, content) => {
            const array = variables[varName];
            if (!Array.isArray(array)) return '';
            return array.map(item => {
                let itemContent = content;
                if (typeof item === 'object') {
                    for (const [key, value] of Object.entries(item)) {
                        itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    }
                } else {
                    itemContent = itemContent.replace(/{{this}}/g, item);
                }
                return itemContent;
            }).join('');
        });
        
        return result;
    }
    
    async generatePreviews(formats) {
        const previews = {};
        let browser;
        
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            for (const [format, html] of Object.entries(formats)) {
                const page = await browser.newPage();
                
                const dims = this.getDimensions(format);
                await page.setViewport(dims);
                await page.setContent(html);
                
                // Attendre que tout soit chargé
                await page.waitForTimeout(500);
                
                const screenshot = await page.screenshot({
                    type: 'jpeg',
                    quality: 85
                });
                
                await page.close();
                
                // Upload sur Cloudinary
                const uploadResult = await uploadImage(screenshot, {
                    folder: 'meta-ads/previews',
                    format: 'jpg'
                });
                
                previews[format] = uploadResult.secure_url;
            }
            
            return previews;
        } catch (error) {
            console.error('Erreur génération previews:', error);
            return {};
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    
    getDimensions(format) {
        const dimensions = {
            landscape: { width: 1200, height: 628 },
            square: { width: 1080, height: 1080 },
            story: { width: 1080, height: 1920 }
        };
        return dimensions[format] || dimensions.landscape;
    }
}

// Classe de validation
class CreativeValidator {
    validate(html, format) {
        const errors = [];
        const warnings = [];
        
        const $ = cheerio.load(html);
        
        // Vérifier les dimensions
        const container = $('.meta-ad-container');
        const expectedDims = this.getDimensions(format);
        
        // Vérifier les textes
        $('h1, h2, h3, p, span, button').each((i, element) => {
            const text = $(element).text().trim();
            
            if (text.length > 150 && ['h1', 'h2', 'h3'].includes(element.tagName)) {
                warnings.push(`Texte trop long dans ${element.tagName}: ${text.substring(0, 50)}...`);
            }
        });
        
        // Vérifier les images
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            if (!src) {
                errors.push('Image sans source détectée');
            }
            
            const alt = $(img).attr('alt');
            if (!alt) {
                warnings.push('Image sans texte alternatif');
            }
        });
        
        // Vérifier le CTA
        const cta = $('button, .cta-button, .cta').length;
        if (cta === 0) {
            warnings.push('Aucun CTA détecté');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            score: this.calculateScore(errors, warnings)
        };
    }
    
    getDimensions(format) {
        const dimensions = {
            landscape: { width: 1200, height: 628 },
            square: { width: 1080, height: 1080 },
            story: { width: 1080, height: 1920 }
        };
        return dimensions[format];
    }
    
    calculateScore(errors, warnings) {
        const baseScore = 100;
        const errorPenalty = 15;
        const warningPenalty = 5;
        
        return Math.max(0, baseScore - (errors.length * errorPenalty) - (warnings.length * warningPenalty));
    }
}

// Classe d'optimisation
class PerformanceOptimizer {
    async optimize(html) {
        let optimized = html;
        
        // Minifier le HTML (basique)
        optimized = optimized
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .trim();
        
        const $ = cheerio.load(optimized);
        
        // Lazy loading pour les images
        $('img').each((i, img) => {
            if (!$(img).hasClass('critical')) {
                $(img).attr('loading', 'lazy');
            }
        });
        
        // Optimiser les animations CSS
        $('style').each((i, style) => {
            let css = $(style).html();
            css = css.replace(/transition:\s*all/g, 'transition: transform, opacity');
            $(style).html(css);
        });
        
        return $.html();
    }
}

module.exports = {
    HTMLGenerator,
    CreativeValidator,
    PerformanceOptimizer
};
