-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Table Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Table Brands (Marques)
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    website_url VARCHAR(500),
    industry VARCHAR(100),
    target_audience TEXT,
    
    -- Identité visuelle
    logo_light_url VARCHAR(500),
    logo_dark_url VARCHAR(500),
    favicon_url VARCHAR(500),
    
    -- Couleurs (format JSON)
    colors JSONB DEFAULT '{"primary": "#667eea", "secondary": "#764ba2", "accent": "#42B883", "text": "#1C1E21", "background": "#FFFFFF"}',
    
    -- Typographie (format JSON)
    typography JSONB DEFAULT '{"heading": "Inter", "body": "Inter", "headingSize": "32px", "bodySize": "16px"}',
    
    -- Personnalité de marque
    personality JSONB DEFAULT '[]',
    keywords TEXT[],
    
    -- CTAs préférés
    preferred_ctas TEXT[] DEFAULT ARRAY['En savoir plus', 'Acheter maintenant', 'Découvrir'],
    
    -- Styles visuels (format JSON)
    visual_style JSONB DEFAULT '{"borderRadius": "medium", "shadowIntensity": "light", "useGradients": false}',
    
    -- Données scraping
    scraped_data JSONB DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Table Templates
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'high-converting', 'modern', 'ugly-ads', 'minimal', etc.
    format VARCHAR(50), -- 'landscape', 'square', 'story'
    
    -- HTML template avec variables
    html_template TEXT NOT NULL,
    
    -- CSS séparé pour plus de flexibilité
    css_template TEXT,
    
    -- Variables requises (format JSON array)
    required_vars JSONB DEFAULT '[]',
    
    -- Métadonnées de performance
    avg_ctr DECIMAL(5,2) DEFAULT 0,
    avg_conversion_rate DECIMAL(5,2) DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    
    -- Tags pour recherche
    tags TEXT[],
    
    -- Aperçu
    thumbnail_url VARCHAR(500),
    preview_html TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false
);

-- Table Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    objective VARCHAR(100), -- 'awareness', 'conversion', 'traffic', 'engagement', 'sales'
    budget DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    target_audience JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table Creatives (Créatives générées)
CREATE TABLE IF NOT EXISTS creatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    template_id UUID REFERENCES templates(id),
    campaign_id UUID REFERENCES campaigns(id),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES creatives(id), -- Pour les variations
    
    -- Contenu
    html_content TEXT NOT NULL,
    css_content TEXT,
    
    -- Formats générés (JSON avec landscape, square, story)
    formats JSONB DEFAULT '{}',
    
    -- Assets utilisés
    assets JSONB DEFAULT '[]',
    
    -- Données de formulaire
    form_data JSONB DEFAULT '{}',
    
    -- Validation
    validation_results JSONB DEFAULT '{}',
    validation_score INTEGER DEFAULT 100,
    is_valid BOOLEAN DEFAULT true,
    
    -- Preview URLs
    preview_urls JSONB DEFAULT '{}',
    
    -- Performance tracking
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    exported_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    
    -- AI metadata
    generation_params JSONB DEFAULT '{}'
);

-- Table Assets (Images, vidéos, etc.)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informations fichier
    original_url VARCHAR(500) NOT NULL,
    optimized_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    cloudinary_id VARCHAR(255),
    
    -- Métadonnées
    file_type VARCHAR(50),
    file_size INTEGER,
    dimensions JSONB DEFAULT '{"width": 0, "height": 0}',
    
    -- IA Generated
    is_ai_generated BOOLEAN DEFAULT false,
    ai_prompt TEXT,
    ai_provider VARCHAR(50), -- 'neobanana', 'dalle', 'stability', 'ideogram', 'leonardo'
    ai_params JSONB DEFAULT '{}',
    
    -- Analyse
    dominant_colors JSONB DEFAULT '[]',
    contains_text BOOLEAN DEFAULT false,
    detected_objects JSONB DEFAULT '[]',
    
    -- Tags et catégories
    tags TEXT[],
    category VARCHAR(100),
    
    -- Métadonnées
    created_at TIMESTAMP DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP
);

-- Table Jobs (pour tracking des jobs async)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'generate-creative', 'scrape-website', 'generate-image', etc.
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    progress INTEGER DEFAULT 0,
    data JSONB DEFAULT '{}',
    result JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Table Analytics (métriques de performance)
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creative_id UUID REFERENCES creatives(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    platform VARCHAR(50), -- 'facebook', 'instagram', 'stories'
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(10,2) DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    cpa DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_brands_user ON brands(user_id);
CREATE INDEX idx_brands_active ON brands(is_active) WHERE is_active = true;
CREATE INDEX idx_creatives_brand ON creatives(brand_id);
CREATE INDEX idx_creatives_user ON creatives(user_id);
CREATE INDEX idx_creatives_status ON creatives(status);
CREATE INDEX idx_creatives_created ON creatives(created_at DESC);
CREATE INDEX idx_assets_brand ON assets(brand_id);
CREATE INDEX idx_assets_user ON assets(user_id);
CREATE INDEX idx_templates_format ON templates(format);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_public ON templates(is_public) WHERE is_public = true;
CREATE INDEX idx_campaigns_brand ON campaigns(brand_id);
CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_analytics_creative ON analytics(creative_id);
CREATE INDEX idx_analytics_date ON analytics(date DESC);

-- Index texte complet pour recherche
CREATE INDEX idx_brands_name_trgm ON brands USING gin(name gin_trgm_ops);
CREATE INDEX idx_templates_name_trgm ON templates USING gin(name gin_trgm_ops);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creatives_updated_at BEFORE UPDATE ON creatives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vues utiles
CREATE OR REPLACE VIEW creative_performance AS
SELECT 
    c.id,
    c.brand_id,
    b.name as brand_name,
    c.template_id,
    t.name as template_name,
    t.category as template_category,
    c.impressions,
    c.clicks,
    c.conversions,
    c.spend,
    CASE 
        WHEN c.impressions > 0 THEN (c.clicks::float / c.impressions * 100)
        ELSE 0
    END as ctr,
    CASE
        WHEN c.clicks > 0 THEN (c.conversions::float / c.clicks * 100)
        ELSE 0
    END as conversion_rate,
    CASE
        WHEN c.clicks > 0 THEN (c.spend / c.clicks)
        ELSE 0
    END as cpc,
    c.validation_score,
    c.status,
    c.created_at
FROM creatives c
LEFT JOIN brands b ON c.brand_id = b.id
LEFT JOIN templates t ON c.template_id = t.id;

-- Fonction pour nettoyer les vieux jobs
CREATE OR REPLACE FUNCTION clean_old_jobs()
RETURNS void AS $$
BEGIN
    DELETE FROM jobs WHERE status IN ('completed', 'failed') AND completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Vue pour les templates les plus performants
CREATE OR REPLACE VIEW top_templates AS
SELECT 
    t.*,
    COUNT(c.id) as usage_count_actual,
    AVG(CASE WHEN c.impressions > 0 THEN (c.clicks::float / c.impressions * 100) ELSE 0 END) as actual_ctr,
    AVG(CASE WHEN c.clicks > 0 THEN (c.conversions::float / c.clicks * 100) ELSE 0 END) as actual_conversion_rate
FROM templates t
LEFT JOIN creatives c ON t.id = c.template_id
WHERE t.is_public = true
GROUP BY t.id
ORDER BY actual_ctr DESC, actual_conversion_rate DESC;

-- Insertion de données de seed
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@metaads.com', '$2b$10$rKJ8HZ3nGPbSvlvLCRvVk.5pJXZY7vQZQH1xgEzxZGxZJQXZQXZQX', 'Admin', 'admin'),
('demo@metaads.com', '$2b$10$rKJ8HZ3nGPbSvlvLCRvVk.5pJXZY7vQZQH1xgEzxZGxZJQXZQXZQX', 'Demo User', 'user')
ON CONFLICT (email) DO NOTHING;
