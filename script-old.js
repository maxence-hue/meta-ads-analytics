// Creative Generator for Meta Platforms
class MetaCreativeGenerator {
    constructor() {
        this.templates = {
            facebook: {
                headline: ["Découvrez {product}", "{product} - Innovation", "Transformez votre quotidien avec {product}"],
                description: ["{description}. Commandez maintenant et profitez de -20% !", "Nouveau {product} ! {description}. Livraison offerte.", "Pourquoi {product} ? {description}. Essayez-le !"],
                cta: ["Acheter maintenant", "En savoir plus", "Découvrir", "S'inscrire"]
            },
            instagram: {
                headline: ["✨ {product} ✨", "🔥 {product} est là !", "💎 {product} - Exclusive"],
                description: ["{description} ✨\n\n👇 Lien en bio !", "Nouveau {product} !\n\n{description}\n\n#tendance #promotion", "{description}\n\n🛍️ Commandes via le lien en bio"],
                cta: ["Shop Now", "Learn More", "Sign Up", "Get Offer"]
            },
            stories: {
                headline: ["{product}", "Nouveau !", "Limited Time"],
                description: ["{description}", "Swipe up !", "Tap to explore"],
                cta: ["Swipe Up", "Tap Here", "Shop Now"]
            }
        };
        
        this.imageSuggestions = {
            modern: ["product-hero-shot", "lifestyle-modern", "minimalist-background"],
            minimalist: ["clean-product", "simple-background", "monochrome-style"],
            vibrant: ["colorful-background", "dynamic-action", "bold-contrast"],
            elegant: ["luxury-setting", "sophisticated-style", "premium-materials"],
            playful: ["fun-atmosphere", "bright-colors", "casual-setting"]
        };
        
        this.objectiveEmojis = {
            awareness: "👁️",
            traffic: "🌐", 
            engagement: "💬",
            conversions: "🎯",
            sales: "💰"
        };
    }

    generateHeadline(product, platform) {
        const headlines = this.templates[platform].headline;
        const selected = headlines[Math.floor(Math.random() * headlines.length)];
        return selected.replace('{product}', product);
    }

    generateDescription(product, description, platform) {
        const descriptions = this.templates[platform].description;
        const selected = descriptions[Math.floor(Math.random() * descriptions.length)];
        return selected
            .replace('{product}', product)
            .replace('{description}', description);
    }

    generateCTA(platform) {
        const ctas = this.templates[platform].cta;
        return ctas[Math.floor(Math.random() * ctas.length)];
    }

    generateImageSuggestion(style, product) {
        const suggestions = this.imageSuggestions[style];
        const selected = suggestions[Math.floor(Math.random() * suggestions.length)];
        return {
            description: `${selected} pour ${product}`,
            url: `https://picsum.photos/seed/${selected}-${product}/400/300.jpg`
        };
    }

    generateHashtags(product, audience) {
        const baseTags = ['#marketing', '#promotion', '#offre'];
        const productTags = [`#${product.toLowerCase().replace(/\s+/g, '')}`];
        const audienceTags = audience ? audience.split(',').map(a => `#${a.trim().toLowerCase().replace(/\s+/g, '')}`) : [];
        
        return [...baseTags, ...productTags, ...audienceTags.slice(0, 2)].join(' ');
    }

    generateCreative(config) {
        const creatives = [];
        
        config.platforms.forEach(platform => {
            const creative = {
                id: Math.random().toString(36).substr(2, 9),
                platform: platform,
                product: config.product,
                headline: this.generateHeadline(config.product, platform),
                description: this.generateDescription(config.product, config.description, platform),
                cta: this.generateCTA(platform),
                image: this.generateImageSuggestion(config.visualStyle, config.product),
                hashtags: platform === 'instagram' ? this.generateHashtags(config.product, config.audience) : null,
                objective: config.objective,
                audience: config.audience,
                visualStyle: config.visualStyle,
                dimensions: this.getPlatformDimensions(platform)
            };
            
            creatives.push(creative);
        });
        
        return creatives;
    }

    getPlatformDimensions(platform) {
        const dimensions = {
            facebook: { width: '1200px', height: '628px', ratio: '1.91:1' },
            instagram: { width: '1080px', height: '1080px', ratio: '1:1' },
            stories: { width: '1080px', height: '1920px', ratio: '9:16' }
        };
        return dimensions[platform];
    }

    formatCreativeForDisplay(creative) {
        const platformColors = {
            facebook: 'bg-blue-600',
            instagram: 'bg-gradient-to-r from-pink-500 to-purple-500',
            stories: 'bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500'
        };

        const objectiveEmoji = this.objectiveEmojis[creative.objective] || '📱';
        
        return `
            <div class="creative-card bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="${platformColors[creative.platform]} text-white p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <i class="fab fa-${creative.platform === 'stories' ? 'camera' : creative.platform} text-xl"></i>
                            <span class="font-semibold capitalize">${creative.platform}</span>
                        </div>
                        <span class="text-2xl">${objectiveEmoji}</span>
                    </div>
                    <div class="mt-2 text-sm opacity-90">
                        ${creative.dimensions.width} × ${creative.dimensions.height} (${creative.dimensions.ratio})
                    </div>
                </div>
                
                <div class="p-4">
                    <div class="mb-4">
                        <img src="${creative.image.url}" alt="${creative.image.description}" 
                             class="w-full h-48 object-cover rounded-lg mb-3">
                        <p class="text-xs text-gray-500 italic">${creative.image.description}</p>
                    </div>
                    
                    <div class="space-y-3">
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-1">Titre:</h4>
                            <p class="text-gray-700 font-medium">${creative.headline}</p>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-1">Description:</h4>
                            <p class="text-gray-600 text-sm whitespace-pre-line">${creative.description}</p>
                        </div>
                        
                        ${creative.hashtags ? `
                        <div>
                            <h4 class="font-semibold text-gray-800 mb-1">Hashtags:</h4>
                            <p class="text-blue-600 text-sm">${creative.hashtags}</p>
                        </div>
                        ` : ''}
                        
                        <div class="flex items-center justify-between pt-3 border-t">
                            <span class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                ${creative.cta}
                            </span>
                            <button onclick="copyCreative('${creative.id}')" class="text-gray-500 hover:text-purple-600 transition">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Global instance
const generator = new MetaCreativeGenerator();
let generatedCreatives = [];

// Main generation function
function generateCreatives() {
    const config = getConfig();
    
    if (!validateConfig(config)) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    showLoading(true);
    
    // Simulate generation delay
    setTimeout(() => {
        generatedCreatives = generator.generateCreative(config);
        displayCreatives(generatedCreatives);
        showLoading(false);
    }, 1500);
}

function getConfig() {
    const platforms = [];
    document.querySelectorAll('.platform-checkbox:checked').forEach(checkbox => {
        platforms.push(checkbox.value);
    });
    
    return {
        product: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        objective: document.getElementById('campaignObjective').value,
        audience: document.getElementById('targetAudience').value,
        platforms: platforms,
        visualStyle: document.getElementById('visualStyle').value
    };
}

function validateConfig(config) {
    return config.product && 
           config.description && 
           config.objective && 
           config.platforms.length > 0;
}

function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const resultsSection = document.getElementById('resultsSection');
    
    if (show) {
        loadingState.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    }
}

function displayCreatives(creatives) {
    const container = document.getElementById('creativesContainer');
    container.innerHTML = creatives.map(creative => generator.formatCreativeForDisplay(creative)).join('');
}

function copyCreative(creativeId) {
    const creative = generatedCreatives.find(c => c.id === creativeId);
    if (!creative) return;
    
    const text = `
Plateforme: ${creative.platform.toUpperCase()}
Titre: ${creative.headline}
Description: ${creative.description}
CTA: ${creative.cta}
${creative.hashtags ? `Hashtags: ${creative.hashtags}` : ''}
Dimensions: ${creative.dimensions.width} × ${creative.dimensions.height}
    `.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        event.target.classList.add('text-green-600');
        setTimeout(() => {
            event.target.classList.remove('text-green-600');
        }, 1000);
    });
}

function exportCreatives() {
    if (generatedCreatives.length === 0) {
        alert('Aucune créative à exporter');
        return;
    }
    
    const exportData = generatedCreatives.map(creative => ({
        platform: creative.platform,
        product: creative.product,
        headline: creative.headline,
        description: creative.description,
        cta: creative.cta,
        hashtags: creative.hashtags,
        dimensions: creative.dimensions,
        imageSuggestion: creative.image.description,
        objective: creative.objective,
        audience: creative.audience,
        visualStyle: creative.visualStyle
    }));
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `meta-creatives-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Initialize tooltips and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Platform checkbox styling
    document.querySelectorAll('.platform-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('label');
            if (this.checked) {
                label.classList.add('ring-2', 'ring-purple-500');
            } else {
                label.classList.remove('ring-2', 'ring-purple-500');
            }
        });
    });
});
