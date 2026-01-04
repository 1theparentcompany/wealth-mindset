-- Migration: Add SELECT policy for user_activity table
-- This allows the app to read interaction counts from Supabase

-- Add Public Read policy for user_activity
CREATE POLICY "Public Read User Activity" 
ON user_activity 
FOR SELECT 
USING (true);
