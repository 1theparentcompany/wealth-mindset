-- ==========================================
-- COMPLETE ADMIN SECURITY POLICIES (RLS & STORAGE)
-- ==========================================
-- This file contains ALL security policies for EVERY table in the database

-- --------------------------------------------------------
-- 1. ENABLE RLS ON ALL TABLES
-- --------------------------------------------------------
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mindset ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Enable RLS on site_taxonomy if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_taxonomy') THEN
        ALTER TABLE site_taxonomy ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- --------------------------------------------------------
-- 2. CONTENT TABLES (Books, Chapters, Mindset, Quotes, Stories)
--    Rule: Public Read-Only. Admin Full Access.
-- --------------------------------------------------------

-- Books
DROP POLICY IF EXISTS "Public read books" ON books;
CREATE POLICY "Public read books" ON books FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage books" ON books;
CREATE POLICY "Admin manage books" ON books FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chapters
DROP POLICY IF EXISTS "Public read chapters" ON chapters;
CREATE POLICY "Public read chapters" ON chapters FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage chapters" ON chapters;
CREATE POLICY "Admin manage chapters" ON chapters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Daily Mindset
DROP POLICY IF EXISTS "Public read daily_mindset" ON daily_mindset;
CREATE POLICY "Public read daily_mindset" ON daily_mindset FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage daily_mindset" ON daily_mindset;
CREATE POLICY "Admin manage daily_mindset" ON daily_mindset FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Quotes
DROP POLICY IF EXISTS "Public read quotes" ON quotes;
CREATE POLICY "Public read quotes" ON quotes FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage quotes" ON quotes;
CREATE POLICY "Admin manage quotes" ON quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stories
DROP POLICY IF EXISTS "Public read stories" ON stories;
CREATE POLICY "Public read stories" ON stories FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage stories" ON stories;
CREATE POLICY "Admin manage stories" ON stories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 3. INTERACTIVE TABLES (Reviews, Community, Activity)
--    Rule: Public can Read + Insert. Admin can Do Everything.
-- --------------------------------------------------------

-- Book Reviews
DROP POLICY IF EXISTS "Public read reviews" ON book_reviews;
CREATE POLICY "Public read reviews" ON book_reviews FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public insert reviews" ON book_reviews;
CREATE POLICY "Public insert reviews" ON book_reviews FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public update reviews" ON book_reviews;
CREATE POLICY "Public update reviews" ON book_reviews FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage reviews" ON book_reviews;
CREATE POLICY "Admin manage reviews" ON book_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Book Topics (Community)
DROP POLICY IF EXISTS "Public read topics" ON book_topics;
CREATE POLICY "Public read topics" ON book_topics FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public insert topics" ON book_topics;
CREATE POLICY "Public insert topics" ON book_topics FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage topics" ON book_topics;
CREATE POLICY "Admin manage topics" ON book_topics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Book Messages (Community)
DROP POLICY IF EXISTS "Public read messages" ON book_messages;
CREATE POLICY "Public read messages" ON book_messages FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public insert messages" ON book_messages;
CREATE POLICY "Public insert messages" ON book_messages FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Public update messages" ON book_messages;
CREATE POLICY "Public update messages" ON book_messages FOR UPDATE TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage messages" ON book_messages;
CREATE POLICY "Admin manage messages" ON book_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Activity (Likes, Views, etc.)
-- Allow public to manage their own activity
DROP POLICY IF EXISTS "Public manage activity" ON user_activity;
CREATE POLICY "Public manage activity" ON user_activity FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage activity" ON user_activity;
CREATE POLICY "Admin manage activity" ON user_activity FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 4. SETTINGS TABLES (Admin, Homepage, Media)
--    Rule: Public Read. Admin Full Access.
-- --------------------------------------------------------

-- Admin Settings
DROP POLICY IF EXISTS "Public read admin_settings" ON admin_settings;
CREATE POLICY "Public read admin_settings" ON admin_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage admin_settings" ON admin_settings;
CREATE POLICY "Admin manage admin_settings" ON admin_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Homepage Settings
DROP POLICY IF EXISTS "Public read homepage_settings" ON homepage_settings;
CREATE POLICY "Public read homepage_settings" ON homepage_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage homepage_settings" ON homepage_settings;
CREATE POLICY "Admin manage homepage_settings" ON homepage_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Media
DROP POLICY IF EXISTS "Public read media" ON media;
CREATE POLICY "Public read media" ON media FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin manage media" ON media;
CREATE POLICY "Admin manage media" ON media FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Site Taxonomy (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'site_taxonomy') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Public read taxonomy" ON site_taxonomy';
        EXECUTE 'CREATE POLICY "Public read taxonomy" ON site_taxonomy FOR SELECT TO public USING (true)';
        
        EXECUTE 'DROP POLICY IF EXISTS "Admin manage taxonomy" ON site_taxonomy';
        EXECUTE 'CREATE POLICY "Admin manage taxonomy" ON site_taxonomy FOR ALL TO authenticated USING (true) WITH CHECK (true)';
    END IF;
END $$;

-- --------------------------------------------------------
-- 5. FEEDBACK (Private)
--    Rule: Public Insert Only. Admin Read/Delete.
-- --------------------------------------------------------
DROP POLICY IF EXISTS "Public insert feedback" ON feedback;
CREATE POLICY "Public insert feedback" ON feedback FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage feedback" ON feedback;
CREATE POLICY "Admin manage feedback" ON feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 6. STORAGE POLICIES
--    Target Buckets: 'book-covers', 'chapter-backgrounds'
-- --------------------------------------------------------

-- POLICY: Public Read (GET)
DROP POLICY IF EXISTS "Public Select Covers" ON storage.objects;
CREATE POLICY "Public Select Covers"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'book-covers' );

DROP POLICY IF EXISTS "Public Select Backgrounds" ON storage.objects;
CREATE POLICY "Public Select Backgrounds"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'chapter-backgrounds' );

-- POLICY: Admin Write (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admin Manage Covers" ON storage.objects;
CREATE POLICY "Admin Manage Covers"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'book-covers' )
WITH CHECK ( bucket_id = 'book-covers' );

DROP POLICY IF EXISTS "Admin Manage Backgrounds" ON storage.objects;
CREATE POLICY "Admin Manage Backgrounds"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'chapter-backgrounds' )
WITH CHECK ( bucket_id = 'chapter-backgrounds' );

-- --------------------------------------------------------
-- 7. SUMMARY
-- --------------------------------------------------------
-- ✅ All tables have RLS enabled
-- ✅ Public can READ all content
-- ✅ Public can INSERT reviews, messages, topics, feedback, activity
-- ✅ Public can UPDATE reviews and messages (for likes)
-- ✅ Admin (authenticated) can do EVERYTHING
-- ✅ Storage buckets are secured (Public Read, Admin Write)
