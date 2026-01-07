
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
            // Trigger related books display
            if (typeof loadRecommendedBooks === 'function') {
                loadRecommendedBooks(bookData);
            }
            // Initialize interaction status (likes, dislikes, etc.) after rendering
            if (typeof checkInteractionStatus === 'function') {
                await checkInteractionStatus(bookData.id);
            }
            if (typeof fetchLiveStats === 'function') {
                await fetchLiveStats(bookData.id);
            }
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

                // --- DYNAMIC OVERRIDE ---
                // If the label matches a CORE property, we pull the LIVE value from 'item'
                // This prevents the 'fixed at some number' problem when data changes.
                // FIX: Only overwrite if LIVE data is valid (non-zero). Otherwise respect the manual 'stat.value'.
                let displayVal = stat.value;
                const lowerLabel = stat.label.toLowerCase();

                if (lowerLabel.includes('chapter') || lowerLabel.includes('content length')) {
                    // Allow rendering but ensured ID assignment below
                }

                if (lowerLabel.includes('rating')) {
                    const liveRating = item.rating;
                    if (liveRating && liveRating !== '0.0' && liveRating !== '0') {
                        displayVal = `⭐ ${liveRating} / 5.0`;
                    }
                } else if (lowerLabel.includes('likes') || lowerLabel.includes('score')) {
                    const liveLikes = item.likes_percent;
                    if (liveLikes && liveLikes !== '0') {
                        displayVal = `👍 ${liveLikes}% Liked`;
                    }
                } else if (lowerLabel.includes('review')) {
                    const liveReviews = item.reviews_count;
                    if (liveReviews && liveReviews !== '0') {
                        displayVal = `💬 ${liveReviews} Reviews`;
                    }
                }

                // Ensure displayVal isn't empty if manual value was empty
                displayVal = (displayVal !== undefined && displayVal !== null && displayVal !== '') ? displayVal : '0';

                // ID assignment for Live Updates (Crucial fix for FOUC/Zeroing)
                let spanId = '';
                if (lowerLabel.includes('rating')) spanId = 'stat-rating-stars';
                else if (lowerLabel.includes('likes') || lowerLabel.includes('score')) spanId = 'stat-likes-pct';
                else if (lowerLabel.includes('review')) spanId = 'stat-reviews-count';
                else if (lowerLabel.includes('chapter') || lowerLabel.includes('content length')) spanId = 'stat-chapters-count';

                div.innerHTML = `<label>${stat.label}</label><span${spanId ? ` id="${spanId}"` : ''}>${displayVal}</span>`;
                statsContainer.appendChild(div);
            });
        }
    } else {
        // Fallback: Populate by ID if they exist (Legacy/Default)
        // FIX: Prefer live data only if non-zero, otherwise use metadata
        const statRatingEl = document.getElementById('stat-rating-stars');
        if (statRatingEl) {
            const liveRating = item.rating;
            if (liveRating && liveRating !== '0.0' && liveRating !== '0') {
                statRatingEl.textContent = `⭐ ${liveRating} / 5.0`;
            } else {
                // Fallback to metadata
                let metaRating = detailSettings.rating;
                if (!metaRating && detailSettings.stats) {
                    const st = detailSettings.stats.find(s => s.label.toLowerCase().includes('rating'));
                    if (st) metaRating = st.value;
                }
                statRatingEl.textContent = metaRating || '⭐ 0.0 / 5.0';
            }
        }

        const statLikesEl = document.getElementById('stat-likes-pct');
        if (statLikesEl) {
            const liveLikes = item.likes_percent;
            if (liveLikes && liveLikes !== '0') {
                statLikesEl.textContent = `👍 ${liveLikes}% Liked`;
            } else {
                let metaLikes = detailSettings.likes;
                if (!metaLikes && detailSettings.stats) {
                    const st = detailSettings.stats.find(s => s.label.toLowerCase().includes('likes') || s.label.toLowerCase().includes('score'));
                    if (st) metaLikes = st.value;
                }
                statLikesEl.textContent = metaLikes || '👍 0% Liked';
            }
        }

        const statReviewsEl = document.getElementById('stat-reviews-count');
        if (statReviewsEl) {
            const liveReviews = item.reviews_count;
            if (liveReviews && liveReviews !== '0') {
                statReviewsEl.textContent = `💬 ${liveReviews} Reviews`;
            } else {
                let metaReviews = detailSettings.reviews;
                if (!metaReviews && detailSettings.stats) {
                    const st = detailSettings.stats.find(s => s.label.toLowerCase().includes('review'));
                    if (st) metaReviews = st.value;
                }
                statReviewsEl.textContent = metaReviews || '💬 0 Reviews';
            }
        }
    }

    // Non-dynamic fields - always use metadata
    // Author
    if (document.getElementById('detail-author')) document.getElementById('detail-author').textContent = item.author;
    if (document.getElementById('author-name-tab')) document.getElementById('author-name-tab').textContent = item.author;
    if (document.getElementById('author-tagline')) document.getElementById('author-tagline').textContent = detailSettings.authorTitle || item.category || 'Wealth & Mindset Author';
    if (document.getElementById('author-bio') && detailSettings.authorBio) document.getElementById('author-bio').textContent = detailSettings.authorBio;
    if (document.getElementById('author-avatar') && detailSettings.authorPhoto) document.getElementById('author-avatar').src = resolveImg(detailSettings.authorPhoto);

    if (document.getElementById('stat-license')) document.getElementById('stat-license').textContent = detailSettings.license || 'Wealth & Mindset Press';
    if (document.getElementById('stat-lang')) document.getElementById('stat-lang').textContent = detailSettings.language || 'English';
    if (document.getElementById('stat-release')) document.getElementById('stat-release').textContent = detailSettings.release || '--';

    // Hero Stats overrides (Top of page - Big numbers)
    if (document.getElementById('detail-rating-pct')) {
        const liveLikes = item.likes_percent;
        let displayLikes = '0';
        if (liveLikes && liveLikes !== '0') {
            displayLikes = liveLikes;
        } else {
            let metaLikes = detailSettings.likes;
            if (!metaLikes && detailSettings.stats) {
                const st = detailSettings.stats.find(s => s.label.toLowerCase().includes('likes') || s.label.toLowerCase().includes('score'));
                if (st) metaLikes = st.value;
            }
            if (metaLikes) {
                displayLikes = metaLikes.replace(/[^\d]/g, '') || '0';
            }
        }
        document.getElementById('detail-rating-pct').textContent = displayLikes;
    }
    if (document.getElementById('detail-rating-count')) {
        let count = item.reviews_count || '0';
        if (!count || count === '0') {
            let metaReviews = detailSettings.reviews;
            if (!metaReviews && detailSettings.stats) {
                const st = detailSettings.stats.find(s => s.label.toLowerCase().includes('review'));
                if (st) metaReviews = st.value;
            }
            if (metaReviews) {
                count = metaReviews.replace(/[^\d]/g, '') || '0';
            }
        }
        document.getElementById('detail-rating-count').textContent = count + ' >';
    }
    if (document.getElementById('detail-chapters-count-hero')) {
        const liveCount = item.chapters_count || (Array.isArray(item.chapters) ? item.chapters.length : 0);
        let displayCount = liveCount;
        if (!liveCount || liveCount === 0) {
            let metaChapters = detailSettings.chapters;
            if (!metaChapters && detailSettings.stats) {
                const st = detailSettings.stats.find(s => s.label.toLowerCase().includes('chapter') || s.label.toLowerCase().includes('content length'));
                if (st) metaChapters = st.value;
            }
            if (metaChapters) {
                const match = metaChapters.match(/\d+/);
                displayCount = match ? match[0] : '0';
            }
        }
        document.getElementById('detail-chapters-count-hero').textContent = displayCount;
    }


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
            const lowerName = tabName.toLowerCase().trim();

            // 1. Try Standard Mapping
            if (lowerName === 'about' || lowerName === 'overview') targetTabId = 'tab-about';
            else if (lowerName.includes('chapter')) targetTabId = 'tab-chapters';
            else if (lowerName.includes('review')) targetTabId = 'tab-reviews';
            else if (lowerName.includes('author')) targetTabId = 'tab-author';
            else if (lowerName.includes('community')) targetTabId = 'tab-community';

            // 2. If not standard, try to find a custom tab container match
            // Custom tabs usually have IDs like 'custom-tab-0', 'custom-tab-1', etc.
            // But we only have the Name here.
            // We need to find the DOM element that corresponds to this name.
            if (!targetTabId && detailSettings.tabs) {
                const tabIndex = detailSettings.tabs.findIndex(t =>
                    t.name.toLowerCase().trim() === lowerName ||
                    t.name.replace(/^[^\w]+/, '').toLowerCase().trim() === lowerName
                );
                if (tabIndex !== -1) {
                    targetTabId = 'custom-tab-' + tabIndex;
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

// --- Live Stats Implementation (Antigravity Fix) ---
window.fetchLiveStats = async function (bookId) {
    if (typeof supabaseClient === 'undefined') return;

    try {
        console.log("Fetching live stats for:", bookId);

        // 1. Resolve UUID if needed (Robust Lookup)
        let resolvedUuid = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);

        if (isUuid) {
            resolvedUuid = bookId;
        } else {
            // Try ID lookup first
            const { data: bData } = await supabaseClient.from('books').select('id').eq('id', bookId).maybeSingle();
            if (bData) {
                resolvedUuid = bData.id;
            } else {
                // Try Title lookup
                const titleEl = document.getElementById('detail-title');
                const title = titleEl ? titleEl.textContent : null;
                if (title) {
                    const { data: bData2 } = await supabaseClient.from('books').select('id').eq('title', title).maybeSingle();
                    if (bData2) resolvedUuid = bData2.id;
                }
            }
        }

        const searchIds = [bookId];
        if (resolvedUuid && resolvedUuid !== bookId) searchIds.push(resolvedUuid);

        // 2. Fetch Aggregated Counts
        // Likes/Dislikes from user_activity
        const activityPromise = supabaseClient
            .from('user_activity')
            .select('activity_type')
            .in('metadata->>book_id', searchIds)
            .in('activity_type', ['like_book', 'dislike_book', 'like_chapter', 'helpful_review']);

        // Reviews & Ratings
        let reviewsPromise = Promise.resolve({ data: [], count: 0 });
        if (resolvedUuid) {
            reviewsPromise = supabaseClient
                .from('book_reviews')
                .select('rating, likes', { count: 'exact' }) // Select rating for average calc
                .eq('book_id', resolvedUuid);
        }

        // Community Messages (Comments)
        let messagesPromise = Promise.resolve({ data: [], count: 0 });
        if (resolvedUuid) {
            messagesPromise = supabaseClient
                .from('book_messages')
                .select('likes_count', { count: 'exact' })
                .eq('book_id', resolvedUuid);
        }

        // Chapters Count
        let chaptersPromise = Promise.resolve({ count: 0 });
        if (resolvedUuid) {
            chaptersPromise = supabaseClient
                .from('chapters')
                .select('id', { count: 'exact', head: true })
                .eq('book_id', resolvedUuid);
        }

        const [activityRes, reviewsRes, messagesRes, chaptersRes] = await Promise.all([
            activityPromise,
            reviewsPromise,
            messagesPromise,
            chaptersPromise
        ]);

        // A. Calculate TOTAL LIKES
        const globalData = activityRes.data || [];
        const bookLikes = globalData.filter(a => a.activity_type === 'like_book').length;
        const chapterLikes = globalData.filter(a => a.activity_type === 'like_chapter').length;
        const reviewInteractionLikes = globalData.filter(a => a.activity_type === 'helpful_review').length;

        let reviewBaseLikes = 0;
        if (reviewsRes.data) reviewBaseLikes = reviewsRes.data.reduce((sum, r) => sum + (r.likes || 0), 0);

        let communityLikes = 0;
        if (messagesRes.data) communityLikes = messagesRes.data.reduce((sum, m) => sum + (m.likes_count || 0), 0);

        const totalLikes = bookLikes + chapterLikes + reviewInteractionLikes + reviewBaseLikes + communityLikes;
        const totalDislikes = globalData.filter(a => a.activity_type === 'dislike_book').length;

        // Calculate Percentage
        let likePct = 0;
        if (totalLikes + totalDislikes > 0) {
            likePct = Math.round((totalLikes / (totalLikes + totalDislikes)) * 100);
        } else {
            // Fallback if no interactions yet: check if we have pure likes but no dislikes recorded
            if (totalLikes > 0) likePct = 100;
        }

        // B. Calculate TOTAL REVIEWS/COMMENTS
        const reviewCount = reviewsRes.count || 0;
        const messageCount = messagesRes.count || 0;
        const totalReviews = reviewCount + messageCount;

        // C. Calculate AVERAGE RATING
        let avgRating = 0;
        if (reviewsRes.data && reviewsRes.data.length > 0) {
            const sumRating = reviewsRes.data.reduce((sum, r) => sum + (r.rating || 0), 0);
            avgRating = (sumRating / reviewsRes.data.length).toFixed(1);
        }

        // D. Chapters
        const totalChapters = chaptersRes.count || 0;


        // --- UPDATE UI ---

        // 1. Likes / Community Score
        const statLikesEl = document.getElementById('stat-likes-pct');
        if (statLikesEl) {
            // If we have actual data, use it. Otherwise, keep the fallback/metadata value.
            if (totalLikes > 0 || totalDislikes > 0) {
                statLikesEl.textContent = `👍 ${likePct}% Liked`;
            }
        }

        // Hero Badge
        const detailRatingPct = document.getElementById('detail-rating-pct');
        if (detailRatingPct && (totalLikes > 0 || totalDislikes > 0)) {
            detailRatingPct.textContent = `${likePct}%`;
        }


        // 2. Reviews
        const statReviewsEl = document.getElementById('stat-reviews-count');
        if (statReviewsEl) {
            if (reviewCount > 0) {
                statReviewsEl.textContent = `💬 ${reviewCount} verified reviews`;
            } else if (totalReviews > 0) { // If only messages/comments exist
                statReviewsEl.textContent = `💬 ${totalReviews} Reviews`;
            }
        }

        // 3. Average Rating
        const statRatingEl = document.getElementById('stat-rating-stars');
        if (statRatingEl && avgRating > 0) {
            statRatingEl.textContent = `⭐ ${avgRating} / 5.0`;
        }

        // 4. Chapters Count (Hero & About)
        // Hero
        const heroChapters = document.getElementById('detail-chapters-count-hero');
        if (heroChapters && totalChapters > 0) {
            heroChapters.textContent = totalChapters;
        }

        // About Tab Badge (if exists, sometimes it's mapped to ID 'stat-chapters-count')
        const statChapters = document.getElementById('stat-chapters-count');
        if (statChapters) {
            statChapters.textContent = `${totalChapters} Chapters`;
        }

        console.log("Live Stats Updated: Likes", totalLikes, "Reviews", reviewCount, "Rating", avgRating, "Chapters", totalChapters);

    } catch (e) {
        console.error("Error fetching live stats:", e);
    }
};
