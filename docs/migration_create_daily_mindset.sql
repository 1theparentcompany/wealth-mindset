-- Migration: Create daily_mindset table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS daily_mindset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    inspiration_text TEXT NOT NULL,
    image_url TEXT,
    read_more_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE daily_mindset ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public Read Daily Mindset" ON daily_mindset FOR SELECT USING (true);
CREATE POLICY "Admin All Daily Mindset" ON daily_mindset FOR ALL USING (true);
