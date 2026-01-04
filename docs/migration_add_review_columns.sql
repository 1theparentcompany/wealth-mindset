-- Migration: Add missing columns to book_reviews table
-- Execute this in Supabase SQL Editor

-- Add likes, dislikes, and admin_reply columns
ALTER TABLE book_reviews 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- Add RLS policy to allow updates (drop first if it exists)
DROP POLICY IF EXISTS "Public Update Book Reviews" ON book_reviews;
CREATE POLICY "Public Update Book Reviews" 
ON book_reviews 
FOR UPDATE 
USING (true);
