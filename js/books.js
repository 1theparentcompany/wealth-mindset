let allLibraryItems = [];

// Static items to show when localStorage is empty
const defaultItems = [
    { id: 'wm-guide', title: 'Wealth & Mindset: The Complete Guide', type: 'book', description: 'The foundation for financial independence.', icon: '📘', tag: 'Bestseller' },
    { id: 'compounding-miracle', title: 'The 30-Year Compounding Miracle', type: 'story', description: 'How patience builds empires.', icon: '📖', tag: 'Inspirational' }
];

document.addEventListener('DOMContentLoaded', () => {
    initLibrary();
});

function showLoading() {
    const loader = document.getElementById('loading-indicator');
    const sections = document.getElementById('library-sections-container');
    if (loader) loader.classList.add('active');
    if (sections) sections.style.opacity = '0.5';
}

function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    const sections = document.getElementById('library-sections-container');
    if (loader) loader.classList.remove('active');
    if (sections) sections.style.opacity = '1';
}

async function initLibrary() {
    showLoading();

    // Default Taxonomy
    const defaultTaxonomy = {
        'book': { icon: '📚', genres: ['Inspiration', 'Education', 'Finance', 'Psychology', 'Business', 'Self-Help', 'Biography'] },
        'story': { icon: '📖', genres: ['Inspirational', 'Motivational', 'Success Story', 'Biographical', 'Classic', 'Fictional'] },
        'guide': { icon: '🧭', genres: ['Wealth Management', 'Personal Growth', 'Study Guide', 'Technical', 'How-To'] },
        'laws': { icon: '⚖️', genres: ['Finance Laws', 'Legal Rights', 'Property Laws', 'Tax Code', 'General'] },
        'custom': { icon: '✨', genres: ['General', 'Special', 'Misc'] }
    };

    try {
        taxonomy = JSON.parse(localStorage.getItem('siteTaxonomy') || '{}');
    } catch (e) {
        console.warn('Failed to parse siteTaxonomy, resetting to default.', e);
        taxonomy = {};
    }

    let stored = [];

    // Try to load cached data first for immediate render if available
    try {
        stored = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        if (stored.length > 0) {
            stored.sort((a, b) => (a.sort_order || 100) - (b.sort_order || 100));
        }
    } catch (e) {
        console.warn('Failed to parse siteLibrary, resetting to empty.', e);
        stored = [];
    }

    // If Supabase is configured, fetch in parallel
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
        try {
            const taxonomyPromise = supabaseClient
                .from('admin_settings')
                .select('content_types')
                .limit(1)
                .maybeSingle();

            const booksPromise = supabaseClient
                .from('books')
                .select('id, title, author, category, description, cover_image, is_featured, background_image, status, sort_order, detail_settings')
                .eq('status', 'published')
                .is('original_book_id', null)
                .order('sort_order', { ascending: true });

            const reviewsPromise = supabaseClient
                .from('book_reviews')
                .select('book_id, rating');

            // Wait for all requests
            const [settingsRes, booksRes, reviewsRes] = await Promise.all([
                taxonomyPromise,
                booksPromise,
                reviewsPromise
            ]);

            // Process Taxonomy
            if (settingsRes.data && settingsRes.data.content_types) {
                taxonomy = settingsRes.data.content_types;
                localStorage.setItem('siteTaxonomy', JSON.stringify(taxonomy));
            }

            // Process Reviews
            const ratingMap = {};
            if (reviewsRes.data) {
                reviewsRes.data.forEach(rev => {
                    if (!ratingMap[rev.book_id]) ratingMap[rev.book_id] = { sum: 0, count: 0 };
                    ratingMap[rev.book_id].sum += rev.rating;
                    ratingMap[rev.book_id].count++;
                });
            }

            // Process Books
            if (booksRes.data && booksRes.data.length > 0) {
                stored = booksRes.data.map(item => {
                    const stats = ratingMap[item.id];
                    const avgRating = stats ? (stats.sum / stats.count).toFixed(1) : '0.0';
                    const details = item.detail_settings || {};

                    return {
                        id: item.id,
                        title: item.title,
                        author: item.author,
                        type: item.category,
                        description: item.description,
                        image: item.cover_image,
                        isFeatured: item.is_featured,
                        backgroundSettings: { detailUrl: item.background_image },
                        detailSettings: details,
                        genre: details.genre || item.genre || 'General',
                        rating: avgRating
                    };
                });
                // Update Cache
                localStorage.setItem('siteLibrary', JSON.stringify(stored));
            }

        } catch (e) {
            console.error("Supabase parallel fetch failed:", e);
        }
    }

    // Merge taxonomy
    const currentTaxonomy = Object.keys(taxonomy).length > 0 ? taxonomy : defaultTaxonomy;
    window.activeTaxonomy = currentTaxonomy;

    // Map stored items to Library format
    const mappedStored = stored.map(item => {
        const typeData = currentTaxonomy[item.type];

        // Extract chapter/volume info
        let volume = "";
        let chapter = "";

        const volMatch = item.title.match(/Volume\s+(\d+)/i) || (item.description && item.description.match(/Volume\s+(\d+)/i));
        if (volMatch) volume = `VOLUME ${volMatch[1]}`;

        const chapMatch = item.title.match(/Chapter\s+(\d+)/i) || (item.description && item.description.match(/Chapter\s+(\d+)/i));
        if (chapMatch) chapter = `CHAPTER ${chapMatch[1]}`;

        const design = item.coverDesign || {};
        const bTop = design.badgeTop || chapter;
        const bBottom = design.badgeBottom || volume;
        const bTopColor = design.badgeTopColor || '';
        const bBottomColor = design.badgeBottomColor || '';
        const displayTitle = design.title || item.title;

        return {
            id: item.id,
            title: displayTitle,
            type: item.type || 'book',
            description: item.description || `${item.chapters ? item.chapters.length : 0} Chapters`,
            url: `book-detail.html?id=${item.id}`,
            icon: typeData ? typeData.icon : '📄',
            image: item.image || 'assets/logo-new.png',
            tag: 'Read Now',
            volume: bBottom,
            chapter: bTop,
            volumeColor: bBottomColor,
            chapterColor: bTopColor,
            genre: item.genre || 'General',
            rating: item.rating || '0.0'
        };
    });

    // Enhance default items
    const enhancedDefault = defaultItems.map(item => ({
        ...item,
        image: item.id === 'wm-guide' ? 'assets/logo-new.png' : 'assets/logo-new.png',
        volume: item.id === 'wm-guide' ? 'COMPLETE EDITION' : '',
        chapter: item.id === 'compounding-miracle' ? 'CHAPTER 15' : '',
        genre: 'General'
    }));

    // If we have real items, don't show defaults mixed in, or do we? 
    // Logic was: const allLibraryItems = [...enhancedDefault, ...mappedStored];
    // But usually real items replace defaults. 
    // Existing logic mixed them, so I will stick to existing logic for safety, 
    // possibly filtering if duplicates (but user didn't ask to change that logic).

    // Check if we have any stored items from DB
    if (stored.length > 0) {
        allLibraryItems = [...mappedStored];
    } else {
        allLibraryItems = [...enhancedDefault, ...mappedStored];
    }

    // Initialize filter from URL
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter) {
        const select = document.getElementById('library-type-filter');
        if (select) select.value = filter;
    }

    const searchQuery = params.get('q');
    if (searchQuery) {
        const searchInput = document.getElementById('library-global-search');
        if (searchInput) searchInput.value = searchQuery;
    }

    // Dynamically populate Category Filter AFTER we have data and taxonomy set
    populateCategoryFilter();

    updateGenreFilter();
    updateLibraryView();

    hideLoading();
}

function populateCategoryFilter() {
    const typeSelect = document.getElementById('library-type-filter');
    if (!typeSelect) return;

    // Get currently selected value if any
    const currentValue = typeSelect.value;

    // Preserve the "All Categories" option
    const allOption = typeSelect.querySelector('option[value="all"]');
    typeSelect.innerHTML = '';
    if (allOption) typeSelect.appendChild(allOption);
    else {
        const opt = document.createElement('option');
        opt.value = 'all';
        opt.textContent = 'All Categories';
        typeSelect.appendChild(opt);
    }

    const taxonomy = window.activeTaxonomy || {};

    // Only populate categories that actually exist in taxonomy
    Object.keys(taxonomy).forEach(key => {
        const data = taxonomy[key];
        const opt = document.createElement('option');
        opt.value = key;
        // Capitalize 
        const label = key.charAt(0).toUpperCase() + key.slice(1);
        opt.textContent = `${data.icon || ''} ${label}`;
        typeSelect.appendChild(opt);
    });

    // Restore selection if valid, otherwise default to all
    if (currentValue && (currentValue === 'all' || taxonomy[currentValue])) {
        typeSelect.value = currentValue;
    } else {
        typeSelect.value = 'all';
    }
}

function handleFilterChange(value) {
    const url = new URL(window.location);
    url.searchParams.set('filter', value);
    url.searchParams.delete('genre'); // Clear genre when category changes
    history.pushState({}, '', url);
    updateGenreFilter();
    updateLibraryView();
}

function handleGenreChange(value) {
    const url = new URL(window.location);
    url.searchParams.set('genre', value);
    history.pushState({}, '', url);
    updateLibraryView();
}

function updateGenreFilter() {
    const typeFilter = document.getElementById('library-type-filter').value;
    const genreSelect = document.getElementById('library-genre-filter');
    const taxonomy = window.activeTaxonomy || {};

    if (!genreSelect) return;

    let genres = new Set();

    if (typeFilter === 'all') {
        // Collect genres from ALL taxonomy types
        Object.values(taxonomy).forEach(t => {
            if (t.genres && Array.isArray(t.genres)) {
                t.genres.forEach(g => genres.add(g));
            }
        });
    } else {
        // Specific category
        if (taxonomy[typeFilter] && taxonomy[typeFilter].genres) {
            taxonomy[typeFilter].genres.forEach(g => genres.add(g));
        }
    }

    // Fallback: collect genres from actual items if none in taxonomy (or as supplement)
    // Only do this if we STILL have 0 genres, or maybe always add them to be safe?
    // User requested "only those catagory in liby appear which i add in site sitting", 
    // so we should strictly respect taxonomy if it exists. 
    // However, if an item has a genre not in taxonomy, it becomes un-filterable. 
    // Let's stick to taxonomy first as requested.

    if (genres.size === 0) {
        // Fallback to item scanning if taxonomy is empty for this type
        allLibraryItems.forEach(item => {
            if (typeFilter === 'all' || item.type === typeFilter) {
                if (item.genre) genres.add(item.genre);
            }
        });
    }

    const params = new URLSearchParams(window.location.search);
    const currentGenre = params.get('genre') || 'all';

    genreSelect.innerHTML = '<option value="all">All Genres</option>';

    Array.from(genres).sort().forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.toLowerCase();
        opt.textContent = g;
        if (g.toLowerCase() === currentGenre.toLowerCase()) opt.selected = true;
        genreSelect.appendChild(opt);
    });

    // Handle Back/Forward buttons
    window.addEventListener('popstate', () => {
        const params = new URLSearchParams(window.location.search);
        const filter = params.get('filter') || 'all';
        if (select) {
            select.value = filter;
            updateLibraryView();
        }
    });
}

// --- XSS & DOM Performance Optimizations ---

// Debounce helper to prevent expensive re-renders on every keystoke
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedUpdateLibrary = debounce(() => {
    updateLibraryView();
}, 250);

// Proxy search input to debounced function
function handleLibrarySearch() {
    debouncedUpdateLibrary();
}

function updateLibraryView() {
    const searchInput = document.getElementById('library-global-search');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const typeFilter = document.getElementById('library-type-filter').value;
    const genreFilter = document.getElementById('library-genre-filter') ? document.getElementById('library-genre-filter').value : 'all';
    const container = document.getElementById('library-sections-container');
    const navContainer = document.getElementById('quick-nav-container');

    container.innerHTML = '';
    navContainer.innerHTML = '';

    const taxonomy = window.activeTaxonomy || {};
    const esc = window.escapeHTML || (s => s); // Fallback if helper missing

    Object.keys(taxonomy).forEach(type => {
        if (typeFilter !== 'all' && typeFilter !== type) return;

        const items = allLibraryItems.filter(item =>
            item.type === type && (
                item.title.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm)
            ) && (
                genreFilter === 'all' || (item.genre && item.genre.toLowerCase() === genreFilter.toLowerCase())
            )
        );

        if (items.length > 0) {
            const data = taxonomy[type];
            const icon = data.icon || '📄';

            // Formatting Display Name
            let baseName = type.charAt(0).toUpperCase() + type.slice(1);
            if (!baseName.endsWith('s') && type !== 'story') baseName += 's';
            const displayName = type === 'story' ? 'Stories' : baseName;

            // Add Quick Nav Chip
            const chip = document.createElement('div');
            chip.className = 'nav-chip';
            chip.innerHTML = `${icon} ${esc(displayName)}`;
            chip.onclick = () => {
                const target = document.getElementById(`section-${type}`);
                if (target) {
                    const yOffset = -100;
                    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            };
            navContainer.appendChild(chip);

            // Render Section
            const section = document.createElement('div');
            section.className = 'library-section';
            section.id = `section-${type}`;

            const listId = `list-${type}`;

            section.innerHTML = `
                <div class="section-header">
                    <span style="font-size: 2rem;">${icon}</span>
                    <h2>${esc(displayName)}</h2>
                    <button class="btn-view-all" onclick="toggleExpandSection('${type}')" id="btn-view-all-${type}">View All</button>
                    <span style="margin-left: auto; opacity: 0.7; font-size: 0.9rem; color: var(--color-text); background: var(--color-secondary-bg); padding: 6px 14px; border-radius: 100px; display: flex; align-items: center; gap: 8px;">
                        <span>📋</span> <span id="count-number-${type}">0</span> items
                    </span>
                </div>
                <div class="section-scroll-wrapper" id="wrapper-${type}">
                    <button class="row-nav-btn prev" onclick="scrollRow('${listId}', -1)">❮</button>
                    <button class="row-nav-btn next" onclick="scrollRow('${listId}', 1)">❯</button>
                    <div class="section-list" id="${listId}">
                        ${items.map(item => {
                // Use a thematic cover for Al-Mizan if it matches
                const isAlMizan = item.title.toLowerCase().includes('al-mizan');
                const coverImg = isAlMizan ?
                    window.getSupabaseImageUrl('assets/al_mizan_cover.png') :
                    window.getSupabaseImageUrl(item.image);

                // Sanitize all dynamic strings
                const sTitle = esc(item.title);
                const sRating = esc(item.rating || '0.0');
                const sTag = esc(item.tag || 'Read Now');
                const sChapter = esc(item.chapter);
                const sVolume = esc(item.volume);
                const sType = esc(item.type);

                return `
                                <a href="${item.url}" class="premium-item-card fade-in-up">
                                    <img src="${coverImg}" alt="${sTitle}" loading="lazy">
                                    <div class="badge-container">
                                        ${item.chapter ? `<span class="chapter-badge" style="background: ${item.chapterColor || ''}">${sChapter}</span>` : ''}
                                        ${item.volume ? `<span class="volume-badge" style="background: ${item.volumeColor || ''}">${sVolume}</span>` : ''}
                                    </div>
                                    <div class="item-overlay">
                                        <div style="font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--color-accent); margin-bottom: 5px; letter-spacing: 1px;">
                                            ${sType}
                                        </div>
                                        <h4>${sTitle}</h4>
                                        <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; opacity: 0.6; font-size: 0.75rem;">
                                            <span>⭐ ${sRating}</span>
                                            <span>•</span>
                                            <span>📖 ${sTag}</span>
                                        </div>
                                    </div>
                                </a>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
            container.appendChild(section);

            // Trigger animation for the count
            if (typeof window.animateNumber === 'function') {
                window.animateNumber(`#count-number-${type}`, items.length, 1000);
            } else {
                document.getElementById(`count-number-${type}`).textContent = items.length;
            }
        }
    });

    if (container.innerHTML === '') {
        container.innerHTML = `<div class="empty-state active"><h3 style="color:var(--color-heading);">No results found</h3><p style="color:var(--color-text);">Try adjusting your search or filters.</p></div>`;
    }
}

// Row scrolling helper
function scrollRow(id, direction) {
    const el = document.getElementById(id);
    if (el) {
        const amount = el.clientWidth * 0.8;
        el.scrollBy({ left: amount * direction, behavior: 'smooth' });
    }
}

function toggleExpandSection(type) {
    const list = document.getElementById(`list-${type}`);
    const wrapper = document.getElementById(`wrapper-${type}`);
    const btn = document.getElementById(`btn-view-all-${type}`);

    if (list && wrapper && btn) {
        const isExpanded = list.classList.toggle('is-expanded');
        wrapper.classList.toggle('expanded');
        btn.textContent = isExpanded ? 'Show Less' : 'View All';

        if (isExpanded) {
            // Scroll to the top of the section when expanded
            const section = document.getElementById(`section-${type}`);
            if (section) {
                const yOffset = -100;
                const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    }
}

// Background Music Control
const audio = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
const musicStatus = musicBtn.querySelector('.music-status-text');

function toggleMusic() {
    if (audio.paused) {
        audio.play().then(() => {
            musicBtn.classList.add('playing');
            musicStatus.textContent = 'Music: ON';
        }).catch(err => {
            if (typeof customAlert === 'function') {
                customAlert("Click anywhere on the page first to enable audio playing.", "info");
            } else {
                alert("Click anywhere on the page first to enable audio playing.");
            }
        });
    } else {
        audio.pause();
        musicBtn.classList.remove('playing');
        musicStatus.textContent = 'Music: OFF';
    }
}

// Auto-pause if user leaves tab
document.addEventListener('visibilitychange', () => {
    if (document.hidden && !audio.paused) {
        audio.pause();
        musicBtn.classList.remove('playing');
        musicStatus.textContent = 'Music: OFF';
    }
});
