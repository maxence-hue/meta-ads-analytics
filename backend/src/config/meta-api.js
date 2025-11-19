const axios = require('axios');
const query = require('../config/database').query;
const redis = require('../config/redis');

class MetaAPI {
    constructor() {
        this.appId = process.env.META_APP_ID;
        this.appSecret = process.env.META_APP_SECRET;
        this.redirectUri = process.env.META_REDIRECT_URI;
        this.apiVersion = 'v19.0';
        this.baseURL = `https://graph.facebook.com/${this.apiVersion}`;
    }

    // Génération de l'URL d'authentification OAuth2
    getAuthURL(state = null) {
        const params = new URLSearchParams({
            client_id: this.appId,
            redirect_uri: this.redirectUri,
            scope: 'ads_read,ads_management,business_management,pages_read_engagement,pages_show_list,read_insights',
            response_type: 'code',
            state: state || 'meta_ads_connection'
        });

        return `${this.baseURL}/dialog/oauth?${params.toString()}`;
    }

    // Échange du code d'autorisation contre un access token
    async exchangeCodeForToken(code) {
        try {
            const response = await axios.get(`${this.baseURL}/oauth/access_token`, {
                params: {
                    client_id: this.appId,
                    client_secret: this.appSecret,
                    redirect_uri: this.redirectUri,
                    code: code
                }
            });

            const { access_token, expires_in } = response.data;
            
            // Récupérer les informations sur l'utilisateur et les comptes publicitaires
            const userInfo = await this.getUserInfo(access_token);
            const adAccounts = await this.getAdAccounts(access_token);

            return {
                success: true,
                accessToken: access_token,
                expiresIn: expires_in,
                userInfo,
                adAccounts
            };
        } catch (error) {
            console.error('Erreur échange token Meta:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    // Rafraîchissement du token (long-lived token)
    async getLongLivedToken(shortLivedToken) {
        try {
            const response = await axios.get(`${this.baseURL}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: this.appId,
                    client_secret: this.appSecret,
                    fb_exchange_token: shortLivedToken
                }
            });

            return {
                success: true,
                accessToken: response.data.access_token,
                expiresIn: response.data.expires_in
            };
        } catch (error) {
            console.error('Erreur rafraîchissement token:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message
            };
        }
    }

    // Récupérer les informations utilisateur
    async getUserInfo(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/me`, {
                params: {
                    fields: 'id,name,email,picture',
                    access_token: accessToken
                }
            });

            return response.data;
        } catch (error) {
            console.error('Erreur récupération infos utilisateur:', error.response?.data || error.message);
            return null;
        }
    }

    // Récupérer les comptes publicitaires
    async getAdAccounts(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/me/adaccounts`, {
                params: {
                    fields: 'id,name,account_status,currency,timezone_name,owner_business',
                    access_token: accessToken
                }
            });

            return response.data.data || [];
        } catch (error) {
            console.error('Erreur récupération comptes pub:', error.response?.data || error.message);
            return [];
        }
    }

    // Récupérer les campagnes d'un compte publicitaire
    async getCampaigns(adAccountId, accessToken, options = {}) {
        try {
            const cacheKey = `meta_campaigns_${adAccountId}_${JSON.stringify(options)}`;
            const cached = await redis.get(cacheKey);
            
            if (cached) {
                return JSON.parse(cached);
            }

            const params = {
                fields: 'id,name,status,objective,buying_type,start_time,stop_time,special_ad_categories,budget_remaining,lifetime_budget,daily_budget',
                access_token: accessToken,
                limit: options.limit || 100,
                ...options.filters
            };

            const response = await axios.get(`${this.baseURL}/${adAccountId}/campaigns`, { params });
            
            // Cache pendant 5 minutes
            await redis.set(cacheKey, JSON.stringify(response.data), 300);
            
            return response.data;
        } catch (error) {
            console.error('Erreur récupération campagnes:', error.response?.data || error.message);
            return { data: [], paging: null };
        }
    }

    // Récupérer les ensembles d'publicités (ad sets)
    async getAdSets(adAccountId, accessToken, campaignId = null) {
        try {
            const params = {
                fields: 'id,name,status,campaign_id,budget_remaining,lifetime_budget,daily_budget,start_time,stop_time,targeting,optimization_goal,billing_event',
                access_token: accessToken,
                limit: 100
            };

            if (campaignId) {
                params.campaign_id = campaignId;
            }

            const response = await axios.get(`${this.baseURL}/${adAccountId}/adsets`, { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération ad sets:', error.response?.data || error.message);
            return { data: [], paging: null };
        }
    }

    // Récupérer les publicités (ads)
    async getAds(adAccountId, accessToken, campaignId = null, adSetId = null) {
        try {
            const params = {
                fields: 'id,name,status,creative,adset_id,campaign_id,created_time,updated_time',
                access_token: accessToken,
                limit: 100
            };

            if (campaignId) {
                params.campaign_id = campaignId;
            }
            if (adSetId) {
                params.adset_id = adSetId;
            }

            const response = await axios.get(`${this.baseURL}/${adAccountId}/ads`, { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération ads:', error.response?.data || error.message);
            return { data: [], paging: null };
        }
    }

    // Récupérer les créatives
    async getCreatives(adAccountId, accessToken, options = {}) {
        try {
            const params = {
                fields: 'id,asset_feed_spec,object_story_spec,name,thumbnail_url,permalink_url',
                access_token: accessToken,
                limit: options.limit || 100
            };

            const response = await axios.get(`${this.baseURL}/${adAccountId}/adcreatives`, { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération créatives:', error.response?.data || error.message);
            return { data: [], paging: null };
        }
    }

    // Récupérer les insights (métriques de performance)
    async getInsights(adAccountId, accessToken, options = {}) {
        try {
            const {
                level = 'campaign',
                fields = [
                    'campaign_name',
                    'adset_name',
                    'ad_name',
                    'spend',
                    'impressions',
                    'clicks',
                    'ctr',
                    'cpc',
                    'cpm',
                    'reach',
                    'frequency',
                    'actions',
                    'action_values',
                    'conversions',
                    'cost_per_conversion',
                    'roas',
                    'date_start',
                    'date_stop'
                ],
                date_preset = 'last_30d',
                time_increment = 1
            } = options;

            const params = {
                level,
                fields: fields.join(','),
                date_preset,
                time_increment,
                access_token: accessToken,
                limit: options.limit || 100
            };

            // Ajout des filtres personnalisés
            if (options.filters) {
                Object.assign(params, options.filters);
            }

            const response = await axios.get(`${this.baseURL}/${adAccountId}/insights`, { params });
            return response.data;
        } catch (error) {
            console.error('Erreur récupération insights:', error.response?.data || error.message);
            return { data: [], paging: null };
        }
    }

    // Sauvegarder la connexion Meta dans la base de données
    async saveConnection(userId, connectionData) {
        try {
            const {
                accessToken,
                expiresIn,
                userInfo,
                adAccounts
            } = connectionData;

            const result = await query(`
                INSERT INTO meta_connections (
                    user_id, access_token, expires_at, user_info, 
                    ad_accounts, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    access_token = EXCLUDED.access_token,
                    expires_at = EXCLUDED.expires_at,
                    user_info = EXCLUDED.user_info,
                    ad_accounts = EXCLUDED.ad_accounts,
                    status = 'connected',
                    updated_at = NOW()
                RETURNING *
            `, [
                userId,
                accessToken,
                new Date(Date.now() + expiresIn * 1000),
                JSON.stringify(userInfo),
                JSON.stringify(adAccounts),
                'connected'
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Erreur sauvegarde connexion Meta:', error);
            throw error;
        }
    }

    // Récupérer la connexion Meta d'un utilisateur
    async getConnection(userId) {
        try {
            const result = await query(`
                SELECT * FROM meta_connections 
                WHERE user_id = $1 AND status = 'connected'
                ORDER BY updated_at DESC
                LIMIT 1
            `, [userId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error('Erreur récupération connexion Meta:', error);
            return null;
        }
    }

    // Vérifier si le token est valide
    async isTokenValid(accessToken) {
        try {
            const response = await axios.get(`${this.baseURL}/me`, {
                params: {
                    fields: 'id',
                    access_token: accessToken
                }
            });

            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    // Révoquer l'accès
    async revokeConnection(userId) {
        try {
            await query(`
                UPDATE meta_connections 
                SET status = 'disconnected', updated_at = NOW()
                WHERE user_id = $1
            `, [userId]);

            return true;
        } catch (error) {
            console.error('Erreur révocation connexion Meta:', error);
            return false;
        }
    }
}

module.exports = new MetaAPI();
