// image-utils.js

/**
 * Global HTML Escaping Utility for XSS Prevention
 */
window.escapeHTML = function (str) {
    if (!str || typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

window.getBustedUrl = function (url, forceBust = false) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;

    // Optimization: Only cache-bust if explicitly requested or for development needs.
    // This allows browser caching to work for images, drastically speeding up content delivery.
    if (!forceBust) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
};

window.getSupabaseImageUrl = function (path, bucket = 'library') {
    if (!path || typeof path !== 'string') return 'assets/logo-new.png';
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return window.getBustedUrl(path);

    // If it's a relative asset path, just return it busted
    if (path.startsWith('assets/')) return window.getBustedUrl(path);

    // Construct Direct Supabase Storage Public URL (Global CDN)
    // Format: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET]/[PATH]
    const projectId = "nlgdthlwmagvjvzrubif";
    const storageBaseUrl = `https://${projectId}.supabase.co/storage/v1/object/public`;

    // Ensure path is properly encoded
    const encodedPath = path.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');

    const finalUrl = `${storageBaseUrl}/${bucket}/${encodedPath}`;

    // Note: We use window.getBustedUrl which by default is FALSE for cache-busting now,
    // ensuring the Edge CDN can effectively cache the image for all users.
    return window.getBustedUrl(finalUrl);
};

/**
 * Parses an HTML string and replaces any Supabase Storage image paths 
 * with robust URLs using getSupabaseImageUrl.
 */
window.fixSupabaseImagesInHtml = function (html) {
    if (!html || typeof html !== 'string') return html;

    // Regular expression to find src attributes that don't already have a full URL
    // This is a simple regex and might need refinement for complex cases
    return html.replace(/src=["']([^"']+)["']/g, (match, path) => {
        // If it looks like a Supabase path (not starting with http, data, blob, or assets)
        if (!path.startsWith('http') && !path.startsWith('data:') && !path.startsWith('blob:') && !path.startsWith('assets/')) {
            return `src="${window.getSupabaseImageUrl(path)}"`;
        }
        return match;
    });
};
