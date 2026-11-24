-- Migration 001: Initial Floria Korean Beauty Database Schema & RLS Policies
-- Apply via Supabase SQL Editor or psql -f database/migrations/001_initial_schema.sql

\i ../schema.sql

-- Supabase Row Level Security (enable when deploying to Supabase PostgreSQL)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Public storefront read access for active catalog items & approved reviews
CREATE POLICY "Public read active products" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read visible categories" ON categories FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "Public read brands" ON brands FOR SELECT USING (TRUE);
CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Public read store settings" ON store_settings FOR SELECT USING (TRUE);
CREATE POLICY "Public read homepage sections" ON homepage_sections FOR SELECT USING (TRUE);
CREATE POLICY "Public read active shipping zones" ON shipping_zones FOR SELECT USING (is_active = TRUE);
