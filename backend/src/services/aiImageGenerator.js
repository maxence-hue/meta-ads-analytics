const axios = require('axios');
const { OpenAI } = require('openai');
const sharp = require('sharp');
const { uploadImage } = require('../config/cloudinary');

class AIImageGenerator {
    constructor() {
        this.providers = {
            neobanana: new NeoBananaProvider(),
            dalle: new DalleProvider(),
            stability: new StabilityProvider(),
            ideogram: new IdeogramProvider(),
            leonardo: new LeonardoProvider()
        };
        
        this.defaultProvider = 'dalle'; // DALL-E est plus fiable pour commencer
    }
    
    async generateImage(prompt, options = {}) {
        const {
            provider = this.defaultProvider,
            style = 'photorealistic',
            dimensions = { width: 1200, height: 628 },
            negativePrompt = 'blurry, low quality, distorted, ugly, bad anatomy',
            seed = null,
            variations = 1
        } = options;
        
        try {
            console.log(`🎨 Génération image avec ${provider}...`);
            
            // Enrichir le prompt avec des modificateurs de qualité
            const enrichedPrompt = this.enrichPrompt(prompt, style);
            
            // Générer via le provider choisi
            const providerInstance = this.providers[provider];
            if (!providerInstance) {
                throw new Error(`Provider ${provider} non disponible`);
            }
            
            const result = await providerInstance.generate({
                prompt: enrichedPrompt,
                negativePrompt,
                dimensions,
                seed,
                variations
            });
            
            // Post-traitement des images
            const processedImages = await this.postProcess(result.images, dimensions);
            
            // Upload sur Cloudinary
            const uploadedImages = await this.uploadToCloudinary(processedImages, prompt);
            
            return {
                success: true,
                images: uploadedImages,
                provider,
                prompt: enrichedPrompt,
                originalPrompt: prompt,
                metadata: result.metadata
            };
            
        } catch (error) {
            console.error(`❌ Erreur génération ${provider}:`, error.message);
            
            // Fallback sur un autre provider si disponible
            if (provider !== 'dalle' && this.providers.dalle) {
                console.log('🔄 Tentative avec DALL-E en fallback...');
                return this.generateImage(prompt, { ...options, provider: 'dalle' });
            }
            
            throw new Error(`Impossible de générer l'image: ${error.message}`);
        }
    }
    
    enrichPrompt(basePrompt, style) {
        const styleModifiers = {
            photorealistic: 'ultra realistic, professional photography, high resolution, 8k, shot on Canon EOS R5, perfect lighting, sharp focus',
            illustration: 'digital illustration, vector art, clean lines, modern design, trending on behance and dribbble, professional artwork',
            minimal: 'minimalist design, simple, clean, white space, modern, geometric, elegant',
            vintage: 'retro style, vintage aesthetic, nostalgic, film grain, analog photography, 1970s style, warm colors',
            highConverting: 'eye-catching, high contrast, bold colors, attention-grabbing design, viral worthy, trending style',
            modern: 'modern design, contemporary, sleek, professional, polished, premium quality',
            vibrant: 'vibrant colors, energetic, dynamic, colorful, lively, bold palette',
            elegant: 'elegant, sophisticated, luxury, premium, refined, high-end design'
        };
        
        const qualityModifiers = 'masterpiece, best quality, highly detailed, professional, award winning';
        const adSpecific = 'perfect for advertising, commercial quality, brand friendly';
        
        const modifier = styleModifiers[style] || styleModifiers.photorealistic;
        
        return `${basePrompt}, ${modifier}, ${qualityModifiers}, ${adSpecific}`;
    }
    
    async postProcess(images, targetDimensions) {
        const processedImages = [];
        
        for (const image of images) {
            try {
                let imageBuffer;
                
                // Télécharger l'image si c'est une URL
                if (typeof image === 'string' || image.url) {
                    const imageUrl = typeof image === 'string' ? image : image.url;
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    imageBuffer = Buffer.from(response.data);
                } else if (image.buffer) {
                    imageBuffer = image.buffer;
                } else {
                    console.warn('Format d\'image non reconnu, skip');
                    continue;
                }
                
                // Optimisation automatique avec Sharp
                const optimized = await sharp(imageBuffer)
                    .resize(targetDimensions.width, targetDimensions.height, {
                        fit: 'cover',
                        position: 'center',
                        withoutEnlargement: false
                    })
                    .sharpen()
                    .modulate({
                        brightness: 1.05,
                        saturation: 1.15,
                        hue: 0
                    })
                    .jpeg({ 
                        quality: parseInt(process.env.IMAGE_QUALITY) || 90, 
                        progressive: true,
                        mozjpeg: true
                    })
                    .toBuffer();
                
                processedImages.push({
                    buffer: optimized,
                    width: targetDimensions.width,
                    height: targetDimensions.height,
                    format: 'jpeg'
                });
            } catch (error) {
                console.error('Erreur post-traitement image:', error);
            }
        }
        
        return processedImages;
    }
    
    async uploadToCloudinary(images, prompt) {
        const uploadedImages = [];
        
        for (let i = 0; i < images.length; i++) {
            try {
                const result = await uploadImage(images[i].buffer, {
                    folder: 'meta-ads/generated',
                    context: {
                        alt: prompt.substring(0, 100),
                        caption: `AI generated image ${i + 1}`
                    },
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                });
                
                uploadedImages.push({
                    url: result.secure_url,
                    cloudinary_id: result.public_id,
                    width: images[i].width,
                    height: images[i].height,
                    format: images[i].format
                });
            } catch (error) {
                console.error('Erreur upload Cloudinary:', error);
            }
        }
        
        return uploadedImages;
    }
}

// Provider NeoBanana
class NeoBananaProvider {
    constructor() {
        this.apiKey = process.env.NEOBANANA_API_KEY;
        this.baseUrl = 'https://api.neobanana.com/v1';
    }
    
    async generate(params) {
        if (!this.apiKey) {
            throw new Error('NEOBANANA_API_KEY non configurée');
        }
        
        try {
            const response = await axios.post(`${this.baseUrl}/generate`, {
                prompt: params.prompt,
                negative_prompt: params.negativePrompt,
                width: params.dimensions.width,
                height: params.dimensions.height,
                num_images: params.variations,
                seed: params.seed
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            });
            
            return {
                images: response.data.images || [],
                metadata: response.data.metadata || {}
            };
        } catch (error) {
            throw new Error(`NeoBanana API error: ${error.message}`);
        }
    }
}

// Provider DALL-E 3
class DalleProvider {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    
    async generate(params) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY non configurée');
        }
        
        try {
            // Adapter les dimensions aux formats supportés par DALL-E
            const dalleSize = this.getDalleSize(params.dimensions);
            
            const response = await this.openai.images.generate({
                model: "dall-e-3",
                prompt: params.prompt,
                n: 1, // DALL-E 3 ne supporte qu'une image à la fois
                size: dalleSize,
                quality: "hd",
                style: "vivid"
            });
            
            return {
                images: [{
                    url: response.data[0].url,
                    width: params.dimensions.width,
                    height: params.dimensions.height
                }],
                metadata: {
                    revised_prompt: response.data[0].revised_prompt,
                    model: 'dall-e-3'
                }
            };
        } catch (error) {
            throw new Error(`DALL-E API error: ${error.message}`);
        }
    }
    
    getDalleSize(dimensions) {
        const { width, height } = dimensions;
        const ratio = width / height;
        
        // Formats DALL-E 3: 1024x1024, 1792x1024, 1024x1792
        if (ratio > 1.5) return "1792x1024"; // Paysage
        if (ratio < 0.7) return "1024x1792"; // Portrait
        return "1024x1024"; // Carré
    }
}

// Provider Stability AI
class StabilityProvider {
    constructor() {
        this.apiKey = process.env.STABILITY_API_KEY;
        this.baseUrl = 'https://api.stability.ai/v1';
    }
    
    async generate(params) {
        if (!this.apiKey) {
            throw new Error('STABILITY_API_KEY non configurée');
        }
        
        try {
            const response = await axios.post(
                `${this.baseUrl}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
                {
                    text_prompts: [
                        { text: params.prompt, weight: 1 },
                        { text: params.negativePrompt, weight: -1 }
                    ],
                    cfg_scale: 7,
                    width: Math.round(params.dimensions.width / 64) * 64,
                    height: Math.round(params.dimensions.height / 64) * 64,
                    samples: params.variations,
                    steps: 30,
                    seed: params.seed || 0
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 60000
                }
            );
            
            const images = response.data.artifacts.map(artifact => ({
                buffer: Buffer.from(artifact.base64, 'base64'),
                width: params.dimensions.width,
                height: params.dimensions.height
            }));
            
            return {
                images,
                metadata: { model: 'stable-diffusion-xl' }
            };
        } catch (error) {
            throw new Error(`Stability AI error: ${error.message}`);
        }
    }
}

// Provider Ideogram
class IdeogramProvider {
    constructor() {
        this.apiKey = process.env.IDEOGRAM_API_KEY;
        this.baseUrl = 'https://api.ideogram.ai/v1';
    }
    
    async generate(params) {
        if (!this.apiKey) {
            throw new Error('IDEOGRAM_API_KEY non configurée');
        }
        
        // Placeholder - À adapter selon l'API Ideogram réelle
        throw new Error('Ideogram provider à implémenter');
    }
}

// Provider Leonardo
class LeonardoProvider {
    constructor() {
        this.apiKey = process.env.LEONARDO_API_KEY;
        this.baseUrl = 'https://cloud.leonardo.ai/api/rest/v1';
    }
    
    async generate(params) {
        if (!this.apiKey) {
            throw new Error('LEONARDO_API_KEY non configurée');
        }
        
        // Placeholder - À adapter selon l'API Leonardo réelle
        throw new Error('Leonardo provider à implémenter');
    }
}

module.exports = AIImageGenerator;
