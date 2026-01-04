-- Migration: Fix Homepage Settings Schema
-- Description: Adds missing columns for hero text, collection IDs, tips, and custom sections.
-- Ensures the table can host a single stable settings row via UUID.

-- 1. Ensure the Extension for UUID exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Column Types and Add Missing Columns
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'hero_title') THEN
        ALTER TABLE homepage_settings ADD COLUMN hero_title TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'hero_subtitle') THEN
        ALTER TABLE homepage_settings ADD COLUMN hero_subtitle TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'exclusive_collection') THEN
        ALTER TABLE homepage_settings ADD COLUMN exclusive_collection JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'popular_books') THEN
        ALTER TABLE homepage_settings ADD COLUMN popular_books JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'success_stories') THEN
        ALTER TABLE homepage_settings ADD COLUMN success_stories JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'browse_topics') THEN
        ALTER TABLE homepage_settings ADD COLUMN browse_topics JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'micro_lessons') THEN
        ALTER TABLE homepage_settings ADD COLUMN micro_lessons JSONB DEFAULT '["", "", ""]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'micro_lesson_headings') THEN
        ALTER TABLE homepage_settings ADD COLUMN micro_lesson_headings JSONB DEFAULT '["", "", ""]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'custom_sections') THEN
        ALTER TABLE homepage_settings ADD COLUMN custom_sections JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'homepage_settings' AND column_name = 'bottom_banners') THEN
        ALTER TABLE homepage_settings ADD COLUMN bottom_banners JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Ensure slider_images and featured_books are JSONB (they should be, but let's be safe)
    ALTER TABLE homepage_settings ALTER COLUMN slider_images SET DEFAULT '[]'::jsonb;
    ALTER TABLE homepage_settings ALTER COLUMN featured_books SET DEFAULT '[]'::jsonb;
END $$;

-- 3. Initialize the Stable Settings Row
-- We use a fixed UUID so all admin sections and the public site refer to the same record.
INSERT INTO homepage_settings (id, hero_title, hero_subtitle)
VALUES ('00000000-0000-0000-0000-000000000001', 'Wealth & Mindset', 'Master the psychology of success.')
ON CONFLICT (id) DO NOTHING;

-- 4. Set default values for any existing records if necessary
UPDATE homepage_settings 
SET 
  exclusive_collection = COALESCE(exclusive_collection, '[]'::jsonb),
  popular_books = COALESCE(popular_books, '[]'::jsonb),
  success_stories = COALESCE(success_stories, '[]'::jsonb),
  browse_topics = COALESCE(browse_topics, '[]'::jsonb),
  micro_lessons = COALESCE(micro_lessons, '["", "", ""]'::jsonb),
  micro_lesson_headings = COALESCE(micro_lesson_headings, '["", "", ""]'::jsonb),
  custom_sections = COALESCE(custom_sections, '[]'::jsonb),
  bottom_banners = COALESCE(bottom_banners, '[]'::jsonb)
WHERE id = '00000000-0000-0000-0000-000000000001';
