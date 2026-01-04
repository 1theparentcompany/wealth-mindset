-- Add columns to support "One Book = One Language" model
-- 1. original_book_id: Links a translated book back to its source (parent)
-- 2. language: Specifies the language of this book entry (e.g. 'en', 'es')

ALTER TABLE books 
ADD COLUMN IF NOT EXISTS original_book_id UUID REFERENCES books(id),
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Index for faster lookups of related books
CREATE INDEX IF NOT EXISTS idx_books_original_book_id ON books(original_book_id);
