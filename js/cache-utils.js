/**
 * Simple caching utility for Supabase responses and other data
 */
const CacheUtils = {
    /**
     * Store data in localStorage with an expiry
     * @param {string} key 
     * @param {any} data 
     * @param {number} ttl Time to live in milliseconds (default 24h)
     */
    set(key, data, ttl = 24 * 60 * 60 * 1000) {
        const item = {
            value: data,
            expiry: Date.now() + ttl
        };
        localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    },

    /**
     * Retrieve data from localStorage and check for expiry
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        const itemStr = localStorage.getItem(`cache_${key}`);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        if (Date.now() > item.expiry) {
            localStorage.removeItem(`cache_${key}`);
            return null;
        }
        return item.value;
    },

    /**
     * Helper to wrap a Supabase fetch call with caching
     */
    async fetchWithCache(key, fetchFn, ttl) {
        const cached = this.get(key);
        if (cached) return cached;

        const data = await fetchFn();
        if (data !== undefined && data !== null) {
            this.set(key, data, ttl);
        }
        return data;
    },

    /**
     * Proactively fetch and cache data without blocking or returning result
     */
    async prefetchWithCache(key, fetchFn, ttl) {
        // If already in cache (and not expired), skip
        if (this.get(key)) return;

        try {
            const data = await fetchFn();
            if (data !== undefined && data !== null) {
                this.set(key, data, ttl);
                console.log(`[Cache] Prefetched: ${key}`);
            }
        } catch (e) {
            console.warn(`[Cache] Prefetch failed for ${key}`, e);
        }
    },

    /**
     * Clear specific cache or all app caches
     */
    clear(key = null) {
        if (key) {
            localStorage.removeItem(`cache_${key}`);
        } else {
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cache_')) {
                    localStorage.removeItem(k);
                }
            });
        }
    }
};

window.CacheUtils = CacheUtils;
