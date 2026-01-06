// Global utility functions for custom modals on user-facing pages
window.showToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
};

window.customConfirm = (message, title = "Are you sure?", icon = "⚠️") => {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');

        if (!modal) {
            resolve(confirm(message));
            return;
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;
        modal.style.display = 'block';

        const handleResolve = (val) => {
            modal.style.display = 'none';
            cleanup();
            resolve(val);
        };

        const onCancel = () => handleResolve(false);
        const onConfirm = () => handleResolve(true);
        const cleanup = () => {
            okBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };
        okBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
};

window.customAlert = (message, type = 'info', title = '', icon = '') => {
    return new Promise((resolve) => {
        const modal = document.getElementById('alert-modal');
        const titleEl = document.getElementById('alert-title');
        const msgEl = document.getElementById('alert-message');
        const iconEl = document.getElementById('alert-icon');
        const okBtn = document.getElementById('alert-ok-btn');

        if (!modal) {
            alert(message);
            resolve();
            return;
        }

        // Auto-select icon and title based on type if not provided
        if (!icon) {
            if (type === 'success') icon = '✅';
            else if (type === 'error') icon = '❌';
            else if (type === 'warning') icon = '⚠️';
            else icon = 'ℹ️';
        }
        if (!title) {
            if (type === 'success') title = 'Success';
            else if (type === 'error') title = 'Error';
            else if (type === 'warning') title = 'Warning';
            else title = 'Notice';
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;
        modal.style.display = 'block';

        const handleResolve = () => {
            modal.style.display = 'none';
            cleanup();
            resolve();
        };

        const cleanup = () => {
            okBtn.removeEventListener('click', handleResolve);
        };
        okBtn.addEventListener('click', handleResolve);
    });
};

window.customPrompt = (message, defaultValue = '', title = 'Input Required', icon = '✏️', isLongText = false) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('prompt-modal');
        const titleEl = document.getElementById('prompt-title');
        const msgEl = document.getElementById('prompt-message');
        const iconEl = document.getElementById('prompt-icon');
        let inputEl = document.getElementById('prompt-input');
        const okBtn = document.getElementById('prompt-ok-btn');
        const cancelBtn = document.getElementById('prompt-cancel-btn');

        if (!modal) {
            resolve(prompt(message, defaultValue));
            return;
        }

        // Handle Textarea dynamic creation
        let areaEl = document.getElementById('prompt-textarea');
        if (!areaEl) {
            areaEl = document.createElement('textarea');
            areaEl.id = 'prompt-textarea';
            areaEl.style.cssText = "width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: white; font-size: 1rem; margin-bottom: 25px; min-height: 120px; font-family: inherit; resize: vertical; display: none;";
            if (inputEl) inputEl.parentNode.insertBefore(areaEl, inputEl.nextSibling);
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;

        // Toggle Input vs Textarea
        if (isLongText) {
            inputEl.style.display = 'none';
            areaEl.style.display = 'block';
            areaEl.value = defaultValue;
            setTimeout(() => areaEl.focus(), 100);
        } else {
            inputEl.style.display = 'block';
            areaEl.style.display = 'none';
            inputEl.value = defaultValue;
            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 100);
        }

        modal.style.display = 'block';

        const handleResolve = (val) => {
            modal.style.display = 'none';
            cleanup();
            resolve(val);
        };

        const onCancel = () => handleResolve(null);
        const onConfirm = () => handleResolve(isLongText ? areaEl.value : inputEl.value);

        const onEnter = (e) => {
            // Textarea allows enter for new lines, so only trigger on Ctrl+Enter
            if (isLongText) {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    onConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            } else {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            }
        };

        const cleanup = () => {
            okBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            inputEl.removeEventListener('keydown', onEnter);
            areaEl.removeEventListener('keydown', onEnter);
        };

        okBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        inputEl.addEventListener('keydown', onEnter);
        areaEl.addEventListener('keydown', onEnter);
    });
};

window.customReport = (title = 'Report Content', icon = '🚩') => {
    return new Promise((resolve) => {
        const modal = document.getElementById('report-modal');
        const titleEl = document.getElementById('report-title');
        const iconEl = document.getElementById('report-icon');
        const nameInput = document.getElementById('report-name');
        const reasonInput = document.getElementById('report-reason');
        const okBtn = document.getElementById('report-ok-btn');
        const cancelBtn = document.getElementById('report-cancel-btn');

        if (!modal) {
            const name = prompt("Enter your name:", "");
            const reason = prompt("Enter reason for reporting:", "");
            if (name && reason) resolve({ name, reason });
            else resolve(null);
            return;
        }

        titleEl.textContent = title;
        iconEl.textContent = icon;
        nameInput.value = '';
        reasonInput.value = '';

        modal.style.display = 'flex';
        setTimeout(() => nameInput.focus(), 100);

        const handleResolve = (val) => {
            modal.style.display = 'none';
            cleanup();
            resolve(val);
        };

        const onCancel = () => handleResolve(null);
        const onConfirm = () => {
            const name = nameInput.value.trim();
            const reason = reasonInput.value.trim();
            if (!name || !reason) {
                if (window.showToast) window.showToast('Please fill in both fields', 'warning');
                else alert('Please fill in both fields');
                return;
            }
            handleResolve({ name, reason });
        };

        const cleanup = () => {
            okBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };
        okBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
};
