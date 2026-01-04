// Settings and Homepage Management for Admin Panel

window.homepageConfig = {
    heroTitle: "",
    heroSubtitle: "",
    tips: ["", "", ""],
    tipHeadings: ["", "", ""],
    topics: [],
    exclusive: [],
    popular: [],
    stories: [],
    customSections: []
};

window.saveSettings = function () {
    customConfirm("Save changes to site settings?", "Save Settings", "⚙️").then(confirmed => {
        if (!confirmed) return;

        const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');

        // SEO & Global Meta
        settings.title = document.getElementById('setting-site-title').value;
        settings.desc = document.getElementById('setting-site-desc').value;
        settings.gaId = document.getElementById('set-ga-id').value;
        settings.siteUrl = document.getElementById('set-site-url').value;

        // Monetization & Ads
        settings.adsenseId = document.getElementById('set-adsense-id').value;
        settings.autoAds = document.getElementById('set-enable-autoads').value;
        settings.sidebarAdSlot = document.getElementById('set-ad-slot-sidebar').value;
        settings.adFrequency = document.getElementById('set-ad-frequency').value;

        // Branding & Contact
        settings.email = document.getElementById('setting-contact-email').value;
        settings.adminCode = document.getElementById('set-admin-code').value;

        // Footer & Scripts
        settings.footerText = document.getElementById('set-footer-text').value;
        settings.headerTags = document.getElementById('set-header-tags').value;

        localStorage.setItem('siteSettings', JSON.stringify(settings));
        if (typeof syncToCloud === 'function') syncToCloud('settings', settings);
        showToast("Site settings saved successfully!");
    });
};

window.loadSettings = function () {
    const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');

    // SEO & Global Meta
    if (document.getElementById('setting-site-title')) document.getElementById('setting-site-title').value = settings.title || '';
    if (document.getElementById('setting-site-desc')) document.getElementById('setting-site-desc').value = settings.desc || '';
    if (document.getElementById('set-ga-id')) document.getElementById('set-ga-id').value = settings.gaId || '';
    if (document.getElementById('set-site-url')) document.getElementById('set-site-url').value = settings.siteUrl || '';

    // Monetization & Ads
    if (document.getElementById('set-adsense-id')) document.getElementById('set-adsense-id').value = settings.adsenseId || '';
    if (document.getElementById('set-enable-autoads')) document.getElementById('set-enable-autoads').value = settings.autoAds || 'true';
    if (document.getElementById('set-ad-slot-sidebar')) document.getElementById('set-ad-slot-sidebar').value = settings.sidebarAdSlot || '';
    if (document.getElementById('set-ad-frequency')) document.getElementById('set-ad-frequency').value = settings.adFrequency || 'med';

    // Branding & Contact
    if (document.getElementById('setting-contact-email')) document.getElementById('setting-contact-email').value = settings.email || '';
    if (document.getElementById('set-admin-code')) document.getElementById('set-admin-code').value = settings.adminCode || '';

    // Footer & Scripts
    if (document.getElementById('set-footer-text')) document.getElementById('set-footer-text').value = settings.footerText || '';
    if (document.getElementById('set-header-tags')) document.getElementById('set-header-tags').value = settings.headerTags || '';

    if (typeof initTaxonomy === 'function') initTaxonomy();
    renderTaxonomyManager();
};

window.renderTaxonomyManager = function () {
    const container = document.getElementById('taxonomy-list-container');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(categoryMap).forEach(key => {
        const typeData = categoryMap[key];
        const row = document.createElement('div');
        row.style.cssText = "background: rgba(255,255,255,0.03); padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); position: relative;";

        // Header (Type Info)
        const header = document.createElement('div');
        header.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px;";
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.5rem;">${typeData.icon || '📄'}</span>
                <div>
                    <h4 style="margin: 0; color: #fff; text-transform: capitalize;">${key}</h4>
                    <span style="font-size: 0.8rem; color: #64748b;">Key: ${key}</span>
                </div>
            </div>
            <button class="btn-primary" onclick="removeContentType('${key}')" style="background: #ef4444; padding: 5px 10px; font-size: 0.8rem;">Remove Type</button>
        `;
        row.appendChild(header);

        // Genres List
        const genresContainer = document.createElement('div');
        genresContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px;";

        if (typeData.genres && typeData.genres.length > 0) {
            typeData.genres.forEach((genre, idx) => {
                const badge = document.createElement('div');
                badge.style.cssText = "background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;";
                badge.innerHTML = `
                    ${genre}
                    <span onclick="removeGenre('${key}', ${idx})" style="cursor: pointer; color: #ef4444; font-weight: bold;">×</span>
                `;
                genresContainer.appendChild(badge);
            });
        } else {
            genresContainer.innerHTML = '<span style="color: #64748b; font-size: 0.9rem;">No genres defined.</span>';
        }
        row.appendChild(genresContainer);

        // Add Genre Input
        const inputRow = document.createElement('div');
        inputRow.style.cssText = "display: flex; gap: 10px;";
        inputRow.innerHTML = `
            <input type="text" id="new-genre-${key}" placeholder="Add genre..." style="flex: 1; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px; border-radius: 6px;">
            <button class="btn-primary" onclick="addGenre('${key}')" style="padding: 5px 15px;">+</button>
        `;
        row.appendChild(inputRow);

        container.appendChild(row);
    });
};

window.addContentType = function () {
    const key = document.getElementById('new-type-key').value.trim().toLowerCase();
    const icon = document.getElementById('new-type-icon').value.trim();
    const genre = document.getElementById('new-type-genre').value.trim();

    if (!key) {
        showToast("Please enter a type key (e.g. podcast)", "error");
        return;
    }
    if (categoryMap[key]) {
        showToast("This content type already exists!", "error");
        return;
    }

    categoryMap[key] = {
        icon: icon || '📄',
        genres: genre ? [genre] : []
    };

    saveTaxonomy();
    renderTaxonomyManager();

    // Clear inputs
    document.getElementById('new-type-key').value = '';
    document.getElementById('new-type-icon').value = '';
    document.getElementById('new-type-genre').value = '';
};

window.removeContentType = function (key) {
    customConfirm(`Delete content type "${key}"? This might affect existing items.`, "Delete Type", "⚠️").then(confirmed => {
        if (!confirmed) return;
        delete categoryMap[key];
        saveTaxonomy();
        renderTaxonomyManager();
    });
};

window.addGenre = function (key) {
    const input = document.getElementById(`new-genre-${key}`);
    const val = input.value.trim();
    if (!val) return;

    if (!categoryMap[key].genres) categoryMap[key].genres = [];
    if (categoryMap[key].genres.includes(val)) {
        showToast("Genre already exists!", "error");
        return;
    }

    categoryMap[key].genres.push(val);
    saveTaxonomy();
    renderTaxonomyManager();
};

window.removeGenre = function (key, index) {
    if (categoryMap[key] && categoryMap[key].genres) {
        categoryMap[key].genres.splice(index, 1);
        saveTaxonomy();
        renderTaxonomyManager();
    }
};

window.saveTaxonomy = function () {
    localStorage.setItem('siteTaxonomy', JSON.stringify(categoryMap));
    if (typeof syncToCloud === 'function') syncToCloud('taxonomy', categoryMap);
    showToast("Content types updated successfully!");

    // Also update existing dropdowns if visible
    if (typeof updateSubcategories === 'function') {
        // Refresh type select if it exists
        const typeSelect = document.getElementById('content-type');
        if (typeSelect) {
            const current = typeSelect.value;
            typeSelect.innerHTML = '';
            Object.keys(categoryMap).forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = `${categoryMap[k].icon} ${k.charAt(0).toUpperCase() + k.slice(1)}`;
                typeSelect.appendChild(opt);
            });
            if (categoryMap[current]) typeSelect.value = current;
            updateSubcategories();
        }
    }
};

window.saveDetailCommons = function () {
    const commons = {
        features: [
            {
                title: document.getElementById('common-feat-1-title').value,
                desc: document.getElementById('common-feat-1-desc').value,
                color: document.getElementById('common-feat-1-color').value
            },
            {
                title: document.getElementById('common-feat-2-title').value,
                desc: document.getElementById('common-feat-2-desc').value,
                color: document.getElementById('common-feat-2-color').value
            },
            {
                title: document.getElementById('common-feat-3-title').value,
                desc: document.getElementById('common-feat-3-desc').value,
                color: document.getElementById('common-feat-3-color').value
            },
            {
                title: document.getElementById('common-feat-4-title').value,
                desc: document.getElementById('common-feat-4-desc').value,
                color: document.getElementById('common-feat-4-color').value
            }
        ],
        reviewHighlight: {
            show: document.getElementById('common-review-show').checked,
            text: document.getElementById('common-review-text').value,
            name: document.getElementById('common-review-name').value
        }
    };

    localStorage.setItem('siteDetailCommons', JSON.stringify(commons));
    if (typeof syncToCloud === 'function') syncToCloud('commons', commons);

    showToast("Detail Page Commons saved! Updates will reflect on all book pages.");
};

window.loadDetailCommons = function () {
    const saved = localStorage.getItem('siteDetailCommons');
    if (!saved) return;

    try {
        const commons = JSON.parse(saved);

        // Features
        if (commons.features) {
            commons.features.forEach((feat, idx) => {
                const i = idx + 1;
                const titleEl = document.getElementById(`common-feat-${i}-title`);
                const descEl = document.getElementById(`common-feat-${i}-desc`);
                const colorEl = document.getElementById(`common-feat-${i}-color`);

                if (titleEl) titleEl.value = feat.title || '';
                if (descEl) descEl.value = feat.desc || '';
                if (colorEl) colorEl.value = feat.color || '#3b82f6';
            });
        }

        // Review Highlight
        if (commons.reviewHighlight) {
            const showEl = document.getElementById('common-review-show');
            const textEl = document.getElementById('common-review-text');
            const nameEl = document.getElementById('common-review-name');

            if (showEl) showEl.checked = commons.reviewHighlight.show;
            if (textEl) textEl.value = commons.reviewHighlight.text || '';
            if (nameEl) nameEl.value = commons.reviewHighlight.name || '';
        }
    } catch (e) {
        console.error("Error loading detail commons:", e);
    }
};


window.updateSubcategories = function () {
    const type = document.getElementById('content-type').value;
    const genreSelect = document.getElementById('content-genre');
    if (!genreSelect) return;

    genreSelect.innerHTML = '';

    if (categoryMap[type] && categoryMap[type].genres) {
        categoryMap[type].genres.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.toLowerCase();
            opt.textContent = g;
            genreSelect.appendChild(opt);
        });
    }
};
