-- Migration: Create or Update product_links table
-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_recommended BOOLEAN DEFAULT false,
    
    -- New columns (included in create to ensure they exist on fresh run)
    custom_name TEXT,
    product_icon TEXT,
    description TEXT,
    display_mode TEXT DEFAULT 'card', -- card, image, icon, text
    orientation TEXT DEFAULT 'portrait', -- portrait, landscape
    size_category TEXT DEFAULT 'standard', -- standard, compact, large, custom
    custom_width NUMERIC,
    custom_height NUMERIC,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns if table exists but columns do not (Safe Update)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='custom_name') THEN
        ALTER TABLE product_links ADD COLUMN custom_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='product_icon') THEN
        ALTER TABLE product_links ADD COLUMN product_icon TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='description') THEN
        ALTER TABLE product_links ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='display_mode') THEN
        ALTER TABLE product_links ADD COLUMN display_mode TEXT DEFAULT 'card';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='orientation') THEN
        ALTER TABLE product_links ADD COLUMN orientation TEXT DEFAULT 'portrait';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='size_category') THEN
        ALTER TABLE product_links ADD COLUMN size_category TEXT DEFAULT 'standard';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='custom_width') THEN
        ALTER TABLE product_links ADD COLUMN custom_width NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_links' AND column_name='custom_height') THEN
        ALTER TABLE product_links ADD COLUMN custom_height NUMERIC;
    END IF;
    -- Visual Builder Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_links' AND column_name = 'position_data') THEN
        ALTER TABLE product_links ADD COLUMN position_data JSONB DEFAULT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_links' AND column_name = 'page_target') THEN
        ALTER TABLE product_links ADD COLUMN page_target TEXT DEFAULT 'home';
    END IF;
END $$;

-- 3. Security Policies
ALTER TABLE product_links ENABLE ROW LEVEL SECURITY;

-- Create policies (safe if exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_links' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON product_links FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_links' AND policyname = 'Enable insert for authenticated users only') THEN
        CREATE POLICY "Enable insert for authenticated users only" ON product_links FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_links' AND policyname = 'Enable update for authenticated users only') THEN
        CREATE POLICY "Enable update for authenticated users only" ON product_links FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_links' AND policyname = 'Enable delete for authenticated users only') THEN
        CREATE POLICY "Enable delete for authenticated users only" ON product_links FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;
```
