-- Add language column to chapters table (for redundancy/filtering)
-- This allows chapters to be tagged with their language even though
-- they belong to a language-specific book

ALTER TABLE chapters 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Index for faster language-based queries
CREATE INDEX IF NOT EXISTS idx_chapters_language ON chapters(language);
