
// Image Manager Logic for Admin Panel

let currentImage1Data = [];
// Expose globally for homepage.js to access during save
window.currentImage1Data = currentImage1Data;

// Ensure we sync with global config if available
if (typeof homepageConfig !== 'undefined' && homepageConfig.imageManager1) {
    currentImage1Data = homepageConfig.imageManager1;
}

// Update global config whenever we change data
function updateGlobalConfig() {
    // Sync with local variable first
    window.currentImage1Data = currentImage1Data;

    if (typeof homepageConfig !== 'undefined') {
        homepageConfig.imageManager1 = currentImage1Data;
    }
}

// Initialize Image Manager when section is shown
// This function should be called when 'image-manager' view is activated
// For now, we'll hook into the global showSection or just rely on manual refresh/load if necessary, 
// but ideally we hook into the existing admin navigation system.
// We can expose a function that the main admin script calls.

async function loadImage1Settings() {
    const listContainer = document.getElementById('image-1-list');
    listContainer.innerHTML = '<div style="text-align: center; color: #fff;">Loading...</div>';

    try {
        const { data, error } = await supabaseClient
            .from('homepage_settings')
            .select('image_manager_1')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

        if (error) throw error;

        currentImage1Data = data.image_manager_1 || [];
        window.currentImage1Data = currentImage1Data; // Sync global
        updateGlobalConfig(); // Ensure homepageConfig is in sync immediately
        renderImage1List();

    } catch (err) {
        console.error('Error loading image settings:', err);
        listContainer.innerHTML = '<div style="color: #ef4444;">Failed to load images. ' + err.message + '</div>';
    }
}

function renderImage1List() {
    const listContainer = document.getElementById('image-1-list');
    listContainer.innerHTML = '';

    if (currentImage1Data.length === 0) {
        listContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8; border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px;">No images added yet.</div>';
        return;
    }

    currentImage1Data.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'image-item-card';
        div.style.cssText = `
            background: #1e293b; 
            border-radius: 8px; 
            overflow: hidden; 
            position: relative; 
            border: 1px solid rgba(255,255,255,0.1);
            display: flex;
            flex-direction: column;
        `;

        div.innerHTML = `
            <div style="height: 120px; overflow: hidden; background: #000;">
                <img src="${img.url}" alt="${img.alt || 'Image'}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="padding: 10px; display: flex; flex-direction: column; gap: 5px; flex: 1;">
                <div style="font-weight: bold; font-size: 0.8rem; color: #fbbf24;">ID: ${img.id || 'N/A'}</div>
                <div style="font-size: 0.75rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${img.url}</div>
                <div style="margin-top: auto; display: flex; gap: 5px; justify-content: flex-end;">
                    <button class="btn-danger-sm" onclick="removeImage1(${index})" style="padding: 4px 8px; font-size: 0.75rem; background: #ef4444; border: none; color: white; border-radius: 4px; cursor: pointer;">Remove</button>
                    <button class="btn-primary-sm" onclick="editImage1(${index})" style="padding: 4px 8px; font-size: 0.75rem; background: #3b82f6; border: none; color: white; border-radius: 4px; cursor: pointer;">Edit</button>
                </div>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

function addImage1() {
    const idInput = document.getElementById('new-image-1-id');
    const urlInput = document.getElementById('new-image-1-url');
    const altInput = document.getElementById('new-image-1-alt');
    const descInput = document.getElementById('new-image-1-description');

    const id = idInput.value.trim();
    const url = urlInput.value.trim();
    const alt = altInput.value.trim();
    const description = descInput.value.trim();

    if (!id || !url) {
        alert('Please provide both ID and URL.');
        return;
    }

    // Check for duplicate ID
    if (currentImage1Data.some(img => img.id === id)) {
        alert('Image ID must be unique.');
        return;
    }

    currentImage1Data.push({ id, url, alt, description });
    updateGlobalConfig();

    // Reset inputs
    idInput.value = '';
    urlInput.value = '';
    altInput.value = '';
    descInput.value = '';

    renderImage1List();
}

function removeImage1(index) {
    if (confirm('Are you sure you want to remove this image?')) {
        currentImage1Data.splice(index, 1);
        updateGlobalConfig();
        renderImage1List();
    }
}

function editImage1(index) {
    const img = currentImage1Data[index];
    const newUrl = prompt("Update Image URL:", img.url);
    if (newUrl !== null) {
        img.url = newUrl.trim();
        const newAlt = prompt("Update Alt Text:", img.alt);
        if (newAlt !== null) {
            img.alt = newAlt.trim();
        }
        renderImage1List();
    }
}

async function saveImage1Settings() {
    try {
        const { error } = await supabaseClient
            .from('homepage_settings')
            .update({ image_manager_1: currentImage1Data })
            .eq('id', '00000000-0000-0000-0000-000000000001'); // Assuming single row config

        if (error) throw error;

        alert('Image settings saved successfully!');
    } catch (err) {
        console.error('Error saving settings:', err);
        alert('Failed to save settings: ' + err.message);
    }
}


function switchImageTab(tabName) {
    // Basic tab switching logic if we add more tabs later
    // For now only image1 exists and is active by default
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Find button with onclick containing tabName
    // (Simplification for existing structure)
    event.target.classList.add('active');
    document.getElementById('tab-' + tabName).classList.add('active');
}

// Global Exposure for HTML onclicks
window.loadImage1Settings = loadImage1Settings;
window.addImage1 = addImage1;
window.removeImage1 = removeImage1;
window.editImage1 = editImage1;
window.saveImage1Settings = saveImage1Settings;
window.switchImageTab = switchImageTab;

// Auto-init mechanism: hook into showSection if possible
const originalShowSection = window.showSection;
window.showSection = function (sectionId) {
    if (originalShowSection) originalShowSection(sectionId);

    // Custom init logic
    if (sectionId === 'image-manager') {
        loadImage1Settings();
    }
};
