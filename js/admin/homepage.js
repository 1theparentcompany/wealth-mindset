// Homepage Manager (Sections, Topics, Hero)

// Default Configuration
window.homepageConfig = {
    heroTitle: "Wealth & Mindset",
    heroSubtitle: "Mastering the Psychology of Success & Financial Freedom",
    tips: ["Save 20% of income", "Read everyday", "Network aggressively"],
    tipHeadings: ["Finance", "Mindset", "Success"],
    topics: ['mindset', 'success', 'growth', 'finance', 'business', 'habits'],
    customTopics: [],
    customSections: [], // { id, title, icon, items: [] }
    exclusive: [],
    popular: [],
    stories: []
};

window.saveHomepageSettings = function () {
    customConfirm("Update the homepage layout and configuration?", "Save Home", "🏠").then(confirmed => {
        if (!confirmed) return;

        homepageConfig.heroTitle = document.getElementById('home-hero-title')?.value || "";
        homepageConfig.heroSubtitle = document.getElementById('home-hero-subtitle')?.value || "";

        for (let i = 1; i <= 3; i++) {
            const tipEl = document.getElementById(`homepage-tip-${i}`) || document.getElementById(`home-tip-${i}`);
            const headEl = document.getElementById('home-tip-head-' + i);
            if (tipEl) homepageConfig.tips[i - 1] = tipEl.value;
            if (headEl) homepageConfig.tipHeadings[i - 1] = headEl.value;
        }

        const topicChecks = document.querySelectorAll('#topics-container input:checked');
        homepageConfig.topics = Array.from(topicChecks).map(cb => cb.value);

        localStorage.setItem('siteHomepageConfig', JSON.stringify(homepageConfig));
        if (typeof syncToCloud === 'function') syncToCloud('homepage', homepageConfig);
        showToast('Homepage configuration saved successfully!');
        if (typeof renderHomepageSectionLists === 'function') renderHomepageSectionLists();
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
        if (homepageConfig.customSections) {
            homepageConfig.customSections.forEach(sec => {
                const items = sec.items || [];
                let itemsHtml = '';

                if (items.length === 0) {
                    itemsHtml = '<li style="color:#64748b; font-style:italic;">No items added yet.</li>';
                } else {
                    items.forEach((id, idx) => {
                        const book = library.find(b => b.id === id) || { title: 'Unknown Content' };
                        itemsHtml += `
                            <li style="background:#0f172a; padding:10px; margin-bottom:8px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid #334155;">
                                <span>${book.title}</span>
                                <button onclick="removeCustomSectionItem('${sec.id}', ${idx})" style="background:#ef4444; border:none; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;">Remove</button>
                            </li>
                        `;
                    });
                }

                const cardHtml = `
                    <div class="action-card" style="cursor: default; margin-top: 20px;">
                        <h3 style="display:flex; justify-content:space-between; align-items:center;">
                            <span>${sec.icon || '📂'} ${sec.title}</span>
                            <div>
                                <button class="btn-primary" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; font-size:0.8rem; padding:4px 10px; margin-right: 10px;" onclick="deleteSection('${sec.id}')">Delete Section</button>
                                <button class="btn-primary" style="font-size:0.8rem; padding:4px 10px;" onclick="openItemAdder('${sec.id}')">+ Add</button>
                            </div>
                        </h3>
                        <ul style="list-style:none; padding:0; margin-top:15px;">
                            ${itemsHtml}
                        </ul>
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

    renderHomepageSectionLists();
    const modal = document.getElementById('item-adder-modal');
    if (modal) modal.style.display = 'none';
};

window.createNewSection = function () {
    const title = document.getElementById('new-section-title').value.trim();
    const icon = document.getElementById('new-section-icon').value.trim() || '📂';

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

    document.getElementById('new-section-title').value = '';
    document.getElementById('new-section-icon').value = '';

    renderHomepageSectionLists();
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
        document.getElementById('home-hero-title').value = homepageConfig.heroTitle || "";
        document.getElementById('home-hero-subtitle').value = homepageConfig.heroSubtitle || "";

        for (let i = 1; i <= 3; i++) {
            const tipEl = document.getElementById(`homepage-tip-${i}`) || document.getElementById(`home-tip-${i}`);
            const headEl = document.getElementById('home-tip-head-' + i);
            if (tipEl) tipEl.value = homepageConfig.tips[i - 1] || "";
            if (headEl) headEl.value = homepageConfig.tipHeadings[i - 1] || "";
        }
    }

    renderTopics();
    renderHomepageSectionLists();
};
