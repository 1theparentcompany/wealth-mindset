-- Migration: Optimize Analytics Performance
-- Add indices to user_activity to speed up charting queries

-- Index for filtering by activity type (essential for all charts)
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);

-- Index for time-range based queries (essential for "Last 7 Days" etc.)
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Composite index for frequent combined lookups (e.g., "page_views from last 7 days")
CREATE INDEX IF NOT EXISTS idx_user_activity_type_time ON user_activity(activity_type, created_at);

-- Index for IP based lookups (unique visitor counting)
CREATE INDEX IF NOT EXISTS idx_user_activity_ip ON user_activity(ip_address);
