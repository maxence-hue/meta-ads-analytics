const metaAPI = require('../config/meta-api');
const query = require('../config/database');
const redis = require('../config/redis');

class MetaController {
    // Route d'authentification - redirige vers Meta
    async connect(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
            
            const authURL = metaAPI.getAuthURL(state);
            
            res.json({
                success: true,
                authURL,
                message: 'URL d\'authentification générée avec succès'
            });
        } catch (error) {
            console.error('Erreur génération URL auth:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Callback OAuth2 après autorisation Meta
    async callback(req, res) {
        try {
            const { code, state } = req.query;
            
            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: 'Code d\'autorisation manquant'
                });
            }

            // Décoder le state pour récupérer userId
            let userId = 'demo_user';
            if (state) {
                try {
                    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                    userId = decoded.userId;
                } catch (e) {
                    console.warn('Impossible de décoder le state:', e);
                }
            }

            // Échanger le code contre un access token
            const tokenResult = await metaAPI.exchangeCodeForToken(code);
            
            if (!tokenResult.success) {
                return res.status(400).json({
                    success: false,
                    error: tokenResult.error
                });
            }

            // Obtenir un token long terme
            const longLivedResult = await metaAPI.getLongLivedToken(tokenResult.accessToken);
            
            if (longLivedResult.success) {
                tokenResult.accessToken = longLivedResult.accessToken;
                tokenResult.expiresIn = longLivedResult.expiresIn;
            }

            // Sauvegarder la connexion
            await metaAPI.saveConnection(userId, tokenResult);

            // Rediriger vers le frontend avec succès
            const redirectURL = `${process.env.FRONTEND_URL}/analytics/connect/success?userId=${userId}`;
            res.redirect(redirectURL);

        } catch (error) {
            console.error('Erreur callback OAuth Meta:', error);
            const redirectURL = `${process.env.FRONTEND_URL}/analytics/connect/error?error=${encodeURIComponent(error.message)}`;
            res.redirect(redirectURL);
        }
    }

    // Récupérer le statut de connexion
    async getConnectionStatus(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            
            const connection = await metaAPI.getConnection(userId);
            
            if (!connection) {
                return res.json({
                    success: true,
                    connected: false,
                    message: 'Aucune connexion Meta trouvée'
                });
            }

            // Vérifier si le token est toujours valide
            const isTokenValid = await metaAPI.isTokenValid(connection.access_token);
            
            if (!isTokenValid) {
                await metaAPI.revokeConnection(userId);
                return res.json({
                    success: true,
                    connected: false,
                    message: 'Token expiré ou invalide'
                });
            }

            res.json({
                success: true,
                connected: true,
                connection: {
                    id: connection.id,
                    userInfo: JSON.parse(connection.user_info),
                    adAccounts: JSON.parse(connection.ad_accounts),
                    expiresAt: connection.expires_at,
                    createdAt: connection.created_at
                }
            });
        } catch (error) {
            console.error('Erreur statut connexion:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Récupérer les campagnes
    async getCampaigns(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            const { adAccountId, limit = 50, status } = req.query;

            const connection = await metaAPI.getConnection(userId);
            if (!connection) {
                return res.status(401).json({
                    success: false,
                    error: 'Connexion Meta requise'
                });
            }

            const options = { limit: parseInt(limit) };
            if (status) {
                options.filters = { 
                    filtering: [{ field: 'status', operator: 'IN', value: [status] }] 
                };
            }

            const campaigns = await metaAPI.getCampaigns(adAccountId, connection.access_token, options);

            res.json({
                success: true,
                campaigns: campaigns.data,
                paging: campaigns.paging
            });
        } catch (error) {
            console.error('Erreur récupération campagnes:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Récupérer les insights
    async getInsights(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';
            const { 
                adAccountId, 
                level = 'campaign',
                datePreset = 'last_30d',
                fields,
                limit = 100 
            } = req.query;

            const connection = await metaAPI.getConnection(userId);
            if (!connection) {
                return res.status(401).json({
                    success: false,
                    error: 'Connexion Meta requise'
                });
            }

            const options = {
                level,
                date_preset: datePreset,
                limit: parseInt(limit)
            };

            if (fields) {
                options.fields = Array.isArray(fields) ? fields : fields.split(',');
            }

            const insights = await metaAPI.getInsights(adAccountId, connection.access_token, options);

            res.json({
                success: true,
                insights: insights.data,
                paging: insights.paging
            });
        } catch (error) {
            console.error('Erreur récupération insights:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Synchroniser les données
    async syncData(req, res) {
        try {
            const userId = req.user?.id || req.body.userId || 'demo_user';
            const { adAccountId, fullSync = false } = req.body;

            const connection = await metaAPI.getConnection(userId);
            if (!connection) {
                return res.status(401).json({
                    success: false,
                    error: 'Connexion Meta requise'
                });
            }

            // Lancer le job de synchronisation
            const { syncQueue } = require('../jobs/syncQueue');
            
            const job = await syncQueue.add('sync-meta-data', {
                userId,
                adAccountId,
                accessToken: connection.access_token,
                fullSync
            });

            res.json({
                success: true,
                jobId: job.id,
                message: 'Synchronisation lancée',
                estimatedTime: fullSync ? 300 : 60 // secondes
            });
        } catch (error) {
            console.error('Erreur synchronisation données:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Déconnexion
    async disconnect(req, res) {
        try {
            const userId = req.user?.id || req.body.userId || 'demo_user';

            const success = await metaAPI.revokeConnection(userId);
            
            // Nettoyer le cache
            const pattern = `meta_*_${userId}_*`;
            const keys = await redis.getKeys(pattern);
            if (keys.length > 0) {
                await redis.del(keys);
            }

            res.json({
                success,
                message: success ? 'Connexion Meta révoquée avec succès' : 'Erreur lors de la révocation'
            });
        } catch (error) {
            console.error('Erreur déconnexion Meta:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Récupérer les comptes publicitaires disponibles
    async getAdAccounts(req, res) {
        try {
            const userId = req.user?.id || req.query.userId || 'demo_user';

            const connection = await metaAPI.getConnection(userId);
            if (!connection) {
                return res.status(401).json({
                    success: false,
                    error: 'Connexion Meta requise'
                });
            }

            const adAccounts = JSON.parse(connection.ad_accounts);

            res.json({
                success: true,
                adAccounts
            });
        } catch (error) {
            console.error('Erreur récupération comptes pub:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new MetaController();
