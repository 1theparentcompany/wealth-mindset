-- Migration: Add status column to daily_mindset
-- Execute this in the Supabase SQL Editor if you want to enable entries activation/deactivation.

ALTER TABLE daily_mindset 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing rows to 'active' if they don't have it
UPDATE daily_mindset SET status = 'active' WHERE status IS NULL;
