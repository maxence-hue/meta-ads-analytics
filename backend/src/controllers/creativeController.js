const { query } = require('../config/database');
const creativeQueue = require('../jobs/creativeQueue');
const { OpenAI } = require('openai');

class CreativeController {
    constructor() {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    
    async create(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const { brandId, templateId, data } = req.body;
            
            if (!brandId || !templateId || !data) {
                return res.status(400).json({ error: 'brandId, templateId et data requis' });
            }
            
            // Vérifier que la marque et le template existent
            const brandCheck = await query('SELECT id FROM brands WHERE id = $1', [brandId]);
            const templateCheck = await query('SELECT id FROM templates WHERE id = $1', [templateId]);
            
            if (brandCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Brand non trouvée' });
            }
            if (templateCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Template non trouvé' });
            }
            
            // Créer un job de génération asynchrone
            const job = await creativeQueue.add('generate-creative', {
                brandId,
                templateId,
                data,
                userId
            });
            
            console.log(`🚀 Job ${job.id} créé pour user ${userId}`);
            
            // Retourner immédiatement avec l'ID du job
            res.status(202).json({
                success: true,
                jobId: job.id,
                message: 'Génération en cours...',
                estimatedTime: 30 // secondes
            });
            
        } catch (error) {
            console.error('Erreur création creative:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async list(req, res) {
        try {
            const userId = req.user?.id || req.query.userId;
            const { brandId, status, page = 1, limit = 20 } = req.query;
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            let queryText = `
                SELECT 
                    c.*,
                    b.name as brand_name,
                    t.name as template_name,
                    t.category as template_category
                FROM creatives c
                LEFT JOIN brands b ON c.brand_id = b.id
                LEFT JOIN templates t ON c.template_id = t.id
                WHERE c.user_id = $1
            `;
            const params = [userId];
            let paramIndex = 2;
            
            if (brandId) {
                queryText += ` AND c.brand_id = $${paramIndex}`;
                params.push(brandId);
                paramIndex++;
            }
            
            if (status) {
                queryText += ` AND c.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
            
            queryText += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit), offset);
            
            const result = await query(queryText, params);
            
            // Compter le total
            let countQuery = 'SELECT COUNT(*) FROM creatives WHERE user_id = $1';
            const countParams = [userId];
            
            if (brandId) {
                countQuery += ' AND brand_id = $2';
                countParams.push(brandId);
            }
            
            const countResult = await query(countQuery, countParams);
            
            res.json({
                success: true,
                creatives: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
                }
            });
            
        } catch (error) {
            console.error('Erreur liste creatives:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async get(req, res) {
        try {
            const { id } = req.params;
            
            const result = await query(`
                SELECT 
                    c.*,
                    b.name as brand_name,
                    b.colors as brand_colors,
                    t.name as template_name,
                    t.category as template_category
                FROM creatives c
                LEFT JOIN brands b ON c.brand_id = b.id
                LEFT JOIN templates t ON c.template_id = t.id
                WHERE c.id = $1
            `, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Creative non trouvée' });
            }
            
            res.json({
                success: true,
                creative: result.rows[0]
            });
            
        } catch (error) {
            console.error('Erreur get creative:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async generateVariations(req, res) {
        try {
            const { id } = req.params;
            const { count = 3 } = req.body;
            const userId = req.user?.id;
            
            // Récupérer la creative originale
            const result = await query(`
                SELECT c.*, b.name as brand_name
                FROM creatives c
                JOIN brands b ON c.brand_id = b.id
                WHERE c.id = $1 AND c.user_id = $2
            `, [id, userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Creative non trouvée' });
            }
            
            const creative = result.rows[0];
            
            // Générer des variations avec l'IA
            const variations = await this.generateAIVariations(creative, count);
            
            // Créer les jobs pour chaque variation
            const jobs = [];
            for (const variation of variations) {
                const job = await creativeQueue.add('generate-creative', {
                    brandId: creative.brand_id,
                    templateId: creative.template_id,
                    data: variation,
                    userId,
                    parentId: creative.id
                });
                jobs.push(job.id);
            }
            
            res.json({
                success: true,
                message: `${variations.length} variations en cours de génération`,
                jobIds: jobs,
                variations: variations.map((v, i) => ({
                    jobId: jobs[i],
                    headline: v.headline
                }))
            });
            
        } catch (error) {
            console.error('Erreur génération variations:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async generateAIVariations(creative, count) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY non configurée');
        }
        
        const formData = creative.form_data;
        
        const prompt = `
Génère ${count} variations créatives de cette publicité Meta Ads.

DONNÉES ORIGINALES:
- Headline: ${formData.headline}
- Description: ${formData.description}
- CTA: ${formData.cta}
- Marque: ${creative.brand_name}

INSTRUCTIONS:
Pour chaque variation, modifie:
1. Le headline (garde le même message mais reformule différemment)
2. L'angle marketing (urgence, bénéfices, preuve sociale, exclusivité, etc.)
3. Le CTA (variations qui convertissent)
4. Le ton (si pertinent)

Retourne un JSON avec cette structure exacte:
{
  "variations": [
    {
      "headline": "nouveau headline",
      "description": "nouvelle description",
      "cta": "nouveau CTA",
      "angle": "type d'angle utilisé",
      "reasoning": "pourquoi cette variation devrait mieux performer"
    }
  ]
}

IMPORTANT: Garde la même intention marketing mais varie l'approche.
`;
        
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.9,
                max_tokens: 2000
            });
            
            const result = JSON.parse(completion.choices[0].message.content);
            
            // Combiner avec les données originales
            return result.variations.map(v => ({
                ...formData,
                headline: v.headline,
                description: v.description,
                cta: v.cta,
                variationAngle: v.angle,
                variationReasoning: v.reasoning
            }));
        } catch (error) {
            console.error('Erreur IA variations:', error);
            
            // Fallback: variations simples sans IA
            return this.generateFallbackVariations(formData, count);
        }
    }
    
    generateFallbackVariations(formData, count) {
        const variations = [];
        const ctaVariations = ['Découvrir', 'En savoir plus', 'Essayer maintenant', 'Commencer'];
        const angles = ['urgence', 'bénéfices', 'exclusivité'];
        
        for (let i = 0; i < count; i++) {
            variations.push({
                ...formData,
                headline: `${formData.headline} - Variation ${i + 1}`,
                cta: ctaVariations[i % ctaVariations.length],
                variationAngle: angles[i % angles.length]
            });
        }
        
        return variations;
    }
    
    async performanceAnalytics(req, res) {
        try {
            const { id } = req.params;
            
            const result = await query(`
                SELECT 
                    c.*,
                    t.name as template_name,
                    t.category as template_category,
                    b.name as brand_name,
                    CASE 
                        WHEN c.clicks > 0 THEN (c.conversions::float / c.clicks * 100)
                        ELSE 0
                    END as conversion_rate,
                    CASE
                        WHEN c.impressions > 0 THEN (c.clicks::float / c.impressions * 100)
                        ELSE 0
                    END as ctr
                FROM creatives c
                JOIN templates t ON c.template_id = t.id
                JOIN brands b ON c.brand_id = b.id
                WHERE c.id = $1
            `, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Creative non trouvée' });
            }
            
            const creative = result.rows[0];
            
            // Analyser avec l'IA
            const aiAnalysis = await this.analyzePerformanceWithAI(creative);
            
            res.json({
                success: true,
                creative: {
                    id: creative.id,
                    impressions: creative.impressions,
                    clicks: creative.clicks,
                    conversions: creative.conversions,
                    ctr: creative.ctr,
                    conversion_rate: creative.conversion_rate,
                    validation_score: creative.validation_score
                },
                analysis: aiAnalysis,
                recommendations: this.getRecommendations(creative)
            });
            
        } catch (error) {
            console.error('Erreur analytics:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async analyzePerformanceWithAI(creative) {
        if (!process.env.OPENAI_API_KEY) {
            return { message: 'Analyse IA non disponible (clé API manquante)' };
        }
        
        const prompt = `
Analyse les performances de cette publicité Meta Ads:

MÉTRIQUES:
- CTR: ${creative.ctr.toFixed(2)}%
- Taux de conversion: ${creative.conversion_rate.toFixed(2)}%
- Impressions: ${creative.impressions}
- Clicks: ${creative.clicks}
- Conversions: ${creative.conversions}
- Score de validation: ${creative.validation_score}/100
- Template: ${creative.template_category}

CONTEXTE:
- Marque: ${creative.brand_name}

Fournis une analyse JSON structurée:
{
  "performance_level": "excellent|bon|moyen|faible",
  "strengths": ["point fort 1", "point fort 2"],
  "weaknesses": ["point faible 1", "point faible 2"],
  "improvements": ["amélioration 1", "amélioration 2", "amélioration 3"],
  "overall_score": 85,
  "next_steps": ["action 1", "action 2"]
}
`;
        
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
                temperature: 0.7
            });
            
            return JSON.parse(completion.choices[0].message.content);
        } catch (error) {
            console.error('Erreur analyse IA:', error);
            return { message: 'Analyse IA temporairement indisponible' };
        }
    }
    
    getRecommendations(creative) {
        const recommendations = [];
        
        if (creative.ctr < 1) {
            recommendations.push({
                type: 'ctr',
                message: 'CTR faible. Essayez un headline plus accrocheur ou une image plus impactante.',
                priority: 'high'
            });
        }
        
        if (creative.conversion_rate < 2) {
            recommendations.push({
                type: 'conversion',
                message: 'Taux de conversion faible. Optimisez votre CTA ou testez une offre plus attractive.',
                priority: 'high'
            });
        }
        
        if (creative.validation_score < 70) {
            recommendations.push({
                type: 'validation',
                message: 'Score de validation faible. Vérifiez les erreurs et warnings de validation.',
                priority: 'medium'
            });
        }
        
        if (creative.clicks < 10 && creative.impressions > 1000) {
            recommendations.push({
                type: 'engagement',
                message: 'Faible engagement malgré les impressions. Revoyez votre ciblage ou votre créative.',
                priority: 'high'
            });
        }
        
        return recommendations;
    }
    
    async export(req, res) {
        try {
            const { id } = req.params;
            const { format = 'all' } = req.query;
            
            const result = await query(
                'SELECT * FROM creatives WHERE id = $1',
                [id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Creative non trouvée' });
            }
            
            const creative = result.rows[0];
            
            // Marquer comme exportée
            await query(
                'UPDATE creatives SET exported_at = NOW() WHERE id = $1',
                [id]
            );
            
            const exportData = {
                id: creative.id,
                brand_id: creative.brand_id,
                created_at: creative.created_at,
                formats: format === 'all' ? creative.formats : { [format]: creative.formats[format] },
                form_data: creative.form_data,
                validation: creative.validation_results,
                previews: creative.preview_urls
            };
            
            res.json({
                success: true,
                data: exportData
            });
            
        } catch (error) {
            console.error('Erreur export:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CreativeController();
