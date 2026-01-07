// Metadata Management for Admin Panel - Comprehensive Redesign
if (typeof window.currentMetaFilter === 'undefined') {
    window.currentMetaFilter = 'book';
}

window.loadMetaBooks = function () {
    renderMetadataItemList();
};

window.toggleMetadataSidebar = function () {
    const layout = document.getElementById('meta-manager-layout');
    if (layout) {
        layout.classList.toggle('sidebar-collapsed');

        // Update toggle icon or title if needed
        const btn = document.getElementById('meta-sidebar-toggle');
        if (btn) {
            const isCollapsed = layout.classList.contains('sidebar-collapsed');
            btn.title = isCollapsed ? 'Show List' : 'Hide List';
        }
    }
};

window.renderMetadataItemList = function () {
    const grid = document.getElementById('meta-items-grid');
    if (!grid) return;

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    grid.innerHTML = "";

    // -- Filter Tabs --
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = "display: flex; gap: 8px; margin-bottom: 20px; padding: 0 5px; flex-wrap: wrap;";

    const mkBtn = (type) => {
        const isActive = currentMetaFilter === type;
        const info = categoryMap[type] || { icon: '📄', label: type };
        const label = info.icon + ' ' + (type.charAt(0).toUpperCase() + type.slice(1)) + 's';

        return `<button onclick="setMetaFilter('${type}')" style="padding: 8px 12px; border-radius: 6px; border: 1px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; background: ${isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}; color: ${isActive ? '#3b82f6' : '#64748b'}; cursor: pointer; font-weight: 700; transition: all 0.2s; font-size: 0.8rem; white-space: nowrap;">${label}</button>`;
    };

    // Add 'All' filter or just use categoryMap keys
    let filterHtml = '';
    Object.keys(categoryMap).forEach(key => {
        filterHtml += mkBtn(key);
    });

    filterContainer.innerHTML = filterHtml;
    grid.appendChild(filterContainer);

    // -- Filter Items --
    const filtered = library.filter(item => {
        const itemType = (item.type || 'book').toLowerCase();
        return itemType === currentMetaFilter;
    });

    if (filtered.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.innerHTML = `<p style="text-align:center; opacity:0.5; padding:20px;">No ${currentMetaFilter}s found.</p>`;
        grid.appendChild(emptyMsg);
        return;
    }

    filtered.forEach(item => {
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 12px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
            border: 1px solid transparent;
        `;
        div.onmouseover = () => {
            div.style.background = 'rgba(255,255,255,0.08)';
            div.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        };
        div.onmouseout = () => {
            div.style.background = 'rgba(255,255,255,0.03)';
            div.style.borderColor = 'transparent';
        };
        div.onclick = () => selectMetadataItem(item.id);

        const typeInfo = categoryMap[currentMetaFilter] || { icon: '📄' };
        const icon = typeInfo.icon;
        div.innerHTML = `
            <span style="font-size: 1.2rem;">${icon}</span>
            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                <div style="font-weight: 600; font-size: 0.9rem;">${item.title}</div>
                <div style="font-size: 0.75rem; opacity: 0.5;">${item.author || 'Unknown Author'}</div>
            </div>
        `;
        grid.appendChild(div);
    });
};

window.setMetaFilter = function (type) {
    currentMetaFilter = type;
    renderMetadataItemList();
};

window.selectMetadataItem = function (itemId) {
    const preview = document.getElementById('meta-preview-container');
    const placeholder = document.getElementById('meta-no-selection');

    if (preview) preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';

    // Collapse sidebar on selection for full-page edit view
    const layout = document.getElementById('meta-manager-layout');
    if (layout && !layout.classList.contains('sidebar-collapsed')) {
        layout.classList.add('sidebar-collapsed');
    }

    renderMetadataPreview(itemId);
};

window.renderMetadataPreview = function (itemId, activeTabName = "About") {
    const container = document.getElementById('meta-preview-container');
    if (!container) return;

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(b => b.id === itemId);
    if (!item) return;

    container.style.display = 'block';
    container.style.animation = 'fadeIn 0.5s ease-out';

    // Smooth scroll to preview area
    if (activeTabName === "About") {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const coverImg = item.image || item.cover || 'assets/placeholder-cover.jpg';
    const bgImg = (item.backgroundSettings && item.backgroundSettings.detailUrl) || item.background_image || item.backgroundImage || 'https://wallpapers.com/images/hd/dark-gradient-background-1920-x-1080-87-l12a781.jpg';

    const settings = item.detailSettings || {};
    const tabs = settings.tabs || [
        { name: "About", enabled: true },
        { name: "Chapters", enabled: true },
        { name: "Community", enabled: true },
        { name: "Reviews", enabled: true },
        { name: "Author", enabled: true },
        { name: "SEO & Social", enabled: true }
    ];

    // Ensure SEO & Social tab exists
    if (!tabs.find(t => t.name === "SEO & Social")) {
        tabs.push({ name: "SEO & Social", enabled: true });
        settings.tabs = tabs;
    }

    const genres = settings.genres || item.genre || "General";
    const authorBio = settings.authorBio || "No author bio provided.";
    const authorPhoto = settings.authorPhoto || item.authorPhoto || 'assets/logo-new.png';

    // -- Initialize Stats if not present --
    if (!settings.stats) {
        settings.stats = (item.type === 'book' || !item.type) ? [
            { label: 'Avg Rating', value: `⭐ ${item.rating || '0.0'} / 5.0` },
            { label: 'Likes Score', value: `👍 ${item.likes_percent || '0'}% Liked` },
            { label: 'Reviews', value: `💬 ${item.reviews_count || '0'} Reviews` },
            { label: 'Chapter Count', value: `📖 ${item.chapters_count || (Array.isArray(item.chapters) ? item.chapters.length : '0')} Chapters` }
        ] : [
            { label: 'Read Time', value: `⏱️ ${item.read_time || '0 min'}` },
            { label: 'Source', value: `🔗 ${item.original_source || 'Unknown'}` },
            { label: 'Status', value: `🚀 ${item.status || 'Draft'}` }
        ];
        // Save defaults
        item.detailSettings = settings;
        saveMetaItem(item);

        // Force immediate sync to ensure these defaults are in Supabase
        if (typeof syncToCloud === 'function') {
            syncToCloud('library', item);
        }
    }

    // Exact Re-implementation of Detail Page Layout with LIVE editing
    container.innerHTML = `
        <div class="meta-detail-wrapper" style="background: #060b19; color: #fff; font-family: 'Inter', sans-serif; border-radius: 16px; overflow: hidden; margin-top: 20px; box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05);">
            <!-- Hero Section -->
            <!-- Hero Section -->
            <div class="meta-hero" style="background-image: linear-gradient(to right, rgba(6, 11, 25, 0.9), rgba(6, 11, 25, 0.6)), url('${bgImg}'); background-size: cover; background-position: center; padding: 60px 6%; border-bottom: 1px solid rgba(255, 255, 255, 0.05); position: relative;">
                <div style="display: flex; gap: 45px; position: relative; z-index: 2; align-items: center;">
                    <!-- Cover -->
                    <div style="width: 260px; flex-shrink: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); position: relative; cursor: pointer;" onclick="editMetadataField('${item.id}', 'image', 'Cover Image URL')">
                        <img src="${coverImg}" style="width: 100%; aspect-ratio: 2/3; object-fit: cover;">
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40px; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                            <i class="fas fa-camera" style="color: white;"></i>
                        </div>
                    </div>
                    
                    <!-- Info -->
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px;">
                            <span style="background: #fbbf24; color: #000; font-size: 0.65rem; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">PREMIUM</span>
                            <span style="background: #3b82f6; color: #fff; font-size: 0.65rem; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 4px;">
                                <span>${(categoryMap[item.type] && categoryMap[item.type].icon) || '📚'}</span>
                                ${item.type ? item.type.toUpperCase() : 'BOOK'}
                            </span>
                            <span onclick="editMetadataField('${item.id}', 'type', 'Classification (book/story/laws/guide/custom)')" style="color: #64748b; cursor: pointer; font-size: 0.8rem; margin-left: 10px;">✎ ${item.type || 'book'}</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <h1 style="margin: 0; font-size: 3.2rem; font-weight: 800; font-family: 'Outfit', sans-serif; letter-spacing: -1px; line-height: 1;">${item.title}</h1>
                            <div onclick="editMetadataField('${item.id}', 'title', 'Title')" style="background: rgba(255, 255, 255, 0.05); color: #3b82f6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'">
                                <i class="fas fa-pen"></i>
                            </div>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 25px; font-size: 1.15rem; color: #94a3b8;">
                            <span onclick="editMetadataField('${item.id}', 'author', 'Author Name')" style="cursor: pointer; color: #fff; font-weight: 600;">${item.author || 'Author Name'}</span>
                            <span>•</span>
                            <span style="color: #fbbf24; font-weight: 700;">⭐ ${item.rating || '0.0'} / 5.0</span>
                            <span style="margin-left: 10px; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; text-transform: uppercase;">
                                ${item.category || 'General'}
                            </span>
                            <span onclick="editMetadataField('${item.id}', 'category', 'Category')" style="color: #3b82f6; cursor: pointer; font-size: 0.8rem;">✎</span>
                        </div>

                        <!-- Stats Row -->
                        <div style="display: flex; gap: 20px; margin-bottom: 35px;">
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                <div style="font-size: 1.5rem; font-weight: 800; color: #10b981;">${item.likes_percent || '0'}%</div>
                                <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Community Score</div>
                            </div>
                            <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                            
                            <!-- Dynamic Stat based on Type -->
                            ${item.type === 'book' || !item.type ? `
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <div style="font-size: 1.5rem; font-weight: 800; color: #fff;">${item.chapters_count || (Array.isArray(item.chapters) ? item.chapters.length : '0')}</div>
                                    <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Chapters</div>
                                </div>
                                <div style="width: 1px; background: rgba(255,255,255,0.1);"></div>
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <div style="font-size: 1.5rem; font-weight: 800; color: #fff;">${settings.pages || '0'}</div>
                                    <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Pages</div>
                                    <div onclick="editMetadataField('${item.id}', 'detailSettings.pages', 'Print Length (Pages)')" style="color: #3b82f6; cursor: pointer; font-size: 0.7rem;">Edit Pages</div>
                                </div>
                            ` : `
                                <div style="display: flex; flex-direction: column; gap: 5px;">
                                    <div style="font-size: 1.5rem; font-weight: 800; color: #fff;">${settings.readTime || '0 min'}</div>
                                    <div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 700;">Read Time</div>
                                    <div onclick="editMetadataField('${item.id}', 'detailSettings.readTime', 'Reading Time')" style="color: #3b82f6; cursor: pointer; font-size: 0.7rem;">Edit Time</div>
                                </div>
                            `}
                        </div>

                        <!-- Buttons -->
                        <div style="display: flex; gap: 12px; margin-bottom: 35px;">
                            <button class="tool-btn" style="background:${item.type === 'article' ? '#10b981' : '#3b82f6'}; color:white; font-weight:700; padding:15px 35px; border-radius: 8px;">READ NOW</button>
                            <button class="tool-btn" style="padding: 15px 20px; background: rgba(255,255,255,0.05); color: #fff;"><i class="fas fa-thumbs-up"></i></button>
                            <button class="tool-btn" style="padding: 15px 20px; background: rgba(255,255,255,0.05); color: #fff;"><i class="fas fa-bookmark"></i></button>
                        </div>
                        
                        <!-- Extra Metadata Fields (Expanded Options) -->
                        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 30px;">
                            <h5 style="margin: 0 0 10px 0; color: #94a3b8; font-size: 0.75rem; text-transform: uppercase;">Expanded Metadata (${item.type === 'article' ? 'Article' : 'Book'})</h5>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                ${item.type === 'book' || !item.type ? `
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:4px;">PUBLISHER</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.publisher', 'Publisher Name')" style="color:#e2e8f0; font-size:0.9rem; cursor:pointer;">${settings.publisher || '--'} ✎</div>
                                    </div>
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:4px;">ISBN / ID</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.isbn', 'ISBN')" style="color:#e2e8f0; font-size:0.9rem; cursor:pointer;">${settings.isbn || '--'} ✎</div>
                                    </div>
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:4px;">PUBLICATION YEAR</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.pubYear', 'Year')" style="color:#e2e8f0; font-size:0.9rem; cursor:pointer;">${settings.pubYear || '--'} ✎</div>
                                    </div>
                                ` : `
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:4px;">SOURCE DOMAIN</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.sourceDomain', 'Source Domain')" style="color:#e2e8f0; font-size:0.9rem; cursor:pointer;">${settings.sourceDomain || 'original.com'} ✎</div>
                                    </div>
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:4px;">ORIGINAL URL</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.sourceUrl', 'Original URL')" style="color:#e2e8f0; font-size:0.9rem; cursor:pointer; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${settings.sourceUrl || 'https://...'} ✎</div>
                                    </div>
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:4px;">PUBLICATION DATE</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.pubDate', 'Publication Date')" style="color:#e2e8f0; font-size:0.9rem; cursor:pointer;">${settings.pubDate || 'Jan 01, 2025'} ✎</div>
                                    </div>
                                `}
                            </div>
                        </div>

                        <div style="max-width: 600px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <h4 style="margin: 0; color: #64748b; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Synopsis</h4>
                                <div onclick="editMetadataField('${item.id}', 'description', 'Hero Synopsis', true)" style="color: #3b82f6; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                                    <i class="fas fa-magic"></i> Edit
                                </div>
                            </div>
                            <p style="margin: 0; line-height: 1.6; color: #cbd5e1; font-size: 1rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                ${item.description || "No description provided yet."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content Editor (for Articles) -->
            ${item.type === 'article' ? `
                <div style="padding: 30px 6%; background: rgba(59, 130, 246, 0.03); border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h4 style="margin: 0; color: #fff; font-size: 1.1rem; font-weight: 800;">Article Body Content</h4>
                        <button onclick="editMetadataField('${item.id}', 'content', 'Full Content', true)" style="background: #10b981; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">✎ Edit Content</button>
                    </div>
                    <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); max-height: 200px; overflow-y: auto; color: #94a3b8; font-size: 0.9rem; line-height: 1.6;">
                        ${item.content ? item.content.substring(0, 500) + '...' : '<i>No content added yet. Click edit to add content.</i>'}
                    </div>
                </div>
            ` : ''}

            <!-- Tabs Component -->
            <div style="padding: 40px 6%; background: #080e1d;">

                <div style="display: flex; gap: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 15px; margin-bottom: 40px; align-items: center; overflow-x: auto; scrollbar-width: none;">
                    ${tabs.map((tab, idx) => `
                        <div style="position: relative; flex-shrink: 0;">
                            <span onclick="renderMetadataPreview('${item.id}', '${tab.name}')" 
                                style="padding: 10px 25px; background: ${tab.name === activeTabName ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}; color: ${tab.name === activeTabName ? '#3b82f6' : '#64748b'}; border-radius: 6px; font-weight: 800; font-size: 0.9rem; cursor: pointer; border-bottom: 2px solid ${tab.name === activeTabName ? '#3b82f6' : 'transparent'};">
                                ${tab.name}
                            </span>
                            <div onclick="removeMetaTab('${item.id}', ${idx})" style="position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; cursor: pointer; opacity: 0.5; transition: opacity 0.2s; z-index: 10;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">✕</div>
                        </div>
                    `).join('')}
                    <button onclick="addMetaTab('${item.id}')" style="background: rgba(59, 130, 246, 0.05); border: 1px dashed rgba(59, 130, 246, 0.3); color: #3b82f6; border-radius: 6px; padding: 8px 18px; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background='rgba(59, 130, 246, 0.05)'">+ ADD TAB</button>
                </div>

                <!-- Info Grid Section -->
                ${activeTabName === 'About' || activeTabName === 'Overview' ? `
                    <div style="margin-bottom: 50px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                             <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #fff;">${item.type === 'book' ? 'Book' : 'Article'} Statistics</h3>
                             <button onclick="addStat('${item.id}')" style="background: rgba(16, 185, 129, 0.1); border: 1px dashed #10b981; color: #10b981; border-radius: 6px; padding: 6px 15px; font-size: 0.8rem; font-weight: 800; cursor: pointer;">+ ADD STAT</button>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
                            ${settings.stats.map((stat, idx) => {
        const lowerLabel = stat.label.toLowerCase();
        const isCoreStat = lowerLabel.includes('rating') || lowerLabel.includes('likes') || lowerLabel.includes('review') || lowerLabel.includes('chapter') || lowerLabel.includes('content length');

        // Hide Core Stats from this list as they are now live/auto-calculated
        if (isCoreStat) return '';

        return `
                                <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); position: relative; group;">
                                    <div style="color: #64748b; font-size: 0.65rem; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px;">${stat.label}</div>
                                    <div style="font-weight: 700; font-size: 0.95rem; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${stat.value}</div>
                                    ${!isCoreStat ? `
                                        <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 8px;">
                                            <div onclick="editStat('${item.id}', ${idx})" style="color: #3b82f6; cursor: pointer; font-size: 1rem;" title="Edit">✏️</div>
                                            <div onclick="removeStat('${item.id}', ${idx})" style="color: #ef4444; cursor: pointer; font-size: 1rem;" title="Remove">🗑️</div>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
    }).join('')}
                            
                            <!-- Genre/Tags Special Rendering -->
                            <div style="background: rgba(255,255,255,0.02); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); position: relative; grid-column: span 2;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                                    <div style="color: #64748b; font-size: 0.65rem; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Genre / Tags</div>
                                    <div style="display: flex; gap: 10px;">
                                        <span onclick="addMetaTagItem('${item.id}', 'genres')" style="color: #10b981; cursor: pointer; font-size: 0.8rem;" title="Add Tag"><i class="fas fa-plus"></i></span>
                                        <span onclick="editMetaGenres('${item.id}')" style="color: #3b82f6; cursor: pointer; font-size: 0.8rem;" title="Edit Raw Text"><i class="fas fa-edit"></i></span>
                                    </div>
                                </div>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${genres.split(',').map(g => g.trim()).filter(g => g).map(tag => `
                                        <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); padding: 4px 10px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                            ${tag}
                                            <span onclick="removeMetaGenre('${item.id}', '${tag}')" style="cursor: pointer; opacity: 0.6; font-size: 0.7rem; display: flex; align-items: center;">✕</span>
                                        </span>
                                    `).join('') || '<span style="opacity: 0.5; font-size: 0.8rem;">No tags set</span>'}
                                </div>
                            </div>
                        </div>

                        <!-- NEW: Structured Global About Fields -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                            <div style="background: rgba(59, 130, 246, 0.05); padding: 25px; border-radius: 16px; border: 1px solid rgba(59, 130, 246, 0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <h4 style="margin: 0; color: #fff; font-size: 1rem; font-weight: 800;">🚀 Key Takeaways</h4>
                                    <button onclick="editMetadataField('${item.id}', 'detailSettings.takeaways', 'Key Takeaways', true)" style="background: none; border: 1px solid #3b82f6; color: #3b82f6; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Edit</button>
                                </div>
                                <div style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${settings.takeaways || 'List the core lessons readers will learn...'}</div>
                            </div>
                            <div style="background: rgba(16, 185, 129, 0.05); padding: 25px; border-radius: 16px; border: 1px solid rgba(16, 185, 129, 0.1);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                    <h4 style="margin: 0; color: #fff; font-size: 1rem; font-weight: 800;">🎯 Who This Is For</h4>
                                    <button onclick="editMetadataField('${item.id}', 'detailSettings.targetAudience', 'Target Audience', true)" style="background: none; border: 1px solid #10b981; color: #10b981; padding: 4px 12px; border-radius: 4px; font-size: 0.75rem; cursor: pointer;">Edit</button>
                                </div>
                                <div style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${settings.targetAudience || 'Describe the ideal reader for this content...'}</div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Author Tab Enhancement -->
                ${activeTabName === 'Author' ? `
                    <div style="margin-bottom: 50px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #fff;">Author Identity & Brand</h3>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 240px 1fr; gap: 40px; background: rgba(59, 130, 246, 0.03); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 16px; padding: 35px;">
                            <!-- Author Photo -->
                            <div style="text-align: center;">
                                <div style="width: 200px; height: 200px; border-radius: 50%; overflow: hidden; border: 4px solid #3b82f6; margin: 0 auto 20px; position: relative; cursor: pointer;" onclick="editMetadataField('${item.id}', 'authorPhoto', 'Author Photo URL')">
                                    <img src="${authorPhoto}" style="width: 100%; height: 100%; object-fit: cover;">
                                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40%; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                                        <i class="fas fa-camera" style="color: white; font-size: 1.2rem;"></i>
                                    </div>
                                </div>
                                <button onclick="editMetadataField('${item.id}', 'authorPhoto', 'Author Photo URL')" style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; padding: 6px 15px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">Change Photo</button>
                            </div>

                            <!-- Author Details -->
                            <div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:6px; text-transform:uppercase;">Author Name</label>
                                        <div onclick="editMetadataField('${item.id}', 'author', 'Author Name')" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; color: #fff; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                                            ${item.author || 'Set Name...'}
                                            <i class="fas fa-pen" style="font-size: 0.7rem; opacity: 0.5;"></i>
                                        </div>
                                    </div>
                                    <div>
                                        <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:6px; text-transform:uppercase;">Professional Title</label>
                                        <div onclick="editMetadataField('${item.id}', 'detailSettings.authorTitle', 'Professional Title')" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; color: #3b82f6; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                                            ${settings.authorTitle || 'e.g. Success Architect'}
                                            <i class="fas fa-pen" style="font-size: 0.7rem; opacity: 0.5;"></i>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 25px;">
                                    <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:6px; text-transform:uppercase;">Author Biography</label>
                                    <div onclick="editMetaAuthorBio('${item.id}')" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; color: #94a3b8; line-height: 1.6; font-size: 0.9rem; cursor: pointer; min-height: 100px;">
                                        ${authorBio || 'Write a compelling biography for the author...'}
                                    </div>
                                </div>

                                <!-- Social Links -->
                                <div>
                                    <label style="display:block; color:#64748b; font-size:0.7rem; font-weight:800; margin-bottom:10px; text-transform:uppercase;">Social Presence</label>
                                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                        ${['website', 'twitter', 'linkedin', 'instagram', 'facebook'].map(platform => {
        const val = (settings.social && settings.social[platform]) || "";
        const icon = platform === 'website' ? 'globe' : platform;
        return `
                                                <div onclick="editMetadataField('${item.id}', 'detailSettings.social.${platform}', '${platform.charAt(0).toUpperCase() + platform.slice(1)} URL')" style="background: ${val ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)'}; border: 1px solid ${val ? '#3b82f6' : 'rgba(255,255,255,0.1)'}; padding: 8px 15px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s;">
                                                    <i class="fab fa-${icon}" style="color: ${val ? '#3b82f6' : '#64748b'};"></i>
                                                    <span style="font-size: 0.8rem; color: ${val ? '#fff' : '#64748b'}; font-weight: 600;">${platform.toUpperCase()}</span>
                                                </div>
                                            `;
    }).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- About Tab's Author Spotlight (Synced) -->
                ${(activeTabName === 'About' || activeTabName === 'Overview') ? `
                    <div style="margin-bottom: 50px; background: rgba(59, 130, 246, 0.03); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 16px; padding: 40px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #fff;">Author Spotlight</h3>
                            <button onclick="renderMetadataPreview('${item.id}', 'Author')" style="background: none; border: 1px solid #3b82f6; color: #3b82f6; padding: 6px 15px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">MANAGE AUTHOR</button>
                        </div>
                        <div style="display: flex; gap: 35px; align-items: flex-start;">
                            <div style="width: 140px; height: 140px; border-radius: 50%; overflow: hidden; flex-shrink: 0; border: 4px solid #3b82f6; position: relative;">
                                <img src="${authorPhoto}" style="width: 100%; height: 100%; object-fit: cover;">
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 5px;">
                                    <h4 style="font-size: 1.8rem; font-weight: 800; margin: 0; color: #fff;">${item.author || 'Unknown Author'}</h4>
                                </div>
                                <div style="color: #3b82f6; font-weight: 700; font-size: 0.9rem; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">${settings.authorTitle || 'Professional Title'}</div>
                                <p style="color: #94a3b8; line-height: 1.8; font-size: 1rem; margin-bottom: 20px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                                    ${authorBio}
                                </p>
                                <div style="display: flex; gap: 15px;">
                                    ${Object.entries(settings.social || {}).map(([platform, url]) => {
        if (!url) return '';
        const icon = platform === 'website' ? 'globe' : platform;
        return `<i class="fab fa-${icon}" style="color: #64748b; font-size: 1.2rem;"></i>`;
    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                <!-- Related Content Editor -->
                <div>
                     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #fff;">Related Titles</h3>
                        <button onclick="editRelatedBooks('${item.id}')" style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; border-radius: 8px; padding: 10px 25px; font-size: 0.9rem; font-weight: 800; cursor: pointer;">MANAGE RELATED</button>
                     </div>
                     <div style="display: flex; gap: 20px; overflow-x: auto; padding-bottom: 25px; scrollbar-width: none;">
                        ${(item.detailSettings && item.detailSettings.relatedItems && item.detailSettings.relatedItems.length > 0) ? (item.detailSettings.relatedItems.map(rid => {
        const rel = library.find(x => x.id === rid) || { title: 'Not Found', image: 'assets/logo-new.png' };
        return `
                                <div style="width: 160px; flex-shrink: 0; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); padding: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                                    <div style="width: 100%; aspect-ratio: 2/3; border-radius: 8px; margin-bottom: 12px; overflow: hidden; position: relative;">
                                        <img src="${rel.image || rel.cover || 'assets/logo-new.png'}" style="width: 100%; height: 100%; object-fit: cover;">
                                    </div>
                                    <div style="font-weight: 800; font-size: 0.85rem; color: #fff; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${rel.title}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">ID: ${rid}</div>
                                </div>
                            `;
    }).join('')) : `
                            <div style="width: 100%; padding: 60px; text-align: center; color: #64748b; border: 2px dashed rgba(255,255,255,0.05); border-radius: 16px;">
                                <i class="fas fa-book-open" style="font-size: 2rem; margin-bottom: 15px; display: block; opacity: 0.2;"></i>
                                No related books assigned. Use the button above to add some!
                            </div>
                        `}
                     </div>
                </div>
                ` : ''}

                <!-- SEO & Social Tab -->
                ${activeTabName === 'SEO & Social' ? `
                    <div style="background: rgba(59, 130, 246, 0.03); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 16px; padding: 40px;">
                        <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 25px; color: #fff;">SEO & Social Metadata</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                            <div>
                                <div class="form-group-admin">
                                    <label>Meta Title (SEO)</label>
                                    <input type="text" id="meta-seo-title" value="${settings.seo?.title || item.title || ''}" onchange="updateSEOField('${item.id}', 'title', this.value)" style="background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 6px; width: 100%;">
                                    <small style="color: #64748b;">Max 60 chars recommended.</small>
                                </div>
                                <div class="form-group-admin" style="margin-top: 20px;">
                                    <label>Meta Description</label>
                                    <textarea id="meta-seo-desc" rows="4" onchange="updateSEOField('${item.id}', 'desc', this.value)" style="background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 6px; width: 100%; resize: vertical;">${settings.seo?.desc || item.description || ''}</textarea>
                                    <small style="color: #64748b;">Max 160 chars recommended.</small>
                                </div>
                            </div>
                            <div>
                                <div class="form-group-admin">
                                    <label>Canonical URL Override</label>
                                    <input type="text" id="meta-seo-canonical" value="${settings.seo?.canonical || ''}" onchange="updateSEOField('${item.id}', 'canonical', this.value)" placeholder="https://wealthmindset.com/books/..." style="background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 6px; width: 100%;">
                                </div>
                                <div class="form-group-admin" style="margin-top: 20px;">
                                    <label>Social (OG) Image URL</label>
                                    <div style="display: flex; gap: 10px;">
                                        <input type="text" id="meta-seo-ogimage" value="${settings.seo?.ogImage || ''}" onchange="updateSEOField('${item.id}', 'ogImage', this.value)" placeholder="assets/og/book1.jpg" style="background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 6px; flex: 1;">
                                        <img src="${settings.seo?.ogImage || coverImg}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #334155;">
                                    </div>
                                </div>
                                <div class="form-group-admin" style="margin-top: 20px;">
                                    <label>Keywords (Comma separated)</label>
                                    <input type="text" id="meta-seo-keywords" value="${settings.seo?.keywords || ''}" onchange="updateSEOField('${item.id}', 'keywords', this.value)" placeholder="wealth, success, mindset" style="background: rgba(0,0,0,0.2); border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 6px; width: 100%;">
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Chapters Tab Enhancement -->
                ${activeTabName === 'Chapters' ? `
                    <div style="margin-bottom: 50px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #fff;">Chapter Management</h3>
                            <button onclick="showSection('content-editor')" style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; border-radius: 6px; padding: 8px 15px; font-size: 0.8rem; font-weight: 800; cursor: pointer;">OPEN CONTENT EDITOR</button>
                        </div>
                        
                        <div style="display: grid; gap: 15px;">
                            ${(Array.isArray(item.chapters) ? item.chapters : []).map((chap, idx) => {
        const chapterNum = chap.number || (idx + 1);
        const chapterTitle = chap.title || `Chapter ${chapterNum}`;
        const excerpts = settings.chapterExcerpts || {};
        const currentExcerpt = excerpts[chapterNum] || chap.short_summary || "";

        return `
                                    <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 25px; display: grid; grid-template-columns: 80px 1fr 200px; gap: 20px; align-items: center;">
                                        <div style="font-size: 1.5rem; font-weight: 900; color: #3b82f6; text-align: center;">${chapterNum}</div>
                                        <div>
                                            <div style="font-weight: 800; color: #fff; font-size: 1.1rem; margin-bottom: 8px;">${chapterTitle}</div>
                                            <div id="excerpt-display-${chapterNum}" style="color: #94a3b8; font-size: 0.9rem; line-height: 1.5; font-style: italic;">
                                                ${currentExcerpt || '<span style="opacity: 0.5;">No excerpt added. Click edit to add a hook for the detail page.</span>'}
                                            </div>
                                        </div>
                                        <div style="display: flex; flex-direction: column; gap: 10px;">
                                            <button onclick="editChapterExcerpt('${item.id}', ${chapterNum})" style="background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.85rem;">✎ EDIT EXCERPT</button>
                                            <a href="reader.html?id=${item.id}&chapter=${chapterNum}" target="_blank" style="background: #10b981; color: #fff; text-align: center; padding: 10px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 0.85rem;">👁️ READ FULL</a>
                                        </div>
                                    </div>
                                `;
    }).join('') || '<div style="text-align: center; color: #64748b; padding: 40px; border: 2px dashed rgba(255,255,255,0.05); border-radius: 12px;">No chapters found. Use the Content Studio to add chapters.</div>'}
                        </div>
                    </div>
                ` : ''}

                <!-- Custom Tab Content Sections (Appears on ALL tabs if enabled, or allows adding) -->
                <div style="margin-top: 50px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <h3 style="font-size: 1.4rem; font-weight: 800; margin: 0; color: #fff;">${activeTabName} Custom Sections</h3>
                        <button onclick="addTabSection('${item.id}', '${activeTabName}')" style="background: rgba(59, 130, 246, 0.1); border: 1px dashed #3b82f6; color: #3b82f6; border-radius: 6px; padding: 6px 15px; font-size: 0.8rem; font-weight: 800; cursor: pointer;">+ ADD SECTION</button>
                    </div>

                    ${(settings.tabContent && settings.tabContent[activeTabName]) ?
            settings.tabContent[activeTabName].map((sec, idx) => `
                            <div style="margin-bottom: 30px; background: rgba(255,255,255,0.02); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); position: relative;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                    <div style="font-weight: 800; color: #fff; font-size: 1.1rem;">${sec.title}</div>
                                    <div style="display: flex; gap: 10px;">
                                        <button onclick="editTabSection('${item.id}', '${activeTabName}', ${idx})" style="background: none; border: none; color: #3b82f6; cursor: pointer;">✎</button>
                                        <button onclick="removeTabSection('${item.id}', '${activeTabName}', ${idx})" style="background: none; border: none; color: #ef4444; cursor: pointer;">✕</button>
                                    </div>
                                </div>
                                <div style="color: #94a3b8; line-height: 1.6; white-space: pre-wrap;">${sec.content}</div>
                            </div>
                        `).join('')
            :
            ((activeTabName !== 'About' && activeTabName !== 'Author' && activeTabName !== 'Chapters') ?
                `<div style="text-align: center; color: #64748b; padding: 40px; border: 2px dashed rgba(255,255,255,0.05); border-radius: 12px;">
                                No custom sections added for ${activeTabName} yet.
                            </div>` : '')
        }
                </div>
            </div>
            
            <!-- Bottom Sticky Action Bar -->
            <div style="background: rgba(8, 14, 29, 0.95); backdrop-filter: blur(10px); padding: 25px 6%; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: flex-end; gap: 15px; border-radius: 0 0 16px 16px;">
                <button onclick="showSection('dashboard-view')" style="background: rgba(255,255,255,0.03); color: #94a3b8; border: 1px solid rgba(255,255,255,0.1); padding: 12px 30px; font-weight: 800; font-size: 0.9rem; border-radius: 8px; cursor: pointer;">CANCEL CHANGES</button>
                <button onclick="renderMetadataPreview('${item.id}', '${activeTabName}')" style="background: #10b981; color: white; border: none; padding: 12px 50px; font-weight: 800; font-size: 1rem; border-radius: 8px; cursor: pointer; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);">SAVE & PREVIEW</button>
            </div>
        </div>
    `;
};


window.editMetaGenres = function (itemId) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(b => b.id === itemId);
    const settings = item.detailSettings || {};
    const current = settings.genres || item.genre || "Finance, Mindset";

    customPrompt("Edit Genres (comma separated)", current).then((val) => {
        if (val === null) return;
        updateItemNestedMetadata(itemId, 'detailSettings.genres', val);
    });
};

window.editMetaAuthorBio = function (itemId) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(b => b.id === itemId);
    const settings = item.detailSettings || {};
    const current = settings.authorBio || "";

    customPrompt("Edit Author Bio", current, "Edit Bio", "✍️").then((val) => {
        if (val === null) return;
        updateItemNestedMetadata(itemId, 'detailSettings.authorBio', val);
    });
};

window.addMetaTab = function (itemId) {
    customPrompt("New Tab Name", "").then((name) => {
        if (!name) return;
        const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        const idx = library.findIndex(b => b.id === itemId);
        if (idx === -1) return;

        const item = library[idx];
        if (!item.detailSettings) item.detailSettings = {};
        if (!item.detailSettings.tabs) item.detailSettings.tabs = [
            { name: "About", enabled: true },
            { name: "Chapters", enabled: true },
            { name: "Community", enabled: true },
            { name: "Reviews", enabled: true },
            { name: "Author", enabled: true }
        ];

        item.detailSettings.tabs.push({ name: name, enabled: true });
        localStorage.setItem('siteLibrary', JSON.stringify(library));
        renderMetadataPreview(itemId);
        showToast("New tab created!", "success");
    });
};

window.removeMetaTab = function (itemId, tabIdx) {
    customConfirm("Delete Tab?", "This will permanently remove this tab from the detail page.").then((confirmed) => {
        if (!confirmed) return;
        const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        const idx = library.findIndex(b => b.id === itemId);
        if (idx === -1) return;

        const item = library[idx];
        if (item.detailSettings && item.detailSettings.tabs) {
            item.detailSettings.tabs.splice(tabIdx, 1);
            localStorage.setItem('siteLibrary', JSON.stringify(library));
            renderMetadataPreview(itemId);
            showToast("Tab removed.", "warning");
        }
    });
};

window.editRelatedBooks = function (itemId) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const currentItem = library.find(b => b.id === itemId);
    const currentRelated = (currentItem.detailSettings && currentItem.detailSettings.relatedItems) || currentItem.relatedItems || [];

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.85); z-index: 10002; display: flex; align-items: center; justify-content: center;';

    const content = document.createElement('div');
    content.style.cssText = 'background: #0f172a; border: 2px solid #3b82f6; border-radius: 16px; padding: 30px; width: 90%; max-width: 700px; max-height: 80vh; overflow-y: auto;';

    content.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #3b82f6; font-size: 1.5rem;">Select Related Books</h2>
        <p style="color: #94a3b8; margin-bottom: 25px; font-size: 0.9rem;">Check the books you want to appear as related titles.</p>
        <div id="related-books-list" style="display: grid; gap: 12px; margin-bottom: 25px; max-height: 400px; overflow-y: auto;"></div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="cancel-related-btn" style="background: #1e293b; color: #fff; border: 1px solid #334155; padding: 10px 25px; border-radius: 8px; cursor: pointer; font-weight: 600;">Cancel</button>
            <button id="save-related-btn" style="background: #3b82f6; color: #fff; border: none; padding: 10px 30px; border-radius: 8px; cursor: pointer; font-weight: 700;">Save Selection</button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Populate book list with checkboxes
    const booksList = document.getElementById('related-books-list');
    library.forEach(book => {
        if (book.id === itemId) return; // Don't show current book

        const isChecked = currentRelated.includes(book.id);
        const bookItem = document.createElement('div');
        bookItem.style.cssText = 'display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; transition: all 0.2s;';
        bookItem.onmouseover = () => bookItem.style.background = 'rgba(59, 130, 246, 0.1)';
        bookItem.onmouseout = () => bookItem.style.background = 'rgba(255,255,255,0.03)';

        bookItem.innerHTML = `
            <input type="checkbox" id="book-${book.id}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
            <img src="${book.image || book.cover || 'assets/logo-new.png'}" style="width: 40px; height: 60px; object-fit: cover; border-radius: 4px;">
            <div style="flex: 1;">
                <div style="color: #fff; font-weight: 700; font-size: 0.95rem;">${book.title}</div>
                <div style="color: #64748b; font-size: 0.8rem;">ID: ${book.id}</div>
            </div>
        `;

        bookItem.onclick = (e) => {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = bookItem.querySelector('input');
                checkbox.checked = !checkbox.checked;
            }
        };

        booksList.appendChild(bookItem);
    });

    // Save button handler
    document.getElementById('save-related-btn').onclick = () => {
        const selected = [];
        document.querySelectorAll('#related-books-list input[type="checkbox"]:checked').forEach(cb => {
            const id = cb.id.replace('book-', '');
            selected.push(id);
        });

        updateItemNestedMetadata(itemId, 'detailSettings.relatedItems', selected);
        document.body.removeChild(modal);
    };

    // Cancel button handler
    document.getElementById('cancel-related-btn').onclick = () => {
        document.body.removeChild(modal);
    };

    // Click outside to close
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
};

window.addMetaTagItem = function (itemId, field) {
    customPrompt(`Add to ${field}`, "").then((val) => {
        if (!val) return;
        const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        const item = library.find(b => b.id === itemId);

        let current = "";
        if (field === 'genres') {
            current = (item.detailSettings && item.detailSettings.genres) || item.genre || "";
        } else {
            current = item[field] || "";
        }

        const newVal = current ? `${current}, ${val}` : val;

        if (field === 'genres') {
            updateItemNestedMetadata(itemId, 'detailSettings.genres', newVal);
        } else {
            updateItemMetadata(itemId, field, newVal);
        }
    });
};


window.editMetadataField = function (itemId, field, label, isLongText = false) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(b => b.id === itemId);
    if (!item) return;

    // Helper to get nested value
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
    };

    let currentValue = field.includes('.') ? getNestedValue(item, field) : item[field];

    // Special case fallback for legacy authorPhoto if needed, or default to empty string
    if (field === 'authorPhoto' && !currentValue && item.detailSettings) currentValue = item.detailSettings.authorPhoto;
    if (currentValue === undefined || currentValue === null) currentValue = "";

    customPrompt(`Edit ${label}`, currentValue, label, "✎", isLongText).then((newValue) => {
        if (newValue !== null && newValue !== currentValue) {
            if (field.includes('.')) {
                updateItemNestedMetadata(itemId, field, newValue);
            } else if (field === 'authorPhoto') {
                // Keep legitimate legacy handling just in case
                updateItemNestedMetadata(itemId, 'detailSettings.authorPhoto', newValue);
            } else {
                updateItemMetadata(itemId, field, newValue);
            }
        }
    });
};

window.updateItemMetadata = function (itemId, field, newValue) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const index = library.findIndex(b => b.id === itemId);

    if (index !== -1) {
        library[index][field] = newValue;

        // Sync cover/image duplication for compatibility
        if (field === 'image') library[index].cover = newValue;
        if (field === 'cover') library[index].image = newValue;

        localStorage.setItem('siteLibrary', JSON.stringify(library));

        if (typeof syncToCloud === 'function') {
            syncToCloud('library', library[index]);
        }

        showToast(`Metadata updated!`, 'success');
        renderMetadataPreview(itemId);
        renderMetadataItemList();
    }
};

window.updateSEOField = function (itemId, field, value) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const index = library.findIndex(b => b.id === itemId);
    if (index === -1) return;

    const item = library[index];
    if (!item.detailSettings) item.detailSettings = {};
    if (!item.detailSettings.seo) item.detailSettings.seo = {};

    item.detailSettings.seo[field] = value;
    localStorage.setItem('siteLibrary', JSON.stringify(library));
    if (typeof syncToCloud === 'function') syncToCloud('library', item);
    showToast(`SEO ${field} updated!`, 'info');
};

window.updateItemNestedMetadata = function (itemId, path, newValue) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const index = library.findIndex(b => b.id === itemId);

    if (index !== -1) {
        const item = library[index];
        const keys = path.split('.');
        let current = item;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = newValue;

        localStorage.setItem('siteLibrary', JSON.stringify(library));

        if (typeof syncToCloud === 'function') {
            syncToCloud('library', library[index]);
        }

        showToast(`Advanced settings updated!`, 'success');
        renderMetadataPreview(itemId);
    }
};

// CSS Injection for smooth transitions
if (!document.getElementById('meta-styles')) {
    const style = document.createElement('style');
    style.id = 'meta-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .meta-detail-wrapper button:hover {
            filter: brightness(1.1);
            transform: scale(1.02);
        }
        .meta-detail-wrapper button:active {
            transform: scale(0.98);
        }
        .tool-btn {
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
    `;
    document.head.appendChild(style);
}

// Custom Stat Management
window.removeMetaGenre = function (itemId, tagToRemove) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(b => b.id === itemId);
    if (!item) return;

    let current = (item.detailSettings && item.detailSettings.genres) || item.genre || "";
    let tags = current.split(',').map(s => s.trim()).filter(s => s.length > 0);

    // Remove the tag (case insensitive check, but preserving original case if possible)
    tags = tags.filter(t => t.toLowerCase() !== tagToRemove.toLowerCase()); // simple remove all instances

    const newVal = tags.join(', ');
    updateItemNestedMetadata(itemId, 'detailSettings.genres', newVal);
};

// Unified Stat Management
window.addStat = function (itemId) {
    customPrompt("New Statistic Label", "").then((label) => {
        if (!label) return;
        customPrompt(`Value for ${label}`, "").then((val) => {
            if (!val) return;
            const item = getMetaItem(itemId);
            if (!item.detailSettings.stats) item.detailSettings.stats = [];
            item.detailSettings.stats.push({ label, value: val });
            saveMetaItem(item);
            showToast("Stat added");
            renderMetadataPreview(itemId);
        });
    });
};

window.editStat = function (itemId, idx) {
    const item = getMetaItem(itemId);
    const stat = item.detailSettings.stats[idx];
    customPrompt(`Edit Value for ${stat.label}`, stat.value).then((val) => {
        if (val === null) return;
        item.detailSettings.stats[idx].value = val;
        saveMetaItem(item);
        renderMetadataPreview(itemId);
    });
};

window.removeStat = function (itemId, idx) {
    customConfirm("Remove Stat?", "This will hide it from the page.").then(c => {
        if (!c) return;
        const item = getMetaItem(itemId);
        item.detailSettings.stats.splice(idx, 1);
        saveMetaItem(item);
        renderMetadataPreview(itemId);
    });
};

// Generic Tab Section Management
window.addTabSection = function (itemId, tabName) {
    customPrompt("Section Title", "").then(title => {
        if (!title) return;
        customPrompt("Section Content (HTML/Text)", "", "Content", "📝").then(content => {
            if (!content) return;

            const item = getMetaItem(itemId);
            if (!item.detailSettings.tabContent) item.detailSettings.tabContent = {};
            if (!item.detailSettings.tabContent[tabName]) item.detailSettings.tabContent[tabName] = [];

            item.detailSettings.tabContent[tabName].push({ title, content });
            saveMetaItem(item);
            renderMetadataPreview(itemId, tabName);
            showToast("Section added");
        });
    });
};

window.editTabSection = function (itemId, tabName, idx) {
    const item = getMetaItem(itemId);
    const section = item.detailSettings.tabContent[tabName][idx];

    customPrompt("Edit Title", section.title).then(title => {
        if (title === null) return;
        customPrompt("Edit Content", section.content, "Content").then(content => {
            if (content === null) return;
            item.detailSettings.tabContent[tabName][idx] = { title, content };
            saveMetaItem(item);
            renderMetadataPreview(itemId, tabName);
        });
    });
};

window.removeTabSection = function (itemId, tabName, idx) {
    customConfirm("Remove Section?", "Content will be deleted.").then(c => {
        if (!c) return;
        const item = getMetaItem(itemId);
        item.detailSettings.tabContent[tabName].splice(idx, 1);
        saveMetaItem(item);
        renderMetadataPreview(itemId, tabName);
    });
};

// Helpers
function getMetaItem(id) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    return library.find(b => b.id === id);
}

function saveMetaItem(item) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const idx = library.findIndex(b => b.id === item.id);
    if (idx !== -1) {
        library[idx] = item;
        localStorage.setItem('siteLibrary', JSON.stringify(library));
        if (typeof syncToCloud === 'function') syncToCloud('library', item);
    }
}
// Removed legacy addCustomStat/editCustomStat/removeCustomStat as they are superceded by the unified stats.

window.editChapterExcerpt = function (itemId, chapterNum) {
    const item = getMetaItem(itemId);
    const excerpts = (item.detailSettings && item.detailSettings.chapterExcerpts) || {};
    const current = excerpts[chapterNum] || "";
    customPrompt(`Edit Excerpt for Chapter ${chapterNum}`, current, "Chapter Excerpt", "📝", true).then((val) => {
        if (val === null) return;
        if (!item.detailSettings) item.detailSettings = {};
        if (!item.detailSettings.chapterExcerpts) item.detailSettings.chapterExcerpts = {};
        item.detailSettings.chapterExcerpts[chapterNum] = val;
        saveMetaItem(item);
        // Dynamic update of display if possible without full re-render
        const display = document.getElementById(`excerpt-display-${chapterNum}`);
        if (display) display.textContent = val || "No excerpt added.";
        showToast(`Excerpt for Chapter ${chapterNum} updated!`, "success");
    });
};

