document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // --- Theme Toggling ---
    const getStoredTheme = () => localStorage.getItem('theme');
    const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    function applyTheme(theme, save = false) {
        const isDark = theme === 'dark';
        const isHomePage = body.classList.contains('home-theme') || ['/', '/index.html'].includes(window.location.pathname);

        if (isDark) {
            body.classList.add('dark-mode');
            if (isHomePage) body.classList.add('home-theme');
            if (toggleBtn) toggleBtn.textContent = '☀️';
        } else {
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
    }

    // Hero Carousel function removed


    window.scrollRow = function (id, direction) {
        const el = document.getElementById(id);
        if (el) {
            const amount = el.clientWidth * 0.8;
            el.scrollBy({ left: amount * direction, behavior: 'smooth' });
        }
    };

    function renderSuccessStories(stories) {
        const container = document.getElementById('stories-scroll');
        if (!container || !stories || stories.length === 0) return;
        container.innerHTML = '';
        stories.forEach(story => {
            const html = `
                <div class="premium-book-card" onclick="window.location.href='books.html?cat=story'">
                    <div class="badge-container">
                        ${story.badge1 ? `<span class="chapter-badge">${story.badge1}</span>` : ''}
                        ${story.badge2 ? `<span class="volume-badge">${story.badge2}</span>` : ''}
                    </div>
                    <div style="padding: 30px; height: 100%; display: flex; flex-direction: column; justify-content: center; background: rgba(255,255,255,0.05);">
                        <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.2rem;">${story.title}</h3>
                        <p style="font-size: 0.85rem; opacity: 0.6;">${story.desc}</p>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    function renderMicroLessons(lessons, headings) {
        if (!lessons) return;
        lessons.forEach((lesson, i) => {
            const headEl = document.getElementById(`tip-head-${i + 1}`);
            const contentEl = document.getElementById(`tip-content-${i + 1}`);
            if (headEl && headings && headings[i]) headEl.textContent = headings[i];
            if (contentEl) contentEl.textContent = lesson;
        });
    }

    function renderBottomMarquee(banners) {
        const container = document.getElementById('bottom-banner-marquee');
        if (!container || !banners || banners.length === 0) return;
        container.innerHTML = '';

        // Use document fragment for efficiency
        const fragment = document.createDocumentFragment();

        // Duplicate once for seamless loop
        const list = [...banners, ...banners];
        list.forEach(img => {
            const url = window.getSupabaseImageUrl ? window.getSupabaseImageUrl(img) : img;
            const imgEl = document.createElement('img');
            imgEl.src = url;
            imgEl.loading = "lazy";
            imgEl.style.cssText = "height: 120px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;";
            imgEl.alt = "Banner";
            fragment.appendChild(imgEl);
        });
        container.appendChild(fragment);

        // Dynamic speed based on image count
        const duration = Math.max(20, banners.length * 5);
        container.style.animationDuration = `${duration}s`;
    }

    function renderImageManager1(images) {
        const container = document.getElementById('home-image-layout-1');
        if (!container) return;

        if (!images || images.length === 0) {
            console.log("Image Manager: No images to render.");
            container.style.display = 'none';
            return;
        }

        console.log("Image Manager: Creating carousel with " + images.length + " images.");
        container.style.display = 'block';
        container.style.position = 'relative';
        container.innerHTML = '';

        // Create carousel wrapper
        const carouselWrapper = document.createElement('div');
        carouselWrapper.style.cssText = `
            position: relative;
            width: 100%;
            height: 400px;
            margin: 0 auto;
            overflow: hidden;
            border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.1);
        `;

        // Add all images as slides
        images.forEach((img, index) => {
            if (!img.url) return;
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: ${index === 0 ? '1' : '0'};
                transition: opacity 1s ease-in-out;
            `;
            slide.innerHTML = `<img src="${img.url}" alt="${img.alt || 'Image'}" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
            carouselWrapper.appendChild(slide);
        });

        container.appendChild(carouselWrapper);

        // Auto-rotate carousel
        if (images.length > 1) {
            let currentIndex = 0;
            const slides = carouselWrapper.querySelectorAll('.carousel-slide');

            setInterval(() => {
                // Hide current slide
                slides[currentIndex].style.opacity = '0';

                // Move to next slide
                currentIndex = (currentIndex + 1) % images.length;

                // Show next slide
                slides[currentIndex].style.opacity = '1';
            }, 5000); // Change image every 5 seconds
        }
    }

    function renderCustomHomeSections(sections, library) {
        const container = document.getElementById('dynamic-home-sections');
        if (!container) return;

        // Clear container first
        container.innerHTML = '';

        if (!sections || sections.length === 0) return;

        sections.forEach((sec, idx) => {
            // Skip if no items to show, to prevent empty rows
            if (!sec.items || sec.items.length === 0) return;

            const sectionId = `custom-sec-${idx}`;
            const iconHtml = sec.icon ? `<span style="margin-right: 10px;">${sec.icon}</span>` : '';

            // Use popup for view all, fallback to library if no items
            const viewAllAction = `openSectionModal('custom', ${idx}); return false;`;

            const html = `
                <section style="margin-bottom: 80px; max-width: var(--max-width); margin-left: auto; margin-right: auto; width: 100%; box-sizing: border-box; padding: 0 var(--spacing-unit);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px;">
                    <h2 style="font-size: var(--font-size-h3); margin: 0; color: #fff; display: flex; align-items: center;">
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
            renderBookListSection(sectionId, sec.items || [], library);
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
                            <h4 style="color: #fff; margin: 0; font-size: 0.95rem;">${book.title}</h4>
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

            // 4. Inject In-Content Ads for Reader Page
            const readerContent = document.getElementById('reader-content-display');
            if (readerContent) {
                const paragraphs = readerContent.innerText.split('\n\n');
                if (paragraphs.length > freqCount) {
                    let newHtml = '';
                    paragraphs.forEach((p, i) => {
                        newHtml += `<p>${p}</p>`;
                        if ((i + 1) % freqCount === 0 && i !== paragraphs.length - 1) {
                            newHtml += `
                            <div class="ad-container ad-middle" style="margin: 40px 0;">
                                <span class="ad-label">Advertisement</span>
                                <ins class="adsbygoogle"
                                     style="display:block; text-align:center;"
                                     data-ad-layout="in-article"
                                     data-ad-format="fluid"
                                     data-ad-client="${adsenseId}"
                                     data-ad-slot="in-content-${i}"></ins>
                            </div>
                        `;
                            try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
                        }
                    });
                    readerContent.innerHTML = newHtml;
                }
            }

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

                    const ipResponse = await fetch('https://api.ipify.org?format=json', {
                        signal: controller.signal
                    }).catch(() => null);

                    clearTimeout(timeoutId);

                    if (ipResponse && ipResponse.ok) {
                        const ipData = await ipResponse.json();
                        ip = ipData.ip;
                        sessionStorage.setItem('cached_user_ip', ip);
                    }
                } catch (e) { }
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

    // --- Daily Mindset Modal ---
    window.openDailyModal = async function () {
        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !supabaseClient) {
            alert("Daily Mindset is not available offline.");
            return;
        }

        // Show loading state (simple alert or toast for now, or build a modal)
        // We'll build a custom modal dynamically
        const existingModal = document.getElementById('daily-mindset-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'daily-mindset-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            opacity: 0; transition: opacity 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="background: var(--color-card-bg); padding: 30px; border-radius: 16px; max-width: 500px; width: 90%; text-align: center; border: 1px solid var(--color-border); box-shadow: 0 10px 40px rgba(0,0,0,0.5); transform: scale(0.9); transition: transform 0.3s ease;">
                <div class="spinner" style="margin: 20px auto;"></div>
                <p>Loading Daily Insight...</p>
            </div>
        `;
        document.body.appendChild(modal);

        // Trigger generic animation
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.querySelector('div').style.transform = 'scale(1)';
        });

        try {
            const { data, error } = await supabaseClient
                .from('daily_mindset')
                .select('id, inspiration_text, title, date')
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            const esc = window.escapeHTML || (s => s);

            if (!data) {
                modal.querySelector('div').innerHTML = `
                    <h2 style="margin-bottom: 10px;">Check Back Later</h2>
                    <p>No insight for today yet.</p>
                    <button id="close-daily-modal" style="background: var(--color-accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 20px; cursor: pointer;">Close</button>
                `;
            } else {
                const sDate = new Date(data.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                const sMessage = esc(data.inspiration_text);
                const sAuthor = data.title || 'Daily Wisdom'; // Use title as author/header fallback

                modal.querySelector('div').innerHTML = `
                    <h3 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-accent); margin-bottom: 10px;">Daily Mindset</h3>
                    <h2 style="font-size: 1.8rem; margin-bottom: 15px; font-family: var(--font-heading);">${esc(sDate)}</h2>
                    <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px; font-style: italic;">"${sMessage}"</div>
                    <p style="opacity: 0.7; margin-bottom: 20px;">— ${sAuthor}</p>
                    <button id="close-daily-modal" style="background: var(--color-accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Reflect & Close</button>
                `;
            }
        } catch (e) {
            console.error("Failed to load daily mindset:", e);
            modal.querySelector('div').innerHTML = `
                <h3 style="color: #ef4444;">Error</h3>
                <p>Could not load today's insight.</p>
                <button id="close-daily-modal" style="background: #333; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-top: 20px; cursor: pointer;">Close</button>
            `;
        }

        // Close logic
        const closeBtn = document.getElementById('close-daily-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            };
        }
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            }
        };
    };

    // Start initialization
    initializeSite();
});
