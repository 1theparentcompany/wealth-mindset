-- Migration: Extend feedback table with metadata for professional management
-- This adds support for email tracking, categorized messages, and status management.

ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unread';

-- Update existing rows with defaults if necessary
UPDATE feedback SET topic = 'general' WHERE topic IS NULL;
UPDATE feedback SET status = 'unread' WHERE status IS NULL;

-- Index for status-based filtering (important for inbox performance)
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
