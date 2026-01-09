-- Migration: Create page_sections table for Visual Builder
CREATE TABLE IF NOT EXISTS page_sections (
    id TEXT PRIMARY KEY,
    page_target TEXT NOT NULL,
    section_type TEXT NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

-- Policies for public read
CREATE POLICY "Allow public read on page_sections" 
ON page_sections FOR SELECT 
USING (true);

-- Policies for authenticated management
CREATE POLICY "Allow authenticated manage on page_sections" 
ON page_sections FOR ALL 
USING (auth.role() = 'authenticated');
