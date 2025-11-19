const Queue = require('bull');
const redis = require('../config/redis');
const metaAPI = require('../config/meta-api');
const query = require('../config/database');
const { io } = require('../app');

// Configuration de la queue de synchronisation
const syncQueue = new Queue('meta sync processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: 2
    },
    defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        }
    }
});

// Processor pour les jobs de synchronisation
syncQueue.process('sync-meta-data', async (job) => {
    const { userId, adAccountId, accessToken, fullSync = false } = job.data;
    
    try {
        console.log(`🔄 Démarrage synchronisation Meta pour user ${userId}, compte ${adAccountId}`);
        
        // Notifier début de synchronisation
        io.emit(`sync:${userId}`, {
            type: 'sync_started',
            data: {
                adAccountId,
                fullSync,
                timestamp: new Date().toISOString()
            }
        });

        job.progress(10);

        // Synchroniser les campagnes
        const campaigns = await syncCampaigns(userId, adAccountId, accessToken, fullSync);
        job.progress(30);

        // Synchroniser les ad sets
        const adSets = await syncAdSets(userId, adAccountId, accessToken, campaigns, fullSync);
        job.progress(50);

        // Synchroniser les ads
        const ads = await syncAds(userId, adAccountId, accessToken, adSets, fullSync);
        job.progress(70);

        // Synchroniser les créatives
        const creatives = await syncCreatives(userId, adAccountId, accessToken, fullSync);
        job.progress(85);

        // Synchroniser les insights (métriques)
        const insights = await syncInsights(userId, adAccountId, accessToken, fullSync);
        job.progress(100);

        // Mettre à jour le statut de synchronisation
        await updateSyncStatus(userId, adAccountId, 'completed');

        // Notifier fin de synchronisation
        io.emit(`sync:${userId}`, {
            type: 'sync_completed',
            data: {
                adAccountId,
                stats: {
                    campaigns: campaigns.length,
                    adSets: adSets.length,
                    ads: ads.length,
                    creatives: creatives.length,
                    insights: insights.length
                },
                timestamp: new Date().toISOString()
            }
        });

        console.log(`✅ Synchronisation terminée pour user ${userId}, compte ${adAccountId}`);
        
        return {
            success: true,
            stats: {
                campaigns: campaigns.length,
                adSets: adSets.length,
                ads: ads.length,
                creatives: creatives.length,
                insights: insights.length
            }
        };

    } catch (error) {
        console.error(`❌ Erreur synchronisation Meta pour user ${userId}:`, error);
        
        // Mettre à jour le statut d'erreur
        await updateSyncStatus(userId, adAccountId, 'failed');
        
        // Notifier l'erreur
        io.emit(`sync:${userId}`, {
            type: 'sync_failed',
            data: {
                adAccountId,
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });

        throw error;
    }
});

// Fonction de synchronisation des campagnes
async function syncCampaigns(userId, adAccountId, accessToken, fullSync) {
    try {
        const campaignsData = await metaAPI.getCampaigns(adAccountId, accessToken, {
            limit: fullSync ? 500 : 100
        });

        const campaigns = campaignsData.data || [];
        
        for (const campaign of campaigns) {
            await query(`
                INSERT INTO meta_campaigns (
                    id, user_id, ad_account_id, name, status, objective,
                    buying_type, start_time, stop_time, special_ad_categories,
                    budget_remaining, lifetime_budget, daily_budget,
                    created_at, updated_at, last_sync_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), NOW())
                ON CONFLICT (id, user_id) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    objective = EXCLUDED.objective,
                    buying_type = EXCLUDED.buying_type,
                    start_time = EXCLUDED.start_time,
                    stop_time = EXCLUDED.stop_time,
                    special_ad_categories = EXCLUDED.special_ad_categories,
                    budget_remaining = EXCLUDED.budget_remaining,
                    lifetime_budget = EXCLUDED.lifetime_budget,
                    daily_budget = EXCLUDED.daily_budget,
                    updated_at = NOW(),
                    last_sync_at = NOW()
            `, [
                campaign.id,
                userId,
                adAccountId,
                campaign.name,
                campaign.status,
                campaign.objective,
                campaign.buying_type,
                campaign.start_time,
                campaign.stop_time,
                JSON.stringify(campaign.special_ad_categories || []),
                campaign.budget_remaining,
                campaign.lifetime_budget,
                campaign.daily_budget
            ]);
        }

        console.log(`📊 ${campaigns.length} campagnes synchronisées`);
        return campaigns;
    } catch (error) {
        console.error('Erreur synchronisation campagnes:', error);
        throw error;
    }
}

// Fonction de synchronisation des ad sets
async function syncAdSets(userId, adAccountId, accessToken, campaigns, fullSync) {
    try {
        const adSetsData = await metaAPI.getAdSets(adAccountId, accessToken);
        const adSets = adSetsData.data || [];

        for (const adSet of adSets) {
            await query(`
                INSERT INTO meta_adsets (
                    id, user_id, ad_account_id, campaign_id, name, status,
                    budget_remaining, lifetime_budget, daily_budget, start_time,
                    stop_time, targeting, optimization_goal, billing_event,
                    created_at, updated_at, last_sync_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW(), NOW())
                ON CONFLICT (id, user_id) 
                DO UPDATE SET 
                    campaign_id = EXCLUDED.campaign_id,
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    budget_remaining = EXCLUDED.budget_remaining,
                    lifetime_budget = EXCLUDED.lifetime_budget,
                    daily_budget = EXCLUDED.daily_budget,
                    start_time = EXCLUDED.start_time,
                    stop_time = EXCLUDED.stop_time,
                    targeting = EXCLUDED.targeting,
                    optimization_goal = EXCLUDED.optimization_goal,
                    billing_event = EXCLUDED.billing_event,
                    updated_at = NOW(),
                    last_sync_at = NOW()
            `, [
                adSet.id,
                userId,
                adAccountId,
                adSet.campaign_id,
                adSet.name,
                adSet.status,
                adSet.budget_remaining,
                adSet.lifetime_budget,
                adSet.daily_budget,
                adSet.start_time,
                adSet.stop_time,
                JSON.stringify(adSet.targeting || {}),
                adSet.optimization_goal,
                adSet.billing_event
            ]);
        }

        console.log(`🎯 ${adSets.length} ad sets synchronisés`);
        return adSets;
    } catch (error) {
        console.error('Erreur synchronisation ad sets:', error);
        throw error;
    }
}

// Fonction de synchronisation des ads
async function syncAds(userId, adAccountId, accessToken, adSets, fullSync) {
    try {
        const adsData = await metaAPI.getAds(adAccountId, accessToken);
        const ads = adsData.data || [];

        for (const ad of ads) {
            await query(`
                INSERT INTO meta_ads (
                    id, user_id, ad_account_id, adset_id, campaign_id, name,
                    status, creative_id, created_time, updated_time,
                    created_at, updated_at, last_sync_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
                ON CONFLICT (id, user_id) 
                DO UPDATE SET 
                    adset_id = EXCLUDED.adset_id,
                    campaign_id = EXCLUDED.campaign_id,
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    creative_id = EXCLUDED.creative_id,
                    created_time = EXCLUDED.created_time,
                    updated_time = EXCLUDED.updated_time,
                    updated_at = NOW(),
                    last_sync_at = NOW()
            `, [
                ad.id,
                userId,
                adAccountId,
                ad.adset_id,
                ad.campaign_id,
                ad.name,
                ad.status,
                ad.creative?.id || null,
                ad.created_time,
                ad.updated_time
            ]);
        }

        console.log(`📢 ${ads.length} ads synchronisées`);
        return ads;
    } catch (error) {
        console.error('Erreur synchronisation ads:', error);
        throw error;
    }
}

// Fonction de synchronisation des créatives
async function syncCreatives(userId, adAccountId, accessToken, fullSync) {
    try {
        const creativesData = await metaAPI.getCreatives(adAccountId, accessToken, {
            limit: fullSync ? 500 : 100
        });
        const creatives = creativesData.data || [];

        for (const creative of creatives) {
            await query(`
                INSERT INTO meta_creatives (
                    id, user_id, ad_account_id, name, asset_feed_spec,
                    object_story_spec, thumbnail_url, permalink_url,
                    created_at, updated_at, last_sync_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
                ON CONFLICT (id, user_id) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    asset_feed_spec = EXCLUDED.asset_feed_spec,
                    object_story_spec = EXCLUDED.object_story_spec,
                    thumbnail_url = EXCLUDED.thumbnail_url,
                    permalink_url = EXCLUDED.permalink_url,
                    updated_at = NOW(),
                    last_sync_at = NOW()
            `, [
                creative.id,
                userId,
                adAccountId,
                creative.name,
                JSON.stringify(creative.asset_feed_spec || {}),
                JSON.stringify(creative.object_story_spec || {}),
                creative.thumbnail_url,
                creative.permalink_url
            ]);
        }

        console.log(`🎨 ${creatives.length} créatives synchronisées`);
        return creatives;
    } catch (error) {
        console.error('Erreur synchronisation créatives:', error);
        throw error;
    }
}

// Fonction de synchronisation des insights (métriques)
async function syncInsights(userId, adAccountId, accessToken, fullSync) {
    try {
        const insightsData = await metaAPI.getInsights(adAccountId, accessToken, {
            level: 'campaign',
            datePreset: fullSync ? 'last_90d' : 'last_30d',
            limit: fullSync ? 1000 : 500
        });
        const insights = insightsData.data || [];

        for (const insight of insights) {
            await query(`
                INSERT INTO meta_insights (
                    user_id, ad_account_id, campaign_id, adset_id, ad_id,
                    date_start, date_stop, spend, impressions, clicks, ctr,
                    cpc, cpm, reach, frequency, actions, action_values,
                    conversions, cost_per_conversion, roas,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
                ON CONFLICT (user_id, campaign_id, date_start, date_stop) 
                DO UPDATE SET 
                    spend = EXCLUDED.spend,
                    impressions = EXCLUDED.impressions,
                    clicks = EXCLUDED.clicks,
                    ctr = EXCLUDED.ctr,
                    cpc = EXCLUDED.cpc,
                    cpm = EXCLUDED.cpm,
                    reach = EXCLUDED.reach,
                    frequency = EXCLUDED.frequency,
                    actions = EXCLUDED.actions,
                    action_values = EXCLUDED.action_values,
                    conversions = EXCLUDED.conversions,
                    cost_per_conversion = EXCLUDED.cost_per_conversion,
                    roas = EXCLUDED.roas,
                    updated_at = NOW()
            `, [
                userId,
                adAccountId,
                insight.campaign_id || null,
                insight.adset_id || null,
                insight.ad_id || null,
                insight.date_start,
                insight.date_stop,
                parseFloat(insight.spend) || 0,
                parseInt(insight.impressions) || 0,
                parseInt(insight.clicks) || 0,
                parseFloat(insight.ctr) || 0,
                parseFloat(insight.cpc) || 0,
                parseFloat(insight.cpm) || 0,
                parseInt(insight.reach) || 0,
                parseFloat(insight.frequency) || 0,
                JSON.stringify(insight.actions || {}),
                JSON.stringify(insight.action_values || {}),
                parseInt(insight.conversions) || 0,
                parseFloat(insight.cost_per_conversion) || 0,
                parseFloat(insight.roas) || 0
            ]);
        }

        console.log(`📈 ${insights.length} insights synchronisés`);
        return insights;
    } catch (error) {
        console.error('Erreur synchronisation insights:', error);
        throw error;
    }
}

// Mettre à jour le statut de synchronisation
async function updateSyncStatus(userId, adAccountId, status) {
    try {
        await query(`
            INSERT INTO meta_sync_status (
                user_id, ad_account_id, status, last_sync_at,
                created_at, updated_at
            ) VALUES ($1, $2, $3, NOW(), NOW(), NOW())
            ON CONFLICT (user_id, ad_account_id) 
            DO UPDATE SET 
                status = EXCLUDED.status,
                last_sync_at = NOW(),
                updated_at = NOW()
        `, [userId, adAccountId, status]);
    } catch (error) {
        console.error('Erreur mise à jour statut sync:', error);
    }
}

// Événements de la queue
syncQueue.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} complété:`, result);
});

syncQueue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} échoué:`, err);
});

syncQueue.on('stalled', (job) => {
    console.warn(`⚠️ Job ${job.id} en attente`);
});

module.exports = { syncQueue };
