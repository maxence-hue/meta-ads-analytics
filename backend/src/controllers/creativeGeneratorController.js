const siteAnalyzer = require('../services/siteAnalyzer');
const nanoBanana = require('../services/imageGeneration'); // Using Gemini service but keeping variable name for minimal refactor
const layoutGenerator = require('../services/layoutGenerator');
const { query } = require('../config/database');
const { creativeQueue } = require('../jobs/creativeQueue');

class CreativeGeneratorController {
    /**
     * Vérifie le statut de la connexion Gemini
     */
    async checkGeminiStatus(_req, res) {
        try {
            const status = await nanoBanana.checkGeminiConnection();

            res.json({
                success: true,
                gemini: status
            });
        } catch (error) {
            console.error('Erreur vérification Gemini:', error);
            res.status(500).json({
                error: 'Erreur lors de la vérification Gemini',
                details: error.message
            });
        }
    }

    /**
     * Analyse un site web et génère des idées de campagne
     */
    async analyzeSite(req, res) {
        try {
            const { url } = req.body;
            const userId = req.user?.id;

            if (!url) {
                return res.status(400).json({
                    error: 'URL du site requise'
                });
            }

            // Lancer l'analyse
            const analysis = await siteAnalyzer.analyzeSite(url);

            // Sauvegarder l'analyse en base
            const result = await query(
                `INSERT INTO site_analyses 
                (user_id, url, site_data, analysis, campaign_ideas, created_at) 
                VALUES ($1, $2, $3, $4, $5, NOW()) 
                RETURNING id`,
                [
                    userId,
                    url,
                    JSON.stringify(analysis.siteData),
                    JSON.stringify(analysis.analysis),
                    JSON.stringify(analysis.campaignIdeas)
                ]
            );

            res.json({
                success: true,
                analysisId: result.rows[0].id,
                url: analysis.url,
                brand: analysis.analysis.brand,
                valueProposition: analysis.analysis.valueProposition,
                targetAudience: analysis.analysis.targetAudience,
                campaigns: analysis.campaignIdeas,
                messaging: analysis.analysis.messaging,
                visualStyle: analysis.analysis.visualStyle
            });

        } catch (error) {
            console.error('Erreur analyse site:', error);
            res.status(500).json({
                error: 'Erreur lors de l\'analyse du site',
                details: error.message
            });
        }
    }

    /**
     * Génère des variantes de textes pour une campagne
     */
    async generateTextVariants(req, res) {
        try {
            const {
                campaign,
                element = 'all', // 'headline', 'primaryText', 'description', 'all'
                count = 5
            } = req.body;

            if (!campaign) {
                return res.status(400).json({
                    error: 'Données de campagne requises'
                });
            }

            // Générer les variantes
            const variants = await siteAnalyzer.generateTextVariants(campaign, element);

            // Sauvegarder en base
            const result = await query(
                `INSERT INTO text_variants 
                (user_id, campaign_data, element, variants, created_at) 
                VALUES ($1, $2, $3, $4, NOW()) 
                RETURNING id`,
                [
                    req.user?.id,
                    JSON.stringify(campaign),
                    element,
                    JSON.stringify(variants)
                ]
            );

            res.json({
                success: true,
                variantId: result.rows[0].id,
                element,
                variants
            });

        } catch (error) {
            console.error('Erreur génération variantes:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération des variantes',
                details: error.message
            });
        }
    }

    /**
     * Génère une image de fond avec NanoBanana
     */
    async generateBackgroundImage(req, res) {
        try {
            const {
                prompt,
                style = 'realistic',
                aspectRatio = '1:1',
                campaign,
                colors,
                brand
            } = req.body;

            if (!prompt) {
                return res.status(400).json({
                    error: 'Prompt requis pour générer une image'
                });
            }

            // Vérifier la clé API Gemini
            if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
                return res.status(500).json({
                    error: 'Service Gemini non configuré'
                });
            }

            // Générer l'image
            const result = await nanoBanana.generateBackgroundImage({
                prompt,
                style,
                aspectRatio,
                campaign,
                colors,
                brand
            });

            // Sauvegarder en base
            const dbResult = await query(
                `INSERT INTO generated_images 
                (user_id, prompt, style, aspect_ratio, image_url, local_path, metadata, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
                RETURNING id`,
                [
                    req.user?.id,
                    result.prompt,
                    style,
                    aspectRatio,
                    result.imageUrl,
                    result.localPath,
                    JSON.stringify(result.metadata)
                ]
            );

            res.json({
                success: true,
                imageId: dbResult.rows[0].id,
                imageUrl: result.imageUrl,
                localPath: result.localPath,
                metadata: result.metadata
            });

        } catch (error) {
            console.error('Erreur génération image:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération de l\'image',
                details: error.message
            });
        }
    }

    /**
     * Génère des variations d'une image
     */
    async generateImageVariations(req, res) {
        try {
            const {
                baseImage,
                count = 3,
                variations = {}
            } = req.body;

            if (!baseImage || !baseImage.prompt) {
                return res.status(400).json({
                    error: 'Image de base requise'
                });
            }

            // Générer les variations
            const results = await nanoBanana.generateVariations(baseImage, count, variations);

            res.json({
                success: true,
                count: results.length,
                variations: results
            });

        } catch (error) {
            console.error('Erreur génération variations:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération des variations',
                details: error.message
            });
        }
    }

    /**
     * Récupère les layouts disponibles
     */
    async getLayouts(req, res) {
        try {
            const layouts = layoutGenerator.layouts;

            // Générer les previews si demandé
            const { includePreview, aspectRatio = '1:1' } = req.query;

            const layoutList = [];
            for (const [id, layout] of Object.entries(layouts)) {
                const layoutData = {
                    id: layout.id,
                    name: layout.name,
                    description: layout.description,
                    zones: layout.zones
                };

                if (includePreview === 'true') {
                    layoutData.preview = await layoutGenerator.previewLayout(id, aspectRatio);
                }

                layoutList.push(layoutData);
            }

            res.json({
                success: true,
                layouts: layoutList,
                aspectRatios: Object.keys(layoutGenerator.canvas)
            });

        } catch (error) {
            console.error('Erreur récupération layouts:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération des layouts',
                details: error.message
            });
        }
    }

    /**
     * Génère une créative complète
     */
    async generateCreative(req, res) {
        try {
            const {
                layoutId = 'classic',
                backgroundImage,
                logo,
                texts,
                colors,
                aspectRatio = '1:1',
                campaign
            } = req.body;

            // Validation
            if (!backgroundImage) {
                return res.status(400).json({
                    error: 'Image de fond requise. Générez d\'abord une image avec Gemini.'
                });
            }

            if (!texts || !texts.headline) {
                return res.status(400).json({
                    error: 'Au minimum un headline est requis'
                });
            }

            // Générer la créative
            const creative = await layoutGenerator.generateCreative({
                layoutId,
                backgroundImage,
                logo,
                texts,
                colors,
                aspectRatio
            });

            // Sauvegarder en base
            const result = await query(
                `INSERT INTO creatives 
                (user_id, layout_id, background_image, logo, texts, colors, aspect_ratio, 
                 output_path, campaign_data, metadata, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
                RETURNING id`,
                [
                    req.user?.id,
                    layoutId,
                    backgroundImage,
                    logo,
                    JSON.stringify(texts),
                    JSON.stringify(colors),
                    aspectRatio,
                    creative.path,
                    JSON.stringify(campaign),
                    JSON.stringify(creative.metadata)
                ]
            );

            res.json({
                success: true,
                creativeId: result.rows[0].id,
                path: creative.path,
                layout: creative.layout,
                dimensions: creative.dimensions,
                metadata: creative.metadata
            });

        } catch (error) {
            console.error('Erreur génération créative:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération de la créative',
                details: error.message
            });
        }
    }

    /**
     * Génère plusieurs créatives avec différents layouts
     */
    async generateMultipleCreatives(req, res) {
        try {
            const {
                backgroundImage,
                logo,
                texts,
                colors,
                aspectRatio = '1:1',
                layouts = ['classic', 'modern', 'bold', 'minimal', 'dynamic'],
                campaign
            } = req.body;

            // Validation
            if (!backgroundImage) {
                return res.status(400).json({
                    error: 'Image de fond requise'
                });
            }

            // Créer un job asynchrone pour générer toutes les créatives
            const job = await creativeQueue.add('generate-multiple-creatives', {
                userId: req.user?.id,
                backgroundImage,
                logo,
                texts,
                colors,
                aspectRatio,
                layouts,
                campaign
            });

            res.json({
                success: true,
                jobId: job.id,
                message: `Génération de ${layouts.length} créatives en cours...`,
                estimatedTime: layouts.length * 5 // secondes
            });

        } catch (error) {
            console.error('Erreur génération multiple:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération des créatives',
                details: error.message
            });
        }
    }

    /**
     * Workflow complet : analyse site → campagne → image → créatives
     */
    async generateFullCampaign(req, res) {
        try {
            const {
                siteUrl,
                selectedCampaign,
                imageStyle = 'realistic',
                aspectRatio = '1:1',
                logo,
                customTexts
            } = req.body;

            if (!siteUrl) {
                return res.status(400).json({
                    error: 'URL du site requise'
                });
            }

            // Créer un job pour le workflow complet
            const job = await creativeQueue.add('generate-full-campaign', {
                userId: req.user?.id,
                siteUrl,
                selectedCampaign,
                imageStyle,
                aspectRatio,
                logo,
                customTexts
            });

            res.json({
                success: true,
                jobId: job.id,
                message: 'Génération de la campagne complète en cours...',
                estimatedTime: 120, // secondes
                steps: [
                    'Analyse du site web',
                    'Génération des idées de campagne',
                    'Création des variantes de texte',
                    'Génération de l\'image de fond',
                    'Création des 5 layouts de créatives'
                ]
            });

        } catch (error) {
            console.error('Erreur génération campagne complète:', error);
            res.status(500).json({
                error: 'Erreur lors de la génération de la campagne',
                details: error.message
            });
        }
    }

    /**
     * Récupère le statut d'un job de génération
     */
    async getJobStatus(req, res) {
        try {
            const { jobId } = req.params;

            const job = await creativeQueue.getJob(jobId);
            if (!job) {
                return res.status(404).json({
                    error: 'Job non trouvé'
                });
            }

            const state = await job.getState();
            const progress = job.progress();

            res.json({
                success: true,
                jobId,
                state,
                progress,
                data: job.data,
                result: job.returnvalue,
                failedReason: job.failedReason
            });

        } catch (error) {
            console.error('Erreur récupération statut job:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération du statut',
                details: error.message
            });
        }
    }

    /**
     * Récupère l'historique des créatives générées
     */
    async getCreativeHistory(req, res) {
        try {
            const userId = req.user?.id;
            const { limit = 20, offset = 0 } = req.query;

            const result = await query(
                `SELECT 
                    c.*,
                    COUNT(*) OVER() as total_count
                FROM creatives c
                WHERE c.user_id = $1
                ORDER BY c.created_at DESC
                LIMIT $2 OFFSET $3`,
                [userId, limit, offset]
            );

            const creatives = result.rows.map(row => ({
                id: row.id,
                layoutId: row.layout_id,
                backgroundImage: row.background_image,
                texts: row.texts,
                colors: row.colors,
                aspectRatio: row.aspect_ratio,
                outputPath: row.output_path,
                campaign: row.campaign_data,
                metadata: row.metadata,
                createdAt: row.created_at
            }));

            res.json({
                success: true,
                creatives,
                total: result.rows[0]?.total_count || 0,
                limit,
                offset
            });

        } catch (error) {
            console.error('Erreur récupération historique:', error);
            res.status(500).json({
                error: 'Erreur lors de la récupération de l\'historique',
                details: error.message
            });
        }
    }
}

module.exports = new CreativeGeneratorController();
