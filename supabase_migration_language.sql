-- Add multi-language support columns to books table

ALTER TABLE books
ADD COLUMN original_book_id UUID REFERENCES books(id),
ADD COLUMN language TEXT DEFAULT 'en';

COMMENT ON COLUMN books.original_book_id IS 'Links to the original book entry for translations';
COMMENT ON COLUMN books.language IS 'Language code (e.g., en, hi, es)';
