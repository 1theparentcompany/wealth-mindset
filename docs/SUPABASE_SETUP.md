# Supabase Database Setup

Copy and paste the following SQL into your Supabase SQL Editor to create the necessary tables for your project.

## 1. Library Table
```sql
CREATE TABLE IF NOT EXISTS site_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id TEXT UNIQUE NOT NULL, -- e.g., 'wm-guide'
    title TEXT NOT NULL,
    author TEXT,
    type TEXT NOT NULL, -- book, story, guide, laws, etc.
    genre TEXT,
    description TEXT,
    cover_image TEXT,
    chapters JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 2. Taxonomy Table
```sql
CREATE TABLE IF NOT EXISTS site_taxonomy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name TEXT UNIQUE NOT NULL, -- e.g., 'book', 'story'
    icon TEXT,
    genres JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 3. Site Settings Table
```sql
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial settings insert
INSERT INTO site_settings (key, value)
VALUES ('global_settings', '{"adsEnabled": true, "theme": "dark"}')
ON CONFLICT (key) DO NOTHING;
```

## 4. Homepage Configuration
```sql
CREATE TABLE IF NOT EXISTS homepage_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_name TEXT UNIQUE NOT NULL, -- 'exclusive', 'popular', 'stories', 'tips', 'topics'
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 5. Feedback Table
```sql
CREATE TABLE IF NOT EXISTS site_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT,
    message TEXT,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 6. Image Management
```sql
CREATE TABLE IF NOT EXISTS site_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL, -- 'carousel', 'bottom', 'cover', 'background'
    url TEXT NOT NULL,
    title TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## 7. Analytics (Basic)
```sql
CREATE TABLE IF NOT EXISTS site_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT,
    path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

## Enable Row Level Security (RLS) - Recommended
For a production app, you should enable RLS and set policies. For now, you can leave it disabled for development, but eventually, you should restrict write access to authenticated admin users only.
