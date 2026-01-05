
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
    // For 'About' text, we use the specific aboutText, or fallback to description
    if (fullDesc) fullDesc.textContent = detailSettings.aboutText || item.description || '';

    // Author
    if (document.getElementById('detail-author')) document.getElementById('detail-author').textContent = item.author;
    if (document.getElementById('author-name-tab')) document.getElementById('author-name-tab').textContent = item.author;
    if (document.getElementById('author-bio') && detailSettings.authorBio) document.getElementById('author-bio').textContent = detailSettings.authorBio;
    if (document.getElementById('author-avatar') && detailSettings.authorPhoto) document.getElementById('author-avatar').src = resolveImg(detailSettings.authorPhoto);

    // --- STATS LOGIC ---
    // If we have dynamic stats from the Admin Metadata Manager, use them.
    // Otherwise, fall back to the hardcoded ID mapping.
    if (detailSettings.stats && Array.isArray(detailSettings.stats) && detailSettings.stats.length > 0) {
        const statsContainer = document.querySelector('.meta-grid-ref');
        if (statsContainer) {
            statsContainer.innerHTML = ''; // Clear default/hardcoded stats
            detailSettings.stats.forEach(stat => {
                const div = document.createElement('div');
                div.className = 'meta-item';
                div.innerHTML = `<label>${stat.label}</label><span>${stat.value}</span>`;
                statsContainer.appendChild(div);
            });
        }
    } else {
        // Fallback: Populate by ID if they exist (Legacy/Default)
        if (document.getElementById('stat-rating-stars') && detailSettings.rating) document.getElementById('stat-rating-stars').textContent = detailSettings.rating;
        if (document.getElementById('stat-likes-pct') && detailSettings.likes) document.getElementById('stat-likes-pct').textContent = detailSettings.likes;
        if (document.getElementById('stat-reviews-count') && detailSettings.reviews) document.getElementById('stat-reviews-count').textContent = detailSettings.reviews;
        if (document.getElementById('stat-chapters-count') && detailSettings.chapters) document.getElementById('stat-chapters-count').textContent = detailSettings.chapters;
        if (document.getElementById('stat-license') && detailSettings.license) document.getElementById('stat-license').textContent = detailSettings.license;
        if (document.getElementById('stat-lang') && detailSettings.language) document.getElementById('stat-lang').textContent = detailSettings.language;
        if (document.getElementById('stat-release') && detailSettings.release) document.getElementById('stat-release').textContent = detailSettings.release;
    }

    // Updated Hero Stats (These are outside the main grid, keep them updated if keys exist)
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

    // --- DYNAMIC SECTIONS FOR ALL TABS ---
    if (detailSettings.tabContent) {
        Object.keys(detailSettings.tabContent).forEach(tabName => {
            const sections = detailSettings.tabContent[tabName];
            if (!sections || !sections.length) return;

            // Resolve Tab ID from Name
            let targetTabId = '';
            const lowerName = tabName.toLowerCase();

            // 1. Try Standard Mapping
            if (lowerName === 'about') targetTabId = 'tab-about';
            else if (lowerName.includes('chapter')) targetTabId = 'tab-chapters';
            else if (lowerName.includes('review')) targetTabId = 'tab-reviews';
            else if (lowerName.includes('author')) targetTabId = 'tab-author';
            else if (lowerName.includes('community')) targetTabId = 'tab-community';

            // 2. If not standard, try to find a custom tab container match
            // Custom tabs usually have IDs like 'custom-tab-0', 'custom-tab-1', etc.
            // But we only have the Name here.
            // We need to find the DOM element that corresponds to this name.
            if (!targetTabId) {
                // If the user created a custom tab, renderCustomTabs should have created it.
                // We might need to look up the tabs array to find the index.
                if (detailSettings.tabs) {
                    const tabIndex = detailSettings.tabs.findIndex(t => t.name.replace(/^[^\w]+/, '').trim() === tabName || t.name === tabName);
                    if (tabIndex !== -1) {
                        targetTabId = 'custom-tab-' + tabIndex;
                    }
                }
            }

            const tabEl = document.getElementById(targetTabId);
            if (tabEl) {
                // Remove previous dynamic sections to prevent duplicates
                tabEl.querySelectorAll('.dynamic-section').forEach(el => el.remove());

                // Determine insertion point
                // For 'About', before 'Synopsis'. For others, typically at the end or before a footer.
                let insertionPoint = null;
                if (targetTabId === 'tab-about') {
                    const aboutHeaders = Array.from(tabEl.querySelectorAll('h3'));
                    insertionPoint = aboutHeaders.find(h => h.textContent.includes('Synopsis'));
                } else if (targetTabId === 'tab-chapters') {
                    // Maybe before the list?
                    insertionPoint = document.getElementById('chapters-list-container');
                }

                // If no specific insertion point found, just append
                const parent = insertionPoint ? insertionPoint.parentNode : tabEl;
                const referenceNode = insertionPoint;

                sections.forEach(sec => {
                    const secDiv = document.createElement('div');
                    secDiv.className = 'dynamic-section'; // Generic class
                    secDiv.style.marginBottom = '30px';
                    secDiv.innerHTML = `
                        <h3 class="section-title">${sec.title}</h3>
                        <div style="color: #aaa; line-height: 1.7; white-space: pre-wrap; margin-bottom: 20px;">${sec.content}</div>
                        <div class="divider-line" style="margin: 30px 0;"></div>
                    `;

                    if (referenceNode) {
                        parent.insertBefore(secDiv, referenceNode);
                    } else {
                        parent.appendChild(secDiv);
                    }
                });
            }
        });
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
}
