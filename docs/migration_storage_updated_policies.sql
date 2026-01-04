-- ==========================================
-- UPDATED STORAGE POLICIES FOR NEW BUCKETS
-- ==========================================
-- Run this in Supabase SQL Editor to secure 'slider', 'banners', and 'image' buckets

-- --------------------------------------------------------
-- 1. PUBLIC READ POLICIES (GET)
-- --------------------------------------------------------

-- Slider Bucket
DROP POLICY IF EXISTS "Public Select Slider" ON storage.objects;
CREATE POLICY "Public Select Slider"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'slider' );

-- Banners Bucket
DROP POLICY IF EXISTS "Public Select Banners" ON storage.objects;
CREATE POLICY "Public Select Banners"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'banners' );

-- Generic Image Bucket
DROP POLICY IF EXISTS "Public Select Image" ON storage.objects;
CREATE POLICY "Public Select Image"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'image' );

-- --------------------------------------------------------
-- 2. ADMIN MANAGE POLICIES (INSERT/UPDATE/DELETE)
-- --------------------------------------------------------

-- Slider Bucket
DROP POLICY IF EXISTS "Admin Manage Slider" ON storage.objects;
CREATE POLICY "Admin Manage Slider"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'slider' )
WITH CHECK ( bucket_id = 'slider' );

-- Banners Bucket
DROP POLICY IF EXISTS "Admin Manage Banners" ON storage.objects;
CREATE POLICY "Admin Manage Banners"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'banners' )
WITH CHECK ( bucket_id = 'banners' );

-- Generic Image Bucket
DROP POLICY IF EXISTS "Admin Manage Image" ON storage.objects;
CREATE POLICY "Admin Manage Image"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'image' )
WITH CHECK ( bucket_id = 'image' );

-- --------------------------------------------------------
-- ✅ Done: Slider, Banners, and Image buckets are now secured.
-- --------------------------------------------------------
