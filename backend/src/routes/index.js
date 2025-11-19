const express = require('express');
const router = express.Router();

// Import controllers
const brandController = require('../controllers/brandController');
const creativeController = require('../controllers/creativeController');
const assetController = require('../controllers/assetController');
const templateController = require('../controllers/templateController');
const libraryController = require('../controllers/libraryController');
const campaignController = require('../controllers/campaignController');

// Import routes
const metaRoutes = require('./meta');
const analyticsRoutes = require('./analytics');

// Middleware (placeholders - à implémenter selon besoins)
const auth = (req, res, next) => {
    // Pour le développement, on simule un utilisateur
    req.user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@metaads.com' };
    next();
};

const rateLimit = {
    scraping: (req, res, next) => next(),
    ai: (req, res, next) => next(),
    bulk: (req, res, next) => next()
};

// ==================== BRANDS ====================
router.post('/brands/scrape', auth, rateLimit.scraping, brandController.scrapeWebsite);
router.post('/brands', auth, brandController.create);
router.get('/brands', auth, brandController.list);
router.get('/brands/:id', auth, brandController.get);
router.put('/brands/:id', auth, brandController.update);
router.delete('/brands/:id', auth, brandController.delete);

// ==================== CREATIVES ====================
router.post('/creatives', auth, creativeController.create);
router.get('/creatives', auth, creativeController.list);
router.get('/creatives/:id', auth, creativeController.get);
router.post('/creatives/:id/variations', auth, creativeController.generateVariations);
router.get('/creatives/:id/analytics', auth, creativeController.performanceAnalytics);
router.post('/creatives/:id/export', auth, creativeController.export);

// ==================== TEMPLATES ====================
router.get('/templates', templateController.list);
router.get('/templates/search', templateController.search);
router.get('/templates/:id', templateController.get);
router.post('/templates/:id/preview', auth, templateController.preview);
router.post('/templates/:id/duplicate', auth, templateController.duplicate);

// ==================== LIBRARY ====================
router.get('/library/folders', auth, libraryController.getFolders);
router.post('/library/folders', auth, libraryController.createFolder);
router.post('/library/move', auth, libraryController.moveCreative);
router.get('/library/favorites', auth, libraryController.getFavorites);
router.post('/library/favorites', auth, libraryController.addFavorite);
router.delete('/library/favorites/:id', auth, libraryController.removeFavorite);

// ==================== CAMPAIGNS ====================
router.get('/campaigns', auth, campaignController.list);
router.get('/campaigns/:id', auth, campaignController.get);
router.post('/campaigns', auth, campaignController.create);
router.put('/campaigns/:id', auth, campaignController.update);
router.post('/campaigns/:id/creatives', auth, campaignController.addCreative);
router.delete('/campaigns/:id/creatives/:creativeId', auth, campaignController.removeCreative);
router.get('/campaigns/:id/stats', auth, campaignController.stats);

// ==================== OLD TEMPLATES (TO REMOVE) ====================
router.get('/templates-old', async (req, res) => {
    try {
        const { query } = require('../config/database');
        const { format, category, page = 1, limit = 20 } = req.query;
        
        let queryText = 'SELECT * FROM templates WHERE is_public = true';
        const params = [];
        let paramIndex = 1;
        
        if (format) {
            queryText += ` AND format = $${paramIndex}`;
            params.push(format);
            paramIndex++;
        }
        
        if (category) {
            queryText += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        queryText += ` ORDER BY avg_ctr DESC, usage_count DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);
        
        const result = await query(queryText, params);
        
        res.json({
            success: true,
            templates: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/templates/categories', async (req, res) => {
    try {
        const { query } = require('../config/database');
        const result = await query(`
            SELECT DISTINCT category, COUNT(*) as count
            FROM templates
            WHERE is_public = true
            GROUP BY category
            ORDER BY count DESC
        `);
        
        res.json({
            success: true,
            categories: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/templates/:id', async (req, res) => {
    try {
        const { query } = require('../config/database');
        const result = await query(
            'SELECT * FROM templates WHERE id = $1',
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template non trouvé' });
        }
        
        res.json({
            success: true,
            template: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ASSETS ====================
router.get('/assets', auth, async (req, res) => {
    try {
        const { query } = require('../config/database');
        const userId = req.user.id;
        const { brandId, category, page = 1, limit = 50 } = req.query;
        
        let queryText = 'SELECT * FROM assets WHERE user_id = $1';
        const params = [userId];
        let paramIndex = 2;
        
        if (brandId) {
            queryText += ` AND brand_id = $${paramIndex}`;
            params.push(brandId);
            paramIndex++;
        }
        
        if (category) {
            queryText += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);
        
        const result = await query(queryText, params);
        
        res.json({
            success: true,
            assets: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== AI ====================
router.post('/ai/generate-image', auth, rateLimit.ai, async (req, res) => {
    try {
        const { prompt, provider, style, dimensions } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt requis' });
        }
        
        const AIImageGenerator = require('../services/aiImageGenerator');
        const generator = new AIImageGenerator();
        
        const result = await generator.generateImage(prompt, {
            provider,
            style,
            dimensions
        });
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ai/generate-copy', auth, rateLimit.ai, async (req, res) => {
    try {
        const { brandInfo, productInfo, objective } = req.body;
        const { OpenAI } = require('openai');
        
        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ error: 'Service IA non disponible' });
        }
        
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const prompt = `
Génère des copies publicitaires pour Meta Ads.

MARQUE: ${brandInfo.name}
PRODUIT: ${productInfo.name}
DESCRIPTION: ${productInfo.description}
OBJECTIF: ${objective}

Génère un JSON avec:
{
  "headlines": ["headline 1", "headline 2", "headline 3"],
  "descriptions": ["desc 1", "desc 2", "desc 3"],
  "ctas": ["CTA 1", "CTA 2", "CTA 3"]
}
`;
        
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        });
        
        const result = JSON.parse(completion.choices[0].message.content);
        
        res.json({
            success: true,
            copy: result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== JOBS ====================
router.get('/jobs/:jobId', auth, async (req, res) => {
    try {
        const { query } = require('../config/database');
        const { jobId } = req.params;
        
        const result = await query(
            'SELECT * FROM jobs WHERE id = $1',
            [jobId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Job non trouvé' });
        }
        
        res.json({
            success: true,
            job: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/jobs', auth, async (req, res) => {
    try {
        const { query } = require('../config/database');
        const userId = req.user.id;
        const { status, limit = 20 } = req.query;
        
        let queryText = 'SELECT * FROM jobs WHERE user_id = $1';
        const params = [userId];
        
        if (status) {
            queryText += ' AND status = $2 ORDER BY created_at DESC LIMIT $3';
            params.push(status, parseInt(limit));
        } else {
            queryText += ' ORDER BY created_at DESC LIMIT $2';
            params.push(parseInt(limit));
        }
        
        const result = await query(queryText, params);
        
        res.json({
            success: true,
            jobs: result.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== WEBSOCKET INFO ====================
router.get('/ws/info', (req, res) => {
    res.json({
        message: 'WebSocket disponible',
        url: `ws://${req.get('host')}`,
        events: [
            'authenticate',
            'subscribe:job',
            'subscribe:creative',
            'preview:update',
            'job:progress',
            'job:completed',
            'job:failed',
            'creative:generated',
            'validation:complete'
        ]
    });
});

// ==================== STATS ====================
router.get('/stats', auth, async (req, res) => {
    try {
        const { query } = require('../config/database');
        const userId = req.user.id;
        
        const brandsResult = await query(
            'SELECT COUNT(*) FROM brands WHERE user_id = $1 AND is_active = true',
            [userId]
        );
        
        const creativesResult = await query(
            'SELECT COUNT(*) FROM creatives WHERE user_id = $1',
            [userId]
        );
        
        const jobsResult = await query(
            `SELECT 
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) as active
             FROM jobs 
             WHERE user_id = $1`,
            [userId]
        );
        
        res.json({
            success: true,
            stats: {
                brands: parseInt(brandsResult.rows[0].count),
                creatives: parseInt(creativesResult.rows[0].count),
                jobs: {
                    completed: parseInt(jobsResult.rows[0].completed || 0),
                    failed: parseInt(jobsResult.rows[0].failed || 0),
                    active: parseInt(jobsResult.rows[0].active || 0)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== META ADS ANALYTICS ====================
router.use('/meta', metaRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
