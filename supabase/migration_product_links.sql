-- Migration: Create product_links table
CREATE TABLE IF NOT EXISTS product_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL CHECK (store_name IN ('amazon', 'flipkart', 'other')),
    url TEXT NOT NULL,
    is_recommended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE product_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product links" ON product_links;
CREATE POLICY "Anyone can view product links" ON product_links 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product links" ON product_links;
CREATE POLICY "Admins can manage product links" ON product_links 
    FOR ALL USING (is_admin());
