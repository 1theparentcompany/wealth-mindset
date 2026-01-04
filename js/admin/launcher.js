// Launcher / Initialization for Admin Panel

async function verifyAdminCode() {
    // 1. Check if Supabase client is available
    if (!window.supabaseClient) {
        console.error("Supabase client not initialized.");
        window.location.href = 'contact.html';
        return;
    }

    // 2. Check for active Supabase session
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();

    if (error || !session) {
        // No valid session - redirect to contact page (where they can trigger hidden login)
        console.warn("No active Supabase session found. Redirecting to contact page.");
        localStorage.removeItem('admin_ui_access');
        sessionStorage.removeItem('adminAuthenticated');
        window.location.href = 'contact.html';
        return;
    }

    // 3. Verify user has admin role
    try {
        const { data: profile, error: roleError } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (roleError || !profile) {
            console.error("Failed to fetch user role:", roleError);
            await window.supabaseClient.auth.signOut();
            localStorage.removeItem('admin_ui_access');
            sessionStorage.removeItem('adminAuthenticated');
            window.location.href = 'contact.html';
            return;
        }

        if (profile.role !== 'admin') {
            console.warn(`User ${session.user.email} does not have admin role (current role: ${profile.role})`);
            alert('Access Denied: Admin privileges required.');
            await window.supabaseClient.auth.signOut();
            localStorage.removeItem('admin_ui_access');
            sessionStorage.removeItem('adminAuthenticated');
            window.location.href = 'index.html';
            return;
        }

        // 4. User is authenticated AND has admin role
        console.log(`✓ Admin authenticated: ${session.user.email} (role: ${profile.role})`);
        sessionStorage.setItem('adminAuthenticated', 'true');
        launchAdmin();

    } catch (err) {
        console.error("Error verifying admin role:", err);
        await window.supabaseClient.auth.signOut();
        localStorage.removeItem('admin_ui_access');
        sessionStorage.removeItem('adminAuthenticated');
        window.location.href = 'contact.html';
    }
}

async function launchAdmin() {
    console.log("Admin Panel Launching...");

    // 0. Sync from Cloud if available (ensures cross-browser consistency)
    if (typeof syncFromCloud === 'function') {
        await syncFromCloud();
    }

    // 1. Initial State Load
    if (typeof initTaxonomy === 'function') initTaxonomy();
    if (typeof updateDashboardStats === 'function') updateDashboardStats();

    // 2. Component Initialization
    if (typeof loadMetaBooks === 'function') loadMetaBooks();
    if (typeof loadDetailPageBooks === 'function') loadDetailPageBooks();
    if (typeof initCharts === 'function') initCharts();

    // 3. Handle Initial View
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        if (typeof showSection === 'function') showSection(initialHash);
    } else {
        if (typeof showSection === 'function') showSection('dashboard-view');
    }

    // 4. Setup Drag & Drop for Tabs
    setupTabDragAndDrop();

    // 5. Global Event Listeners for Dynamic UI
    setupGlobalUIListeners();

    console.log("Admin Panel Ready.");
}

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminAuthenticated') === 'true') {
        launchAdmin();
    } else {
        verifyAdminCode();
    }
});

function setupTabDragAndDrop() {
    const containers = ['#active-tabs-list', '#adv-tools-tabs-list'];
    containers.forEach(selector => {
        const container = document.querySelector(selector);
        if (!container) return;

        container.addEventListener('dragover', e => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        });
    });

    document.addEventListener('dragstart', e => {
        if (e.target.classList.contains('tab-item')) {
            e.target.classList.add('dragging');
        }
    });

    document.addEventListener('dragend', e => {
        if (e.target.classList.contains('tab-item')) {
            e.target.classList.remove('dragging');
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.tab-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function setupGlobalUIListeners() {
    // Sync line numbers on paste input
    const pasteEl = document.getElementById('manual-paste');
    if (pasteEl) {
        pasteEl.addEventListener('input', function () {
            if (typeof initContent === 'function') initContent(this.value);
        });
    }

    // Scroll sync for preview
    const previewBox = document.getElementById('preview-box');
    if (previewBox) {
        previewBox.addEventListener('input', () => {
            if (typeof updateLineNumbers === 'function') updateLineNumbers();
            if (window.chaptersArray && window.chaptersArray[window.currentChapterIndex]) {
                window.chaptersArray[window.currentChapterIndex].content = previewBox.value;
            }
            if (typeof saveDraft === 'function') saveDraft();
        });
        previewBox.addEventListener('scroll', () => {
            if (typeof syncScroll === 'function') syncScroll();
        });
    }

    // Drag & Drop for Upload Zone
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "#3b82f6";
            dropZone.style.background = "rgba(59, 130, 246, 0.1)";
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = "#1e293b";
            dropZone.style.background = "rgba(0, 0, 0, 0.2)";
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = "#1e293b";
            dropZone.style.background = "rgba(0, 0, 0, 0.2)";
            const file = e.dataTransfer.files[0];
            if (file && typeof handleDroppedFile === 'function') {
                handleDroppedFile(file);
            }
        });
    }

    // Hash navigation
    window.addEventListener('hashchange', () => {
        const h = window.location.hash.substring(1);
        if (h && typeof showSection === 'function') showSection(h);
    });
}

async function logoutAdmin() {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    localStorage.removeItem('admin_ui_access');
    sessionStorage.removeItem('adminAuthenticated');
    window.location.href = 'index.html';
}
