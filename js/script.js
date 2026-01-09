document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // --- Visual Builder Activation (Security Bypass) ---
    window.addEventListener('message', (event) => {
        if (event.data.type === 'VB_ACTIVATE') {
            const scriptId = 'visual-editor-injected';
            if (document.getElementById(scriptId)) return;
            const script = document.createElement('script');
            script.id = scriptId;
            // Use provided code or fallback to file load
            if (event.data.scriptContent) {
                script.text = event.data.scriptContent;
            } else {
                script.src = 'js/admin/visual-editor.js';
            }
            document.body.appendChild(script);
        }
    });

    // --- Theme Toggling ---
    const getStoredTheme = () => localStorage.getItem('theme');
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    function applyTheme(theme, save = false) {
        const isDark = theme === 'dark';
        const root = document.documentElement;
        const isHomePage = body.classList.contains('home-theme') || ['/', '/index.html'].includes(window.location.pathname);

        if (isDark) {
            root.classList.add('dark-mode');
            body.classList.add('dark-mode'); // Keep for compatibility
            if (isHomePage) body.classList.add('home-theme');
            if (toggleBtn) toggleBtn.textContent = '☀️';
        } else {
            root.classList.remove('dark-mode');
            body.classList.remove('dark-mode');
            body.classList.remove('home-theme');
            if (toggleBtn) toggleBtn.textContent = '🌙';
        }

        if (save) {
            localStorage.setItem('theme', theme);
        }
    }

    // Initialize Theme
    const savedTheme = getStoredTheme();
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(getSystemTheme());
    }

    // Listen for System Theme Changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!getStoredTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = body.classList.contains('dark-mode') || body.classList.contains('home-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme, true);
        });
    }

    // --- Mobile Menu ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    const menuBackdrop = document.getElementById('menu-backdrop');

    if (mobileMenuBtn && mobileMenuOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuOverlay.classList.add('active');
            if (menuBackdrop) menuBackdrop.classList.add('active');
            body.style.overflow = 'hidden';
        });

        if (closeMobileMenu) {
            closeMobileMenu.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
                if (menuBackdrop) menuBackdrop.classList.remove('active');
                body.style.overflow = '';
            });
        }

        if (menuBackdrop) {
            menuBackdrop.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
                menuBackdrop.classList.remove('active');
                body.style.overflow = '';
            });
        }
    }

    // --- Background Music Control ---
    const audio = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-toggle');
    const musicStatus = musicBtn ? musicBtn.querySelector('.music-status-text') : null;

    if (audio && musicBtn) {
        window.toggleMusic = function () {
            if (audio.paused) {
                audio.play().then(() => {
                    musicBtn.classList.add('playing');
                    if (musicStatus) musicStatus.textContent = 'Music: ON';
                }).catch(err => {
                    alert("Click anywhere on the page first to enable audio playing.");
                });
            } else {
                audio.pause();
                musicBtn.classList.remove('playing');
                if (musicStatus) musicStatus.textContent = 'Music: OFF';
            }
        };

        musicBtn.addEventListener('click', window.toggleMusic);
    }

    // Auto-pause if user leaves tab
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && audio && !audio.paused) {
            audio.pause();
            if (musicBtn) musicBtn.classList.remove('playing');
            if (musicStatus) musicStatus.textContent = 'Music: OFF';
        }
    });

    // --- Load Settings ---
    async function initializeSite() {
        let settings = {};
        try {
            settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
        } catch (e) {
            console.warn('Failed to parse siteSettings, resetting.', e);
        }

        // If Supabase is configured, try to fetch settings from cloud
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            try {
                // 1. Fetch from new V2 admin_settings table
                const { data: adminData } = await supabaseClient.from('admin_settings').select('*').limit(1).maybeSingle();
                if (adminData) {
                    settings = {
                        ...settings,
                        title: adminData.site_title || settings.title || 'Wealth & Mindset',
                        desc: adminData.site_description || settings.desc || '',
                        gaId: adminData.ga_id || settings.gaId || '',
                        siteUrl: adminData.site_url || settings.siteUrl || '',
                        adsenseId: adminData.adsense_id || settings.adsenseId || '',
                        autoAds: adminData.auto_ads_enabled ? 'true' : 'false',
                        sidebarAdSlot: adminData.sidebar_ad_slot || settings.sidebarAdSlot || '',
                        adFrequency: adminData.ad_frequency || settings.adFrequency || 'med',
                        footerText: adminData.footer_copyright || settings.footerText || '© 2024 Wealth & Mindset',
                        headerTags: adminData.header_tags || settings.headerTags || '',
                        maintenanceMode: adminData.maintenance_mode
                    };
                    localStorage.setItem('siteSettings', JSON.stringify(settings));
                }

                // 2. Fetch Homepage Settings
                const { data: homeData } = await supabaseClient
                    .from('homepage_settings')
                    .select('*')
                    .eq('id', '00000000-0000-0000-0000-000000000001')
                    .maybeSingle();
                if (homeData) {
                    const homeConfig = {
                        hero: { title: homeData.hero_title, subtitle: homeData.hero_subtitle },
                        topics: homeData.browse_topics || [],
                        exclusive: homeData.exclusive_collection || [],
                        popular: homeData.popular_books || [],
                        customSections: homeData.custom_sections || [],
                        microLessons: homeData.micro_lessons || [],
                        microLessonHeadings: homeData.micro_lesson_headings || [],
                        sliderImages: homeData.slider_images || [],

                        bottomBanners: homeData.bottom_banners || [],
                        imageManager1: homeData.image_manager_1 || []
                    };
                    localStorage.setItem('siteHomepageConfig', JSON.stringify(homeConfig));
                }
            } catch (e) {
                console.warn("Supabase load failed, using local fallback", e);
            }
        }

        applySettings(settings);
        renderHomepageContent();
    }

    function renderHomepageContent() {
        let homepageConfig = {};
        try {
            homepageConfig = JSON.parse(localStorage.getItem('siteHomepageConfig') || '{}');
        } catch (e) {
            console.warn('Failed to parse siteHomepageConfig.', e);
        }

        let library = [];
        try {
            library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        } catch (e) {
            console.warn('Failed to parse siteLibrary.', e);
        }

        // 0. Render Hero (Carousel removed)
        // renderHeroCarousel(homepageConfig.sliderImages, homepageConfig.hero);

        // 1. Render Topics
        const topicsContainer = document.getElementById('topics-container');
        if (topicsContainer && homepageConfig.topics && homepageConfig.topics.length > 0) {
            topicsContainer.innerHTML = ''; // Clear default static items
            homepageConfig.topics.forEach(topic => {
                // Capitalize first letter
                const title = topic.charAt(0).toUpperCase() + topic.slice(1);
                // Simple icon mapping (could be improved)
                let icon = '📂';
                if (topic.includes('mindset')) icon = '🧠';
                else if (topic.includes('success')) icon = '📈';
                else if (topic.includes('growth')) icon = '🚀';
                else if (topic.includes('finance')) icon = '💰';
                else if (topic.includes('business')) icon = '💼';

                // Description mapping (optional, or generic)
                const desc = getTopicDescription(topic);

                const cardHtml = `
                    <a href="books.html?cat=${topic}" class="category-card-home hover-lift glass">
                        <span class="icon">${icon}</span>
                        <div>
                            <h3>${title}</h3>
                            <p>${desc}</p>
                        </div>
                    </a>
                `;
                topicsContainer.innerHTML += cardHtml;
            });
        }

        // 2. Render Success Stories
        // renderSuccessStories(homepageConfig.stories);

        // 3. Render Exclusive Collection
        renderBookListSection('exclusive-scroll-container', homepageConfig.exclusive, library);

        // 4. Render "Popular Picks"
        renderBookListSection('popular-scroll', homepageConfig.popular, library);

        // 5. Render Tips
        renderMicroLessons(homepageConfig.microLessons, homepageConfig.microLessonHeadings);

        // 6. Render Bottom Banner Marquee
        renderBottomMarquee(homepageConfig.bottomBanners);

        // 7. Render Custom Sections
        renderCustomHomeSections(homepageConfig.customSections, library);

        // 8. Render Image Manager 1
        renderImageManager1(homepageConfig.imageManager1);


        // 9. Render Recommended Section (NEW)
        renderRecommendedSection(library);

        // 10. Render Custom Page Sections (Visual Builder)
        renderPageSections();

        // 11. Render Dynamic Product Links (Visual Builder)
        renderProductLinks();
    }

    async function renderPageSections() {
        try {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            let { data: sections, error } = await supabaseClient
                .from('page_sections')
                .select('*')
                .eq('page_target', page === '' ? 'index.html' : page)
                .order('position', { ascending: true });

            if (error || !sections || sections.length === 0) return;

            console.log(`Loading Page Sections for ${page}:`, sections.length);

            const container = document.querySelector('main') || document.body;

            sections.forEach(sec => {
                if (document.getElementById(sec.id)) return; // Already exists

                let html = '';
                if (sec.section_type === 'top-book-buy') {
                    const config = sec.config || {};
                    html = `
                        <section id="${sec.id}" class="top-book-buy-section" style="padding: 60px 20px; background: rgba(255,255,255,0.02); text-align: center; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <div style="max-width: 1000px; margin: 0 auto;">
                                <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; color: var(--color-heading); margin-bottom: 30px;">Top Recommendation</h2>
                                <div class="book-buy-container" style="display: flex; gap: 40px; align-items: center; justify-content: center; flex-wrap: wrap;">
                                    <div class="book-cover-wrapper" style="width: 200px; height: 300px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); overflow: hidden;">
                                        <img src="assets/logo-new.png" class="book-buy-link" data-book-id="${config.book_id || ''}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
                                    </div>
                                    <div style="max-width: 500px; text-align: left;">
                                        <h3 style="font-size: 1.5rem; margin-bottom: 15px; color: var(--color-heading);">Featured Selection</h3>
                                        <p style="color: #64748b; margin-bottom: 25px;">Hand-selected for its profound impact on mindset and financial intelligence. Click the cover to see details or buy now.</p>
                                        <button class="book-buy-link btn-primary" data-book-id="${config.book_id || ''}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: 700; border:none; cursor:pointer;">🛒 Check Details & Buy</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    `;
                } else if (sec.section_type === 'empty-section') {
                    html = `<section id="${sec.id}" class="custom-empty-section" style="padding: 20px;"></section>`;
                }

                if (html) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = html.trim();
                    const newSec = tempDiv.firstChild;
                    container.appendChild(newSec);
                }
            });
        } catch (e) {
            console.error("Failed to load page sections:", e);
        }
    }

    async function renderProductLinks() {
        try {
            const page = window.location.pathname.split('/').pop() || 'index.html';
            let { data: links, error } = await supabaseClient
                .from('product_links')
                .select('*')
                .eq('page_target', page === '' ? 'index.html' : page);

            if (error || !links || links.length === 0) return;

            links.forEach(link => {
                const pos = link.position_data;
                if (!pos || !pos.reference_id) return;

                const refNode = document.getElementById(pos.reference_id);
                if (!refNode) return;

                const wrapper = document.createElement('div');
                wrapper.className = 'product-link-wrapper';
                wrapper.style.margin = '20px auto';
                wrapper.style.textAlign = 'center';

                const el = document.createElement('a');
                el.href = link.url;
                el.className = 'product-link-item hover-lift';
                el.target = "_blank";
                el.style.display = 'inline-flex';
                el.style.alignItems = 'center';
                el.style.gap = '12px';
                el.style.padding = '16px 24px';
                el.style.background = 'rgba(255,255,255,0.05)';
                el.style.border = '1px solid rgba(255,255,255,0.1)';
                el.style.borderRadius = '16px';
                el.style.color = 'var(--color-heading)';
                el.style.textDecoration = 'none';
                el.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
                el.style.fontWeight = '600';
                el.style.backdropFilter = 'blur(10px)';

                const icon = link.product_icon && link.product_icon.includes('http')
                    ? `<img src="${link.product_icon}" style="width:32px;height:32px;object-fit:contain;">`
                    : `<span style="font-size: 1.5rem;">${link.product_icon || '🔗'}</span>`;

                if (link.display_mode === 'icon') {
                    el.innerHTML = icon;
                    el.style.borderRadius = '50%';
                    el.style.padding = '15px';
                } else if (link.display_mode === 'text') {
                    el.innerHTML = `<span>${link.custom_name || 'Product'}</span>`;
                } else {
                    el.innerHTML = `${icon} <span>${link.custom_name || 'Product Link'}</span> <span style="margin-left:auto; opacity:0.5; font-size:0.8em; padding-left: 10px;">↗</span>`;
                }

                if (link.size_category === 'custom') {
                    if (link.custom_width) el.style.width = link.custom_width + 'px';
                    if (link.custom_height) el.style.height = link.custom_height + 'px';
                }

                wrapper.appendChild(el);
                if (pos.placement === 'before') refNode.parentNode.insertBefore(wrapper, refNode);
                else refNode.parentNode.insertBefore(wrapper, refNode.nextSibling);
            });
        } catch (e) {
            console.error("Failed to load product links:", e);
        }
    }

    function renderCustomHomeSections(sections, library) {
        const container = document.getElementById('dynamic-home-sections');
        if (!container) return;

        // Clear container first
        container.innerHTML = '';

        if (!sections || sections.length === 0) return;

        sections.forEach((sec, idx) => {
            // CHANGED: Don't skip sections with no items - just show them empty or with available items
            const hasItems = sec.items && sec.items.length > 0;

            // Log for debugging
            if (!hasItems) {
                console.log(`[Homepage] Section "${sec.title}" has no items yet.`);
            }

            const sectionId = `custom-sec-${idx}`;
            const iconHtml = sec.icon ? `<span style="margin-right: 10px;">${sec.icon}</span>` : '';

            // Use popup for view all, fallback to library if no items
            const viewAllAction = `openSectionModal('custom', ${idx}); return false;`;

            const html = `
                <section style="margin-bottom: 80px; max-width: var(--max-width); margin-left: auto; margin-right: auto; width: 100%; box-sizing: border-box; padding: 0 var(--spacing-unit);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px;">
                    <h2 style="font-size: var(--font-size-h3); margin: 0; color: var(--color-heading); display: flex; align-items: center;">
                        ${iconHtml}
                        ${sec.title}
                    </h2>
                    <a href="#" onclick="${viewAllAction}" style="color: var(--color-accent); font-weight: 700; text-decoration: none;">View All →</a>
                  </div>
                  <div class="section-scroll-wrapper">
                    <button class="row-nav-btn prev" onclick="scrollRow('${sectionId}', -1)">❮</button>
                    <button class="row-nav-btn next" onclick="scrollRow('${sectionId}', 1)">❯</button>
                    <div class="horizontal-scroll-list" id="${sectionId}"></div>
                  </div>
                </section>
            `;
            container.innerHTML += html;

            // CHANGED: Render items even if some are missing from library
            if (hasItems) {
                renderBookListSectionWithFallback(sectionId, sec.items || [], library, sec.title);
            } else {
                // Show placeholder for empty section
                const sectionContainer = document.getElementById(sectionId);
                if (sectionContainer) {
                    sectionContainer.innerHTML = '<p style="color: #64748b; padding: 40px; text-align: center;">No books added yet. Add books through the Admin Panel.</p>';
                }
            }
        });
    }

    // --- Section Modal Logic ---
    window.openSectionModal = function (type, customIndex = -1) {
        const modal = document.getElementById('section-modal');
        const grid = document.getElementById('section-modal-grid');
        const titleEl = document.getElementById('section-modal-title');
        const badgeEl = document.getElementById('section-modal-badge');

        if (!modal || !grid) return;

        // Load Data
        let homepageConfig = {};
        try {
            homepageConfig = JSON.parse(localStorage.getItem('siteHomepageConfig') || '{}');
        } catch (e) { }

        let library = [];
        try {
            library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        } catch (e) { }

        let items = [];
        let title = "Collection";
        let icon = "📚";

        if (type === 'exclusive') {
            title = "Exclusive Collection";
            icon = "📚";
            items = homepageConfig.exclusive || [];
        } else if (type === 'popular') {
            title = "Popular Picks";
            icon = "🔥";
            items = homepageConfig.popular || [];
        } else if (type === 'custom' && customIndex >= 0) {
            const sec = homepageConfig.customSections[customIndex];
            if (sec) {
                title = sec.title;
                icon = sec.icon || "✨";
                items = sec.items || [];
            }
        }

        // Update Header
        titleEl.textContent = title;
        badgeEl.textContent = `${icon} Collection`;

        // Render Grid
        grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = `<p style="color: #94a3b8; grid-column: 1/-1; text-align: center;">No items found in this collection.</p>`;
        } else {
            items.forEach(id => {
                const book = library.find(b => b.id === id);
                if (!book) return;

                const cover = window.getSupabaseImageUrl ? window.getSupabaseImageUrl(book.image) : (book.image || 'assets/logo-new.png');
                let badge1 = (book.chapters && book.chapters.length > 0) ? `${book.chapters.length} CHAPTERS` : '0 CHAPTERS';
                let badge2 = book.author ? book.author.toUpperCase() : 'AUTHOR';

                const card = `
                    <div class="premium-book-card" onclick="window.location.href='book-detail.html?id=${book.id}'" style="cursor: pointer;">
                        <img src="${cover}" alt="${book.title}" loading="lazy">
                        <div class="badge-container">
                            <span class="chapter-badge">${badge1}</span>
                            <span class="volume-badge">${badge2}</span>
                        </div>
                        <div style="padding: 15px;">
                            <h4 style="color: var(--color-heading); margin: 0; font-size: 0.95rem;">${book.title}</h4>
                        </div>
                    </div>
                `;
                grid.innerHTML += card;
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    window.closeSectionModal = function () {
        const modal = document.getElementById('section-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Close on click outside
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('section-modal');
        if (modal && e.target === modal) {
            window.closeSectionModal();
        }
    });

    // --- Global Search Logic ---
    window.handleGlobalSearch = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        const searchInput = document.querySelector('.search-bar-section input, .site-main input[type="text"]');
        if (!searchInput) return;

        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `books.html ? q = ${encodeURIComponent(query)} `;
        }
    };

    // Attach to any search button or input on the page
    const searchBtns = document.querySelectorAll('.search-bar-section button, .site-main button');
    searchBtns.forEach(btn => {
        if (btn.textContent.toLowerCase().includes('search')) {
            btn.onclick = window.handleGlobalSearch;
        }
    });

    const searchInputs = document.querySelectorAll('.search-bar-section input, .site-main input[type="text"]');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.handleGlobalSearch(e);
            }
        });
    });


    function renderBookListSection(containerId, bookIds, library) {
        const container = document.getElementById(containerId);
        if (!container || !bookIds || bookIds.length === 0) return;

        container.innerHTML = ''; // Clear defaults if we have dynamic content

        bookIds.forEach(id => {
            const book = library.find(b => b.id === id);
            if (!book) return;

            const cover = window.getSupabaseImageUrl ? window.getSupabaseImageUrl(book.image) : (book.image || 'assets/logo-new.png');
            let badge1 = (book.chapters && book.chapters.length > 0) ? `${book.chapters.length} CHAPTERS` : '0 CHAPTERS';
            let badge2 = book.author ? book.author.toUpperCase() : 'AUTHOR';

            const html = `
                <div class="premium-book-card" onclick="window.location.href='book-detail.html?id=${book.id}'">
                    <img src="${cover}" alt="${book.title}" loading="lazy">
                    <div class="badge-container">
                        <span class="chapter-badge">${badge1}</span>
                        <span class="volume-badge">${badge2}</span>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    // NEW: Enhanced version of renderBookListSection with fallback for missing items
    function renderBookListSectionWithFallback(containerId, bookIds, library, sectionTitle = 'Section') {
        const container = document.getElementById(containerId);
        if (!container || !bookIds || bookIds.length === 0) return;

        container.innerHTML = ''; // Clear defaults

        let renderedCount = 0;
        let missingCount = 0;

        bookIds.forEach(id => {
            const book = library.find(b => b.id === id);
            if (!book) {
                console.warn(`[Homepage] Book ID "${id}" not found in library for section "${sectionTitle}"`);
                missingCount++;
                return;
            }

            const cover = window.getSupabaseImageUrl ? window.getSupabaseImageUrl(book.image) : (book.image || 'assets/logo-new.png');
            let badge1 = (book.chapters && book.chapters.length > 0) ? `${book.chapters.length} CHAPTERS` : '0 CHAPTERS';
            let badge2 = book.author ? book.author.toUpperCase() : 'AUTHOR';

            const html = `
                <div class="premium-book-card" onclick="window.location.href='book-detail.html?id=${book.id}'">
                    <img src="${cover}" alt="${book.title}" loading="lazy">
                    <div class="badge-container">
                        <span class="chapter-badge">${badge1}</span>
                        <span class="volume-badge">${badge2}</span>
                    </div>
                </div>
            `;
            container.innerHTML += html;
            renderedCount++;
        });

        if (missingCount > 0) {
            console.log(`[Homepage] Section "${sectionTitle}": Rendered ${renderedCount} books, ${missingCount} books not found in library`);
        }
    }

    function renderMicroLessons(lessons, headings) {
        const container = document.getElementById('micro-lessons-container');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        if (!lessons || lessons.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">No tips available yet.</p>';
            return;
        }

        // Render headings if provided
        if (headings && headings.length > 0) {
            headings.forEach(heading => {
                const headingEl = document.createElement('h3');
                headingEl.style.cssText = 'color: var(--color-heading); margin: 30px 0 20px; font-size: 1.8rem;';
                headingEl.textContent = heading;
                container.appendChild(headingEl);
            });
        }

        // Render lessons
        lessons.forEach((lesson, index) => {
            const lessonCard = document.createElement('div');
            lessonCard.className = 'micro-lesson-card glass hover-lift';
            lessonCard.style.cssText = `
                padding: 25px;
                margin-bottom: 20px;
                border-radius: 16px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                transition: all 0.3s ease;
            `;

            const emoji = lesson.emoji || '💡';
            const title = lesson.title || `Tip #${index + 1}`;
            const content = lesson.content || lesson.text || '';

            lessonCard.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <span style="font-size: 2rem;">${emoji}</span>
                    <h4 style="margin: 0; color: var(--color-heading); font-size: 1.2rem;">${title}</h4>
                </div>
                <p style="color: #cbd5e1; line-height: 1.7; margin: 0;">${content}</p>
            `;

            container.appendChild(lessonCard);
        });
    }

    function renderBottomMarquee(banners) {
        const container = document.getElementById('bottom-marquee-container');
        if (!container || !banners || banners.length === 0) return;

        container.innerHTML = '';

        const marquee = document.createElement('div');
        marquee.className = 'marquee-content';
        marquee.style.cssText = 'display: flex; gap: 30px; animation: marquee 20s linear infinite;';

        // Duplicate banners for seamless loop
        const allBanners = [...banners, ...banners];

        allBanners.forEach(banner => {
            const item = document.createElement('span');
            item.style.cssText = 'white-space: nowrap; color: var(--color-accent); font-weight: 700;';
            item.textContent = banner.text || banner;
            marquee.appendChild(item);
        });

        container.appendChild(marquee);
    }

    function renderImageManager1(images) {
        const container = document.getElementById('image-manager-1-container');
        if (!container || !images || images.length === 0) return;

        container.innerHTML = '';

        images.forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = window.getSupabaseImageUrl ? window.getSupabaseImageUrl(img.url || img) : (img.url || img);
            imgEl.alt = img.alt || 'Image';
            imgEl.style.cssText = 'max-width: 100%; border-radius: 12px; margin: 20px 0;';
            imgEl.loading = 'lazy';
            container.appendChild(imgEl);
        });
    }

    function renderRecommendedSection(library) {
        const container = document.getElementById('recommended-section-container');
        if (!container) return;

        // Get recently added books (last 6)
        const recentBooks = library.slice(-6).reverse();

        if (recentBooks.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center;">No books available yet.</p>';
            return;
        }

        container.innerHTML = '';
        recentBooks.forEach(book => {
            const cover = window.getSupabaseImageUrl ? window.getSupabaseImageUrl(book.image) : (book.image || 'assets/logo-new.png');
            const badge1 = (book.chapters && book.chapters.length > 0) ? `${book.chapters.length} CHAPTERS` : '0 CHAPTERS';
            const badge2 = book.author ? book.author.toUpperCase() : 'AUTHOR';

            const html = `
                <div class="premium-book-card" onclick="window.location.href='book-detail.html?id=${book.id}'">
                    <img src="${cover}" alt="${book.title}" loading="lazy">
                    <div class="badge-container">
                        <span class="chapter-badge">${badge1}</span>
                        <span class="volume-badge">${badge2}</span>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    function getTopicDescription(topic) {
        const map = {
            'mindset': 'Rewire your brain for peak performance and wealth attraction.',
            'success': 'Proven frameworks and daily habits of elite high-performers.',
            'growth': 'Strategies for sustainable wealth and legacy creation.',
            'finance': 'Master money management and investment psychology.',
            'business': 'Tactics for building and scaling successful ventures.',
            'habits': 'Small daily changes that lead to massive results.'
        };
        return map[topic.toLowerCase()] || 'Explore our curated collection of wisdom.';
    }

    function applySettings(settings) {
        const adsEnabled = settings.autoAds !== 'false';
        const adsenseId = settings.adsenseId || '';
        const adFreq = settings.adFrequency || 'med';
        const freqMap = { 'low': 10, 'med': 5, 'high': 3 };
        const freqCount = freqMap[adFreq] || 5;

        // 1. SEO & Branding
        if (settings.title) document.title = settings.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && settings.desc) metaDesc.setAttribute('content', settings.desc);

        const footerTextEl = document.getElementById('footer-copyright-text') || document.querySelector('.footer p');
        if (footerTextEl && settings.footerText) footerTextEl.textContent = settings.footerText;

        // 2. Global Scripts & GA
        if (settings.headerTags) {
            const div = document.createElement('div');
            div.innerHTML = settings.headerTags;
            Array.from(div.children).forEach(node => {
                if (node.tagName === 'SCRIPT') {
                    const s = document.createElement('script');
                    if (node.src) s.src = node.src;
                    else s.textContent = node.textContent;
                    document.head.appendChild(s);
                } else {
                    document.head.appendChild(node.cloneNode(true));
                }
            });
        }

        if (settings.gaId) {
            const gaScript = document.createElement('script');
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.gaId}`;
            gaScript.async = true;
            document.head.appendChild(gaScript);
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', settings.gaId);
        }

        if (adsEnabled && adsenseId) {
            // 2. Inject Google AdSense Auto-Ads
            const adsenseScript = document.createElement('script');
            adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
            adsenseScript.async = true;
            adsenseScript.crossOrigin = "anonymous";
            document.head.appendChild(adsenseScript);

            // 3. Replace Placeholders with Real Ad Units
            const placeholders = document.querySelectorAll('.ad-container, .vertical-ad-banner');
            placeholders.forEach((container, index) => {
                const innerBox = container.querySelector('div:not(.ad-label)');
                if (innerBox) {
                    const isVertical = container.classList.contains('vertical-ad-banner');
                    const slotId = isVertical ? (settings.sidebarAdSlot || `slot-${index}`) : `slot-${index}`;

                    innerBox.innerHTML = `
                    <ins class="adsbygoogle"
                         style="display:block; ${isVertical ? 'min-width:300px;min-height:600px;' : 'min-height:90px;'}"
                         data-ad-client="${adsenseId}"
                         data-ad-slot="${slotId}"
                         data-ad-format="${isVertical ? 'vertical' : 'auto'}"
                         data-full-width-responsive="true"></ins>
                `;

                    try {
                        (adsbygoogle = window.adsbygoogle || []).push({});
                    } catch (e) { }
                }
            });

            // 4. Inject In-Content Ads for Reader Page - REMOVED TO PREVENT CONFLICT
            // The reader logic (reader.html) handles its own ad injection more intelligently.


        } else if (!adsEnabled) {
            document.querySelectorAll('.ad-container, .vertical-ad-banner').forEach(el => {
                el.style.display = 'none';
            });
        }


        // --- Library Filtering Logic ---
        const filterBtns = document.querySelectorAll('.filter-btn');
        const sections = document.querySelectorAll('.library-section');

        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const filter = btn.getAttribute('data-filter');
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    sections.forEach(section => {
                        if (section.id === `section-${filter}`) {
                            section.classList.add('active');
                        } else {
                            section.classList.remove('active');
                        }
                    });
                });
            });
        }

        // --- Cookie Consent Banner ---
        if (!localStorage.getItem('cookieConsent')) {
            const banner = document.createElement('div');
            banner.id = 'cookie-consent-banner';
            banner.style.cssText = `
            position: fixed; bottom: 0; left: 0; right: 0; 
            background: #1e293b; color: #fff; padding: 20px; 
            text-align: center; z-index: 9999; 
            border-top: 2px solid var(--color-accent);
            font-family: var(--font-heading); font-size: 0.9rem;
        `;
            banner.innerHTML = `
            <span>We use cookies to improve your experience and show personalized ads. By continuing to use our site, you agree to our 
            <a href="privacy.html" style="color:var(--color-accent); text-decoration:underline;">Privacy Policy</a>.</span>
            <button id="accept-cookies" style="
                background: var(--color-accent); color: white; border: none; 
                padding: 8px 20px; border-radius: 6px; margin-left: 15px; 
                cursor: pointer; font-weight: 700;
            ">Accept</button>
        `;
            document.body.appendChild(banner);

            document.getElementById('accept-cookies').onclick = async () => {
                banner.style.display = 'none';
                localStorage.setItem('cookieConsent', 'true');
                logActivity('cookie_accept', { timestamp: new Date().toISOString() });
            };
        }

        // --- Log Page View Activity ---
        // logActivity('page_view', { title: document.title }); // Disabling redundant log, handled by logVisit in supabase-config.js

        // --- Add Terms link to Footers ---
        const footerLinks = document.querySelector('.footer-links');
        if (footerLinks && !footerLinks.innerHTML.includes('terms.html')) {
            const termsLink = document.createElement('a');
            termsLink.href = 'terms.html';
            termsLink.textContent = 'Terms and Conditions';
            termsLink.style.marginLeft = '15px';
            footerLinks.appendChild(termsLink);
        }
    }

    // --- Analytics Helper ---
    window.logActivity = async function (type, metadata = {}) {
        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !window.supabaseClient) return;

        // Rate limiting: Don't log same type within 2 seconds (simple throttle)
        const lastLog = window[`_last_log_${type}`];
        const now = Date.now();
        if (lastLog && (now - lastLog < 2000)) return;
        window[`_last_log_${type}`] = now;

        try {
            // Get IP Address - Silently fail if blocked by adblock/tracking
            let ip = sessionStorage.getItem('cached_user_ip');

            if (!ip) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000);

                    const ipResponse = await fetch('https://ipapi.co/json/', {
                        signal: controller.signal
                    }).catch(() => null);

                    clearTimeout(timeoutId);

                    if (ipResponse && ipResponse.ok) {
                        const ipData = await ipResponse.json();
                        ip = ipData.ip;
                        const country = ipData.country_name || 'Unknown';
                        sessionStorage.setItem('cached_user_ip', ip);
                        sessionStorage.setItem('cached_user_country', country);
                    }
                } catch (e) {
                    console.warn("Geo lookup failed", e);
                }
            }

            if (!ip) ip = "0.0.0.0";

            // Mobile/Tablet/Desktop detection
            const ua = navigator.userAgent;
            let deviceType = 'desktop';
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                deviceType = 'tablet';
            } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                deviceType = 'mobile';
            }

            const activity = {
                ip_address: ip,
                activity_type: type,
                page_url: window.location.href,
                metadata: {
                    ...metadata,
                    device: deviceType,
                    country: sessionStorage.getItem('cached_user_country') || 'Unknown',
                    browser: navigator.appName,
                    platform: navigator.platform,
                    userAgent: ua,
                    timestamp: new Date().toISOString()
                }
            };

            await supabaseClient.from('user_activity').insert(activity);
        } catch (e) {
            console.warn("Analytics log failed silently", e);
        }
    };

    // Global Tracking Helpers
    window.trackAdClick = function (adId, location) {
        console.log(`Tracking Ad Click: ${adId} at ${location}`);
        window.logActivity('ad_click', { ad_id: adId, ad_location: location });
    };

    window.trackChapterRead = function (bookId, chapterId, title) {
        console.log(`Tracking Chapter Read: ${title} (${bookId})`);
        window.logActivity('chapter_read', { book_id: bookId, chapter_id: chapterId, title: title });
    };

    // --- Daily Reading Modal ---
    window.openDailyModal = async function () {
        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !supabaseClient) {
            alert("Daily Reading is not available offline.");
            return;
        }

        const existingModal = document.getElementById('daily-mindset-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'daily-mindset-modal';
        modal.className = 'daily-modal-overlay active'; // Use the CSS class if available, or stay with inline
        modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.9); z-index: 10000;
        display: flex; justify-content: center; align-items: center;
        backdrop-filter: blur(10px);
    `;

        modal.innerHTML = `
        <div style="background: #0f172a; padding: 40px; border-radius: 24px; max-width: 600px; width: 90%; text-align: left; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 40px 100px rgba(0,0,0,0.8); position: relative;">
            <button id="close-daily-modal" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;">×</button>
            <div id="daily-content-area">
                <div class="spinner" style="margin: 20px auto;"></div>
                <p style="text-align: center; color: #94a3b8;">Loading Today's Reading...</p>
            </div>
        </div>
    `;
        document.body.appendChild(modal);

        try {
            const { data, error } = await supabaseClient
                .from('daily_mindset')
                .select('*')
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            const contentArea = document.getElementById('daily-content-area');
            if (!data) {
                contentArea.innerHTML = `
                <h2 style="color: var(--color-heading); margin-bottom: 10px;">New Chapter Incoming</h2>
                <p style="color: #94a3b8;">Check back tomorrow for your next daily reading session.</p>
            `;
            } else {
                const sDate = new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                contentArea.innerHTML = `
                <span style="background: var(--color-accent); color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 20px;">📖 Today's Reading</span>
                <h2 style="font-size: 2rem; color: var(--color-heading); margin-bottom: 15px; font-family: var(--font-heading);">${esc(data.title || 'Daily Wisdom')}</h2>
                <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 1px;">${esc(sDate)} • 2 MIN READ</p>
                <div style="font-size: 1.15rem; line-height: 1.7; color: #cbd5e1; margin-bottom: 30px; max-height: 300px; overflow-y: auto; padding-right: 10px;">
                    ${data.inspiration_text.split('\n\n').map(p => `<p style="margin-bottom: 1.2rem;">${esc(p)}</p>`).join('')}
                </div>
                <button id="daily-read-done" style="width: 100%; background: var(--color-accent); color: white; border: none; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: 0.3s;">Complete Session</button>
            `;

                document.getElementById('daily-read-done').onclick = () => {
                    modal.remove();
                    if (window.showToast) window.showToast("Daily Reading Completed! +1 Day Streak", "success");
                };
            }
        } catch (e) {
            console.error("Daily Reading Error", e);
        }

        document.getElementById('close-daily-modal').onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    };

    // --- Save / Bookmark Logic ---
    window.toggleSaveReader = function () {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('id');
        const chIdx = urlParams.get('ch') || '0';

        if (!bookId) return;

        let saved = JSON.parse(localStorage.getItem('saved_chapters') || '[]');
        const saveKey = `${bookId}_${chIdx}`;
        const exists = saved.find(s => s.id === saveKey);

        const btnTop = document.getElementById('btn-save-top');
        const btnBottom = document.getElementById('btn-save-bottom');

        if (exists) {
            saved = saved.filter(s => s.id !== saveKey);
            if (btnTop) btnTop.classList.remove('active');
            if (btnBottom) btnBottom.classList.remove('active');
            if (window.showToast) window.showToast("Removed from bookmarks");
        } else {
            const title = document.getElementById('chapter-title-display')?.textContent || 'Untitled Chapter';
            saved.push({
                id: saveKey,
                bookId,
                chIdx,
                title,
                timestamp: Date.now()
            });
            if (btnTop) btnTop.classList.add('active');
            if (btnBottom) btnBottom.classList.add('active');
            if (window.showToast) window.showToast("Saved to bookmarks!", "success");
        }

        localStorage.setItem('saved_chapters', JSON.stringify(saved));
    };

    // Help helper
    function esc(s) {
        if (!s) return "";
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    // Start initialization
    initializeSite();
});
