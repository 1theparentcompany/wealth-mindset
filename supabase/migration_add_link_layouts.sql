-- Migration: Add layout options to product_links table
ALTER TABLE product_links 
ADD COLUMN IF NOT EXISTS layout_type TEXT DEFAULT 'with-detail',
ADD COLUMN IF NOT EXISTS display_mode TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'portrait',
ADD COLUMN IF NOT EXISTS size_category TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS custom_width INTEGER,
ADD COLUMN IF NOT EXISTS custom_height INTEGER;
