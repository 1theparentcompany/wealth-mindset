let allLibraryItems = [];

// Static items to show when localStorage is empty
const defaultItems = [
    { id: 'wm-guide', title: 'Wealth & Mindset: The Complete Guide', type: 'book', description: 'The foundation for financial independence.', icon: '📘', tag: 'Bestseller' },
    { id: 'compounding-miracle', title: 'The 30-Year Compounding Miracle', type: 'story', description: 'How patience builds empires.', icon: '📖', tag: 'Inspirational' }
];

document.addEventListener('DOMContentLoaded', () => {
    initLibrary();
});

async function initLibrary() {
    // Load Taxonomy
    let taxonomy = JSON.parse(localStorage.getItem('siteTaxonomy') || '{}');
    const defaultTaxonomy = {
        'book': { icon: '📘' },
        'story': { icon: '📖' },
        'guide': { icon: '🧭' },
        'laws': { icon: '⚖️' },
        'chapter': { icon: '📝' },
        'quotes': { icon: '📄' }
    };

    // Load stored items (Fallback only)
    let stored = [];
    try {
        stored = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        stored.sort((a, b) => (a.sort_order || 100) - (b.sort_order || 100));
    } catch (e) { }

    // If Supabase is configured, try to fetch from cloud
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
        try {
            // Fetch Taxonomy
            const { data: taxData, error: taxError } = await supabaseClient.from('site_taxonomy').select('*');
            if (taxData && taxData.length > 0) {
                taxonomy = {};
                taxData.forEach(t => {
                    taxonomy[t.category_name] = { icon: t.icon, genres: t.genres };
                });
            }

            // Fetch Books (Light data only, but include detail_settings for customization)
            const { data: libData, error: libError } = await supabaseClient
                .from('books')
                .select('id, title, author, category, description, cover_image, is_featured, background_image, status, sort_order, detail_settings')
                .eq('status', 'published')
                .is('original_book_id', null) // Filter out translations - show only original books
                .order('sort_order', { ascending: true });

            // Fetch Ratings and aggregate
            const { data: reviewData } = await supabaseClient
                .from('book_reviews')
                .select('book_id, rating');

            const ratingMap = {};
            if (reviewData) {
                reviewData.forEach(rev => {
                    if (!ratingMap[rev.book_id]) ratingMap[rev.book_id] = { sum: 0, count: 0 };
                    ratingMap[rev.book_id].sum += rev.rating;
                    ratingMap[rev.book_id].count++;
                });
            }

            if (libData && libData.length > 0) {
                stored = libData.map(item => {
                    const stats = ratingMap[item.id];
                    const avgRating = stats ? (stats.sum / stats.count).toFixed(1) : '4.9';

                    return {
                        id: item.id,
                        title: item.title,
                        author: item.author,
                        type: item.category,
                        description: item.description,
                        image: item.cover_image,
                        isFeatured: item.is_featured,
                        backgroundSettings: { detailUrl: item.background_image },
                        detailSettings: item.detail_settings, // Added detailSettings
                        rating: avgRating
                    };
                });
            }
        } catch (e) {
            console.error("Supabase fetch failed, falling back to local:", e);
        }
    }

    // Merge taxonomy
    const currentTaxonomy = Object.keys(taxonomy).length > 0 ? taxonomy : defaultTaxonomy;
    window.activeTaxonomy = currentTaxonomy;

    // Map stored items to Library format
    const mappedStored = stored.map(item => {
        const typeData = currentTaxonomy[item.type];

        // Extract chapter/volume info if possible from title or description
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
            image: item.image || 'assets/logo-new.png', // Keep raw path/image, helper will handle it
            tag: 'Read Now',
            volume: bBottom,
            chapter: bTop,
            volumeColor: bBottomColor,
            chapterColor: bTopColor,
            genre: item.genre || 'General',
            rating: item.rating || '4.9'
        };
    });

    // Enhance default items with image and badges
    const enhancedDefault = defaultItems.map(item => ({
        ...item,
        image: item.id === 'wm-guide' ? 'assets/logo-new.png' : 'assets/logo-new.png',
        volume: item.id === 'wm-guide' ? 'COMPLETE EDITION' : '',
        chapter: item.id === 'compounding-miracle' ? 'CHAPTER 15' : '',
        genre: 'General'
    }));

    allLibraryItems = [...enhancedDefault, ...mappedStored];

    // Initialize filter from URL to persist state on refresh
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter');
    if (filter) {
        const select = document.getElementById('library-type-filter');
        if (select) {
            select.value = filter;
        }
    }

    updateGenreFilter();
    updateLibraryView();
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
        Object.values(taxonomy).forEach(t => {
            if (t.genres) t.genres.forEach(g => genres.add(g));
        });
    } else if (taxonomy[typeFilter] && taxonomy[typeFilter].genres) {
        taxonomy[typeFilter].genres.forEach(g => genres.add(g));
    }

    // Fallback: collect genres from actual items if none in taxonomy
    if (genres.size === 0) {
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
}

// Handle Back/Forward buttons
window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const filter = params.get('filter') || 'all';
    const select = document.getElementById('library-type-filter');
    if (select) {
        select.value = filter;
        updateLibraryView();
    }
});

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
function handleGlobalSearch() {
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
                        <span>📋</span> ${items.length} items
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
                const sRating = esc(item.rating || '4.9');
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
