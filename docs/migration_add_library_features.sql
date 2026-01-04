-- Migration: Add sort_order to books table
-- Execute this in Supabase SQL Editor

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 100;

-- Comment for clarity
COMMENT ON COLUMN books.sort_order IS 'Manually controllable sort order. Lower numbers appear first.';
