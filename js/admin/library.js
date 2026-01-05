// Library and Feedback Management for Admin Panel

window.offerFilterLibraryTable = function (q) {
    if (typeof filterLibraryTable === 'function') filterLibraryTable(q);
};

window.filterLibraryTable = function (query) {
    window.librarySearchQuery = query.toLowerCase();
    renderLibraryTable();
};

window.renderLibraryTable = async function () {
    const tbody = document.getElementById('library-table-body');
    const emptyState = document.getElementById('library-empty-state');
    const searchQuery = (window.librarySearchQuery || '').toLowerCase();
    const filterType = document.getElementById('library-filter-type')?.value || 'all';

    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="padding: 40px; text-align: center; color: #64748b;">Loading library...</td></tr>';

    let library = [];
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('books')
                .select('*, chapters(id)') // Fetch chapter IDs for counting
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: false });
            if (data) library = data;
            if (error) throw error;
        } catch (e) {
            console.error("Supabase library fetch failed", e);
            library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
        }
    } else {
        library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    }

    tbody.innerHTML = '';

    const filteredLibrary = library.filter(item => {
        // Type filter
        const itemType = item.category || item.type || 'book';
        if (filterType !== 'all' && itemType !== filterType) return false;

        // Search filter
        if (!searchQuery) return true;
        return (item.title && item.title.toLowerCase().includes(searchQuery)) ||
            (item.author && item.author.toLowerCase().includes(searchQuery)) ||
            (item.id && item.id.toString().includes(searchQuery));
    });

    if (filteredLibrary.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'block';
            emptyState.querySelector('p').textContent = searchQuery ? `No items matching "${searchQuery}"` : 'Your library is empty. Start by creating new content!';
        }
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    filteredLibrary.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #1e293b';

        const itemType = item.category || item.type || 'book';

        // Status Toggle Logic
        const isHidden = item.status === 'hidden';
        const visibilityIcon = isHidden ? '👁️‍🗨️' : '👁️';
        const visibilityColor = isHidden ? '#64748b' : '#10b981';
        const visibilityTitle = isHidden ? 'Currently Hidden (Click to Publish)' : 'Currently Published (Click to Hide)';

        tr.innerHTML = `
            <td style="padding: 15px;">
                <img src="${window.getBustedUrl(item.image || 'assets/logo-new.png')}" style="width: 40px; height: 55px; border-radius: 4px; object-fit: cover; background: #0f172a;" loading="eager">
            </td>
            <td style="padding: 15px; color: white; font-weight: 500;">
                <div style="font-size: 0.95rem;">${item.title}</div>
                <small style="color:#64748b; text-transform: capitalize;">${item.author || 'Unknown Author'}</small>
            </td>
            <td style="padding: 15px;">
                <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
                    <span style="font-size: 1.1rem;">${(window.categoryMap[itemType] && window.categoryMap[itemType].icon) || '📚'}</span>
                    ${itemType}
                </span>
            </td>
            <td style="padding: 15px;">
                <input type="number" value="${item.sort_order || 0}" 
                    onchange="updateLibraryOrder('${item.id}', this.value)"
                    style="width: 60px; padding: 6px; background: #0f172a; border: 1px solid #334155; color: white; border-radius: 4px; text-align: center;">
            </td>
            <td style="padding: 15px; color: #e2e8f0;">${item.chapters ? item.chapters.length : 0} Chapters</td>
            <td style="padding: 15px;">
                <button onclick="toggleLibraryVisibility('${item.id}')" 
                    style="background:none; border:1px solid ${visibilityColor}; color:${visibilityColor}; padding: 4px 8px; border-radius: 4px; cursor:pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;" 
                    title="${visibilityTitle}">
                    ${visibilityIcon} ${isHidden ? 'Hidden' : 'Visible'}
                </button>
            </td>
            <td style="padding: 15px; text-align: right; position: relative;">
                <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end;">
                    <a href="book-detail.html?id=${item.id}" target="_blank" class="btn-primary" 
                        style="padding: 6px 10px; background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; color: #3b82f6; text-decoration: none; border-radius: 6px; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">
                        <span>🔗</span> View
                    </a>
                    <button onclick="openVariantsModal('${item.id}', '${item.original_book_id || item.id}', '${item.title.replace(/'/g, "\\'")}')" 
                        style="background:rgba(59, 130, 246, 0.1); border:1px solid #3b82f6; color:#3b82f6; border-radius: 6px; cursor:pointer; font-size:1.1rem; padding:4px 8px;" 
                        title="View Language Variants">🌐</button>
                    <button onclick="toggleActionMenu('${item.id}', this)" 
                        style="background:rgba(255,255,255,0.05); border:1px solid #334155; color:#94a3b8; border-radius: 6px; cursor:pointer; font-size:1.1rem; padding:4px 8px;">⋮</button>
                </div>
                <div id="action-menu-${item.id}" class="action-menu-dropdown" style="display:none; position:absolute; right:15px; top:50px; background:#1e293b; border:1px solid #334155; border-radius:8px; width:180px; z-index:100; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
                    <button onclick="viewLibraryItemDetails('${item.id}')" style="width:100%; text-align:left; padding:10px 15px; background:none; border:none; color:#e2e8f0; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.9rem;">
                        <span>📖</span> Reader View
                    </button>
                    <button onclick="editLibraryItem('${item.id}')" style="width:100%; text-align:left; padding:10px 15px; background:none; border:none; color:#e2e8f0; cursor:pointer; display:flex; align-items:center; gap:10px; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.9rem;">
                        <span>📝</span> Edit Content
                    </button>
                    <button onclick="deleteLibraryItem('${item.id}')" style="width:100%; text-align:left; padding:10px 15px; background:none; border:none; color:#ef4444; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:0.9rem;">
                        <span>🗑️</span> Delete Item
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.viewLibraryItemDetails = function (id) {
    window.open(`reader.html?id=${id}`, '_blank');
};

window.toggleActionMenu = function (id, btn) {
    // Close others
    document.querySelectorAll('.action-menu-dropdown').forEach(d => d.style.display = 'none');
    const menu = document.getElementById(`action-menu-${id}`);
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
    // Close on click outside (simple implementation)
    setTimeout(() => {
        const closer = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.style.display = 'none';
                document.removeEventListener('click', closer);
            }
        };
        document.addEventListener('click', closer);
    }, 0);
};

// --- VARIANTS MANAGER ---

window.openVariantsModal = async function (id, familyId, title) {
    const modal = document.getElementById('variants-modal');
    const titleEl = document.getElementById('variants-book-title');
    const listEl = document.getElementById('variants-list');

    if (!modal || !listEl) return;

    titleEl.textContent = `Family: ${title}`;
    listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">🔍 Searching for variants...</div>';
    modal.style.display = 'flex';

    if (typeof supabaseClient === 'undefined') {
        listEl.innerHTML = '<div style="color: #ef4444; padding: 20px;">Supabase not connected.</div>';
        return;
    }

    try {
        // query for variants
        // Validate UUID to prevent Supabase 400 error
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(familyId);

        if (!isUuid) {
            console.warn("Skipping variants fetch: Invalid UUID", familyId);
            listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">Variants not available for legacy items.</div>';
            return;
        }

        const { data: variants, error } = await supabaseClient
            .from('books')
            .select('id, title, language, chapters(id)')
            .or(`id.eq.${familyId},original_book_id.eq.${familyId}`)
            .order('language', { ascending: true });

        if (error) throw error;

        if (!variants || variants.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">No variants found.</div>';
            return;
        }

        const langNames = {
            'en': 'English', 'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French',
            'ar': 'Arabic', 'zh': 'Mandarin', 'bn': 'Bengali', 'pt': 'Portuguese',
            'ru': 'Russian', 'ur': 'Urdu', 'jp': 'Japanese', 'pa': 'Punjabi',
            'mr': 'Marathi', 'hi-en': 'Hinglish', 'de': 'German'
        };

        listEl.innerHTML = '';
        variants.forEach(v => {
            const isCurrent = v.id === id;
            const langName = langNames[v.language] || v.language?.toUpperCase() || 'Unknown';
            const chapterCount = v.chapters ? v.chapters.length : 0;

            const div = document.createElement('div');
            div.style.cssText = `
                display: flex; justify-content: space-between; align-items: center; 
                padding: 12px 15px; background: ${isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)'}; 
                border: 1px solid ${isCurrent ? '#3b82f6' : 'rgba(255,255,255,0.05)'}; 
                border-radius: 8px;
            `;

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-size: 1.2rem;">${v.language === 'en' ? '🇺🇸' : '🌐'}</span>
                    <div>
                        <div style="color: white; font-weight: 500;">${langName} ${isCurrent ? '<span style="color: #3b82f6; font-size: 0.7rem; margin-left: 5px; background: rgba(59, 130, 246, 0.1); padding: 2px 5px; border-radius: 4px;">ACTIVE</span>' : ''}</div>
                        <small style="color: #64748b;">${v.language.toUpperCase()} • ${chapterCount} Chapters</small>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <a href="reader.html?id=${v.id}" target="_blank" class="btn-primary" 
                        style="padding: 5px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.05); border: 1px solid #334155; color: #cbd5e1; text-decoration: none; border-radius: 4px;">📖 View</a>
                    <button onclick="editVariant('${v.id}')" class="btn-primary" 
                        style="padding: 5px 10px; font-size: 0.75rem; background: ${isCurrent ? '#3b82f6' : '#1e293b'}; border: 1px solid #3b82f6; color: white; border-radius: 4px; cursor: pointer;">📝 Edit</button>
                </div>
            `;
            listEl.appendChild(div);
        });

    } catch (e) {
        console.error("Failed to load variants", e);
        listEl.innerHTML = `<div style="color: #ef4444; padding: 20px;">Error: ${e.message}</div>`;
    }
};

window.closeVariantsModal = function () {
    const modal = document.getElementById('variants-modal');
    if (modal) modal.style.display = 'none';
};

window.editVariant = function (id) {
    closeVariantsModal();
    editLibraryItem(id);
};






window.toggleLibraryVisibility = function (id) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(i => i.id === id);
    if (item) {
        item.status = (item.status === 'hidden') ? 'published' : 'hidden';
        localStorage.setItem('siteLibrary', JSON.stringify(library));

        // Sync update
        if (typeof syncToCloud === 'function') syncToCloud('library_update', item);

        renderLibraryTable();
        showToast(`Book is now ${item.status}`, 'info');
    }
};

window.updateLibraryOrder = function (id, newOrder) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(i => i.id === id);
    if (item) {
        item.sort_order = parseInt(newOrder);
        localStorage.setItem('siteLibrary', JSON.stringify(library));

        // Sync update
        if (typeof syncToCloud === 'function') syncToCloud('library_update', item);

        showToast("Order updated", "success");
    }
};

window.deleteLibraryItem = function (id) {
    customConfirm("Are you sure you want to delete this item?", "Delete Confirmation", "🗑️")
        .then(confirmed => {
            if (!confirmed) return;
            const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
            const filtered = library.filter(item => item.id !== id);
            localStorage.setItem('siteLibrary', JSON.stringify(filtered));

            if (typeof syncToCloud === 'function') syncToCloud('library_delete', null, id);
            renderLibraryTable();
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            showToast("Item deleted successfully", "success");
        });
};

window.clearFullLibrary = function () {
    customConfirm("CRITICAL: This will delete ALL published items. Continue?", "Wipe Library", "⚠️")
        .then(confirmed => {
            if (!confirmed) return;
            localStorage.removeItem('siteLibrary');
            renderLibraryTable();
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            showToast("Library cleared!", "warning");
        });
};

window.editLibraryItem = function (id) {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const item = library.find(i => i.id === id);

    if (!item) {
        showToast("Item not found!", 'error');
        return;
    }

    // Initialize Editor State
    window.currentEditorBookId = id;

    // Select the book in the dropdown (if it exists)
    const bookSelect = document.getElementById('content-editor-book-select');
    if (bookSelect) {
        // We need to refresh the list first to ensure this book is in it
        if (typeof loadContentEditorBooks === 'function') loadContentEditorBooks();
        bookSelect.value = id;
    }

    // Switch to the correct section
    showSection('content-editor');

    // Trigger the load logic
    if (typeof loadContentEditorBook === 'function') loadContentEditorBook();

    showToast(`Editing: ${item.title}`);
};

window.renderFeedbackTable = async function () {
    const tbody = document.getElementById('feedback-table-body');
    const emptyMsg = document.getElementById('feedback-empty-msg');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="padding: 40px; text-align: center; color: #64748b;">Loading feedback...</td></tr>';

    let feedback = [];

    // 1. Try to fetch from Supabase first
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('site_feedback')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) feedback = data;
            if (error) throw error;
        } catch (e) {
            console.error("Supabase feedback fetch failed", e);
        }
    }

    // 2. Fallback to localStorage if no cloud feedback found
    if (feedback.length === 0) {
        feedback = JSON.parse(localStorage.getItem('siteFeedback') || '[]');
    }

    tbody.innerHTML = '';
    if (feedback.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    feedback.forEach(item => {
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : (item.date || 'Unknown');
        const isRead = item.status === 'read';

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #1e293b';
        if (isRead) tr.style.opacity = '0.6';

        tr.innerHTML = `
            <td style="padding: 15px; color: #64748b; font-size: 0.85rem;">${dateStr}</td>
            <td style="padding: 15px; color: white; font-weight: 500;">
                ${item.name || 'Anonymous'}<br>
                <small style="color:#64748b">${item.email || 'No email'}</small>
            </td>
            <td style="padding: 15px;">
                <span style="background:rgba(30, 41, 59, 0.5); padding:4px 10px; border-radius:100px; font-size:0.75rem; color:#94a3b8; border: 1px solid rgba(255,255,255,0.05);">
                    ${(item.topic || 'General').toUpperCase()}
                </span>
            </td>
            <td style="padding: 15px; max-width: 400px; line-height: 1.5; color: #cbd5e1;">
                ${item.message}
            </td>
            <td style="padding: 15px; white-space: nowrap;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    ${!isRead ? `<button onclick="markFeedbackRead('${item.id}')" style="background:#0ea5e9; border:none; color:white; padding: 6px 12px; border-radius: 6px; cursor:pointer; font-size: 0.75rem; font-weight: 600;">Check</button>` : '<span style="color:#10b981; font-size:0.8rem;">✓ Read</span>'}
                    <button onclick="deleteFeedbackItem('${item.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size: 1.1rem;" title="Delete">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.markFeedbackRead = async function (id) {
    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient && id.length > 20) {
        const { error } = await supabaseClient.from('site_feedback').update({ status: 'read' }).eq('id', id);
        if (error) {
            showToast('Failed to update cloud status', 'error');
            return;
        }
    } else {
        const feedback = JSON.parse(localStorage.getItem('siteFeedback') || '[]');
        const item = feedback.find(fb => fb.id === id);
        if (item) item.status = 'read';
        localStorage.setItem('siteFeedback', JSON.stringify(feedback));
    }
    renderFeedbackTable();
};

window.deleteFeedbackItem = async function (id) {
    customConfirm("Delete this feedback forever?", "Delete Message", "🗑️").then(async confirmed => {
        if (!confirmed) return;

        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient && id.length > 20) {
            const { error } = await supabaseClient.from('site_feedback').delete().eq('id', id);
            if (error) {
                showToast('Failed to delete from cloud', 'error');
                return;
            }
        } else {
            const feedback = JSON.parse(localStorage.getItem('siteFeedback') || '[]');
            const filtered = feedback.filter(item => item.id !== id);
            localStorage.setItem('siteFeedback', JSON.stringify(filtered));
        }

        showToast('Feedback message deleted');
        renderFeedbackTable();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
    });
};

window.updateDashboardStats = async function () {
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    let feedbackCount = JSON.parse(localStorage.getItem('siteFeedback') || '[]').length;

    if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
        try {
            const { count, error } = await supabaseClient
                .from('site_feedback')
                .select('*', { count: 'exact', head: true });

            if (count !== null) feedbackCount = count;
        } catch (e) { }
    }

    const readersEl = document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-number');
    const feedbackEl = document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-number');

    if (readersEl) {
        const targetVal = 1284 + library.length;
        if (typeof window.animateNumber === 'function') {
            window.animateNumber(readersEl, targetVal);
        } else {
            readersEl.textContent = targetVal.toLocaleString();
        }
    }

    if (feedbackEl) {
        if (typeof window.animateNumber === 'function') {
            window.animateNumber(feedbackEl, feedbackCount);
        } else {
            feedbackEl.textContent = feedbackCount;
        }
    }
};
