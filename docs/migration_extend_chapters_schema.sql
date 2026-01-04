-- Migration: Extend chapters table with metadata for Content Editor
-- This adds support for background styling, music settings, and advanced metadata.

ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS background_style TEXT DEFAULT 'cover',
ADD COLUMN IF NOT EXISTS music_volume INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS music_loop BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reading_time TEXT,
ADD COLUMN IF NOT EXISTS chapter_type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS custom_css TEXT;

-- Update existing rows with defaults if necessary
UPDATE chapters SET background_style = 'cover' WHERE background_style IS NULL;
UPDATE chapters SET music_volume = 30 WHERE music_volume IS NULL;
UPDATE chapters SET music_loop = true WHERE music_loop IS NULL;
UPDATE chapters SET chapter_type = 'standard' WHERE chapter_type IS NULL;
UPDATE chapters SET visibility = 'public' WHERE visibility IS NULL;
