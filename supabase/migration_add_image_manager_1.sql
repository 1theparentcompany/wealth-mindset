-- Add image_manager_1 column to homepage_settings table
ALTER TABLE homepage_settings 
ADD COLUMN IF NOT EXISTS image_manager_1 JSONB DEFAULT '[]'::jsonb;

-- Comment on column
COMMENT ON COLUMN homepage_settings.image_manager_1 IS 'Array of images for the Image 1 section below welcome banner';
