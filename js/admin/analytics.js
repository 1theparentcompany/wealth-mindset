// Analytics and Charts for Admin Panel - Real-time Supabase Edition
window.trafficChartInstance = null;
window.deviceChartInstance = null;

window.initCharts = async function () {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded.");
        return;
    }

    // Initialize UI indicators
    updateAnalyticsMetrics();

    // Load Charts with Real Data
    await renderTrafficChart();
    await renderDeviceChart();
    await loadRealTimeActivity();
    await loadTopPerformingBooks();
};

async function renderTrafficChart() {
    const trafficCanvas = document.getElementById('trafficChart');
    if (!trafficCanvas) return;

    let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let visitorData = [0, 0, 0, 0, 0, 0, 0];

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            // Get last 7 days visitor counts
            const today = new Date();
            labels = [];
            visitorData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

                const { count, error } = await supabaseClient
                    .from('user_activity')
                    .select('*', { count: 'exact', head: true })
                    .eq('activity_type', 'page_view')
                    .gte('created_at', dateStr + 'T00:00:00')
                    .lte('created_at', dateStr + 'T23:59:59');

                visitorData.push(count || 0);
            }
        }
    } catch (e) {
        console.warn("Traffic data fetch failed, using demo fallback", e);
        visitorData = [120, 190, 150, 220, 280, 310, 350];
    }

    if (trafficChartInstance) trafficChartInstance.destroy();
    const trafficCtx = trafficCanvas.getContext('2d');
    window.trafficChartInstance = new Chart(trafficCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Visitors',
                data: visitorData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
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
            const { data, error } = await supabaseClient
                .from('user_activity')
                .select('metadata')
                .limit(1000);

            if (data) {
                data.forEach(act => {
                    const device = act.metadata?.device || 'desktop';
                    if (deviceCounts[device] !== undefined) deviceCounts[device]++;
                });
            }
        }
    } catch (e) {
        console.warn("Device data fetch failed", e);
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
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 } } }
            }
        }
    });
}

window.loadRealTimeActivity = async function () {
    const container = document.getElementById('activity-feed-container');
    if (!container) return;

    try {
        if (typeof isSupabaseConfigured !== 'function' || !isSupabaseConfigured() || !window.supabaseClient) {
            renderDemoActivity(container);
            return;
        }

        const { data, error } = await supabaseClient
            .from('user_activity')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) throw error;

        container.innerHTML = data.map(act => {
            const device = act.metadata?.device || 'desktop';
            const deviceIcon = device === 'mobile' ? '📱' : (device === 'tablet' ? '平板' : '💻');

            return `
            <div style="display: flex; gap: 15px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="width: 40px; height: 40px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                    ${getActivityIcon(act.activity_type)}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #fff; font-weight: 600; font-size: 0.85rem;">
                            ${act.activity_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span style="color: #64748b; font-size: 0.75rem;">${new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.8rem; margin: 4px 0 0;">
                        ${deviceIcon} ${act.ip_address} • 📍 ${act.page_url.split('/').pop() || 'Home'}
                    </p>
                </div>
            </div>
        `}).join('');
    } catch (e) {
        renderDemoActivity(container);
    }
};

window.updateAnalyticsMetrics = async function () {
    const totalUsersEl = document.getElementById('analytics-total-users');
    const pageViewsEl = document.getElementById('analytics-page-views');
    const revenueEl = document.getElementById('analytics-ad-revenue');
    const popularEl = document.getElementById('analytics-avg-session');

    if (!totalUsersEl) return;

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            // 1. Total Unique Visitors (by IP)
            const { data: uniqueIps, error: ipError } = await supabaseClient
                .from('user_activity')
                .select('ip_address');

            if (uniqueIps) {
                const uniqueSet = new Set(uniqueIps.map(a => a.ip_address));
                totalUsersEl.textContent = uniqueSet.size.toLocaleString();
            }

            // 2. Total Page Views
            const { count: viewCount, error: viewError } = await supabaseClient
                .from('user_activity')
                .select('*', { count: 'exact', head: true })
                .eq('activity_type', 'page_view');

            if (viewCount !== null) {
                pageViewsEl.textContent = viewCount.toLocaleString();
                // 3. Estimated Revenue (Simplified: $2.50 RPM)
                const estRevenue = (viewCount / 1000) * 2.50;
                revenueEl.textContent = `$${estRevenue.toFixed(2)}`;
            }

            // 4. Most Popular Content
            const { data: topContent, error: topError } = await supabaseClient
                .from('user_activity')
                .select('metadata')
                .eq('activity_type', 'page_view')
                .limit(100);

            if (topContent && topContent.length > 0) {
                const counts = {};
                topContent.forEach(a => {
                    const title = a.metadata?.title || 'Unknown';
                    counts[title] = (counts[title] || 0) + 1;
                });
                const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                if (top) popularEl.textContent = top[0].length > 15 ? top[0].substring(0, 15) + '...' : top[0];
            }
        }
    } catch (e) {
        console.warn("Analytics metrics load failed", e);
    }
};

async function loadTopPerformingBooks() {
    const tbody = document.querySelector('#site-analytics table tbody');
    if (!tbody) return;

    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured() && window.supabaseClient) {
            // This is a simplified aggregation. In a real app, you'd use a RPC or specialized table.
            // For now, we'll fetch recently viewed books/chapters.
            const { data, error } = await supabaseClient
                .from('user_activity')
                .select('metadata')
                .eq('activity_type', 'page_view')
                .limit(500);

            const bookCounts = {};
            if (data) {
                data.forEach(act => {
                    const title = act.metadata?.title || 'Unknown Page';
                    bookCounts[title] = (bookCounts[title] || 0) + 1;
                });
            }

            const sorted = Object.entries(bookCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            if (sorted.length > 0) {
                tbody.innerHTML = sorted.map(([title, count]) => `
                    <tr style="border-bottom: 1px solid #1e293b;">
                        <td style="padding: 10px;">${title}</td>
                        <td style="padding: 10px;">${count.toLocaleString()}</td>
                        <td style="padding: 10px; color: #eab308;">${'★'.repeat(5)}</td>
                    </tr>
                `).join('');
                return;
            }
        }
    } catch (e) { }
}

function getActivityIcon(type) {
    switch (type) {
        case 'page_view': return '👁️';
        case 'cookie_accept': return '🍪';
        case 'ad_click': return '💰';
        case 'feedback_submit': return '📨';
        default: return '⚡';
    }
}

function renderDemoActivity(container) {
    const demoData = [
        { type: 'page_view', ip: '192.168.1.1', page: '/index.html', time: 'Just now' },
        { type: 'cookie_accept', ip: '172.16.0.42', page: '/reader.html', time: '2 mins ago' },
        { type: 'page_view', ip: '10.0.0.15', page: '/book-detail.html', time: '5 mins ago' }
    ];

    container.innerHTML = demoData.map(act => `
        <div style="display: flex; gap: 15px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="width: 40px; height: 40px; background: #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                ${getActivityIcon(act.type)}
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #fff; font-weight: 600; font-size: 0.85rem;">${act.type.toUpperCase()}</span>
                    <span style="color: #64748b; font-size: 0.75rem;">${act.time}</span>
                </div>
                <p style="color: #94a3b8; font-size: 0.8rem; margin: 4px 0 0;">IP: ${act.ip} • Page: ${act.page}</p>
            </div>
        </div>
    `).join('');
}
