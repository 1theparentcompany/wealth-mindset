// supabase-config.js

const SUPABASE_URL = "https://nlgdthlwmagvjvzrubif.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2R0aGx3bWFndmp2enJ1YmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNjY2MDUsImV4cCI6MjA4Mjc0MjYwNX0.AtgDFTPUubrZmkdH4CPNQHTgSo0DkdvCrQa9LgiV4Ng";

let supabaseClient = null;

function isSupabaseConfigured() {
    return (
        SUPABASE_URL &&
        SUPABASE_ANON_KEY &&
        SUPABASE_URL.includes("supabase.co")
    );
}

if (isSupabaseConfigured() && window.supabase) {
    try {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true  // Always persist sessions for both admin and contact pages
                },
                global: {
                    fetch: (url, options) => {
                        return fetch(url, { ...options, cache: 'no-store' });
                    }
                }
            }
        );
    } catch (error) {
        // Silent failure in production or use a dedicated logger
    }
} else {
    // Fallback mode
}

// Map the client back to 'supabase' window global if needed for other scripts, 
// but we'll use supabaseClient to avoid 'already declared' errors.
window.supabaseClient = supabaseClient;

// Global helper to check for valid UUID (prevents 400 errors for legacy numeric IDs)
window.isValidUUID = function (uuid) {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
