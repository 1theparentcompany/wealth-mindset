document.addEventListener('DOMContentLoaded', () => {
    // Initialize if we are already in the section
    if (window.location.hash === '#daily-mindset-manager') {
        initDailyMindsetManager();
    }
});

if (typeof window.mindsetList === 'undefined') {
    window.mindsetList = [];
}

function initDailyMindsetManager() {
    console.log("Initializing Daily Mindset Manager...");

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('mindset-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
        loadMindsetForDate(); // Load for today
    }

    loadDailyMindsetList();
}

async function loadDailyMindsetList() {
    const listEl = document.getElementById('mindset-history-list');
    if (!listEl) return;

    listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">Loading...</div>';

    try {
        if (typeof supabaseClient === 'undefined') {
            throw new Error("Supabase not initialized");
        }

        // Fetch last 15 entries (ordered by date desc)
        const { data, error } = await supabaseClient
            .from('daily_mindset')
            .select('*')
            .order('date', { ascending: false })
            .limit(15);

        if (error) throw error;

        mindsetList = data || [];
        renderMindsetList();

    } catch (err) {
        console.error("Error loading mindset list:", err);
        listEl.innerHTML = `<div style="color: #ef4444; padding: 10px;">Error loading data: ${err.message}</div>`;
    }
}

function renderMindsetList() {
    const listEl = document.getElementById('mindset-history-list');
    listEl.innerHTML = '';

    if (mindsetList.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b;">No insights found. Schedule one!</div>';
        return;
    }

    mindsetList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-card'; // Reuse admin style
        div.style.cssText = 'padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;';

        // Highlight logic
        const currentDate = document.getElementById('mindset-date').value;
        if (currentDate === item.date) {
            div.style.background = 'rgba(251, 191, 36, 0.1)'; // Amber hint
            div.style.borderColor = 'rgba(251, 191, 36, 0.3)';
        }

        div.innerHTML = `
            <div>
                <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">${formatDateAdmin(item.date)}</div>
                <div style="font-size: 0.9rem; color: #94a3b8;">${item.title || '(No Title)'}</div>
            </div>
            <div style="font-size: 1.2rem;">✏️</div>
        `;
        div.onclick = () => {
            document.getElementById('mindset-date').value = item.date;
            loadMindsetForDate();
        };

        listEl.appendChild(div);
    });
}

async function loadMindsetForDate() {
    const dateVal = document.getElementById('mindset-date').value;
    if (!dateVal) return;

    // Reset Form First
    document.getElementById('mindset-title').value = '';
    document.getElementById('mindset-content').value = '';
    document.getElementById('mindset-link').value = '';
    document.getElementById('mindset-image').value = '';

    // Check if we already have it in our fetched list to save a network call
    const cached = mindsetList.find(m => m.date === dateVal);

    if (cached) {
        populateMindsetForm(cached);
    } else {
        // Fetch specific date from DB
        try {
            const { data, error } = await supabaseClient
                .from('daily_mindset')
                .select('*')
                .eq('date', dateVal)
                .single();

            if (data) {
                populateMindsetForm(data);
            }
        } catch (e) {
            // Likely no entry, which is fine (new entry mode)
        }
    }

    // Re-render list to update highlight
    renderMindsetList();
}

function populateMindsetForm(data) {
    document.getElementById('mindset-title').value = data.title || '';
    document.getElementById('mindset-content').value = data.inspiration_text || '';
    document.getElementById('mindset-link').value = data.read_more_link || '';
    document.getElementById('mindset-image').value = data.image_url || '';
}

async function saveDailyMindset() {
    if (typeof supabaseClient === 'undefined') {
        alert("Critical Error: Supabase client not initialized!");
        return;
    }

    const date = document.getElementById('mindset-date').value;
    const title = document.getElementById('mindset-title').value;
    const content = document.getElementById('mindset-content').value;
    const link = document.getElementById('mindset-link').value;
    const image = document.getElementById('mindset-image').value;

    if (!date || !title || !content) {
        alert("Please fill in Date, Title, and Content.");
        return;
    }

    const payload = {
        date: date,
        title: title,
        inspiration_text: content,
        read_more_link: link,
        image_url: image
    };

    try {
        const { error } = await supabaseClient
            .from('daily_mindset')
            .upsert(payload, { onConflict: 'date' });

        if (error) throw error;

        alert('✅ Daily Insight saved successfully!');
        loadDailyMindsetList(); // Refresh list

    } catch (err) {
        alert('Error saving insight: ' + err.message);
        console.error(err);
    }
}

function formatDateAdmin(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Global hooks
window.initDailyMindsetManager = initDailyMindsetManager;
window.loadDailyMindsetList = loadDailyMindsetList;
window.saveDailyMindset = saveDailyMindset;
window.loadMindsetForDate = loadMindsetForDate;
