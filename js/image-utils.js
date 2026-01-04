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

/**
 * Reusable utility to animate a numeric value in an element
 * @param {HTMLElement|string} element - The element or selector to update
 * @param {number} target - The final value to animate to
 * @param {number} duration - Duration in milliseconds (default: 1500)
 * @param {number} decimals - Number of decimal places to show (default: 0)
 * @param {string} prefix - Optional prefix (e.g. "⭐ ")
 * @param {string} suffix - Optional suffix (e.g. " Chapters")
 * @param {boolean} useCommas - Whether to format with commas (default: true)
 */
window.animateNumber = function (element, target, duration = 1500, decimals = 0, prefix = '', suffix = '', useCommas = true) {
    const el = (typeof element === 'string') ? document.querySelector(element) : element;
    if (!el) return;

    // Try to get starting value from current text
    let currentText = el.textContent.replace(prefix, '').replace(suffix, '').replace(/,/g, '').trim();
    let startValue = parseFloat(currentText) || 0;

    // Handle cases where the target might be a string (like "12.5K")
    let finalTarget = target;
    let multiplier = 1;
    if (typeof target === 'string') {
        if (target.toUpperCase().endsWith('K')) {
            multiplier = 1000;
            finalTarget = parseFloat(target) * multiplier;
        } else if (target.toUpperCase().endsWith('M')) {
            multiplier = 1000000;
            finalTarget = parseFloat(target) * multiplier;
        } else {
            finalTarget = parseFloat(target.replace(/,/g, '')) || 0;
        }
    }

    const startTime = performance.now();

    function format(value) {
        // If we used a multiplier (K/M), convert back for display if decimals are needed or just keep as is
        // But usually, if they pass "12.5K", they want it to end at "12.5K"
        // Here we handle the animation of the numeric part
        let valToDisplay = value;
        if (multiplier > 1) valToDisplay = value / multiplier;

        let formatted = valToDisplay.toFixed(decimals);
        if (useCommas) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            formatted = parts.join('.');
        }

        // Add K/M suffix back if it was there
        let unitSuffix = '';
        if (multiplier === 1000) unitSuffix = 'K';
        else if (multiplier === 1000000) unitSuffix = 'M';

        return prefix + formatted + unitSuffix + suffix;
    }

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out quad
        const easeProgress = progress * (2 - progress);

        const currentValue = startValue + (finalTarget - startValue) * easeProgress;
        el.textContent = format(currentValue);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = format(finalTarget);
        }
    }

    requestAnimationFrame(update);
};
