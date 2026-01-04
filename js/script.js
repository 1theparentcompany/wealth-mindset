document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // --- Theme Toggling ---
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isHomePage = body.classList.contains('home-theme');

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (isHomePage) body.classList.add('home-theme');
        if (toggleBtn) toggleBtn.textContent = '☀️';
    } else if (savedTheme === 'light') {
        body.classList.remove('dark-mode');
        body.classList.remove('home-theme');
        if (toggleBtn) toggleBtn.textContent = '🌙';
    } else {
        if (isHomePage || prefersDark) {
            if (toggleBtn) toggleBtn.textContent = '☀️';
            if (!isHomePage && prefersDark) body.classList.add('dark-mode');
        } else {
            if (toggleBtn) toggleBtn.textContent = '🌙';
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode') || body.classList.contains('home-theme');
            if (isDark) {
                body.classList.remove('dark-mode');
                body.classList.remove('home-theme');
                localStorage.setItem('theme', 'light');
                toggleBtn.textContent = '🌙';
            } else {
                body.classList.add('dark-mode');
                if (isHomePage) body.classList.add('home-theme');
                localStorage.setItem('theme', 'dark');
                toggleBtn.textContent = '☀️';
            }
        });
    }

    // --- Load Settings ---
    async function initializeSite() {
        let settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');

        // If Supabase is configured, try to fetch settings from cloud
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            try {
                // Fetch from new V2 admin_settings table
                const { data, error } = await supabaseClient.from('admin_settings').select('*').limit(1).single();
                if (data) {
                    // Map back to the keys expected by applySettings
                    settings = {
                        ...settings,
                        title: data.site_name || settings.title || 'Wealth & Mindset',
                        adsEnabled: data.ads_enabled !== undefined ? data.ads_enabled : settings.adsEnabled,
                        audioEnabled: data.audio_enabled !== undefined ? data.audio_enabled : settings.audioEnabled,
                        theme: data.theme || settings.theme || 'dark'
                    };
                    // Optionally sync back to localStorage for offline cache
                    localStorage.setItem('siteSettings', JSON.stringify(settings));
                }
            } catch (e) {
                console.warn("Supabase load failed, using local fallback", e);
            }
        }

        applySettings(settings);
    }

    function applySettings(settings) {
        const adsEnabled = settings.adsEnabled !== false; // Default to true if not set
        const adsenseId = settings.adsenseId || '';
        const customScript = settings.adScript || '';

        if (adsEnabled) {
            // 1. Custom Script Injection - Removed for security

            // 2. Inject Google AdSense Auto-Ads if ID is present
            if (adsenseId) {
                const adsenseScript = document.createElement('script');
                adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
                adsenseScript.async = true;
                adsenseScript.crossOrigin = "anonymous";
                document.head.appendChild(adsenseScript);
            }

            // 3. Replace Placeholders with Real Ad Units
            const placeholders = document.querySelectorAll('.ad-container, .vertical-ad-banner');
            placeholders.forEach((container, index) => {
                const innerBox = container.querySelector('div:not(.ad-label)');
                if (innerBox && adsenseId) {
                    const isVertical = container.classList.contains('vertical-ad-banner');
                    const slotId = `site-ad-${index}`;

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
            if (readerContent && adsenseId) {
                const paragraphs = readerContent.innerText.split('\n\n');
                if (paragraphs.length > 4) {
                    let newHtml = '';
                    paragraphs.forEach((p, i) => {
                        newHtml += `<p>${p}</p>`;
                        if ((i + 1) % 3 === 0 && i !== paragraphs.length - 1) {
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

        } else {
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
        logActivity('page_view', { title: document.title });

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
                } catch (e) {
                    console.log("Analytics: IP fetch blocked or failed");
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
                    browser: navigator.appName,
                    platform: navigator.platform,
                    userAgent: ua,
                    timestamp: new Date().toISOString()
                }
            };

            const { error } = await supabaseClient
                .from('user_activity')
                .insert(activity);

            // if (error) console.warn("Activity log failed", error); // Silenced for cleaner production log
        } catch (e) {
            // console.warn("Analytics error", e); // Silenced for cleaner production log
        }
    };

    // Global Tracking Helpers
    window.trackAdClick = function (adId, location) {
        window.logActivity('ad_click', { ad_id: adId, ad_location: location });
    };

    window.trackChapterRead = function (bookId, chapterId, timeSpentSeconds) {
        window.logActivity('chapter_read', { book_id: bookId, chapter_id: chapterId, time_spent: timeSpentSeconds });
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
                .select('*')
                .eq('status', 'active')
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
                const sMessage = esc(data.message);
                const sAuthor = esc(data.author);

                modal.querySelector('div').innerHTML = `
                    <h3 style="font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-accent); margin-bottom: 10px;">Daily Mindset</h3>
                    <h2 style="font-size: 1.8rem; margin-bottom: 15px; font-family: var(--font-heading);">${esc(sDate)}</h2>
                    <div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px; font-style: italic;">"${sMessage}"</div>
                    ${data.author ? `<p style="opacity: 0.7; margin-bottom: 20px;">— ${sAuthor}</p>` : ''}
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
