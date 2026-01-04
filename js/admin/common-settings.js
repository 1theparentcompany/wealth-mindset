// Common Settings Management (Carousel, Banners, Tips, Branding, Covers, Detail Defaults)

window.switchCommonTab = function (tabId) {
    document.querySelectorAll('.common-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.common-tab-content').forEach(content => content.classList.remove('active'));

    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
    const content = document.getElementById(tabId);
    if (content) content.classList.add('active');
};

window.loadCommonSettings = function () {
    const settings = JSON.parse(localStorage.getItem('commonSettings') || '{}');
    const homepageConfig = JSON.parse(localStorage.getItem('siteHomepageConfig') || '{}');

    if (typeof loadTab1CarouselImages === 'function') loadTab1CarouselImages();
    if (typeof loadTab2BottomImages === 'function') loadTab2BottomImages();

    if (homepageConfig.tips && Array.isArray(homepageConfig.tips)) {
        for (let i = 1; i <= 3; i++) {
            const tipEl = document.getElementById(`common-tip-${i}`);
            const headEl = document.getElementById(`common-tip-head-${i}`);
            if (tipEl) tipEl.value = homepageConfig.tips[i - 1] || '';
            if (headEl) headEl.value = (homepageConfig.tipHeadings && homepageConfig.tipHeadings[i - 1]) || '';
        }
    }

    if (document.getElementById('common-hero-title')) {
        document.getElementById('common-hero-title').value = homepageConfig.heroTitle || 'Wealth & Mindset';
        document.getElementById('common-hero-subtitle').value = homepageConfig.heroSubtitle || '';

        // Sanitize logo URL
        let logoUrl = homepageConfig.logoUrl || 'assets/logo-new.png';
        if (logoUrl === 'logo-new.png') logoUrl = 'assets/logo-new.png';

        document.getElementById('common-logo-url').value = logoUrl;
        document.getElementById('common-site-tagline').value = homepageConfig.tagline || 'Read Smart. Think Wealth.';
    }

    loadTab5Books();

    const detailCommons = JSON.parse(localStorage.getItem('siteDetailCommons') || '{}');
    if (detailCommons.features) {
        for (let i = 1; i <= 4; i++) {
            const feat = detailCommons.features[i - 1] || {};
            if (document.getElementById(`common-feat-title-${i}`))
                document.getElementById(`common-feat-title-${i}`).value = feat.title || '';
            if (document.getElementById(`common-feat-desc-${i}`))
                document.getElementById(`common-feat-desc-${i}`).value = feat.desc || '';
            if (document.getElementById(`common-feat-color-${i}`))
                document.getElementById(`common-feat-color-${i}`).value = feat.color || '';
        }
    }
    if (document.getElementById('common-detail-show-review-snippet')) {
        const showReview = detailCommons.showReviewSnippet || 'no';
        document.getElementById('common-detail-show-review-snippet').value = showReview;
        const snippetFields = document.getElementById('common-review-snippet-fields');
        if (snippetFields) snippetFields.style.display = showReview === 'yes' ? 'block' : 'none';
        document.getElementById('common-review-text').value = detailCommons.reviewText || '';
        document.getElementById('common-review-author').value = detailCommons.reviewAuthor || '';
    }
};

window.saveTab3Tips = function () {
    customConfirm("Save these tips to the homepage?", "Save Tips", "💡").then(confirmed => {
        if (!confirmed) return;

        const homepageConfig = JSON.parse(localStorage.getItem('siteHomepageConfig') || '{"tips":["","",""],"tipHeadings":["","",""]}');

        if (!homepageConfig.tips) homepageConfig.tips = ["", "", ""];
        if (!homepageConfig.tipHeadings) homepageConfig.tipHeadings = ["", "", ""];

        for (let i = 1; i <= 3; i++) {
            const tipEl = document.getElementById(`common-tip-${i}`);
            const headEl = document.getElementById(`common-tip-head-${i}`);
            if (tipEl) homepageConfig.tips[i - 1] = tipEl.value;
            if (headEl) homepageConfig.tipHeadings[i - 1] = headEl.value;
        }

        localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));
        if (typeof syncToCloud === 'function') syncToCloud('homepage', homepageConfig);
        showToast('Daily tips saved successfully!');
    });
};

window.saveTab4Branding = function () {
    customConfirm("Apply site branding changes?", "Update Branding", "🎨").then(confirmed => {
        if (!confirmed) return;

        const homepageConfig = JSON.parse(localStorage.getItem('siteHomepageConfig') || '{}');

        homepageConfig.heroTitle = document.getElementById('common-hero-title').value;
        homepageConfig.heroSubtitle = document.getElementById('common-hero-subtitle').value;
        homepageConfig.logoUrl = document.getElementById('common-logo-url').value;
        homepageConfig.tagline = document.getElementById('common-site-tagline').value;

        localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));
        if (typeof syncToCloud === 'function') syncToCloud('homepage', homepageConfig);
        showToast('Site branding saved successfully!');
    });
};

window.saveTab6DetailCommons = function () {
    customConfirm("Update common settings for all detail pages?", "Save Commons", "⚙️").then(confirmed => {
        if (!confirmed) return;

        const features = [];
        for (let i = 1; i <= 4; i++) {
            features.push({
                title: document.getElementById(`common-feat-title-${i}`).value,
                desc: document.getElementById(`common-feat-desc-${i}`).value,
                color: document.getElementById(`common-feat-color-${i}`).value
            });
        }

        const detailCommons = {
            features: features,
            showReviewSnippet: document.getElementById('common-detail-show-review-snippet').value,
            reviewText: document.getElementById('common-review-text').value,
            reviewAuthor: document.getElementById('common-review-author').value
        };

        localStorage.setItem('siteDetailCommons', JSON.stringify(detailCommons));
        if (typeof syncToCloud === 'function') syncToCloud('settings', detailCommons);
        showToast('Detail page common settings saved!');
    });
};

window.loadTab5Books = function () {
    const select = document.getElementById('common-cover-book-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select a Book --</option>';
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');

    library.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.title;
        select.appendChild(option);
    });
};

window.loadSelectedBookCover = function () {
    const bookId = document.getElementById('common-cover-book-select').value;
    const fields = document.getElementById('cover-designer-fields');
    const noSelection = document.getElementById('cover-no-selection');

    if (!bookId) {
        if (fields) fields.style.display = 'none';
        if (noSelection) noSelection.style.display = 'block';
        return;
    }

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const book = library.find(item => item.id === bookId);

    if (!book) return;

    if (fields) fields.style.display = 'block';
    if (noSelection) noSelection.style.display = 'none';

    const design = book.coverDesign || {};
    document.getElementById('common-cover-url').value = design.url || book.image || book.cover || '';
    document.getElementById('common-hero-bg-url').value = design.heroBgUrl || '';
    document.getElementById('common-cover-title').value = design.title || book.title || '';
    document.getElementById('common-cover-subtitle').value = design.subtitle || book.author || '';
    document.getElementById('common-hero-bg-color1').value = design.heroColor1 || '#1e3a8a';
    document.getElementById('common-hero-bg-color2').value = design.heroColor2 || '#7c3aed';

    document.getElementById('common-cover-badge-top').value = design.badgeTop || '';
    document.getElementById('common-cover-badge-bottom').value = design.badgeBottom || '';
    document.getElementById('common-cover-badge-top-color').value = design.badgeTopColor || '#0d9488';
    document.getElementById('common-cover-badge-bottom-color').value = design.badgeBottomColor || '#000000';

    document.getElementById('common-cover-align').value = design.align || 'center';
    document.getElementById('common-cover-valign').value = design.valign || 'middle';
    document.getElementById('common-cover-text-color').value = design.textColor || '#ffffff';
    document.getElementById('common-cover-shadow').value = design.shadow || '0 4px 10px rgba(0,0,0,0.8)';
};

window.saveTab5Cover = function () {
    const bookId = document.getElementById('common-cover-book-select').value;
    if (!bookId) return;

    customConfirm("Save and apply this cover design?", "Save Design", "🎨").then(confirmed => {
        if (!confirmed) return;

        const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        const bookIndex = library.findIndex(item => item.id === bookId);

        if (bookIndex === -1) return;

        const design = {
            url: document.getElementById('common-cover-url').value,
            heroBgUrl: document.getElementById('common-hero-bg-url').value,
            title: document.getElementById('common-cover-title').value,
            subtitle: document.getElementById('common-cover-subtitle').value,
            heroColor1: document.getElementById('common-hero-bg-color1').value,
            heroColor2: document.getElementById('common-hero-bg-color2').value,
            badgeTop: document.getElementById('common-cover-badge-top').value,
            badgeBottom: document.getElementById('common-cover-badge-bottom').value,
            badgeTopColor: document.getElementById('common-cover-badge-top-color').value,
            badgeBottomColor: document.getElementById('common-cover-badge-bottom-color').value,
            align: document.getElementById('common-cover-align').value,
            valign: document.getElementById('common-cover-valign').value,
            textColor: document.getElementById('common-cover-text-color').value,
            shadow: document.getElementById('common-cover-shadow').value
        };

        library[bookIndex].coverDesign = design;
        if (design.url) {
            library[bookIndex].image = design.url;
            library[bookIndex].cover = design.url;
        }

        localStorage.setItem('siteLibrary', JSON.stringify(library));
        if (typeof syncToCloud === 'function') syncToCloud('library', library[bookIndex]);
        showToast('Cover design saved and applied to book!');
    });
};

window.resetCoverDesigner = function () {
    customConfirm('Are you sure you want to reset the design fields?', 'Reset Design', '🧹')
        .then(confirmed => {
            if (confirmed) loadSelectedBookCover();
        });
};


// --- From Media.js: Carousel and Banners ---

window.getCarouselImages = function () {
    return JSON.parse(localStorage.getItem('carouselImages') || '[]');
};

window.saveCarouselImagesStorage = function (images) {
    localStorage.setItem('carouselImages', JSON.stringify(images));
    syncSiteImageConfig();
};

window.syncSiteImageConfig = function () {
    const carouselImages = getCarouselImages();
    const bottomImages = getBottomImages();

    const config = {
        carousel: carouselImages.map(img => ({
            img: img.url,
            title: img.heading || img.title,
            desc: img.title || '',
            badge: img.badge || '',
            color: '#3b82f6'
        })),
        bottomBanners: bottomImages.map(img => img.url)
    };

    localStorage.setItem('siteImageConfig', JSON.stringify(config));
    if (typeof syncToCloud === 'function') syncToCloud('images', config);
};

window.loadTab1CarouselImages = function () {
    const grid = document.getElementById('tab1-carousel-grid');
    const countBadge = document.getElementById('tab1-carousel-count');
    if (!grid) return;

    let images = getCarouselImages();
    if (countBadge) countBadge.textContent = `${images.length} Slide${images.length !== 1 ? 's' : ''}`;

    if (images.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;"><p style="font-size: 1.2rem; margin: 0;">No carousel images yet</p></div>';
        return;
    }

    grid.innerHTML = images.map((img, index) => {
        const displayUrl = (img.url === 'logo-new.png') ? 'assets/logo-new.png' : img.url;
        return `
        <div class="image-card">
            <img src="${displayUrl}" alt="${img.title}" onerror="this.src='assets/logo-new.png'">
            <div class="image-card-body">
                <h4>${img.title}</h4>
                <p>Slide #${index + 1}</p>
                <div style="margin: 10px 0; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px;">
                    <strong style="color: #3b82f6;">Badge:</strong> ${img.badge || 'None'}<br>
                    <strong style="color: #3b82f6;">Heading:</strong> ${img.heading || 'None'}
                </div>
                <div class="image-card-actions">
                    <button class="img-action-btn edit" onclick="editTab1CarouselImage('${img.id}')">✏️ Edit</button>
                    <button class="img-action-btn delete" onclick="deleteTab1CarouselImage('${img.id}')">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `}).join('');
};

window.openTab1AddImageModal = function () {
    const modalHtml = `
        <div id="tab1-image-modal" class="modal" style="display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="max-width: 600px; margin: 0;">
                <div class="modal-header">
                    <h3>Add Carousel Image</h3>
                    <span class="close-modal" onclick="closeTab1ImageModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img id="tab1-prev-img" src="assets/logo-new.png" style="max-height: 120px; max-width: 100%; border-radius: 8px; border: 2px solid #334155; object-fit: cover;" onerror="this.src='assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Image Title</label>
                        <input type="text" id="tab1-new-title" placeholder="e.g., Master Your Financial Destiny">
                    </div>
                    <div class="form-group-admin">
                        <label>Image URL</label>
                        <input type="text" id="tab1-new-url" placeholder="Enter image URL or path"
                            oninput="document.getElementById('tab1-prev-img').src = this.value || 'assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Badge Text</label>
                        <input type="text" id="tab1-new-badge" placeholder="e.g., Featured Guide">
                    </div>
                    <div class="form-group-admin">
                        <label>Main Heading</label>
                        <input type="text" id="tab1-new-heading" placeholder="e.g., Master Your Financial Destiny">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" style="background: #ef4444; margin-right: 10px;" onclick="closeTab1ImageModal()">Cancel</button>
                    <button class="btn-success" style="margin: 0;" onclick="saveTab1NewImage()">Add Image</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.closeTab1ImageModal = function () {
    const modal = document.getElementById('tab1-image-modal');
    if (modal) modal.remove();
};

window.saveTab1NewImage = function () {
    const title = document.getElementById('tab1-new-title').value;
    const url = document.getElementById('tab1-new-url').value;
    if (!title || !url) {
        showToast('Please fill in required fields', 'warning');
        return;
    }
    const images = getCarouselImages();
    images.push({
        id: 'carousel-' + Date.now(),
        title: title,
        url: url,
        badge: document.getElementById('tab1-new-badge').value,
        heading: document.getElementById('tab1-new-heading').value
    });
    saveCarouselImagesStorage(images);
    loadTab1CarouselImages();
    closeTab1ImageModal();
    showToast('Carousel image added!');
};

window.editTab1CarouselImage = function (imageId) {
    const images = getCarouselImages();
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const modalHtml = `
        <div id="tab1-image-modal" class="modal" style="display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="max-width: 600px; margin: 0;">
                <div class="modal-header">
                    <h3>Edit Carousel Image</h3>
                    <span class="close-modal" onclick="closeTab1ImageModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img id="tab1-edit-prev-img" src="${image.url}" style="max-height: 120px; max-width: 100%; border-radius: 8px; border: 2px solid #334155; object-fit: cover;" onerror="this.src='assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Image Title</label>
                        <input type="text" id="tab1-edit-title" value="${image.title}">
                    </div>
                    <div class="form-group-admin">
                        <label>Image URL</label>
                        <input type="text" id="tab1-edit-url" value="${image.url}"
                            oninput="document.getElementById('tab1-edit-prev-img').src = this.value || 'assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Badge Text</label>
                        <input type="text" id="tab1-edit-badge" value="${image.badge || ''}">
                    </div>
                    <div class="form-group-admin">
                        <label>Main Heading</label>
                        <input type="text" id="tab1-edit-heading" value="${image.heading || ''}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" style="background: #ef4444; margin-right: 10px;" onclick="closeTab1ImageModal()">Cancel</button>
                    <button class="btn-success" style="margin: 0;" onclick="updateTab1CarouselImage('${imageId}')">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.updateTab1CarouselImage = function (imageId) {
    const images = getCarouselImages();
    const index = images.findIndex(img => img.id === imageId);
    if (index === -1) return;

    images[index] = {
        ...images[index],
        title: document.getElementById('tab1-edit-title').value,
        url: document.getElementById('tab1-edit-url').value,
        badge: document.getElementById('tab1-edit-badge').value,
        heading: document.getElementById('tab1-edit-heading').value
    };

    saveCarouselImagesStorage(images);
    loadTab1CarouselImages();
    closeTab1ImageModal();
    showToast('Carousel image updated!');
};

window.deleteTab1CarouselImage = function (imageId) {
    customConfirm('Delete this carousel image?', 'Delete Slide', '🗑️').then(confirmed => {
        if (!confirmed) return;
        const images = getCarouselImages().filter(img => img.id !== imageId);
        saveCarouselImagesStorage(images);
        loadTab1CarouselImages();
        showToast('Carousel image deleted!');
    });
};

window.getBottomImages = function () {
    return JSON.parse(localStorage.getItem('bottomImages') || '[]');
};

window.saveBottomImagesStorage = function (images) {
    localStorage.setItem('bottomImages', JSON.stringify(images));
    syncSiteImageConfig();
};

window.loadTab2BottomImages = function () {
    const grid = document.getElementById('tab2-bottom-grid');
    const countBadge = document.getElementById('tab2-bottom-count');
    if (!grid) return;

    let images = getBottomImages();
    if (countBadge) countBadge.textContent = `${images.length} Image${images.length !== 1 ? 's' : ''}`;

    if (images.length === 0) {
        grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;"><p style="font-size: 1.2rem; margin: 0;">No bottom images yet</p></div>';
        return;
    }

    grid.innerHTML = images.map((img, index) => {
        const displayUrl = (img.url === 'logo-new.png') ? 'assets/logo-new.png' : img.url;
        return `
        <div class="image-card">
            <img src="${displayUrl}" alt="${img.title}" onerror="this.src='assets/logo-new.png'">
            <div class="image-card-body">
                <h4>${img.title}</h4>
                <p>Image #${index + 1}</p>
                <div style="margin: 10px 0; padding: 8px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
                    <strong style="color: #10b981;">Section:</strong> ${img.section || 'General'}
                </div>
                <div class="image-card-actions">
                    <button class="img-action-btn edit" onclick="editTab2BottomImage('${img.id}')">✏️ Edit</button>
                    <button class="img-action-btn delete" onclick="deleteTab2BottomImage('${img.id}')">🗑️ Delete</button>
                </div>
            </div>
        </div>
    `}).join('');
};

window.openTab2AddImageModal = function () {
    const modalHtml = `
        <div id="tab2-image-modal" class="modal" style="display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="max-width: 600px; margin: 0;">
                <div class="modal-header">
                    <h3>Add Bottom Image</h3>
                    <span class="close-modal" onclick="closeTab2ImageModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img id="tab2-prev-img" src="assets/logo-new.png" style="max-height: 120px; max-width: 100%; border-radius: 8px; border: 2px solid #334155; object-fit: cover;" onerror="this.src='assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Image Title</label>
                        <input type="text" id="tab2-new-title" placeholder="e.g., Promotional Banner">
                    </div>
                    <div class="form-group-admin">
                        <label>Image URL</label>
                        <input type="text" id="tab2-new-url" placeholder="Enter image URL or path"
                            oninput="document.getElementById('tab2-prev-img').src = this.value || 'assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Section</label>
                        <select id="tab2-new-section">
                            <option value="micro-lessons">Micro Lessons</option>
                            <option value="animation">Animation Banner</option>
                            <option value="ad-banner">Ad Banner</option>
                            <option value="promotional">Promotional</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" style="background: #ef4444; margin-right: 10px;" onclick="closeTab2ImageModal()">Cancel</button>
                    <button class="btn-success" style="margin: 0;" onclick="saveTab2NewImage()">Add Image</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.closeTab2ImageModal = function () {
    const modal = document.getElementById('tab2-image-modal');
    if (modal) modal.remove();
};

window.saveTab2NewImage = function () {
    const title = document.getElementById('tab2-new-title').value;
    const url = document.getElementById('tab2-new-url').value;
    if (!title || !url) {
        showToast('Please fill in required fields', 'warning');
        return;
    }
    const images = getBottomImages();
    images.push({
        id: 'bottom-' + Date.now(),
        title: title,
        url: url,
        section: document.getElementById('tab2-new-section').value
    });
    saveBottomImagesStorage(images);
    loadTab2BottomImages();
    closeTab2ImageModal();
    showToast('Bottom image added!');
};

window.editTab2BottomImage = function (imageId) {
    const images = getBottomImages();
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const modalHtml = `
        <div id="tab2-image-modal" class="modal" style="display: flex; align-items: center; justify-content: center;">
            <div class="modal-content" style="max-width: 600px; margin: 0;">
                <div class="modal-header">
                    <h3>Edit Bottom Image</h3>
                    <span class="close-modal" onclick="closeTab2ImageModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img id="tab2-edit-prev-img" src="${image.url}" style="max-height: 120px; max-width: 100%; border-radius: 8px; border: 2px solid #334155; object-fit: cover;" onerror="this.src='assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Image Title</label>
                        <input type="text" id="tab2-edit-title" value="${image.title}">
                    </div>
                    <div class="form-group-admin">
                        <label>Image URL</label>
                        <input type="text" id="tab2-edit-url" value="${image.url}"
                            oninput="document.getElementById('tab2-edit-prev-img').src = this.value || 'assets/logo-new.png'">
                    </div>
                    <div class="form-group-admin">
                        <label>Section</label>
                        <select id="tab2-edit-section">
                            <option value="micro-lessons" ${image.section === 'micro-lessons' ? 'selected' : ''}>Micro Lessons</option>
                            <option value="animation" ${image.section === 'animation' ? 'selected' : ''}>Animation Banner</option>
                            <option value="ad-banner" ${image.section === 'ad-banner' ? 'selected' : ''}>Ad Banner</option>
                            <option value="promotional" ${image.section === 'promotional' ? 'selected' : ''}>Promotional</option>
                            <option value="other" ${image.section === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" style="background: #ef4444; margin-right: 10px;" onclick="closeTab2ImageModal()">Cancel</button>
                    <button class="btn-success" style="margin: 0;" onclick="updateTab2BottomImage('${imageId}')">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.updateTab2BottomImage = function (imageId) {
    const images = getBottomImages();
    const index = images.findIndex(img => img.id === imageId);
    if (index === -1) return;

    images[index] = {
        ...images[index],
        title: document.getElementById('tab2-edit-title').value,
        url: document.getElementById('tab2-edit-url').value,
        section: document.getElementById('tab2-edit-section').value
    };

    saveBottomImagesStorage(images);
    loadTab2BottomImages();
    closeTab2ImageModal();
    showToast('Bottom image updated!');
};

window.deleteTab2BottomImage = function (imageId) {
    customConfirm('Delete this bottom image?', 'Delete Image', '🗑️').then(confirmed => {
        if (!confirmed) return;
        const images = getBottomImages().filter(img => img.id !== imageId);
        saveBottomImagesStorage(images);
        loadTab2BottomImages();
        showToast('Bottom image deleted!');
    });
};
