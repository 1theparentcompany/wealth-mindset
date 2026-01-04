// Core Navigation and State for Admin Panel

// --- GLOBAL STATE ---
window.extractedText = "";
window.chaptersArray = [];
window.currentChapterIndex = 0;
window.currentEditId = null;

window.categoryMap = {
    'book': { icon: '📔', genres: ['Inspiration', 'Education', 'Finance', 'Psychology', 'Business', 'Self-Help'] },
    'story': { icon: '📖', genres: ['Inspirational', 'Motivational', 'Success Story', 'Biographical', 'Classic'] },
    'guide': { icon: '🧭', genres: ['Wealth Management', 'Personal Growth', 'Study Guide', 'Technical'] },
    'laws': { icon: '⚖️ ', genres: ['Finance Laws', 'Legal Rights', 'Property Laws', 'General'] },
    'chapter': { icon: '📄 ', genres: ['Snippet', 'Short Reading', 'Quote'] },
    'quates': { icon: '📄', genres: ['General'] }
};

// --- NAVIGATION ---
window.currentActiveSection = 'dashboard-view'; // Track for optimization

window.showSection = function (id) {
    if (!id || id === window.currentActiveSection) return;

    // Hide previous section only (Optimization)
    const prev = document.getElementById(window.currentActiveSection);
    if (prev) {
        prev.style.display = 'none';
        prev.classList.remove('active');
    }

    const target = document.getElementById(id);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        window.currentActiveSection = id; // Update tracker
        window.scrollTo(0, 0);
        if (window.location.hash !== '#' + id) {
            window.location.hash = id;
        }
    }

    // Initialize section-specific logic
    try {
        if (id === 'site-analytics' && typeof initCharts === 'function') setTimeout(initCharts, 100);
        if (id === 'library-manager' && typeof renderLibraryTable === 'function') renderLibraryTable();
        if (id === 'feedback-inbox' && typeof renderFeedbackTable === 'function') renderFeedbackTable();
        if (id === 'site-settings' && typeof loadSettings === 'function') loadSettings();
        if (id === 'content-editor' && typeof loadContentEditorBooks === 'function') loadContentEditorBooks();
        if (id === 'metadata-manager' && typeof loadMetaBooks === 'function') loadMetaBooks();
        if (id === 'detail-page-editor' && typeof loadDetailPageBooks === 'function') loadDetailPageBooks();
        if (id === 'detail-page-commons' && typeof loadDetailCommons === 'function') loadDetailCommons();
        if (id === 'homepage-manager' && typeof initHomepageManager === 'function') initHomepageManager();
        if (id === 'common-settings' && typeof loadCommonSettings === 'function') loadCommonSettings();
        if (id === 'taxonomy-ads-manager' && typeof initAdvancedTools === 'function') initAdvancedTools();
        if (id === 'community-manager' && typeof initCommunityManager === 'function') initCommunityManager();
        if (id === 'review-manager' && typeof initReviewManager === 'function') initReviewManager();
        if (id === 'supabase-manager' && typeof testSupabaseConnection === 'function') testSupabaseConnection();
        if (id === 'manage-content' && typeof loadDraft === 'function') {
            const draft = localStorage.getItem('contentStudioDraft');
            if (draft && chaptersArray.length === 0) loadDraft();
        }
    } catch (e) {
        console.warn("Section initialization helper failed:", e);
    }
}

// Handle Hash Change
window.addEventListener('hashchange', () => {
    const currentHash = window.location.hash.substring(1);
    if (currentHash) showSection(currentHash);
});

// Taxonomy Initialization
window.initTaxonomy = function () {
    const saved = localStorage.getItem('siteTaxonomy');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(categoryMap, parsed);
        } catch (e) { console.error("Taxonomy parse failed", e); }
    }
};
window.startNewContent = function () {
    window.currentEditId = null;
    window.chaptersArray = [];
    window.currentChapterIndex = 0;

    // Clear inputs in New Content section
    const fields = ['book-title', 'book-author', 'book-cover', 'book-desc', 'manual-paste', 'preview-box'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = (id === 'preview-box') ? '[No content loaded]' : '';
    });

    const chaptersDiv = document.getElementById('chapter-list-preview');
    if (chaptersDiv) {
        chaptersDiv.innerHTML = '<p style="color: #64748b; font-size: 0.9rem;">Chapters will appear here after splitting.</p>';
    }

    if (typeof updateSubcategories === 'function') updateSubcategories();

    const publishBtn = document.querySelector('.split-results-panel .btn-success');
    if (publishBtn) publishBtn.innerHTML = '<span>🚀</span> Publish';

    const status = document.getElementById('extraction-status');
    if (status) {
        status.textContent = 'Ready for upload...';
        status.style.color = "#94a3b8";
    }

    showSection('manage-content');
    if (typeof updateLineNumbers === 'function') updateLineNumbers();
    if (typeof saveDraft === 'function') saveDraft();
};
