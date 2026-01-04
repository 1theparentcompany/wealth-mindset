-- Verify and check book_reviews table structure
-- Run this to see what columns actually exist in your database

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'book_reviews'
ORDER BY ordinal_position;
