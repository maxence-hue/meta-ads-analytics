-- Extension TimescaleDB pour les données temporelles
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Table des connexions Meta OAuth2
CREATE TABLE IF NOT EXISTS meta_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_info JSONB,
    ad_accounts JSONB,
    status VARCHAR(50) DEFAULT 'connected',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Table des campagnes Meta
CREATE TABLE IF NOT EXISTS meta_campaigns (
    id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    objective VARCHAR(100),
    buying_type VARCHAR(50),
    start_time TIMESTAMP,
    stop_time TIMESTAMP,
    special_ad_categories JSONB,
    budget_remaining DECIMAL(15,2),
    lifetime_budget DECIMAL(15,2),
    daily_budget DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (id, user_id)
);

-- Table des ad sets
CREATE TABLE IF NOT EXISTS meta_adsets (
    id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    budget_remaining DECIMAL(15,2),
    lifetime_budget DECIMAL(15,2),
    daily_budget DECIMAL(15,2),
    start_time TIMESTAMP,
    stop_time TIMESTAMP,
    targeting JSONB,
    optimization_goal VARCHAR(100),
    billing_event VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (id, user_id)
);

-- Table des ads
CREATE TABLE IF NOT EXISTS meta_ads (
    id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    adset_id VARCHAR(100),
    campaign_id VARCHAR(100),
    name VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    creative_id VARCHAR(100),
    created_time TIMESTAMP,
    updated_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (id, user_id)
);

-- Table des créatives
CREATE TABLE IF NOT EXISTS meta_creatives (
    id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    name VARCHAR(500),
    asset_feed_spec JSONB,
    object_story_spec JSONB,
    thumbnail_url TEXT,
    permalink_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_sync_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (id, user_id)
);

-- Table des insights (métriques) avec TimescaleDB
CREATE TABLE IF NOT EXISTS meta_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    campaign_id VARCHAR(100),
    adset_id VARCHAR(100),
    ad_id VARCHAR(100),
    date_start DATE NOT NULL,
    date_stop DATE NOT NULL,
    spend DECIMAL(15,2) DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    ctr DECIMAL(8,4) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    cpm DECIMAL(10,2) DEFAULT 0,
    reach BIGINT DEFAULT 0,
    frequency DECIMAL(8,2) DEFAULT 0,
    actions JSONB,
    action_values JSONB,
    conversions BIGINT DEFAULT 0,
    cost_per_conversion DECIMAL(10,2) DEFAULT 0,
    roas DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, campaign_id, date_start, date_stop)
);

-- Créer hypertable TimescaleDB pour les insights
SELECT create_hypertable('meta_insights', 'date_start', if_not_exists => TRUE);

-- Table des analyses IA
CREATE TABLE IF NOT EXISTS ai_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, ad_account_id)
);

-- Table du statut de synchronisation
CREATE TABLE IF NOT EXISTS meta_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    ad_account_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    last_sync_at TIMESTAMP,
    error_message TEXT,
    sync_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, ad_account_id)
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_user_account ON meta_campaigns(user_id, ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_status ON meta_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_meta_adsets_user_account ON meta_adsets(user_id, ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_adsets_campaign ON meta_adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_user_account ON meta_ads(user_id, ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_campaign ON meta_ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_creatives_user_account ON meta_creatives(user_id, ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_insights_user_account ON meta_insights(user_id, ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_insights_date_range ON meta_insights(date_start, date_stop);
CREATE INDEX IF NOT EXISTS idx_meta_insights_campaign ON meta_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_user_account ON ai_analytics(user_id, ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_sync_status_user_account ON meta_sync_status(user_id, ad_account_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meta_connections_updated_at BEFORE UPDATE ON meta_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meta_campaigns_updated_at BEFORE UPDATE ON meta_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meta_adsets_updated_at BEFORE UPDATE ON meta_adsets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meta_ads_updated_at BEFORE UPDATE ON meta_ads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meta_creatives_updated_at BEFORE UPDATE ON meta_creatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analytics_updated_at BEFORE UPDATE ON ai_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meta_sync_status_updated_at BEFORE UPDATE ON meta_sync_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques de rétention pour les insights (garder 2 ans de données)
SELECT add_retention_policy('meta_insights', INTERVAL '2 years');

-- Vues matérialisées pour les rapports rapides
CREATE MATERIALIZED VIEW IF NOT EXISTS meta_campaign_summary AS
SELECT 
    user_id,
    ad_account_id,
    campaign_id,
    MAX(date_start) as latest_date,
    MIN(date_start) as earliest_date,
    SUM(spend) as total_spend,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    AVG(ctr) as avg_ctr,
    AVG(cpc) as avg_cpc,
    SUM(conversions) as total_conversions,
    AVG(roas) as avg_roas,
    COUNT(*) as data_points
FROM meta_insights 
WHERE campaign_id IS NOT NULL
GROUP BY user_id, ad_account_id, campaign_id;

-- Index pour la vue matérialisée
CREATE INDEX IF NOT EXISTS idx_meta_campaign_summary_user_account ON meta_campaign_summary(user_id, ad_account_id);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_campaign_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY meta_campaign_summary;
END;
$$ LANGUAGE plpgsql;

-- Permissions (adapter selon votre configuration)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO meta_ads_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO meta_ads_user;
