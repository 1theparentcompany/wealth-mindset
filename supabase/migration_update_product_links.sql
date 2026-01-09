-- Migration: Add product_icon and description to product_links table
ALTER TABLE product_links 
ADD COLUMN IF NOT EXISTS product_icon TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS custom_name TEXT;

-- Update existing column if needed
ALTER TABLE product_links ALTER COLUMN book_id DROP NOT NULL;
