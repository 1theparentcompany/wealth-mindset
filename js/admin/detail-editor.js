// Detail Page Editor Logic

window.saveDetailPageSettings = function () {
    const id = document.getElementById('detail-book-select').value;
    if (!id) {
        showToast('No book selected', 'warning');
        return;
    }

    customConfirm("Update detail page configuration for this item?", "Save Page Design", "🎨").then(confirmed => {
        if (!confirmed) return;

        const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        const index = library.findIndex(b => b.id === id);

        if (index === -1) {
            showToast('Book not found', 'error');
            return;
        }

        const tabs = [];
        document.querySelectorAll('#active-tabs-list .tab-item').forEach(tabDiv => {
            const name = tabDiv.querySelector('span').textContent;
            tabs.push({
                name,
                enabled: true,
                content: tabDiv.dataset.content || '',
                heading: tabDiv.dataset.heading || '',
                subheading: tabDiv.dataset.subheading || '',
                image: tabDiv.dataset.image || '',
                headingWeight: tabDiv.dataset.headingWeight || '700',
                subheadingWeight: tabDiv.dataset.subheadingWeight || '400',
                imageWidth: tabDiv.dataset.imageWidth || '100%'
            });
        });

        // Merge with existing settings to preserve 'stats' and other non-form data
        const existingSettings = library[index].detailSettings || {};

        const detailSettings = {
            ...existingSettings, // Preserve existing data (like stats array)
            tabs: tabs,
            genres: document.getElementById('detail-genres').value,
            readers: document.getElementById('detail-readers').value,
            // Keep existing values for core stats if not in DOM (they are hidden now)
            rating: document.getElementById('detail-rating')?.value || existingSettings.rating || '',
            likes: document.getElementById('detail-likes')?.value || existingSettings.likes || '',
            reviews: document.getElementById('detail-reviews')?.value || existingSettings.reviews || '',
            chapters: document.getElementById('detail-chapters-count')?.value || existingSettings.chapters || '',
            pages: document.getElementById('detail-pages').value,
            license: document.getElementById('detail-license').value,
            language: document.getElementById('detail-lang').value,
            release: document.getElementById('detail-release').value,
            icons: {
                bookmark: document.getElementById('icon-bookmark')?.checked,
                share: document.getElementById('icon-share')?.checked,
                listen: document.getElementById('icon-listen')?.checked,
                progress: document.getElementById('icon-progress')?.checked,
                report: document.getElementById('icon-report')?.checked,
                audio: document.getElementById('icon-audio')?.checked
            },
            authorName: document.getElementById('detail-author-name').value,
            authorBio: document.getElementById('detail-author-bio').value,
            authorPhoto: document.getElementById('detail-author-photo').value,
            aboutContent: document.getElementById('detail-about-content').value,
            gradientStart: document.getElementById('detail-gradient-start').value,
            gradientEnd: document.getElementById('detail-gradient-end').value,
            buttonColor: document.getElementById('detail-button-color').value,
            enableReviews: document.getElementById('detail-enable-reviews').value,
            enableAds: document.getElementById('detail-enable-ads').value,
            showRelated: document.getElementById('detail-show-related').value,
            customCss: document.getElementById('detail-custom-css').value,
            customJs: document.getElementById('detail-custom-js').value
        };

        library[index].detailSettings = detailSettings;
        library[index].author = detailSettings.authorName;
        library[index].description = detailSettings.aboutContent;

        localStorage.setItem('siteLibrary', JSON.stringify(library));
        if (typeof syncToCloud === 'function') syncToCloud('library', library[index]);
        showToast('Detail page settings saved successfully!');
    });
};

window.loadDetailPageBooks = function () {
    const select = document.getElementById('detail-book-select');
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

window.loadDetailPageSettings = function () {
    const id = document.getElementById('detail-book-select').value;
    const editorContent = document.getElementById('detail-editor-content');

    if (!id) {
        if (editorContent) editorContent.style.display = 'none';
        return;
    }

    if (editorContent) editorContent.style.display = 'block';

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const book = library.find(b => b.id === id);

    if (!book) return;

    const s = book.detailSettings || {};

    // 1. Tabs
    const tabsList = document.getElementById('active-tabs-list');
    if (tabsList) {
        tabsList.innerHTML = '';
        const tabs = s.tabs || [
            { name: "📖 About", enabled: true },
            { name: "📚 Chapters", enabled: true },
            { name: "⭐ Reviews", enabled: true }
        ];

        tabs.forEach(tab => {
            const div = document.createElement('div');
            div.className = 'tab-item';
            div.draggable = true;
            div.style.cssText = 'background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 8px; cursor: move; display: flex; justify-content: space-between; align-items: center;';
            div.innerHTML = `
                <span>${tab.name}</span>
                <button class="toolbar-btn" onclick="removeTab(this)" style="background: #ef4444; border-color: #ef4444; color: white; padding: 4px 10px;">Remove</button>
            `;
            // Store data attributes for rich content
            div.dataset.content = tab.content || '';
            div.dataset.heading = tab.heading || '';
            div.dataset.subheading = tab.subheading || '';
            div.dataset.image = tab.image || '';
            div.dataset.headingWeight = tab.headingWeight || '700';
            div.dataset.subheadingWeight = tab.subheadingWeight || '400';
            div.dataset.imageWidth = tab.imageWidth || '100%';

            tabsList.appendChild(div);
        });
    }

    // 2. Features/Badges
    if (document.getElementById('detail-genres')) document.getElementById('detail-genres').value = s.genres || book.genre || '';
    if (document.getElementById('detail-readers')) document.getElementById('detail-readers').value = s.readers || '';
    if (document.getElementById('detail-rating')) document.getElementById('detail-rating').value = s.rating || '';
    if (document.getElementById('detail-likes')) document.getElementById('detail-likes').value = s.likes || '';
    if (document.getElementById('detail-reviews')) document.getElementById('detail-reviews').value = s.reviews || '';
    if (document.getElementById('detail-chapters-count')) document.getElementById('detail-chapters-count').value = s.chapters || (book.chapters ? book.chapters.length : '');
    if (document.getElementById('detail-pages')) document.getElementById('detail-pages').value = s.pages || '';
    if (document.getElementById('detail-license')) document.getElementById('detail-license').value = s.license || '';
    if (document.getElementById('detail-lang')) document.getElementById('detail-lang').value = s.language || '';
    if (document.getElementById('detail-release')) document.getElementById('detail-release').value = s.release || '';

    // 3. Icons
    const icons = s.icons || {};
    if (document.getElementById('icon-bookmark')) document.getElementById('icon-bookmark').checked = icons.bookmark !== false;
    if (document.getElementById('icon-share')) document.getElementById('icon-share').checked = icons.share !== false;
    if (document.getElementById('icon-listen')) document.getElementById('icon-listen').checked = icons.listen !== false;
    if (document.getElementById('icon-progress')) document.getElementById('icon-progress').checked = icons.progress !== false;
    if (document.getElementById('icon-report')) document.getElementById('icon-report').checked = icons.report !== false;
    if (document.getElementById('icon-audio')) document.getElementById('icon-audio').checked = icons.audio !== false;

    // 4. Author & Content
    if (document.getElementById('detail-author-name')) document.getElementById('detail-author-name').value = s.authorName || book.author || '';
    if (document.getElementById('detail-author-bio')) document.getElementById('detail-author-bio').value = s.authorBio || '';
    if (document.getElementById('detail-author-photo')) document.getElementById('detail-author-photo').value = s.authorPhoto || '';
    if (document.getElementById('detail-about-content')) document.getElementById('detail-about-content').value = s.aboutContent || book.description || '';

    // 5. Visuals
    if (document.getElementById('detail-gradient-start')) document.getElementById('detail-gradient-start').value = s.gradientStart || '#1e3a8a';
    if (document.getElementById('detail-gradient-end')) document.getElementById('detail-gradient-end').value = s.gradientEnd || '#7c3aed';
    if (document.getElementById('detail-button-color')) document.getElementById('detail-button-color').value = s.buttonColor || '#3b82f6';

    // 6. Advanced
    if (document.getElementById('detail-enable-reviews')) document.getElementById('detail-enable-reviews').value = s.enableReviews || 'yes';
    if (document.getElementById('detail-enable-ads')) document.getElementById('detail-enable-ads').value = s.enableAds || 'yes';
    if (document.getElementById('detail-show-related')) document.getElementById('detail-show-related').value = s.showRelated || 'yes';
    if (document.getElementById('detail-custom-css')) document.getElementById('detail-custom-css').value = s.customCss || '';
    if (document.getElementById('detail-custom-js')) document.getElementById('detail-custom-js').value = s.customJs || '';
};

window.addNewTab = function () {
    const input = document.getElementById('new-tab-name');
    const name = input.value.trim();
    if (!name) return;

    const tabsList = document.getElementById('active-tabs-list');
    const div = document.createElement('div');
    div.className = 'tab-item';
    div.draggable = true;
    div.style.cssText = 'background: #1e293b; padding: 10px; border-radius: 6px; margin-bottom: 8px; cursor: move; display: flex; justify-content: space-between; align-items: center;';
    div.innerHTML = `
        <span>${name}</span>
        <button class="toolbar-btn" onclick="removeTab(this)" style="background: #ef4444; border-color: #ef4444; color: white; padding: 4px 10px;">Remove</button>
    `;
    tabsList.appendChild(div);
    input.value = '';
};

window.removeTab = function (btn) {
    btn.closest('.tab-item').remove();
};
