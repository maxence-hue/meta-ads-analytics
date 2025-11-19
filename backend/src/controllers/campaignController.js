const { query } = require('../config/database');

class CampaignController {
    async list(req, res) {
        try {
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            const { status, brandId } = req.query;
            
            let queryText = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT cc.creative_id) as creatives_count,
                    SUM(cr.impressions) as total_impressions,
                    SUM(cr.clicks) as total_clicks,
                    AVG(cr.ctr) as avg_ctr
                FROM campaigns c
                LEFT JOIN campaign_creatives cc ON cc.campaign_id = c.id
                LEFT JOIN creatives cr ON cr.id = cc.creative_id
                WHERE c.user_id = $1
            `;
            const params = [userId];
            let paramIndex = 2;
            
            if (status) {
                queryText += ` AND c.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
            
            if (brandId) {
                queryText += ` AND c.brand_id = $${paramIndex}`;
                params.push(brandId);
            }
            
            queryText += ' GROUP BY c.id ORDER BY c.created_at DESC';
            
            const result = await query(queryText, params);
            
            res.json({
                success: true,
                campaigns: result.rows.map(campaign => ({
                    ...campaign,
                    total_impressions: parseInt(campaign.total_impressions) || 0,
                    total_clicks: parseInt(campaign.total_clicks) || 0,
                    avg_ctr: parseFloat(campaign.avg_ctr) || 0
                }))
            });
        } catch (error) {
            console.error('Error listing campaigns:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async get(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            const result = await query(`
                SELECT 
                    c.*,
                    b.name as brand_name,
                    COUNT(DISTINCT cc.creative_id) as creatives_count
                FROM campaigns c
                LEFT JOIN brands b ON c.brand_id = b.id
                LEFT JOIN campaign_creatives cc ON cc.campaign_id = c.id
                WHERE c.id = $1 AND c.user_id = $2
                GROUP BY c.id, b.name
            `, [id, userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            
            // Get creatives
            const creativesResult = await query(`
                SELECT 
                    cr.*,
                    t.name as template_name
                FROM campaign_creatives cc
                JOIN creatives cr ON cr.id = cc.creative_id
                LEFT JOIN templates t ON cr.template_id = t.id
                WHERE cc.campaign_id = $1
            `, [id]);
            
            res.json({
                success: true,
                campaign: {
                    ...result.rows[0],
                    creatives: creativesResult.rows
                }
            });
        } catch (error) {
            console.error('Error getting campaign:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async create(req, res) {
        try {
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            const {
                name,
                brandId,
                objective,
                budget,
                startDate,
                endDate,
                targetAudience
            } = req.body;
            
            if (!name || !brandId) {
                return res.status(400).json({ error: 'Name and brandId are required' });
            }
            
            const result = await query(`
                INSERT INTO campaigns (
                    name, brand_id, user_id, objective,
                    budget, start_date, end_date,
                    target_audience, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                name,
                brandId,
                userId,
                objective || 'traffic',
                budget || 1000,
                startDate || new Date(),
                endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                JSON.stringify(targetAudience || {}),
                'draft'
            ]);
            
            res.json({
                success: true,
                campaign: result.rows[0]
            });
        } catch (error) {
            console.error('Error creating campaign:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            const updates = req.body;
            
            // Build update query dynamically
            const setClause = [];
            const values = [];
            let paramIndex = 1;
            
            for (const [key, value] of Object.entries(updates)) {
                if (['name', 'objective', 'budget', 'status', 'start_date', 'end_date'].includes(key)) {
                    setClause.push(`${key} = $${paramIndex}`);
                    values.push(value);
                    paramIndex++;
                }
            }
            
            if (setClause.length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' });
            }
            
            values.push(id, userId);
            
            const result = await query(`
                UPDATE campaigns
                SET ${setClause.join(', ')}, updated_at = NOW()
                WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
                RETURNING *
            `, values);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            
            res.json({
                success: true,
                campaign: result.rows[0]
            });
        } catch (error) {
            console.error('Error updating campaign:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async addCreative(req, res) {
        try {
            const { id: campaignId } = req.params;
            const { creativeId } = req.body;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            if (!creativeId) {
                return res.status(400).json({ error: 'creativeId is required' });
            }
            
            // Verify campaign ownership
            const campaignCheck = await query(
                'SELECT id FROM campaigns WHERE id = $1 AND user_id = $2',
                [campaignId, userId]
            );
            
            if (campaignCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            
            // Add creative to campaign
            await query(`
                INSERT INTO campaign_creatives (campaign_id, creative_id)
                VALUES ($1, $2)
                ON CONFLICT (campaign_id, creative_id) DO NOTHING
            `, [campaignId, creativeId]);
            
            res.json({
                success: true,
                message: 'Creative added to campaign'
            });
        } catch (error) {
            console.error('Error adding creative to campaign:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async removeCreative(req, res) {
        try {
            const { id: campaignId, creativeId } = req.params;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            // Verify campaign ownership
            const campaignCheck = await query(
                'SELECT id FROM campaigns WHERE id = $1 AND user_id = $2',
                [campaignId, userId]
            );
            
            if (campaignCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            
            // Remove creative from campaign
            await query(
                'DELETE FROM campaign_creatives WHERE campaign_id = $1 AND creative_id = $2',
                [campaignId, creativeId]
            );
            
            res.json({
                success: true,
                message: 'Creative removed from campaign'
            });
        } catch (error) {
            console.error('Error removing creative from campaign:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    async stats(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
            
            // Get campaign stats
            const result = await query(`
                SELECT 
                    c.id,
                    c.name,
                    c.budget,
                    c.spend,
                    COUNT(DISTINCT cr.id) as total_creatives,
                    SUM(cr.impressions) as total_impressions,
                    SUM(cr.clicks) as total_clicks,
                    SUM(cr.conversions) as total_conversions,
                    AVG(cr.ctr) as avg_ctr,
                    AVG(cr.conversion_rate) as avg_conversion_rate
                FROM campaigns c
                LEFT JOIN campaign_creatives cc ON cc.campaign_id = c.id
                LEFT JOIN creatives cr ON cr.id = cc.creative_id
                WHERE c.id = $1 AND c.user_id = $2
                GROUP BY c.id
            `, [id, userId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            
            const stats = result.rows[0];
            
            res.json({
                success: true,
                stats: {
                    ...stats,
                    total_impressions: parseInt(stats.total_impressions) || 0,
                    total_clicks: parseInt(stats.total_clicks) || 0,
                    total_conversions: parseInt(stats.total_conversions) || 0,
                    avg_ctr: parseFloat(stats.avg_ctr) || 0,
                    avg_conversion_rate: parseFloat(stats.avg_conversion_rate) || 0,
                    roas: stats.spend > 0 ? (stats.total_conversions * 50 / stats.spend).toFixed(2) : 0
                }
            });
        } catch (error) {
            console.error('Error getting campaign stats:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CampaignController();
