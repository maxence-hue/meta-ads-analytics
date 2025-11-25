const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ImageGenerationService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY non configurée - génération d\'images désactivée');
        }
        this.apiKey = apiKey;
        this.imageApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';

        // Vérification de la connexion au démarrage
        if (this.apiKey) {
            console.log('✅ Service Gemini Imagen initialisé avec succès');
            console.log(`🔑 Clé API: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
        }
    }

    /**
     * Génère une image de fond avec Gemini Imagen 3.0
     * Compatible avec l'interface NanoBanana
     */
    async generateBackgroundImage(params) {
        try {
            const {
                prompt,
                style = 'realistic',
                aspectRatio = '1:1',
                campaign,
                colors,
                brand
            } = params;

            // 1. Construire le prompt enrichi
            const enrichedPrompt = this.buildImagePrompt({
                basePrompt: prompt,
                style,
                campaign,
                colors,
                brand
            });

            // 2. Générer l'image
            const result = await this.generate(enrichedPrompt, aspectRatio);

            // 3. Sauvegarder l'image localement
            const localPath = await this.saveGeneratedImage(result.url);

            return {
                success: true,
                imageUrl: result.url, // Note: Data URL from Gemini
                localPath: localPath,
                prompt: enrichedPrompt,
                metadata: {
                    style,
                    aspectRatio,
                    provider: 'gemini-imagen-3',
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('Erreur génération Gemini:', error);
            throw new Error(`Erreur génération image: ${error.message}`);
        }
    }

    async generate(prompt, aspectRatio = '1:1') {
        try {
            if (!this.apiKey) {
                console.log('⚠️ Pas de clé API Gemini - utilisation de fallback Pollinations.AI');
                return await this.generateWithPollinations(prompt);
            }

            console.log(`🎨 Génération d'image avec Gemini Imagen 4.0: "${prompt.substring(0, 100)}..."`);
            console.log(`📐 Aspect ratio: ${aspectRatio}`);

            // Tentatives de génération avec retry
            let lastError = null;
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 1) {
                        console.log(`🔄 Tentative ${attempt}/${maxRetries} pour Gemini...`);
                        // Attendre un peu avant de réessayer (backoff exponentiel)
                        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                    }

                    const requestPayload = {
                        instances: [
                            {
                                prompt: prompt
                            }
                        ],
                        parameters: {
                            sampleCount: 1,
                            aspectRatio: aspectRatio,
                            safetySetting: "block_low_and_above",
                            personGeneration: "allow_adult"
                        }
                    };

                    console.log(`📡 Appel API Gemini (tentative ${attempt})...`);

                    const response = await axios.post(
                        `${this.imageApiUrl}?key=${this.apiKey}`,
                        requestPayload,
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            timeout: 60000 // 60 secondes timeout
                        }
                    );

                    if (response.data && response.data.predictions && response.data.predictions[0]) {
                        const prediction = response.data.predictions[0];
                        let imageUrl;

                        if (prediction.bytesBase64Encoded) {
                            imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`;
                        } else if (prediction.mimeType && prediction.image) {
                            imageUrl = `data:${prediction.mimeType};base64,${prediction.image}`;
                        } else {
                            throw new Error('Format de réponse Gemini non reconnu');
                        }

                        console.log('✅ Image générée avec succès via Gemini Imagen 4.0');

                        return {
                            url: imageUrl,
                            filename: `imagen-${Date.now()}.png`,
                            provider: 'gemini-imagen-4.0',
                            success: true
                        };
                    } else {
                        throw new Error('Réponse Gemini vide ou malformée');
                    }
                } catch (apiError) {
                    const errorMsg = apiError.response?.data?.error?.message || apiError.message;
                    console.warn(`⚠️ Erreur API Imagen (Tentative ${attempt}/${maxRetries}):`, errorMsg);
                    lastError = apiError;

                    // Afficher les détails de l'erreur pour debug
                    if (apiError.response?.data) {
                        console.warn('📋 Détails erreur API:', JSON.stringify(apiError.response.data, null, 2));
                    }

                    // Si c'est une erreur 400 (Bad Request), ne pas réessayer sauf si c'est un quota
                    if (apiError.response?.status === 400 && !JSON.stringify(apiError.response.data).includes('QUOTA')) {
                        break;
                    }
                }
            }

            console.error('❌ Échec de toutes les tentatives Gemini:', lastError?.message);
            console.log('📦 Utilisation de Pollinations.AI comme alternative...');

            // Fallback: Utiliser Pollinations.AI (gratuit, pas de clé API)
            return await this.generateWithPollinations(prompt);

        } catch (error) {
            console.error('❌ Erreur critique génération:', error.message);
            return await this.generateWithPollinations(prompt);
        }
    }

    /**
     * Construit un prompt optimisé (adapté de NanoBanana)
     */
    buildImagePrompt({ basePrompt, style, campaign, colors, brand }) {
        let prompt = basePrompt;

        // Ajouter le contexte de campagne
        if (campaign && campaign.theme) {
            prompt = `${campaign.theme} themed, ${prompt}`;
        }

        // Ajouter les couleurs de marque
        if (colors && colors.length > 0) {
            prompt += `, dominant colors: ${colors.slice(0, 3).join(', ')}`;
        }

        // Ajouter le style
        const styleModifiers = {
            'realistic': 'photorealistic, high quality, professional photography, 8k, highly detailed',
            'illustration': 'digital illustration, vector art, clean lines, artistic',
            'abstract': 'abstract art, modern, creative composition, geometric shapes',
            'minimal': 'minimalist, clean, simple, white space, elegant',
            'vibrant': 'vibrant colors, energetic, dynamic, high saturation',
            'corporate': 'corporate, professional, business style, office setting',
            'lifestyle': 'lifestyle photography, authentic, relatable, candid',
            '3d': '3d render, modern 3d art, octane render, ray tracing'
        };

        if (styleModifiers[style]) {
            prompt += `, ${styleModifiers[style]}`;
        } else {
            prompt += `, ${styleModifiers['realistic']}`;
        }

        // Ajouter le contexte de marque
        if (brand && brand.tone) {
            prompt += `, ${brand.tone} brand style`;
        }

        return prompt;
    }

    async saveGeneratedImage(imageUrl) {
        try {
            let buffer;

            // Gérer Data URL
            if (imageUrl.startsWith('data:image')) {
                const base64Data = imageUrl.split(';base64,').pop();
                buffer = Buffer.from(base64Data, 'base64');
            } else {
                // Gérer URL distante (Pollinations, etc.)
                const response = await axios.get(imageUrl, {
                    responseType: 'arraybuffer'
                });
                buffer = Buffer.from(response.data);
            }

            const fileName = `gemini_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
            // Chemin relatif pour l'URL
            const relativePath = `/uploads/generated/${fileName}`;
            // Chemin absolu pour l'écriture fichier
            // Note: On suppose que le dossier uploads/generated existe ou on le crée
            const uploadDir = path.join(__dirname, '../../uploads/generated');
            const filePath = path.join(uploadDir, fileName);

            // Créer le dossier si nécessaire
            await fs.mkdir(uploadDir, { recursive: true });

            // Sauvegarder l'image
            await fs.writeFile(filePath, buffer);

            return relativePath;
        } catch (error) {
            console.error('Erreur sauvegarde image:', error);
            return imageUrl; // Retourner l'URL originale en cas d'erreur
        }
    }

    async generateWithPollinations(prompt) {
        try {
            // Pollinations.AI - API gratuite de génération d'images
            const cleanPrompt = encodeURIComponent(prompt);
            const seed = Math.floor(Math.random() * 1000000);
            const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&seed=${seed}&nologo=true`;

            console.log('✅ Image générée avec Pollinations.AI (fallback)');

            return {
                url: imageUrl,
                filename: `pollinations-${Date.now()}.png`,
                provider: 'pollinations-ai',
                success: true
            };
        } catch (error) {
            console.error('❌ Erreur Pollinations:', error);
            return this.generatePlaceholder(prompt);
        }
    }

    /**
     * Méthode pour vérifier le statut de la connexion Gemini
     */
    async checkGeminiConnection() {
        try {
            if (!this.apiKey) {
                return {
                    connected: false,
                    message: 'Clé API Gemini non configurée',
                    provider: 'none'
                };
            }

            // Test simple avec un prompt minimal
            console.log('🔍 Vérification de la connexion Gemini...');
            const testResult = await this.generate('A simple test image', '1:1');

            if (testResult.success && testResult.provider === 'gemini-imagen-4.0') {
                return {
                    connected: true,
                    message: 'Connexion Gemini active',
                    provider: 'gemini-imagen-4.0'
                };
            } else {
                return {
                    connected: false,
                    message: 'Utilisation du fallback',
                    provider: testResult.provider || 'unknown'
                };
            }
        } catch (error) {
            return {
                connected: false,
                message: error.message,
                provider: 'error'
            };
        }
    }

    async generatePlaceholder(prompt) {
        // Générer un placeholder avec Placehold.co
        const shortPrompt = prompt.substring(0, 100).replace(/[^a-zA-Z0-9\s]/g, '');
        const url = `https://placehold.co/1080x1080/6366f1/white?text=${encodeURIComponent(shortPrompt)}`;
        return {
            url: url,
            filename: `placeholder-${Date.now()}.png`
        };
    }
}

module.exports = new ImageGenerationService();
