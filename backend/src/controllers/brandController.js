const { query } = require('../config/database');
const WebScraper = require('../services/webScraper');
const { cache } = require('../config/redis');

class BrandController {
    async scrapeWebsite(req, res) {
        try {
            const { url } = req.body;
            
            if (!url) {
                return res.status(400).json({ error: 'URL manquante' });
            }
            
            // Vérifier le cache
            const cacheKey = `scrape:${url}`;
            const cached = await cache.get(cacheKey);
            
            if (cached) {
                console.log('✅ Données scraping depuis le cache');
                return res.json({
                    success: true,
                    data: cached,
                    fromCache: true
                });
            }
            
            console.log(`🔍 Scraping ${url}...`);
            
            const scraper = new WebScraper();
            const brandData = await scraper.scrapeBrandFromWebsite(url);
            
            // Mettre en cache pour 24h
            await cache.set(cacheKey, brandData, 86400);
            
            res.json({
                success: true,
                data: brandData
            });
            
        } catch (error) {
            console.error('Erreur scraping:', error);
            res.status(500).json({ 
                error: 'Erreur lors du scraping du site',
                message: error.message 
            });
        }
    }
    
    async create(req, res) {
        try {
            const userId = req.user?.id || req.body.userId;
            const {
                name, website_url, industry, target_audience,
                logo_light_url, logo_dark_url, favicon_url,
                colors, typography, personality, keywords,
                preferred_ctas, visual_style, scraped_data
            } = req.body;
            
            if (!name) {
                return res.status(400).json({ error: 'Nom de la marque requis' });
            }
            
            const result = await query(`
                INSERT INTO brands (
                    user_id, name, website_url, industry, target_audience,
                    logo_light_url, logo_dark_url, favicon_url,
                    colors, typography, personality, keywords,
                    preferred_ctas, visual_style, scraped_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING *
            `, [
                userId, name, website_url, industry, target_audience,
                logo_light_url, logo_dark_url, favicon_url,
                JSON.stringify(colors || {}),
                JSON.stringify(typography || {}),
                JSON.stringify(personality || []),
                keywords || [],
                preferred_ctas || [],
                JSON.stringify(visual_style || {}),
                JSON.stringify(scraped_data || {})
            ]);
            
            // Invalider le cache
            await cache.del(`brands:user:${userId}`);
            
            res.status(201).json({
                success: true,
                brand: result.rows[0]
            });
            
        } catch (error) {
            console.error('Erreur création brand:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async list(req, res) {
        try {
            const userId = req.user?.id || req.query.userId;
            const { search, industry, page = 1, limit = 20 } = req.query;
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            // Vérifier le cache
            const cacheKey = `brands:user:${userId}:${search || 'all'}:${page}`;
            const cached = await cache.get(cacheKey);
            
            if (cached) {
                return res.json({ ...cached, fromCache: true });
            }
            
            let queryText = `
                SELECT * FROM brands 
                WHERE user_id = $1 AND is_active = true
            `;
            const params = [userId];
            let paramIndex = 2;
            
            if (search) {
                queryText += ` AND name ILIKE $${paramIndex}`;
                params.push(`%${search}%`);
                paramIndex++;
            }
            
            if (industry) {
                queryText += ` AND industry = $${paramIndex}`;
                params.push(industry);
                paramIndex++;
            }
            
            queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(parseInt(limit), offset);
            
            const result = await query(queryText, params);
            
            // Compter le total
            const countResult = await query(
                'SELECT COUNT(*) FROM brands WHERE user_id = $1 AND is_active = true',
                [userId]
            );
            
            const response = {
                success: true,
                brands: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count),
                    totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
                }
            };
            
            // Mettre en cache pour 5 minutes
            await cache.set(cacheKey, response, 300);
            
            res.json(response);
            
        } catch (error) {
            console.error('Erreur liste brands:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async get(req, res) {
        try {
            const { id } = req.params;
            
            const result = await query(
                'SELECT * FROM brands WHERE id = $1',
                [id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Brand non trouvée' });
            }
            
            res.json({
                success: true,
                brand: result.rows[0]
            });
            
        } catch (error) {
            console.error('Erreur get brand:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const updates = req.body;
            
            // Vérifier que l'utilisateur possède cette brand
            const checkResult = await query(
                'SELECT id FROM brands WHERE id = $1 AND user_id = $2',
                [id, userId]
            );
            
            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Brand non trouvée ou non autorisée' });
            }
            
            // Construire la requête de mise à jour
            const allowedFields = [
                'name', 'website_url', 'industry', 'target_audience',
                'logo_light_url', 'logo_dark_url', 'favicon_url',
                'colors', 'typography', 'personality', 'keywords',
                'preferred_ctas', 'visual_style'
            ];
            
            const setClause = [];
            const values = [];
            let paramIndex = 1;
            
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    setClause.push(`${field} = $${paramIndex}`);
                    
                    // Convertir en JSON si nécessaire
                    if (['colors', 'typography', 'personality', 'visual_style'].includes(field)) {
                        values.push(JSON.stringify(updates[field]));
                    } else {
                        values.push(updates[field]);
                    }
                    
                    paramIndex++;
                }
            }
            
            if (setClause.length === 0) {
                return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
            }
            
            values.push(id);
            
            const updateResult = await query(`
                UPDATE brands 
                SET ${setClause.join(', ')}, updated_at = NOW()
                WHERE id = $${paramIndex}
                RETURNING *
            `, values);
            
            // Invalider le cache
            await cache.del(`brands:user:${userId}*`);
            
            res.json({
                success: true,
                brand: updateResult.rows[0]
            });
            
        } catch (error) {
            console.error('Erreur update brand:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async delete(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            
            // Soft delete (marquer comme inactif)
            const result = await query(`
                UPDATE brands 
                SET is_active = false, updated_at = NOW()
                WHERE id = $1 AND user_id = $2
                RETURNING id
            `, [id, userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Brand non trouvée ou non autorisée' });
            }
            
            // Invalider le cache
            await cache.del(`brands:user:${userId}*`);
            
            res.json({
                success: true,
                message: 'Brand supprimée'
            });
            
        } catch (error) {
            console.error('Erreur delete brand:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new BrandController();
