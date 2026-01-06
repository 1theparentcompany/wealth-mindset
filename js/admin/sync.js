// Supabase Cloud Sync Module
if (!window.HOMEPAGE_SETTINGS_ID) {
    window.HOMEPAGE_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';
}

window.syncToCloud = async function (type, data, identifier = null) {
    if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !supabaseClient) {
        console.warn("Supabase not configured, skipping sync.");
        return;
    }

    try {
        switch (type) {
            case 'library':
            case 'book':
                const book = data;

                // Sanitize cover image path
                let coverImage = book.image || book.cover || 'assets/logo-new.png';
                if (coverImage === 'logo-new.png') coverImage = 'assets/logo-new.png';

                const bookPayload = {
                    title: book.title,
                    author: book.author || 'James Allen',
                    description: book.description || '',
                    cover_image: coverImage,
                    background_image: (book.backgroundSettings && book.backgroundSettings.detailUrl) || book.background_image || book.backgroundImage || '',
                    original_book_id: book.original_book_id || null,
                    language: book.language || 'en',
                    // CRITICAL FIX: Map 'type' (Book/Article) to 'category' column because reader.html/books.js uses 'category' column as 'type'
                    category: book.type || 'book',
                    detail_settings: {
                        ...(book.detailSettings || {}),
                        coverDesign: book.coverDesign || {},
                        type: book.type || 'book',
                        genre: book.genre || (book.detailSettings && book.detailSettings.genres) || '',
                        relatedItems: book.relatedItems || []
                    },
                    status: book.status || 'published',
                    sort_order: book.sort_order || 100
                };

                let existingBook = null;

                // 1. Try to find by ID if valid UUID
                if (book.id && book.id.match(/^[0-9a-fA-F-]{36}$/)) {
                    const { data: foundById } = await supabaseClient
                        .from('books')
                        .select('id')
                        .eq('id', book.id)
                        .maybeSingle();
                    if (foundById) existingBook = foundById;
                }

                // 2. If not found by ID, try to find by Title (to prevent duplicates)
                if (!existingBook && book.title) {
                    const { data: foundByTitle } = await supabaseClient
                        .from('books')
                        .select('id')
                        .eq('title', book.title)
                        .maybeSingle();
                    if (foundByTitle) existingBook = foundByTitle;
                }

                if (existingBook) {
                    bookPayload.id = existingBook.id;
                }

                // Perform Upsert (now safer with ID if it exists)
                // Explicitly sanitize payload to remove any 'public_domain' or legacy fields
                const sanitizedPayload = {
                    ...bookPayload
                };
                delete sanitizedPayload.public_domain;
                if (sanitizedPayload.publicDomain) delete sanitizedPayload.publicDomain;

                console.log("Syncing Book Payload:", sanitizedPayload);

                const { data: savedBook, error: bookError } = await supabaseClient
                    .from('books')
                    .upsert(sanitizedPayload)
                    .select('id, title, author, status') // Select only what we need to avoid schema cache conflicts
                    .single();

                if (bookError) throw bookError;

                if (book.chapters && book.chapters.length > 0) {
                    const bookId = savedBook.id;
                    // Delete existing chapters to ensure clean sync (optional but safer)
                    await supabaseClient.from('chapters').delete().eq('book_id', bookId);

                    for (let i = 0; i < book.chapters.length; i++) {
                        const ch = book.chapters[i];
                        if (!ch) continue;

                        const rawContent = ch.content || '';
                        const sanitizedContent = typeof DOMPurify !== 'undefined' ?
                            DOMPurify.sanitize(rawContent) :
                            rawContent;

                        const chapterPayload = {
                            book_id: bookId,
                            chapter_number: i + 1,
                            title: ch.title || `Chapter ${i + 1}`,
                            content: sanitizedContent,
                            description: ch.description || '',
                            background_image: ch.backgroundImage || '',
                            background_style: ch.backgroundStyle || 'cover',
                            audio_url: ch.musicUrl || ch.audioUrl || '',
                            music_volume: isNaN(parseInt(ch.musicVolume)) ? 30 : parseInt(ch.musicVolume),
                            music_loop: ch.musicLoop !== false,
                            reading_time: ch.readingTime || '',
                            chapter_type: ch.chapterType || 'standard',
                            visibility: ch.visibility || 'public',
                            custom_css: ch.customCss || '',
                            language: ch.language || book.language || 'en',
                            status: 'published'
                        };

                        console.log(`Syncing Chapter ${i + 1} Payload:`, chapterPayload);

                        const { error: chError } = await supabaseClient.from('chapters').insert(chapterPayload);
                        if (chError) {
                            console.error(`Error inserting chapter ${i + 1}:`, chError);
                            throw chError;
                        }
                    }
                }

                // Clear detail page cache to ensure updates are visible immediately
                if (typeof CacheUtils !== 'undefined') {
                    CacheUtils.clear(`book_detail_${savedBook.id}`);
                    console.log(`[Sync] Cleared detail cache for: ${savedBook.id}`);
                }
                break;
            case 'library_delete':
                await supabaseClient.from('books').delete().eq('id', identifier);
                break;
            case 'library_update':
                // Targeted update for status/sort_order from Library Manager
                if (data && data.id) {
                    const updatePayload = {
                        status: data.status,
                        sort_order: data.sort_order
                    };
                    const { error: updateError } = await supabaseClient
                        .from('books')
                        .update(updatePayload)
                        .eq('id', data.id);
                    if (updateError) throw updateError;
                }
                break;
            case 'settings':
                await supabaseClient.from('admin_settings').upsert({
                    id: '00000000-0000-0000-0000-000000000001',
                    site_title: data.title || '',
                    site_description: data.desc || '',
                    ga_id: data.gaId || '',
                    site_url: data.siteUrl || '',
                    adsense_id: data.adsenseId || '',
                    auto_ads_enabled: data.autoAds === 'true',
                    sidebar_ad_slot: data.sidebarAdSlot || '',
                    ad_frequency: data.adFrequency || 'med',
                    support_email: data.email || '',
                    admin_access_code: data.adminCode || '',
                    footer_copyright: data.footerText || '',
                    header_tags: data.headerTags || '',
                    maintenance_mode: data.maintenanceMode === true
                });
                break;
            case 'homepage':
                await supabaseClient.from('homepage_settings').upsert({
                    id: window.HOMEPAGE_SETTINGS_ID,
                    hero_title: data.heroTitle || '',
                    hero_subtitle: data.heroSubtitle || '',
                    exclusive_collection: data.exclusive || [],
                    popular_books: data.popular || [],
                    success_stories: data.stories || [],
                    browse_topics: data.topics || [],
                    micro_lessons: data.tips || [],
                    micro_lesson_headings: data.tipHeadings || [],
                    custom_sections: data.customSections || [],
                    image_manager_1: data.imageManager1 || []
                });
                break;
            case 'images':
                await supabaseClient.from('homepage_settings').upsert({
                    id: window.HOMEPAGE_SETTINGS_ID,
                    // slider_images: data.carousel || [], // Removed
                    bottom_banners: data.bottomBanners || data.bottomBanner || []
                });
                break;
            case 'stories':
                await supabaseClient.from('stories').upsert({
                    title: data.title,
                    content: data.content,
                    moral: data.moral || '',
                    category: data.category || 'Success Story',
                    featured: data.featured || false
                });
                break;
            case 'quotes':
                await supabaseClient.from('quotes').upsert({
                    quote: data.text || data.quote,
                    author: data.author || 'Anonymous'
                });
                break;
            case 'taxonomy':
                await supabaseClient.from('admin_settings').upsert({
                    id: '00000000-0000-0000-0000-000000000001',
                    content_types: data
                });
                break;
            case 'site_feedback':
            case 'feedback':
                await supabaseClient.from('site_feedback').insert({
                    name: data.name,
                    email: data.email || '',
                    topic: data.topic || 'general',
                    message: data.message,
                    status: data.status || 'unread',
                    secret_code: data.secretCode || ''
                });
                break;
        }
        console.log(`Cloud sync success: ${type}`);
    } catch (e) {
        if (e.code === '401' || e.message?.includes('401')) {
            console.error(`Cloud sync 401 Unauthorized for ${type}. Check RLS policies.`);
            showToast(`Sync failed: Unauthorized (401). Check database permissions.`, 'error');
        } else {
            console.error(`Cloud sync failed: ${type}`, e);
            showToast(`Sync failed for ${type}: ${e.message || 'Unknown error'}`, 'error');
        }
    }
};

window.syncFromCloud = async function () {
    if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !supabaseClient) {
        console.warn("Supabase not configured, skipping initial fetch.");
        return;
    }

    console.log("Starting full sync from cloud...");

    try {
        // 1. Fetch Library Data
        const { data: books, error: booksError } = await supabaseClient
            .from('books')
            .select('*')
            .order('sort_order', { ascending: true });

        if (booksError) throw booksError;

        const { data: chapters, error: chaptersError } = await supabaseClient
            .from('chapters')
            .select('*')
            .order('book_id', { ascending: true })
            .order('chapter_number', { ascending: true });

        if (chaptersError) throw chaptersError;

        // Reconstruct local siteLibrary
        const reconstructedLibrary = books.map(book => {
            const bookChapters = chapters
                .filter(ch => ch.book_id === book.id)
                .map(ch => ({
                    title: ch.title,
                    content: ch.content,
                    description: ch.description,
                    backgroundImage: ch.background_image,
                    backgroundStyle: ch.background_style,
                    musicUrl: ch.audio_url,
                    audioUrl: ch.audio_url,
                    musicVolume: ch.music_volume,
                    musicLoop: ch.music_loop,
                    readingTime: ch.reading_time,
                    chapterType: ch.chapter_type,
                    visibility: ch.visibility,
                    customCss: ch.custom_css,
                    language: ch.language
                }));

            return {
                id: book.id,
                title: book.title,
                author: book.author,
                description: book.description,
                image: book.cover_image,
                // CRITICAL FIX: Read 'type' from 'category' column (matches reader logic)
                type: book.category || 'book',
                // CRITICAL FIX: Read 'genre' from 'detail_settings.genre'
                genre: (book.detail_settings && book.detail_settings.genre) || book.genre || '',
                status: book.status,
                sort_order: book.sort_order,
                language: book.language,
                original_book_id: book.original_book_id,
                detailSettings: book.detail_settings,
                chapters: bookChapters,
                timestamp: book.created_at
            };
        });

        localStorage.setItem('siteLibrary', JSON.stringify(reconstructedLibrary));

        // 2. Fetch Settings
        const { data: settings, error: settingsError } = await supabaseClient
            .from('admin_settings')
            .select('*')
            .limit(1)
            .maybeSingle();

        if (settings && !settingsError) {
            localStorage.setItem('siteSettings', JSON.stringify({
                title: settings.site_title || '',
                desc: settings.site_description || '',
                gaId: settings.ga_id || '',
                siteUrl: settings.site_url || '',
                adsenseId: settings.adsense_id || '',
                autoAds: settings.auto_ads_enabled ? 'true' : 'false',
                sidebarAdSlot: settings.sidebar_ad_slot || '',
                adFrequency: settings.ad_frequency || 'med',
                email: settings.support_email || '',
                adminCode: settings.admin_access_code || '',
                footerText: settings.footer_copyright || '',
                headerTags: settings.header_tags || '',
                maintenanceMode: settings.maintenance_mode
            }));

            if (settings.content_types) {
                localStorage.setItem('siteTaxonomy', JSON.stringify(settings.content_types));
                window.categoryMap = settings.content_types;
            }
        }

        // 3. Fetch Homepage Data
        const { data: hp, error: hpError } = await supabaseClient
            .from('homepage_settings')
            .select('*')
            .eq('id', window.HOMEPAGE_SETTINGS_ID)
            .maybeSingle();

        if (hp && !hpError) {
            // A. Update siteHomepageConfig (Content & Text)
            const homepageConfig = {
                heroTitle: hp.hero_title || '',
                heroSubtitle: hp.hero_subtitle || '',
                exclusive: hp.exclusive_collection || [],
                popular: hp.popular_books || [],
                stories: hp.success_stories || [],
                topics: hp.browse_topics || [],
                tips: hp.micro_lessons || [],
                tipHeadings: hp.micro_lesson_headings || [],
                customSections: hp.custom_sections || []
            };
            localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));
            localStorage.setItem('homepageSettings', JSON.stringify(homepageConfig)); // Keep legacy key for safety

            // B. Update siteImageConfig (Visuals: Banners only)
            // const carouselRaw = hp.slider_images || []; // Removed
            const bannersRaw = hp.bottom_banners || [];

            // Save raw lists for Admin Panel Common Settings
            // localStorage.setItem('carouselImages', JSON.stringify(carouselRaw));
            localStorage.setItem('bottomImages', JSON.stringify(bannersRaw));

            // Construct config for index.html
            // Construct config for index.html (Now using raw format for consistency)
            const imageConfig = {
                // carousel: carouselRaw,
                bottomBanners: bannersRaw
            };
            localStorage.setItem('siteImageConfig', JSON.stringify(imageConfig));
        }

        // 4. Fetch Feedback (Optional, but good for consistency)
        const { data: feedback, error: fbError } = await supabaseClient
            .from('site_feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (!fbError && feedback) {
            localStorage.setItem('siteFeedback', JSON.stringify(feedback));
        }

        console.log("Cloud sync from cloud completed successfully.");
        return true;
    } catch (err) {
        console.error("Cloud sync from cloud failed:", err);
        return false;
    }
};

window.isSupabaseConfigured = function () {
    return typeof supabaseClient !== 'undefined' && supabaseClient !== null;
};

// --- Supabase Management Logic ---

window.updateSupabaseStatus = function (message, isError = false) {
    const statusEl = document.getElementById('supabase-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#ef4444' : '#00e676';
    }
};

window.testSupabaseConnection = async function () {
    if (!isSupabaseConfigured()) {
        updateSupabaseStatus("Supabase URL or Key not configured in supabase-config.js", true);
        return false;
    }

    updateSupabaseStatus("Testing connection...");

    if (!supabaseClient) {
        updateSupabaseStatus("❌ Supabase client not initialized. Check your API keys and internet connection.", true);
        return false;
    }

    try {
        const { data, error } = await supabaseClient.from('admin_settings').select('id').limit(1);

        if (error) {
            if (error.code === '42P01' || error.message.includes('relation "public.admin_settings" does not exist')) {
                updateSupabaseStatus("✅ Connected! (Note: V2 tables not created yet)");
                return true;
            }
            throw error;
        }
        updateSupabaseStatus("✅ Connected to Supabase V2!");
        return true;
    } catch (e) {
        console.error("Supabase Connection Error:", e);
        updateSupabaseStatus("❌ Connection failed: " + e.message, true);
        return false;
    }
};

window.migrateToSupabase = async function (type) {
    if (!isSupabaseConfigured()) {
        showToast("Please configure Supabase first!", 'warning');
        return;
    }

    customConfirm(`Start full V2 migration for ${type}? This will sync all local items to the new cloud schema.`, "Full Migration", "🚀")
        .then(confirmed => {
            if (!confirmed) return;
            performMigration(type);
        });
};

window.performMigration = async function (type) {
    updateSupabaseStatus(`Migrating ${type} (V2)...`);

    try {
        switch (type) {
            case 'library':
                const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
                if (library.length === 0) throw new Error("No local library data found.");

                for (const item of library) {
                    await syncToCloud('library', item);
                }
                break;

            case 'taxonomy':
                const categories = JSON.parse(localStorage.getItem('siteTaxonomy') || '{}');
                await syncToCloud('taxonomy', categories);
                break;

            case 'settings':
                const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
                await syncToCloud('settings', settings);
                break;

            case 'homepage':
                let hpConfig = JSON.parse(localStorage.getItem('siteHomepageConfig') || '{}');
                if (Object.keys(hpConfig).length === 0) {
                    hpConfig = JSON.parse(localStorage.getItem('homepageSettings') || '{}');
                }
                await syncToCloud('homepage', hpConfig);
                break;

            case 'images':
                // Use the standard syncToCloud structure for images (homepage_settings)
                // instead of the 'media' table which might not exist or be used.
                const imageConfig = {
                    carousel: JSON.parse(localStorage.getItem('carouselImages') || '[]'),
                    bottomBanners: JSON.parse(localStorage.getItem('bottomImages') || '[]')
                };
                await syncToCloud('images', imageConfig);
                break;

            case 'feedback':
                const feedback = JSON.parse(localStorage.getItem('siteFeedback') || '[]');
                for (const fb of feedback) {
                    await syncToCloud('site_feedback', fb);
                }
                break;
        }

        updateSupabaseStatus(`✅ V2 Migration complete for ${type}!`);
    } catch (e) {
        console.error("Migration failed:", e);
        updateSupabaseStatus(`❌ Migration failed: ${e.message}`, true);
    }
};

window.renderMigrationIndicators = function () {
    const types = ['library', 'taxonomy', 'settings', 'homepage', 'images', 'feedback'];
    const typeMap = {
        'library': 'siteLibrary',
        'taxonomy': 'siteTaxonomy',
        'settings': 'siteSettings',
        'homepage': 'homepageSettings',
        'images': 'carouselImages',
        'feedback': 'feedbackData'
    };

    // Max items reference for 100% width (simplified heuristic)
    const MAX_ITEMS = 10;

    types.forEach(type => {
        let itemCount = 0;
        let isComplete = false; // For single object types

        try {
            if (type === 'images') {
                const c = JSON.parse(localStorage.getItem('carouselImages') || '[]');
                const b = JSON.parse(localStorage.getItem('bottomImages') || '[]');
                itemCount = c.length + b.length;
            } else {
                const raw = localStorage.getItem(typeMap[type]);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        itemCount = parsed.length;
                    } else {
                        // For object types (settings, taxonomy key-map, homepage), 
                        // if keys exist, treat as "full" (100%) or calculate based on keys
                        itemCount = Object.keys(parsed).length > 0 ? MAX_ITEMS : 0;
                    }
                }
            }
        } catch (e) {
            console.warn(`Error checking data for ${type}:`, e);
        }

        // Calculate functionality
        let widthPercent = 0;
        if (itemCount > 0) {
            // Ensure at least 15% visibility if data exists
            widthPercent = Math.min((itemCount / MAX_ITEMS) * 100, 100);
            widthPercent = Math.max(widthPercent, 15);
        }

        const fill = document.querySelector(`.progress-fill[data-type="${type}"]`);
        if (fill) {
            fill.style.width = widthPercent + '%';
            // Use Warning Red (#ef4444) if data exists
            fill.style.background = itemCount > 0 ? '#ef4444' : 'transparent';
        }
    });
};

window.verifySchema = async function () {
    if (!isSupabaseConfigured()) {
        showToast("Supabase not configured.", "warning");
        return;
    }

    const tables = ['books', 'chapters', 'admin_settings', 'homepage_settings', 'stories', 'quotes', 'site_feedback'];
    let missing = [];

    updateSupabaseStatus("Verifying Schema...");

    for (const table of tables) {
        const { error } = await supabaseClient.from(table).select('count').limit(1);
        if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
            missing.push(table);
        }
    }

    if (missing.length > 0) {
        const msg = `Missing Tables: ${missing.join(', ')}`;
        console.error(msg);
        updateSupabaseStatus(`❌ Schema Incomplete. ${msg}`, true);
        showToast(msg, "error");
    } else {
        updateSupabaseStatus("✅ Schema Verified. All tables exist.");
        showToast("Schema Verified. All tables exist.", "success");
    }
};
