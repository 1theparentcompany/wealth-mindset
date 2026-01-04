function renderDetailCommons() {
    const saved = localStorage.getItem('siteDetailCommons');
    if (!saved) return;

    try {
        const commons = JSON.parse(saved);

        // 1. Platform Features
        const featuresSection = document.getElementById('common-platform-features-section');
        const featuresContainer = document.getElementById('common-features-container');

        if (commons.features && commons.features.length > 0 && featuresContainer) {
            let hasContent = false;
            featuresContainer.innerHTML = '';
            commons.features.forEach(feat => {
                if (feat.title) {
                    hasContent = true;
                    featuresContainer.innerHTML += `
                    <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s; cursor: default;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 45px; height: 45px; border-radius: 10px; background: ${feat.color || '#3b82f6'}; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 15px; color: white; box-shadow: 0 4px 15px ${feat.color}40;">⚡</div>
                        <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 1.05rem; font-weight: 700;">${feat.title}</h4>
                        <p style="margin: 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.5;">${feat.desc || ''}</p>
                    </div>
                   `;
                }
            });

            if (hasContent && featuresSection) {
                featuresSection.style.display = 'block';
            }
        }

        // 2. Global Review Highlight
        const reviewSection = document.getElementById('common-review-highlight-section');
        if (commons.reviewHighlight && commons.reviewHighlight.show) {
            const textEl = document.getElementById('common-review-text-display');
            const authorEl = document.getElementById('common-review-author-display');

            if (textEl) textEl.textContent = `"${commons.reviewHighlight.text}"`;
            if (authorEl) authorEl.textContent = commons.reviewHighlight.name;

            if (reviewSection) reviewSection.style.display = 'block';
        } else {
            if (reviewSection) reviewSection.style.display = 'none';
        }

    } catch (e) {
        console.error("Error render details commons", e);
    }
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderDetailCommons);
} else {
    renderDetailCommons();
}
