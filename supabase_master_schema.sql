-- MASTER SCHEMA FOR WEALTH & MINDSET PROJECT (V2)
-- Consolidated from various migrations and existing script logic.

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Roles (For Authentication)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Books Table
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_image TEXT,
    background_image TEXT,
    category TEXT DEFAULT 'book', -- Used for 'type' filtering (book/story/etc)
    genre TEXT,
    detail_settings JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'published',
    sort_order INTEGER DEFAULT 100,
    original_book_id UUID REFERENCES books(id) ON DELETE SET NULL, -- For language variants
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_books_original_id ON books(original_book_id);
CREATE INDEX IF NOT EXISTS idx_books_language ON books(language);

-- 3. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT, -- Markdown or HTML
    description TEXT,
    background_image TEXT,
    background_style TEXT DEFAULT 'cover',
    audio_url TEXT,
    music_volume INTEGER DEFAULT 30,
    music_loop BOOLEAN DEFAULT true,
    reading_time TEXT,
    chapter_type TEXT DEFAULT 'standard',
    visibility TEXT DEFAULT 'public',
    custom_css TEXT,
    language TEXT DEFAULT 'en',
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_language ON chapters(language);

-- 4. Admin Settings (Global Site Config)
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    site_title TEXT,
    site_description TEXT,
    ga_id TEXT,
    site_url TEXT,
    adsense_id TEXT,
    auto_ads_enabled BOOLEAN DEFAULT true,
    sidebar_ad_slot TEXT,
    ad_frequency TEXT DEFAULT 'med',
    support_email TEXT,
    admin_access_code TEXT,
    footer_copyright TEXT,
    header_tags TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    content_types JSONB DEFAULT '{}'::jsonb, -- Stores categoryMap
    extra_settings JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Homepage Settings
CREATE TABLE IF NOT EXISTS homepage_settings (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    hero_title TEXT,
    hero_subtitle TEXT,
    exclusive_collection JSONB DEFAULT '[]'::jsonb,
    popular_books JSONB DEFAULT '[]'::jsonb,
    success_stories JSONB DEFAULT '[]'::jsonb,
    browse_topics JSONB DEFAULT '[]'::jsonb,
    micro_lessons JSONB DEFAULT '[]'::jsonb,
    micro_lesson_headings JSONB DEFAULT '[]'::jsonb,
    custom_sections JSONB DEFAULT '[]'::jsonb,
    slider_images JSONB DEFAULT '[]'::jsonb,
    bottom_banners JSONB DEFAULT '[]'::jsonb,
    image_manager_1 JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Daily Mindset
CREATE TABLE IF NOT EXISTS daily_mindset (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    title TEXT,
    inspiration_text TEXT NOT NULL,
    read_more_link TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. User Activity (Analytics)
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    activity_type TEXT NOT NULL, -- page_view, ad_click, chapter_read
    page_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Site Feedback
CREATE TABLE IF NOT EXISTS site_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    topic TEXT DEFAULT 'general',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread', -- unread, read, replied, archived
    secret_code TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8.1. Site Visitors (New for accurate unique counts)
CREATE TABLE IF NOT EXISTS site_visitors (
    visitor_id UUID PRIMARY KEY, -- Provided by client (localStorage/cookie)
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    visit_count INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RPC for Tracking Visitors (Upsert logic)
CREATE OR REPLACE FUNCTION track_visitor(
    p_visitor_id UUID,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO site_visitors (visitor_id, ip_address, user_agent, metadata, last_seen, visit_count)
    VALUES (p_visitor_id, p_ip_address, p_user_agent, p_metadata, now(), 1)
    ON CONFLICT (visitor_id) DO UPDATE SET
        last_seen = now(),
        visit_count = site_visitors.visit_count + 1,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        metadata = site_visitors.metadata || p_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Stories (Legacy/Secondary Content)
CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    moral TEXT,
    category TEXT DEFAULT 'Success Story',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Quotes
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote TEXT NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Book Reviews
CREATE TABLE IF NOT EXISTS book_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    reviewer_name TEXT,
    username TEXT, -- Legacy support
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    admin_reply TEXT,
    chapter_number INTEGER,
    chapter_title TEXT,
    ip_address TEXT,
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Grant permissions for RPCs
GRANT EXECUTE ON FUNCTION track_visitor(UUID, TEXT, TEXT, JSONB) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON book_reviews(book_id);

-- --- ROW LEVEL SECURITY (RLS) ---

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mindset ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visitors ENABLE ROW LEVEL SECURITY;

-- Helper Function: Is Admin?
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. User Roles Policies
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;
CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Books Policies
DROP POLICY IF EXISTS "Anyone can view books" ON books;
CREATE POLICY "Anyone can view books" ON books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage books" ON books;
CREATE POLICY "Admins can manage books" ON books FOR ALL USING (is_admin());

-- 3. Chapters Policies
DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
CREATE POLICY "Anyone can view chapters" ON chapters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage chapters" ON chapters;
CREATE POLICY "Admins can manage chapters" ON chapters FOR ALL USING (is_admin());

-- 4. Admin Settings Policies
DROP POLICY IF EXISTS "Anyone can view settings" ON admin_settings;
CREATE POLICY "Anyone can view settings" ON admin_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
CREATE POLICY "Admins can manage settings" ON admin_settings FOR ALL USING (is_admin());

-- 5. Homepage Settings Policies
DROP POLICY IF EXISTS "Anyone can view homepage" ON homepage_settings;
CREATE POLICY "Anyone can view homepage" ON homepage_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage homepage" ON homepage_settings;
CREATE POLICY "Admins can manage homepage" ON homepage_settings FOR ALL USING (is_admin());

-- 6. Daily Mindset Policies
DROP POLICY IF EXISTS "Anyone can view daily mindset" ON daily_mindset;
CREATE POLICY "Anyone can view daily mindset" ON daily_mindset FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage daily mindset" ON daily_mindset;
CREATE POLICY "Admins can manage daily mindset" ON daily_mindset FOR ALL USING (is_admin());

-- 7. User Activity Policies
DROP POLICY IF EXISTS "Anyone can insert activity" ON user_activity;
CREATE POLICY "Anyone can insert activity" ON user_activity FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view activity" ON user_activity;
CREATE POLICY "Admins can view activity" ON user_activity FOR SELECT USING (is_admin());

-- 8. Site Feedback Policies
DROP POLICY IF EXISTS "Anyone can submit feedback" ON site_feedback;
CREATE POLICY "Anyone can submit feedback" ON site_feedback FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage feedback" ON site_feedback;
CREATE POLICY "Admins can manage feedback" ON site_feedback FOR ALL USING (is_admin());

-- 9. Stories Policies
DROP POLICY IF EXISTS "Anyone can view stories" ON stories;
CREATE POLICY "Anyone can view stories" ON stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage stories" ON stories;
CREATE POLICY "Admins can manage stories" ON stories FOR ALL USING (is_admin());

-- 10. Quotes Policies
DROP POLICY IF EXISTS "Anyone can view quotes" ON quotes;
CREATE POLICY "Anyone can view quotes" ON quotes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage quotes" ON quotes;
CREATE POLICY "Admins can manage quotes" ON quotes FOR ALL USING (is_admin());

-- 11. Book Reviews Policies
DROP POLICY IF EXISTS "Anyone can view reviews" ON book_reviews;
CREATE POLICY "Anyone can view reviews" ON book_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert reviews" ON book_reviews;
CREATE POLICY "Anyone can insert reviews" ON book_reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage reviews" ON book_reviews;
CREATE POLICY "Admins can manage reviews" ON book_reviews FOR ALL USING (is_admin());

-- 12. Site Visitors Policies
DROP POLICY IF EXISTS "Anyone can insert/update via RPC" ON site_visitors;
CREATE POLICY "Anyone can insert/update via RPC" ON site_visitors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view visitors" ON site_visitors;
CREATE POLICY "Admins can view visitors" ON site_visitors FOR SELECT USING (is_admin());
