const { query } = require('../config/database');
const templates = require('../templates/templates.json');

class TemplateService {
    // Les 5 templates de base
    static baseTemplates = [
        {
            id: 'product-showcase',
            name: 'Product Showcase',
            category: 'product',
            description: 'Met en valeur un produit avec ses caractéristiques',
            variables: ['headline', 'description', 'cta', 'productImage', 'features', 'badge', 'price'],
            formats: ['landscape', 'square', 'story']
        },
        {
            id: 'sales-promotion',
            name: 'Sales Promotion',
            category: 'promotion',
            description: 'Template pour promotions avec prix barrés et urgence',
            variables: ['headline', 'discount', 'price', 'oldPrice', 'urgency', 'cta', 'productImage'],
            formats: ['landscape', 'square', 'story']
        },
        {
            id: 'social-proof',
            name: 'Social Proof',
            category: 'testimonial',
            description: 'Met en avant les avis clients et témoignages',
            variables: ['headline', 'testimonial', 'customerName', 'customerTitle', 'rating', 'reviewCount', 'cta'],
            formats: ['landscape', 'square', 'story']
        },
        {
            id: 'minimal',
            name: 'Minimal',
            category: 'brand',
            description: 'Design épuré et moderne',
            variables: ['headline', 'description', 'cta'],
            formats: ['landscape', 'square', 'story']
        },
        {
            id: 'story-carousel',
            name: 'Story Carousel',
            category: 'story',
            description: 'Format optimisé pour les stories',
            variables: ['headline', 'description', 'cta', 'backgroundImage'],
            formats: ['story']
        }
    ];

    async list(filters = {}) {
        const { category, search } = filters;
        let filteredTemplates = [...TemplateService.baseTemplates];
        
        if (category) {
            filteredTemplates = filteredTemplates.filter(t => t.category === category);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filteredTemplates = filteredTemplates.filter(t => 
                t.name.toLowerCase().includes(searchLower) ||
                t.description.toLowerCase().includes(searchLower)
            );
        }
        
        return {
            success: true,
            templates: filteredTemplates.map(t => ({
                ...t,
                preview_url: `/templates/${t.id}.png`,
                usage_count: Math.floor(Math.random() * 1000),
                is_premium: false,
                performance_score: 85 + Math.floor(Math.random() * 15)
            }))
        };
    }

    async get(id) {
        const template = TemplateService.baseTemplates.find(t => t.id === id);
        
        if (!template) {
            throw new Error('Template not found');
        }
        
        return {
            success: true,
            template: {
                ...template,
                preview_url: `/templates/${template.id}.png`,
                usage_count: Math.floor(Math.random() * 1000),
                is_premium: false,
                html_structure: this.getTemplateHTML(template.id)
            }
        };
    }

    async preview(templateId, brandId) {
        // Get template
        const template = TemplateService.baseTemplates.find(t => t.id === templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Get brand data
        const brandResult = await query('SELECT * FROM brands WHERE id = $1', [brandId]);
        if (brandResult.rows.length === 0) {
            throw new Error('Brand not found');
        }
        
        const brand = brandResult.rows[0];
        
        // Generate preview HTML for each format
        const previews = {};
        for (const format of template.formats) {
            previews[format] = this.generatePreview(template, brand, format);
        }
        
        return {
            success: true,
            previews,
            template,
            brand
        };
    }

    generatePreview(template, brand, format) {
        const vars = this.prepareVariables(brand);
        const html = this.getTemplateHTML(template.id, format, vars);
        
        return {
            html,
            variables: vars,
            format,
            template_id: template.id
        };
    }

    prepareVariables(brand, customData = {}) {
        return {
            // Brand variables
            brandName: brand.name || 'Ma Marque',
            logo: brand.logo_light_url || '/logo-placeholder.svg',
            logoDark: brand.logo_dark_url || brand.logo_light_url || '/logo-placeholder.svg',
            
            // Colors
            primaryColor: brand.colors?.primary || '#667eea',
            secondaryColor: brand.colors?.secondary || '#764ba2',
            accentColor: brand.colors?.accent || '#42B883',
            textColor: brand.colors?.text || '#1C1E21',
            backgroundColor: brand.colors?.background || '#FFFFFF',
            
            // Typography
            headingFont: brand.typography?.heading || 'Inter',
            bodyFont: brand.typography?.body || 'Inter',
            
            // Default content
            headline: customData.headline || 'Découvrez notre nouvelle offre',
            description: customData.description || brand.description || 'Une solution innovante pour vos besoins',
            cta: customData.cta || 'En savoir plus',
            
            // Additional variables
            productImage: customData.productImage || '/product-placeholder.jpg',
            price: customData.price || '29€',
            oldPrice: customData.oldPrice || '49€',
            discount: customData.discount || '-40%',
            urgency: customData.urgency || 'Offre limitée',
            badge: customData.badge || 'Nouveau',
            
            // Social proof
            testimonial: customData.testimonial || 'Service exceptionnel, je recommande !',
            customerName: customData.customerName || 'Marie D.',
            customerTitle: customData.customerTitle || 'Client vérifié',
            rating: customData.rating || 5,
            reviewCount: customData.reviewCount || '2,847',
            
            // Features
            features: customData.features || ['Livraison gratuite', 'Garantie 2 ans', 'Support 24/7'],
            
            // Style
            borderRadius: brand.visual_style?.borderRadius || '8px',
            shadowStyle: brand.visual_style?.shadowIntensity || 'box-shadow: 0 4px 6px rgba(0,0,0,0.1)',
            useGradients: brand.visual_style?.useGradients || false,
            
            ...customData
        };
    }

    getTemplateHTML(templateId, format = 'landscape', vars = {}) {
        // For now, return a simple placeholder structure
        // In production, this would generate the actual HTML
        return `
            <div class="creative-${templateId}-${format}" style="position: relative; width: 100%; height: 100%;">
                <div class="creative-content">
                    <h1>${vars.headline || 'Headline'}</h1>
                    <p>${vars.description || 'Description'}</p>
                    <button>${vars.cta || 'Call to Action'}</button>
                </div>
            </div>
        `;
    }
}

module.exports = new TemplateService();
