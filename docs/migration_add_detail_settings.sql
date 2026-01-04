-- Migration: Add detail_settings to books table
-- Execute this in Supabase SQL Editor

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS detail_settings JSONB DEFAULT '{}'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN books.detail_settings IS 'Stores custom detail page settings like colors, layout, and enabled features.';
