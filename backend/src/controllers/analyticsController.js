const aiAnalyticsService = require('../services/ai-analytics');
const query = require('../config/database');
const redis = require('../config/redis');

class AnalyticsController {
    // Obtenir le dashboard analytics complet
    async getDashboard(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            const { adAccountId, dateRange = '30d', refresh = false } = req.query;

            if (!adAccountId) {
                return res.status(400).json({
                    success: false,
                    error: 'adAccountId requis'
                });
            }

            // Vérifier la connexion Meta
            const connection = await query(`
                SELECT * FROM meta_connections 
                WHERE user_id = $1 AND status = 'connected'
                ORDER BY updated_at DESC
                LIMIT 1
            `, [userId]);

            if (!connection.rows[0]) {
                return res.status(401).json({
                    success: false,
                    error: 'Connexion Meta requise',
                    requiresAuth: true
                });
            }

            // Récupérer les métriques de base
            const metrics = await this.getMetrics(userId, adAccountId, dateRange);
            
            // Récupérer les performances des campagnes
            const campaignPerformance = await this.getCampaignPerformance(userId, adAccountId, dateRange);
            
            // Récupérer les insights temporels
            const timeSeriesData = await this.getTimeSeriesData(userId, adAccountId, dateRange);

            // Analyse IA si demandée ou si première visite
            let aiAnalysis = null;
            if (refresh === 'true' || !await this.hasRecentAnalysis(userId, adAccountId)) {
                aiAnalysis = await aiAnalyticsService.analyzeCampaigns(userId, adAccountId, { 
                    forceRefresh: refresh === 'true' 
                });
            } else {
                aiAnalysis = await this.getStoredAnalysis(userId, adAccountId);
            }

            res.json({
                success: true,
                dashboard: {
                    userId,
                    adAccountId,
                    dateRange,
                    lastUpdated: new Date().toISOString(),
                    metrics,
                    campaignPerformance,
                    timeSeriesData,
                    aiAnalysis
                }
            });
        } catch (error) {
            console.error('Erreur récupération dashboard analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Lancer une analyse IA
    async runAIAnalysis(req, res) {
        try {
            const userId = req.user?.id || req.body.userId || 'demo_user';
            const { adAccountId, options = {} } = req.body;

            if (!adAccountId) {
                return res.status(400).json({
                    success: false,
                    error: 'adAccountId requis'
                });
            }

            // Lancer l'analyse en arrière-plan
            const analysis = await aiAnalyticsService.analyzeCampaigns(userId, adAccountId, options);

            res.json({
                success: true,
                analysis,
                message: 'Analyse IA complétée avec succès'
            });
        } catch (error) {
            console.error('Erreur analyse IA:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Obtenir les métriques principales
    async getMetrics(userId, adAccountId, dateRange = '30d') {
        try {
            const dateCondition = this.getDateCondition(dateRange);
            
            const result = await query(`
                SELECT 
                    COUNT(DISTINCT campaign_id) as totalCampaigns,
                    SUM(spend) as totalSpend,
                    SUM(impressions) as totalImpressions,
                    SUM(clicks) as totalClicks,
                    AVG(ctr) as avgCTR,
                    AVG(cpc) as avgCPC,
                    AVG(cpm) as avgCPM,
                    SUM(conversions) as totalConversions,
                    AVG(cost_per_conversion) as avgCostPerConversion,
                    AVG(roas) as avgROAS,
                    SUM(reach) as totalReach
                FROM meta_insights 
                WHERE user_id = $1 
                AND ad_account_id = $2
                AND ${dateCondition}
            `, [userId, adAccountId]);

            const metrics = result.rows[0];

            return {
                totalCampaigns: parseInt(metrics.totalcampaigns) || 0,
                totalSpend: parseFloat(metrics.totalspend) || 0,
                totalImpressions: parseInt(metrics.totalimpressions) || 0,
                totalClicks: parseInt(metrics.totalclicks) || 0,
                avgCTR: parseFloat(metrics.avgctr) || 0,
                avgCPC: parseFloat(metrics.avgcpc) || 0,
                avgCPM: parseFloat(metrics.avgcpm) || 0,
                totalConversions: parseInt(metrics.totalconversions) || 0,
                avgCostPerConversion: parseFloat(metrics.avgcostperconversion) || 0,
                avgROAS: parseFloat(metrics.avgroas) || 0,
                totalReach: parseInt(metrics.totalreach) || 0,
                // Métriques calculées
                conversionRate: metrics.totalclicks > 0 ? 
                    (metrics.totalconversions / metrics.totalclicks * 100) : 0,
                costPerThousandImpressions: metrics.totalimpressions > 0 ? 
                    (metrics.totalspend / metrics.totalimpressions * 1000) : 0,
                clickThroughRate: metrics.totalimpressions > 0 ? 
                    (metrics.totalclicks / metrics.totalimpressions * 100) : 0
            };
        } catch (error) {
            console.error('Erreur récupération métriques:', error);
            return this.getEmptyMetrics();
        }
    }

    // Obtenir la performance des campagnes
    async getCampaignPerformance(userId, adAccountId, dateRange = '30d') {
        try {
            const dateCondition = this.getDateCondition(dateRange);
            
            const result = await query(`
                SELECT 
                    c.id,
                    c.name,
                    c.status,
                    c.objective,
                    i.spend,
                    i.impressions,
                    i.clicks,
                    i.ctr,
                    i.cpc,
                    i.conversions,
                    i.roas,
                    i.date_start,
                    i.date_stop
                FROM meta_campaigns c
                LEFT JOIN meta_insights i ON c.id = i.campaign_id
                WHERE c.user_id = $1 
                AND c.ad_account_id = $2
                AND (i.${dateCondition} OR i.campaign_id IS NULL)
                ORDER BY i.spend DESC NULLS LAST
                LIMIT 20
            `, [userId, adAccountId]);

            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                status: row.status,
                objective: row.objective,
                spend: parseFloat(row.spend) || 0,
                impressions: parseInt(row.impressions) || 0,
                clicks: parseInt(row.clicks) || 0,
                ctr: parseFloat(row.ctr) || 0,
                cpc: parseFloat(row.cpc) || 0,
                conversions: parseInt(row.conversions) || 0,
                roas: parseFloat(row.roas) || 0,
                dateRange: {
                    start: row.date_start,
                    end: row.date_stop
                },
                performance: {
                    efficiency: this.calculateEfficiency(row),
                    trend: 'stable' // TODO: Calculer trend basé sur données historiques
                }
            }));
        } catch (error) {
            console.error('Erreur récupération performance campagnes:', error);
            return [];
        }
    }

    // Obtenir les données temporelles pour les graphiques
    async getTimeSeriesData(userId, adAccountId, dateRange = '30d') {
        try {
            const dateCondition = this.getDateCondition(dateRange);
            
            const result = await query(`
                SELECT 
                    date_start as date,
                    SUM(spend) as dailySpend,
                    SUM(impressions) as dailyImpressions,
                    SUM(clicks) as dailyClicks,
                    AVG(ctr) as dailyCTR,
                    SUM(conversions) as dailyConversions,
                    AVG(roas) as dailyROAS
                FROM meta_insights 
                WHERE user_id = $1 
                AND ad_account_id = $2
                AND ${dateCondition}
                GROUP BY date_start
                ORDER BY date_start ASC
            `, [userId, adAccountId]);

            return result.rows.map(row => ({
                date: row.date,
                spend: parseFloat(row.dailyspend) || 0,
                impressions: parseInt(row.dailyimpressions) || 0,
                clicks: parseInt(row.dailyclicks) || 0,
                ctr: parseFloat(row.dailyctr) || 0,
                conversions: parseInt(row.dailyconversions) || 0,
                roas: parseFloat(row.dailyroas) || 0
            }));
        } catch (error) {
            console.error('Erreur récupération données temporelles:', error);
            return [];
        }
    }

    // Obtenir les recommandations IA
    async getRecommendations(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            const { adAccountId } = req.query;

            if (!adAccountId) {
                return res.status(400).json({
                    success: false,
                    error: 'adAccountId requis'
                });
            }

            const analysis = await this.getStoredAnalysis(userId, adAccountId);
            
            if (!analysis) {
                return res.json({
                    success: true,
                    recommendations: [],
                    message: 'Aucune analyse disponible. Lancez une analyse IA d\'abord.'
                });
            }

            res.json({
                success: true,
                recommendations: analysis.recommendations || [],
                lastUpdated: analysis.timestamp
            });
        } catch (error) {
            console.error('Erreur récupération recommandations:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Exporter les analytics
    async exportAnalytics(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            const { adAccountId, format = 'json', dateRange = '30d' } = req.query;

            const dashboard = await this.getDashboardData(userId, adAccountId, dateRange);
            
            if (format === 'csv') {
                const csv = this.convertToCSV(dashboard);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=meta-analytics-${Date.now()}.csv`);
                res.send(csv);
            } else {
                res.json({
                    success: true,
                    data: dashboard,
                    exportedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Erreur export analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Fonctions utilitaires
    getDateCondition(dateRange) {
        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '180d': 180
        };
        
        const daysCount = days[dateRange] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysCount);
        
        return `date_start >= '${startDate.toISOString().split('T')[0]}'`;
    }

    calculateEfficiency(campaign) {
        if (!campaign.spend || campaign.spend === 0) return 0;
        
        const roas = campaign.roas || 0;
        const ctr = campaign.ctr || 0;
        
        // Score d'efficacité combiné (ROAS pondéré + CTR)
        return Math.min(100, (roas * 20) + (ctr * 10));
    }

    getEmptyMetrics() {
        return {
            totalCampaigns: 0,
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            avgCTR: 0,
            avgCPC: 0,
            avgCPM: 0,
            totalConversions: 0,
            avgCostPerConversion: 0,
            avgROAS: 0,
            totalReach: 0,
            conversionRate: 0,
            costPerThousandImpressions: 0,
            clickThroughRate: 0
        };
    }

    async hasRecentAnalysis(userId, adAccountId) {
        try {
            const result = await query(`
                SELECT created_at FROM ai_analytics 
                WHERE user_id = $1 AND ad_account_id = $2
                ORDER BY created_at DESC
                LIMIT 1
            `, [userId, adAccountId]);

            if (result.rows.length === 0) return false;

            const lastAnalysis = new Date(result.rows[0].created_at);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            return lastAnalysis > oneHourAgo;
        } catch (error) {
            return false;
        }
    }

    async getStoredAnalysis(userId, adAccountId) {
        try {
            const result = await query(`
                SELECT analysis_data FROM ai_analytics 
                WHERE user_id = $1 AND ad_account_id = $2
                ORDER BY created_at DESC
                LIMIT 1
            `, [userId, adAccountId]);

            return result.rows[0] ? JSON.parse(result.rows[0].analysis_data) : null;
        } catch (error) {
            return null;
        }
    }

    async getDashboardData(userId, adAccountId, dateRange) {
        const metrics = await this.getMetrics(userId, adAccountId, dateRange);
        const campaignPerformance = await this.getCampaignPerformance(userId, adAccountId, dateRange);
        const timeSeriesData = await this.getTimeSeriesData(userId, adAccountId, dateRange);
        const aiAnalysis = await this.getStoredAnalysis(userId, adAccountId);

        return {
            metrics,
            campaignPerformance,
            timeSeriesData,
            aiAnalysis
        };
    }

    convertToCSV(data) {
        const headers = [
            'Campaign Name', 'Status', 'Spend', 'Impressions', 'Clicks', 
            'CTR', 'CPC', 'Conversions', 'ROAS'
        ];
        
        const rows = data.campaignPerformance.map(campaign => [
            campaign.name,
            campaign.status,
            campaign.spend,
            campaign.impressions,
            campaign.clicks,
            campaign.ctr,
            campaign.cpc,
            campaign.conversions,
            campaign.roas
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

module.exports = new AnalyticsController();
