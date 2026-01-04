-- Supabase V2 Database Migration

-- 1. Core Tables

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Books Table
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image TEXT,
    background_image TEXT,
    audio_url TEXT,
    category TEXT,
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft',
    detail_settings JSONB DEFAULT '{}'::jsonb, -- custom colors, tabs, etc.
    sort_order INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    background_image TEXT,
    audio_url TEXT,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    moral TEXT,
    category TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote TEXT NOT NULL,
    author TEXT,
    category TEXT,
    is_daily BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Daily Mindset Table
CREATE TABLE IF NOT EXISTS daily_mindset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    inspiration_text TEXT NOT NULL,
    image_url TEXT,
    read_more_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Homepage Settings Table
CREATE TABLE IF NOT EXISTS homepage_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slider_images JSONB DEFAULT '[]'::jsonb,
    featured_books JSONB DEFAULT '[]'::jsonb,
    moving_banner_image TEXT,
    show_audio BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ads_enabled BOOLEAN DEFAULT true,
    audio_enabled BOOLEAN DEFAULT true,
    background_enabled BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    message TEXT,
    is_admin_trigger BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Media Table
CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- image / audio
    url TEXT NOT NULL,
    usage TEXT, -- cover / bg / slider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. User Activity Table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address TEXT,
    activity_type TEXT, -- e.g., 'page_view', 'cookie_accept', 'ad_click'
    page_url TEXT,
    metadata JSONB, -- store extra info like chapter_id, book_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Book Reviews Table (Community)
CREATE TABLE IF NOT EXISTS book_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    reviewer_name TEXT,
    username TEXT,
    rating INTEGER,
    comment TEXT,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    admin_reply TEXT,
    ip_address TEXT,
    chapter_number INTEGER, -- Optional: if review is for specific chapter
    chapter_title TEXT, -- Optional: chapter title for display
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Book Topics Table (Community)
CREATE TABLE IF NOT EXISTS book_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Book Messages Table (Community)
CREATE TABLE IF NOT EXISTS book_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES book_topics(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    username TEXT,
    message TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Default Settings Initialization

INSERT INTO admin_settings (ads_enabled, audio_enabled, background_enabled, maintenance_mode)
VALUES (true, true, true, false)
ON CONFLICT DO NOTHING;

INSERT INTO homepage_settings (show_audio)
VALUES (true)
ON CONFLICT DO NOTHING;

-- 3. Storage Buckets (Manual via Dashboard)
-- The following buckets should be created in the Supabase Storage dashboard:
-- covers (Public)
-- backgrounds (Public)
-- audio (Public)
-- slider (Public)
-- banners (Public)

-- 4. Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_messages ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public Read Books" ON books FOR SELECT USING (status = 'published');
CREATE POLICY "Public Read Chapters" ON chapters FOR SELECT USING (status = 'published');
CREATE POLICY "Public Read Stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Public Read Quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "Public Read Homepage Settings" ON homepage_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Admin Settings" ON admin_settings FOR SELECT USING (true);
CREATE POLICY "Public Insert Feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert User Activity" ON user_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Book Reviews" ON book_reviews FOR SELECT USING (true);
CREATE POLICY "Public Insert Book Reviews" ON book_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Book Reviews" ON book_reviews FOR UPDATE USING (true);
CREATE POLICY "Public Read Book Topics" ON book_topics FOR SELECT USING (true);
CREATE POLICY "Public Insert Book Topics" ON book_topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Book Messages" ON book_messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Book Messages" ON book_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Book Messages" ON book_messages FOR UPDATE USING (true); -- For likes

-- Admin Full Access Policies (Requires Auth)
-- For now, for simplicity in development, you can allow all if needed, 
-- but ideally restricted to authenticated users.
-- Example Admin Policy:
-- CREATE POLICY "Admin Full Access Books" ON books ALL TO authenticated USING (true);
