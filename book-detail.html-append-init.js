
// --- Cloud-First Initialization Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    // Helper to resolve Supabase Image URL
    function getImageUrl(path) {
        if (!path) return 'assets/logo-new.png';
        if (path.startsWith('http')) return path;
        return `https://[SUPABASE_PROJECT_ID].supabase.co/storage/v1/object/public/book-covers/${path}`;
    }

    // Ensure we have the correct project ID if getSupabaseImageUrl is available
    const resolveImg = (typeof window.getSupabaseImageUrl === 'function') ? window.getSupabaseImageUrl : getImageUrl;

    async function fetchAndRenderBook() {
        let bookData = null;

        // 1. Try Supabase
        if (typeof supabaseClient !== 'undefined') {
            try {
                // Check if ID is UUID
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                let query = supabaseClient.from('books').select('*');

                if (isUuid) {
                    query = query.eq('id', id);
                } else {
                    // Try ID column first, assuming it might store slug/legacy ID
                    query = query.eq('id', id);
                }

                const { data, error } = await query.maybeSingle();

                if (data && !error) {
                    bookData = data;
                    // Normalize naming
                    bookData.image = bookData.cover_image;
                    bookData.detailSettings = bookData.detail_settings;
                    console.log('Loaded book from Cloud:', bookData.title);
                }
            } catch (e) {
                console.warn('Cloud fetch failed:', e);
            }
        }

        // 2. Fallback to LocalStorage
        if (!bookData) {
            const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
            bookData = library.find(b => b.id === id);
            if (bookData) console.log('Loaded book from LocalStorage:', bookData.title);
        }

        // 3. Render
        if (bookData) {
            renderBookUI(bookData, resolveImg);
        }
    }

    // Trigger fetch
    await fetchAndRenderBook();
});

function renderBookUI(item, resolveImg) {
    const detailSettings = item.detailSettings || {};

    // Title & Meta
    const titleEl = document.getElementById('detail-title');
    if (titleEl) titleEl.textContent = item.title;

    // Cover
    const coverEl = document.getElementById('detail-cover');
    if (coverEl) coverEl.src = resolveImg(item.image);

    const heroCoverEl = document.getElementById('hero-cover');
    if (heroCoverEl) heroCoverEl.src = resolveImg(item.image);

    // Description
    const shortDesc = document.getElementById('detail-description-short');
    if (shortDesc) shortDesc.textContent = item.description || '';
    const fullDesc = document.getElementById('detail-description-details');
    if (fullDesc) fullDesc.textContent = detailSettings.aboutText || item.description || '';

    // Author
    if (document.getElementById('detail-author')) document.getElementById('detail-author').textContent = item.author;
    if (document.getElementById('author-name-tab')) document.getElementById('author-name-tab').textContent = item.author;
    if (document.getElementById('author-bio') && detailSettings.authorBio) document.getElementById('author-bio').textContent = detailSettings.authorBio;
    if (document.getElementById('author-avatar') && detailSettings.authorPhoto) document.getElementById('author-avatar').src = resolveImg(detailSettings.authorPhoto);

    // Stats
    if (document.getElementById('stat-rating-stars') && detailSettings.rating) document.getElementById('stat-rating-stars').textContent = detailSettings.rating;
    if (document.getElementById('stat-likes-pct') && detailSettings.likes) document.getElementById('stat-likes-pct').textContent = detailSettings.likes;
    if (document.getElementById('stat-reviews-count') && detailSettings.reviews) document.getElementById('stat-reviews-count').textContent = detailSettings.reviews;
    if (document.getElementById('stat-chapters-count') && detailSettings.chapters) document.getElementById('stat-chapters-count').textContent = detailSettings.chapters;
    if (document.getElementById('stat-license') && detailSettings.license) document.getElementById('stat-license').textContent = detailSettings.license;
    if (document.getElementById('stat-lang') && detailSettings.language) document.getElementById('stat-lang').textContent = detailSettings.language;
    if (document.getElementById('stat-release') && detailSettings.release) document.getElementById('stat-release').textContent = detailSettings.release;

    // Updated Hero Stats
    if (document.getElementById('detail-rating-pct') && detailSettings.likes) document.getElementById('detail-rating-pct').textContent = detailSettings.likes;
    if (document.getElementById('detail-rating-count') && detailSettings.reviews) document.getElementById('detail-rating-count').textContent = detailSettings.reviews + ' >';


    // Gradient Background
    if (detailSettings.gradientStart && detailSettings.gradientEnd) {
        const heroEl = document.querySelector('.detail-hero-ref');
        if (heroEl) {
            heroEl.style.backgroundImage = `
                         linear-gradient(to right, ${detailSettings.gradientStart}cc, ${detailSettings.gradientEnd}cc),
                         url('https://wallpapers.com/images/hd/dark-gradient-background-1920-x-1080-87-l12a781.jpg')
                     `;
        }
    }

    // Buttons Color
    if (detailSettings.buttonColor) {
        document.querySelectorAll('.btn-start-reading').forEach(btn => {
            btn.style.background = detailSettings.buttonColor;
        });
    }

    // Tabs
    if (typeof renderCustomTabs === 'function' && detailSettings.tabs && Array.isArray(detailSettings.tabs)) {
        renderCustomTabs(detailSettings.tabs, item);
    }

    // Custom CSS/JS
    if (detailSettings.customCss) {
        let styleEl = document.getElementById('dynamic-custom-styles');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-custom-styles';
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = detailSettings.customCss;
    }
    // Be careful with eval customJs on load, maybe skip for security or restrict
}
