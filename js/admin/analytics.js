// Analytics and Charts for Admin Panel - Real-time Supabase Edition
window.trafficChartInstance = null;
window.deviceChartInstance = null;

window.initCharts = async function () {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded.");
        return;
    }

    // Initialize UI indicators
    await updateAnalyticsMetrics();

    // Load Charts with Real Data
    await renderTrafficChart();
    await renderDeviceChart();
    await loadRealTimeActivity();
    await loadTopPerformingBooks();
    await loadAdPerformance();

    // Setup Polling (60s)
    if (!window.analyticsPollingInterval) {
        window.analyticsPollingInterval = setInterval(() => {
            if (window.currentActiveSection === 'site-analytics') {
                updateAnalyticsMetrics();
                loadRealTimeActivity();
                console.log("Analytics: Polled latest data.");
            }
        }, 60000);
    }
};

window.updateAnalyticsMetrics = async function () {
    const totalUsersEl = document.getElementById('analytics-total-users');
    const pageViewsEl = document.getElementById('analytics-page-views');
    const adClicksEl = document.getElementById('analytics-ad-clicks');
    const chapterReadsEl = document.getElementById('analytics-chapter-reads');

    if (!totalUsersEl) return;

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {

            // 1. Total Unique Visitors (Accurate from site_visitors table)
            const { count: visitorCount } = await supabaseClient
                .from('site_visitors')
                .select('*', { count: 'exact', head: true });

            if (visitorCount !== null) {
                totalUsersEl.textContent = visitorCount.toLocaleString() + (visitorCount >= 1000 ? "+" : "");
            }


            // Update timestamp
            const ts = document.getElementById('analytics-last-update');
            if (ts) ts.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;


            // 2. Total Page Views
            const { count: viewCount } = await supabaseClient
                .from('user_activity')
                .select('*', { count: 'exact', head: true })
                .eq('activity_type', 'page_view');

            if (viewCount !== null) {
                pageViewsEl.textContent = viewCount.toLocaleString();
            }

            // 3. Ad Clicks
            const { count: clickCount } = await supabaseClient
                .from('user_activity')
                .select('*', { count: 'exact', head: true })
                .eq('activity_type', 'ad_click');

            if (clickCount !== null) {
                adClicksEl.textContent = clickCount.toLocaleString();
            }

            // 4. Chapter Reads
            const { count: readCount } = await supabaseClient
                .from('user_activity')
                .select('*', { count: 'exact', head: true })
                .eq('activity_type', 'chapter_read');

            if (readCount !== null) {
                chapterReadsEl.textContent = readCount.toLocaleString();
            }

        } else {
            // Demo Data
            totalUsersEl.textContent = "1,240";
            pageViewsEl.textContent = "15,400";
            adClicksEl.textContent = "342";
            chapterReadsEl.textContent = "8,100";
        }
    } catch (e) {
        console.warn("Analytics metrics load failed", e);
    }
};

async function renderTrafficChart() {
    const trafficCanvas = document.getElementById('trafficChart');
    if (!trafficCanvas) return;

    let labels = [];
    let visitorData = [];

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            const dateRange = document.getElementById('analytics-date-range')?.value || '7';
            const daysToFetch = parseInt(dateRange === 'custom' ? '30' : dateRange);
            const today = new Date();

            labels = [];
            visitorData = [];

            for (let i = daysToFetch - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                // Only show weekday for 7 days, otherwise date
                const label = daysToFetch <= 7
                    ? date.toLocaleDateString('en-US', { weekday: 'short' })
                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                labels.push(label);

                const { count } = await supabaseClient
                    .from('user_activity')
                    .select('*', { count: 'exact', head: true })
                    .eq('activity_type', 'page_view')
                    .gte('created_at', dateStr + 'T00:00:00')
                    .lte('created_at', dateStr + 'T23:59:59');

                visitorData.push(count || 0);
            }
        } else {
            throw new Error("Offline");
        }
    } catch (e) {
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        visitorData = [120, 190, 150, 220, 280, 310, 350]; // Demo
    }


    if (trafficChartInstance) trafficChartInstance.destroy();
    const trafficCtx = trafficCanvas.getContext('2d');

    // Gradient
    const gradient = trafficCtx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    window.trafficChartInstance = new Chart(trafficCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Page Views',
                data: visitorData,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, border: { display: false } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' }, border: { display: false } }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

async function renderDeviceChart() {
    const deviceCanvas = document.getElementById('deviceChart');
    if (!deviceCanvas) return;

    let deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            const { data } = await supabaseClient
                .from('user_activity')
                .select('metadata')
                .limit(500); // Sample last 500 for distribution

            if (data) {
                data.forEach(act => {
                    const device = act.metadata?.device || 'desktop';
                    if (deviceCounts[device] !== undefined) deviceCounts[device]++;
                });
            }
        } else {
            throw new Error("Offline");
        }
    } catch (e) {
        deviceCounts = { mobile: 65, desktop: 30, tablet: 5 };
    }

    if (deviceChartInstance) deviceChartInstance.destroy();
    const deviceCtx = deviceCanvas.getContext('2d');
    window.deviceChartInstance = new Chart(deviceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Mobile', 'Desktop', 'Tablet'],
            datasets: [{
                data: [deviceCounts.mobile, deviceCounts.desktop, deviceCounts.tablet],
                backgroundColor: ['#10b981', '#3b82f6', '#eab308'],
                borderColor: '#1e293b',
                borderWidth: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } }
            }
        }
    });
}

window.loadRealTimeActivity = async function () {
    const container = document.getElementById('ip-activity-log-body');
    if (!container) return;

    try {
        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !window.supabaseClient) {
            throw new Error("Offline");
        }

        const { data, error } = await supabaseClient
            .from('user_activity')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        container.innerHTML = data.map(act => {
            const typeIcons = {
                'page_view': '📄',
                'ad_click': '💰',
                'chapter_read': '📖',
                'cookie_accept': '🛡️'
            };
            const typeLabels = {
                'page_view': '<span style="color:#3b82f6">Page View</span>',
                'ad_click': '<span style="color:#f59e0b">Ad Click</span>',
                'chapter_read': '<span style="color:#a855f7">Chapter Read</span>',
                'cookie_accept': '<span style="color:#10b981">Cookie Consent</span>'
            };
            const icon = typeIcons[act.activity_type] || '⚡';
            const label = typeLabels[act.activity_type] || act.activity_type;
            const fullUrl = act.page_url || '#';
            const pageName = act.page_url ? act.page_url.split('/').pop().split('?')[0] || 'Home' : 'N/A';
            const detailLink = `<a href="${fullUrl}" target="_blank" style="color: #60a5fa; text-decoration: none; display: flex; align-items: center; gap: 5px;">
                <span>🔗</span> ${pageName}
            </a>`;
            const location = act.metadata?.ad_location ? `<span style="font-size: 0.75rem; opacity: 0.7;">[${act.metadata.ad_location}]</span>` : '';

            return `
            <tr style="border-bottom: 1px solid #1e293b; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px; font-family: monospace; color: #94a3b8;">${new Date(act.created_at).toLocaleTimeString()}</td>
                <td style="padding: 12px; font-weight: 600;">${icon} ${label}</td>
                <td style="padding: 12px; color: #cbd5e1;">${detailLink} ${location}</td>
                <td style="padding: 12px; font-family: monospace; color: #64748b;">${act.ip_address}</td>
            </tr>
        `}).join('');
    } catch (e) {
        container.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #64748b;">Offline Mode - Real-time data unavailable.</td></tr>`;
    }
};

async function loadTopPerformingBooks() {
    const tbody = document.getElementById('top-books-body');
    if (!tbody) return;

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            const { data } = await supabaseClient
                .from('user_activity')
                .select('metadata')
                .in('activity_type', ['page_view', 'chapter_read'])
                .limit(500);

            const counts = {};
            if (data) {
                data.forEach(act => {
                    const title = act.metadata?.title || (act.metadata?.book_id ? `Book ${act.metadata.book_id.substr(0, 8)}` : 'Unknown');
                    counts[title] = (counts[title] || 0) + 1;
                });
            }

            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

            if (sorted.length > 0) {
                tbody.innerHTML = sorted.map(([title, count]) => `
                    <tr style="border-bottom: 1px solid #1e293b;">
                        <td style="padding: 12px; font-weight: 500; color: #fff;">${title}</td>
                        <td style="padding: 12px; color: #3b82f6; font-weight: 700;">${count.toLocaleString()}</td>
                    </tr>
                `).join('');
                return;
            }
        }
    } catch (e) { }

    tbody.innerHTML = `<tr><td colspan="2" style="padding: 20px; text-align: center; color: #64748b;">No analytics data available.</td></tr>`;
}

async function loadAdPerformance() {
    const tbody = document.getElementById('ad-performance-body');
    if (!tbody) return;

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            const { data } = await supabaseClient
                .from('user_activity')
                .select('metadata')
                .eq('activity_type', 'ad_click')
                .limit(200);

            const stats = {}; // { location: count }

            if (data) {
                data.forEach(act => {
                    const loc = act.metadata?.ad_location || 'unknown';
                    stats[loc] = (stats[loc] || 0) + 1;
                });
            }

            const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);

            if (sorted.length > 0) {
                tbody.innerHTML = sorted.map(([loc, count]) => `
                    <tr style="border-bottom: 1px solid #1e293b;">
                         <td style="padding: 12px; color: #fff;">Generic Ad</td>
                         <td style="padding: 12px; font-weight: 700; color: #f59e0b;">${count}</td>
                         <td style="padding: 12px; color: #94a3b8; text-transform: capitalize;">${loc.replace('_', ' ')}</td>
                    </tr>
                 `).join('');
                return;
            }
        }
    } catch (e) { }

    tbody.innerHTML = `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #64748b;">No ad clicks recorded yet.</td></tr>`;
}

// CSV Export Utility
window.exportAnalyticsToCSV = function (tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = Array.from(rows[i].querySelectorAll('th, td')).map(cell => {
            let text = cell.innerText.replace(/"/g, '""');
            return `"${text}"`;
        }).join(',');
        csv.push(row);
    }

    const csvContent = "data:text/csv;charset=utf-8," + csv.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename || "analytics_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

