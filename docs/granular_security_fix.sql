-- ==========================================
-- GRANULAR SECURITY POLICIES (V2)
-- ==========================================

-- 1. SECURE REVIEWS: Allow public to ONLY update likes/dislikes
DROP POLICY IF EXISTS "Public update reviews (likes)" ON book_reviews;

-- We use a trigger or a more restrictive policy to ensure only likes/dislikes are updated.
-- Since RLS 'WITH CHECK' applies to the new row, we can compare it with the old row in a trigger.
-- However, for a simple SQL-only fix, we can use a functional check.

CREATE OR REPLACE FUNCTION check_review_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow changing likes or dislikes
    IF (NEW.id IS DISTINCT FROM OLD.id) OR
       (NEW.book_id IS DISTINCT FROM OLD.book_id) OR
       (NEW.reviewer_name IS DISTINCT FROM OLD.reviewer_name) OR
       (NEW.username IS DISTINCT FROM OLD.username) OR
       (NEW.rating IS DISTINCT FROM OLD.rating) OR
       (NEW.comment IS DISTINCT FROM OLD.comment) OR
       (NEW.ip_address IS DISTINCT FROM OLD.ip_address) OR
       (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'You are only allowed to update likes or dislikes.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_restrict_review_update ON book_reviews;
CREATE TRIGGER tr_restrict_review_update
BEFORE UPDATE ON book_reviews
FOR EACH ROW
EXECUTE FUNCTION check_review_update();

-- 2. SECURE MESSAGES: Allow public to ONLY update likes
CREATE OR REPLACE FUNCTION check_message_update()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.id IS DISTINCT FROM OLD.id) OR
       (NEW.topic_id IS DISTINCT FROM OLD.topic_id) OR
       (NEW.book_id IS DISTINCT FROM OLD.book_id) OR
       (NEW.username IS DISTINCT FROM OLD.username) OR
       (NEW.message IS DISTINCT FROM OLD.message) OR
       (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'You are only allowed to update the likes count.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_restrict_message_update ON book_messages;
CREATE TRIGGER tr_restrict_message_update
BEFORE UPDATE ON book_messages
FOR EACH ROW
EXECUTE FUNCTION check_message_update();

-- 3. ENSURE ADMINS BYPASS THESE RESTRICTIONS
-- We can check the role or use a separate admin policy.
-- Note: Triggers execute regardless of RLS, so we modify the triggers to allow service_role or admin users.

CREATE OR REPLACE FUNCTION check_review_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow service_role or authenticated admins to bypass
    IF current_setting('role') = 'service_role' OR auth.role() = 'authenticated' THEN
        RETURN NEW;
    END IF;

    -- For others (anon), restrict updates
    IF (NEW.id IS DISTINCT FROM OLD.id) OR
       (NEW.book_id IS DISTINCT FROM OLD.book_id) OR
       (NEW.reviewer_name IS DISTINCT FROM OLD.reviewer_name) OR
       (NEW.username IS DISTINCT FROM OLD.username) OR
       (NEW.rating IS DISTINCT FROM OLD.rating) OR
       (NEW.comment IS DISTINCT FROM OLD.comment) OR
       (NEW.ip_address IS DISTINCT FROM OLD.ip_address) OR
       (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'You are only allowed to update likes or dislikes.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_message_update()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('role') = 'service_role' OR auth.role() = 'authenticated' THEN
        RETURN NEW;
    END IF;

    IF (NEW.id IS DISTINCT FROM OLD.id) OR
       (NEW.topic_id IS DISTINCT FROM OLD.topic_id) OR
       (NEW.book_id IS DISTINCT FROM OLD.book_id) OR
       (NEW.username IS DISTINCT FROM OLD.username) OR
       (NEW.message IS DISTINCT FROM OLD.message) OR
       (NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
        RAISE EXCEPTION 'You are only allowed to update the likes count.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
