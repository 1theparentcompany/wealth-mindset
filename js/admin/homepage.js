// Homepage Manager (Sections, Topics, Hero)

// Default Configuration
window.homepageConfig = {
    hero: {
        title: "Wealth & Mindset",
        subtitle: "Mastering the Psychology of Success & Financial Freedom"
    },
    microLessons: ["Save 20% of income", "Read everyday", "Network aggressively"],
    microLessonHeadings: ["Finance", "Mindset", "Success"],
    topics: ['mindset', 'success', 'growth', 'finance', 'business', 'habits'],
    customTopics: [],
    customSections: [],
    exclusive: [],
    popular: [],
    stories: [],
    bottomBanners: []
};

// Helper to clear all sections (Requested by User)
window.clearAllHomepageBooks = function () {
    if (!confirm("Are you sure you want to remove ALL books from the homepage sections? This cannot be undone.")) return;

    homepageConfig.exclusive = [];
    homepageConfig.popular = [];
    homepageConfig.stories = [];
    // Custom sections: keep sections but remove items? Or remove sections?
    // "remove all thse book appearin these sction" -> likely remove items.
    // User said "fromthese section", implying sections stay.
    if (homepageConfig.customSections) {
        homepageConfig.customSections.forEach(s => s.items = []);
    }
    renderHomepageSectionLists();
    showToast("All books removed. Please click Save to persist.", "success");
};

window.saveHomepageSettings = function () {
    customConfirm("Update the homepage layout and configuration?", "Save Home", "🏠").then(confirmed => {
        if (!confirmed) return;

        // Ensure nested objects exist
        if (!homepageConfig.hero) homepageConfig.hero = {};

        homepageConfig.hero.title = document.getElementById('home-hero-title')?.value || "";
        homepageConfig.hero.subtitle = document.getElementById('home-hero-subtitle')?.value || "";

        // Reset arrays to ensure clean state before populating
        homepageConfig.microLessons = [];
        homepageConfig.microLessonHeadings = [];

        for (let i = 1; i <= 3; i++) {
            const tipEl = document.getElementById(`homepage-tip-${i}`) || document.getElementById(`home-tip-${i}`);
            const headEl = document.getElementById('home-tip-head-' + i);
            if (tipEl) homepageConfig.microLessons[i - 1] = tipEl.value;
            if (headEl) homepageConfig.microLessonHeadings[i - 1] = headEl.value;
        }

        const topicChecks = document.querySelectorAll('#topics-container input:checked');
        homepageConfig.topics = Array.from(topicChecks).map(cb => cb.value);

        // Explicitly sync Image Manager data if available in global scope but not in config yet
        if (typeof currentImage1Data !== 'undefined' && (!homepageConfig.imageManager1 || homepageConfig.imageManager1.length !== currentImage1Data.length)) {
            homepageConfig.imageManager1 = currentImage1Data;
        }

        localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));
        if (typeof syncToCloud === 'function') syncToCloud('homepage', homepageConfig);

        // Calculate statistics for feedback
        const totalBooks = (homepageConfig.exclusive?.length || 0) +
            (homepageConfig.popular?.length || 0) +
            (homepageConfig.stories?.length || 0);
        const customSectionCount = homepageConfig.customSections?.length || 0;
        const customBooksCount = homepageConfig.customSections?.reduce((sum, sec) => sum + (sec.items?.length || 0), 0) || 0;

        showToast(`Homepage saved! ${totalBooks + customBooksCount} books in ${3 + customSectionCount} sections.`, 'success');
        if (typeof renderHomepageSectionLists === 'function') renderHomepageSectionLists();
    }).catch(err => {
        console.error("Save failed:", err);
    });
};

window.renderTopics = function () {
    const container = document.getElementById('topics-container');
    if (!container) return;
    container.innerHTML = '';

    const defaultTopics = ['Mindset', 'Success', 'Growth', 'Finance', 'Business', 'Habits'];
    const allTopics = [...defaultTopics];
    if (homepageConfig.customTopics) {
        homepageConfig.customTopics.forEach(t => {
            if (!allTopics.includes(t)) allTopics.push(t);
        });
    }

    allTopics.forEach(topic => {
        const val = topic.toLowerCase();
        const isChecked = homepageConfig.topics && homepageConfig.topics.includes(val);
        // Ensure topics is an array before checking
        const safeTopics = Array.isArray(homepageConfig.topics) ? homepageConfig.topics : [];
        const checkedState = safeTopics.includes(val) ? 'checked' : '';

        container.innerHTML += `
            <label style="display:flex; align-items:center; gap:8px; color: #e2e8f0; font-size: 0.9rem; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
                <input type="checkbox" class="home-topic-cb" value="${val}" ${checkedState}>
                ${topic}
            </label>
        `;
    });
};

window.renderHomepageSectionLists = function () {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');

    ['exclusive', 'popular', 'stories'].forEach(section => {
        const container = document.getElementById(`${section}-list`);
        if (!container) return;

        container.innerHTML = '';
        const items = homepageConfig[section] || [];

        if (items.length === 0) {
            container.innerHTML = '<p style="color:#64748b; font-size: 0.85rem; padding: 10px;">No items added yet.</p>';
        }

        items.forEach((id, index) => {
            const book = library.find(b => b.id === id);
            const name = book ? book.title : 'Unknown Item';
            const cover = book ? (book.cover || book.image || 'assets/logo-new.png') : 'assets/logo-new.png';

            const itemDiv = document.createElement('div');
            itemDiv.className = 'mini-list-item';
            itemDiv.style.cssText = 'background: #1e293b; padding: 8px 12px; border-radius: 6px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; border: 1px solid rgba(255,255,255,0.05);';
            itemDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${cover}" style="width: 30px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <span title="${name}">${name.length > 25 ? name.substring(0, 25) + '...' : name}</span>
                </div>
                <button onclick="removeFromHomepageSection('${section}', ${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem; padding: 5px;">×</button>
            `;
            container.appendChild(itemDiv);
        });
    });

    const customContainer = document.getElementById('sections-container');
    if (customContainer) {
        customContainer.innerHTML = '';
        if (homepageConfig.customSections && homepageConfig.customSections.length > 0) {
            homepageConfig.customSections.forEach((sec, secIdx) => {
                const items = sec.items || [];
                let itemsHtml = '';

                if (items.length === 0) {
                    itemsHtml = '<div style="color:#64748b; font-style:italic; padding: 10px; text-align: center; background: rgba(0,0,0,0.2); border-radius: 6px;">No books added yet. Click "+ Add" to populate this list.</div>';
                } else {
                    items.forEach((id, idx) => {
                        const book = library.find(b => b.id === id) || { title: 'Unknown Content', image: 'assets/logo-new.png' };
                        const cover = book.image || book.cover || 'assets/logo-new.png';

                        itemsHtml += `
                            <div style="background:#1e293b; padding:8px 12px; margin-bottom:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid #334155;">
                                <div style="display:flex; align-items:center; gap:10px;">
                                    <img src="${cover}" style="width: 30px; height: 40px; object-fit: cover; border-radius: 4px;">
                                    <span style="font-size: 0.9rem; color: #e2e8f0;">${book.title}</span>
                                </div>
                                <button onclick="removeCustomSectionItem('${sec.id}', ${idx})" style="background:none; border:none; color:#ef4444; padding:4px; border-radius:4px; cursor:pointer;" title="Remove Book">✕</button>
                            </div>
                        `;
                    });
                }

                const cardHtml = `
                    <div class="action-card" style="cursor: default; margin-top: 20px; border-top: 4px solid var(--color-accent);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                            <h3 style="margin:0; display:flex; align-items:center; gap: 8px;">
                                <span style="font-size: 1.5rem;">${sec.icon || '📂'}</span> 
                                <span>${sec.title}</span>
                            </h3>
                            <div style="display: flex; gap: 10px;">
                                <button class="btn-primary" style="font-size:0.8rem; padding:6px 12px;" onclick="openItemAdder('${sec.id}')">+ Add Book</button>
                                <button class="btn-primary" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; font-size:0.8rem; padding:6px 12px;" onclick="deleteSection('${sec.id}')">Delete Section</button>
                            </div>
                        </div>
                        <div style="background: rgba(15, 23, 42, 0.5); padding: 10px; border-radius: 8px;">
                            ${itemsHtml}
                        </div>
                    </div>
                `;
                customContainer.insertAdjacentHTML('beforeend', cardHtml);
            });
        }
    }
};

window.removeFromHomepageSection = function (section, index) {
    if (homepageConfig[section]) {
        homepageConfig[section].splice(index, 1);
        renderHomepageSectionLists();
    }
};

window.removeCustomSectionItem = function (secId, index) {
    if (homepageConfig.customSections) {
        const sec = homepageConfig.customSections.find(s => s.id === secId);
        if (sec) {
            sec.items.splice(index, 1);
            renderHomepageSectionLists();
        }
    }
};

window.deleteSection = function (sectionId) {
    customConfirm("Are you sure you want to delete this content section?", "Delete Section", "🗑️")
        .then(confirmed => {
            if (!confirmed) return;
            homepageConfig.customSections = homepageConfig.customSections.filter(s => s.id !== sectionId);
            renderHomepageSectionLists();
            showToast("Section deleted");
        });
};

window.addNewTopic = function () {
    const input = document.getElementById('new-topic-input');
    if (!input) return;
    const rawVal = input.value.trim();
    if (!rawVal) return;
    const topicName = rawVal.charAt(0).toUpperCase() + rawVal.slice(1);
    if (!homepageConfig.customTopics) homepageConfig.customTopics = [];

    if (!homepageConfig.customTopics.includes(topicName)) {
        homepageConfig.customTopics.push(topicName);
        if (!homepageConfig.topics) homepageConfig.topics = [];
        homepageConfig.topics.push(topicName.toLowerCase());
        renderTopics();
        input.value = '';
    } else {
        showToast('Topic already exists!', 'warning');
    }
};

window.openItemAdder = function (targetId) {
    window.currentAddTarget = targetId;
    const modal = document.getElementById('item-adder-modal');
    const select = document.getElementById('item-adder-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Content --</option>';

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    library.forEach(b => {
        const option = document.createElement('option');
        option.value = b.id;
        option.textContent = `${b.title} (${b.type || 'Book'})`;
        select.appendChild(option);
    });

    if (modal) modal.style.display = 'flex';
};

window.confirmAddItem = function () {
    const select = document.getElementById('item-adder-select');
    const val = select.value;
    if (!val) return;

    if (['exclusive', 'popular', 'stories'].includes(window.currentAddTarget)) {
        if (!homepageConfig[window.currentAddTarget]) homepageConfig[window.currentAddTarget] = [];
        if (!homepageConfig[window.currentAddTarget].includes(val)) {
            homepageConfig[window.currentAddTarget].push(val);
        }
    } else {
        if (homepageConfig.customSections) {
            const sec = homepageConfig.customSections.find(s => s.id === window.currentAddTarget);
            if (sec) {
                if (!sec.items.includes(val)) sec.items.push(val);
            }
        }
    }

    // Auto-save intermediate state to LocalStorage so it persists across refreshes even if not synced to cloud yet
    localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));

    renderHomepageSectionLists();
    const modal = document.getElementById('item-adder-modal');
    if (modal) modal.style.display = 'none';
};

window.createNewSection = function () {
    const titleInput = document.getElementById('new-section-title');
    const iconInput = document.getElementById('new-section-icon');

    const title = titleInput.value.trim();
    const icon = iconInput.value.trim() || '📂';

    if (!title) {
        showToast("Please enter a section title.", 'warning');
        return;
    }

    const newSection = {
        id: 'custom_sec_' + Date.now(),
        title: title,
        icon: icon,
        items: []
    };

    if (!homepageConfig.customSections) homepageConfig.customSections = [];
    homepageConfig.customSections.push(newSection);

    // Clear inputs
    titleInput.value = '';
    iconInput.value = '';

    // Auto-save to ensure persistence immediately
    localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));
    renderHomepageSectionLists();
    showToast("New section created! Don't forget to save changes.", 'success');
};

window.initHomepageManager = function () {
    const saved = localStorage.getItem('siteHomepageConfig');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Robust Merge: defaults first, then saved
            window.homepageConfig = { ...window.homepageConfig, ...parsed };
        } catch (e) {
            console.error("Homepage config load failed", e);
        }
    }

    if (document.getElementById('home-hero-title')) {
        const hero = homepageConfig.hero || {};
        document.getElementById('home-hero-title').value = hero.title || "";
        document.getElementById('home-hero-subtitle').value = hero.subtitle || "";

        const lessons = homepageConfig.microLessons || [];
        const headings = homepageConfig.microLessonHeadings || [];

        for (let i = 1; i <= 3; i++) {
            const tipEl = document.getElementById(`homepage-tip-${i}`) || document.getElementById(`home-tip-${i}`);
            const headEl = document.getElementById('home-tip-head-' + i);
            if (tipEl) tipEl.value = lessons[i - 1] || "";
            if (headEl) headEl.value = headings[i - 1] || "";
        }
    }

    renderTopics();
    renderHomepageSectionLists();
};
