-- Create Products table (parent/induk produk)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sku VARCHAR(100),
    category VARCHAR(100),
    
    -- Stock management
    initial_stock INTEGER,
    stock_tracking JSONB DEFAULT '{"enabled": false, "current": 0}',
    
    -- Pricing (default/base price)
    base_price DECIMAL(12, 2),
    cost_price DECIMAL(12, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT products_name_brand_unique UNIQUE(name, brand_id)
);

-- Create index untuk faster queries
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Update forms table untuk menambah productId
ALTER TABLE IF EXISTS forms ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX idx_forms_product_id ON forms(product_id);

-- Create Product Analytics table (untuk tracking per advertiser)
CREATE TABLE IF NOT EXISTS product_form_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    advertiser_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Performance metrics
    views_count INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    
    -- Engagement
    average_time_on_page NUMERIC DEFAULT 0,
    bounce_rate NUMERIC DEFAULT 0,
    
    -- Conversion
    conversion_rate NUMERIC DEFAULT 0,
    average_order_value DECIMAL(12, 2) DEFAULT 0,
    
    -- Source tracking
    traffic_sources JSONB DEFAULT '{"organic": 0, "social": 0, "email": 0, "paid": 0, "direct": 0}',
    top_referrer VARCHAR(500),
    
    -- Time period
    period_start DATE DEFAULT CURRENT_DATE,
    period_end DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT analytics_unique UNIQUE(product_id, form_id, advertiser_id, period_start)
);

CREATE INDEX idx_analytics_product_id ON product_form_analytics(product_id);
CREATE INDEX idx_analytics_form_id ON product_form_analytics(form_id);
CREATE INDEX idx_analytics_advertiser_id ON product_form_analytics(advertiser_id);
CREATE INDEX idx_analytics_period ON product_form_analytics(period_start DESC);

-- Create Product Performance Aggregation view (aggregate per product)
CREATE OR REPLACE VIEW product_performance_aggregate AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.brand_id,
    COUNT(DISTINCT pfa.form_id) as total_forms,
    COUNT(DISTINCT pfa.advertiser_id) as total_advertisers,
    COALESCE(SUM(pfa.views_count), 0) as total_views,
    COALESCE(SUM(pfa.clicks_count), 0) as total_clicks,
    COALESCE(SUM(pfa.orders_count), 0) as total_orders,
    COALESCE(SUM(pfa.total_revenue), 0) as total_revenue,
    ROUND(
        CASE 
            WHEN COALESCE(SUM(pfa.views_count), 0) > 0 
            THEN (COALESCE(SUM(pfa.orders_count), 0)::NUMERIC / COALESCE(SUM(pfa.views_count), 0)::NUMERIC) * 100
            ELSE 0 
        END, 
        2
    ) as conversion_rate_percent,
    ROUND(
        CASE 
            WHEN COALESCE(SUM(pfa.orders_count), 0) > 0 
            THEN COALESCE(SUM(pfa.total_revenue), 0) / COALESCE(SUM(pfa.orders_count), 0)::NUMERIC
            ELSE 0 
        END, 
        2
    ) as avg_order_value,
    MAX(pfa.updated_at) as last_updated
FROM products p
LEFT JOIN product_form_analytics pfa ON p.id = pfa.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.brand_id;

-- Create Advertiser Performance per Product view
CREATE OR REPLACE VIEW advertiser_product_performance AS
SELECT 
    pfa.advertiser_id,
    p.id as product_id,
    p.name as product_name,
    COUNT(DISTINCT pfa.form_id) as forms_count,
    SUM(pfa.views_count) as views_count,
    SUM(pfa.clicks_count) as clicks_count,
    SUM(pfa.orders_count) as orders_count,
    SUM(pfa.total_revenue) as total_revenue,
    ROUND(
        CASE 
            WHEN SUM(pfa.views_count) > 0 
            THEN (SUM(pfa.orders_count)::NUMERIC / SUM(pfa.views_count)::NUMERIC) * 100
            ELSE 0 
        END, 
        2
    ) as conversion_rate,
    ROUND(
        CASE 
            WHEN SUM(pfa.orders_count) > 0 
            THEN SUM(pfa.total_revenue) / SUM(pfa.orders_count)::NUMERIC
            ELSE 0 
        END, 
        2
    ) as average_order_value,
    MAX(pfa.period_start) as period_start,
    CASE 
        WHEN SUM(pfa.total_revenue) > 0 THEN TRUE
        ELSE FALSE
    END as is_profitable
FROM product_form_analytics pfa
JOIN products p ON pfa.product_id = p.id
WHERE pfa.is_active = true
GROUP BY pfa.advertiser_id, p.id, p.name
ORDER BY MAX(pfa.period_start) DESC, SUM(pfa.total_revenue) DESC;

-- Trigger untuk auto-update product updated_at
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_updated_at ON products;
CREATE TRIGGER trigger_update_product_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_updated_at();

-- RPC Function untuk create analytics record
CREATE OR REPLACE FUNCTION create_product_analytics(
    p_product_id UUID,
    p_form_id UUID,
    p_advertiser_id UUID,
    p_period_start DATE DEFAULT CURRENT_DATE
)
RETURNS product_form_analytics AS $$
DECLARE
    v_analytics product_form_analytics;
BEGIN
    INSERT INTO product_form_analytics (
        product_id, form_id, advertiser_id, period_start
    )
    VALUES (p_product_id, p_form_id, p_advertiser_id, p_period_start)
    ON CONFLICT (product_id, form_id, advertiser_id, period_start)
    DO UPDATE SET is_active = true, updated_at = NOW()
    RETURNING * INTO v_analytics;
    
    RETURN v_analytics;
END;
$$ LANGUAGE plpgsql;

-- RPC Function untuk update analytics metrics
CREATE OR REPLACE FUNCTION update_analytics_metrics(
    p_analytics_id UUID,
    p_views_count INTEGER DEFAULT NULL,
    p_clicks_count INTEGER DEFAULT NULL,
    p_orders_count INTEGER DEFAULT NULL,
    p_total_revenue DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE product_form_analytics
    SET 
        views_count = COALESCE(p_views_count, views_count),
        clicks_count = COALESCE(p_clicks_count, clicks_count),
        orders_count = COALESCE(p_orders_count, orders_count),
        total_revenue = COALESCE(p_total_revenue, total_revenue),
        conversion_rate = CASE 
            WHEN COALESCE(p_views_count, views_count) > 0 
            THEN (COALESCE(p_orders_count, orders_count)::NUMERIC / COALESCE(p_views_count, views_count)::NUMERIC) * 100
            ELSE 0
        END,
        average_order_value = CASE 
            WHEN COALESCE(p_orders_count, orders_count) > 0 
            THEN COALESCE(p_total_revenue, total_revenue) / COALESCE(p_orders_count, orders_count)::NUMERIC
            ELSE 0
        END,
        updated_at = NOW()
    WHERE id = p_analytics_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- GRANT permissions
GRANT SELECT ON products TO authenticated;
GRANT INSERT, UPDATE ON products TO authenticated;
GRANT SELECT ON product_form_analytics TO authenticated;
GRANT INSERT, UPDATE ON product_form_analytics TO authenticated;
GRANT SELECT ON product_performance_aggregate TO authenticated;
GRANT SELECT ON advertiser_product_performance TO authenticated;
GRANT EXECUTE ON FUNCTION create_product_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION update_analytics_metrics TO authenticated;
