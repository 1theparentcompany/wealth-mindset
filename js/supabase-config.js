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

// --- ACCURATE VISITOR TRACKING ---

window.getVisitorId = function () {
    let vid = localStorage.getItem('site_visitor_id');
    if (!vid || !window.isValidUUID(vid)) {
        vid = crypto.randomUUID();
        localStorage.setItem('site_visitor_id', vid);
    }
    return vid;
};

window.logVisit = async function (metadata = {}) {
    if (!window.supabaseClient) return;

    const vid = window.getVisitorId();
    const ua = navigator.userAgent;
    const path = window.location.pathname;

    // Add page info to metadata
    const enrichedMetadata = {
        ...metadata,
        path: path,
        screen: `${window.screen.width}x${window.screen.height}`,
        device: /Mobile|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop'
    };

    try {
        // 1. Call the accurate visitor RPC
        await window.supabaseClient.rpc('track_visitor', {
            p_visitor_id: vid,
            p_ip_address: 'client-side', // IP is handled by Supabase server usually, but we can pass a placeholder or use a service
            p_user_agent: ua,
            p_metadata: enrichedMetadata
        });

        // 2. Also log to legacy user_activity for real-time log (optional, but keeps existing dashboards working)
        await window.supabaseClient.from('user_activity').insert({
            activity_type: 'page_view',
            page_url: window.location.href,
            metadata: enrichedMetadata
        });
    } catch (e) {
        console.warn("Tracking failed", e);
    }
};

// Auto-log visit on load (with slight delay to ensure scripts are ready)
if (document.readyState === 'complete') {
    window.logVisit();
} else {
    window.addEventListener('load', () => window.logVisit());
}

