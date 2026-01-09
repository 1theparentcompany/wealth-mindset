var VBuilder = {
    isEditorActive: false,
    marker: null,

    init: function () {
        console.log("🚀 VBuilder.init() called inside Iframe");
        // Visual confirmation for developers/users that builder is active
        document.body.style.outline = "2px dashed #b91c1c";
        document.body.style.outlineOffset = "-4px";

        this.addStyles();
        this.createDropMarker();
        this.bindEvents();
        console.log("✨ Visual Builder Event Binding Complete");
    },

    addStyles: function () {
        const style = document.createElement('style');
        style.innerHTML = `
            .vb-drop-marker {
                position: fixed;
                height: 6px;
                background: #b91c1c;
                border-radius: 3px;
                pointer-events: none;
                transition: top 0.1s, left 0.1s, width 0.1s;
                z-index: 10000;
                box-shadow: 0 0 15px rgba(185, 28, 28, 0.6);
                display: none;
            }
            .vb-drop-marker::before {
                content: 'Drop Here to Insert';
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: #b91c1c;
                color: white;
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-family: 'Inter', sans-serif;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            }
            .product-link-wrapper {
                margin: 20px auto;
                text-align: center;
                position: relative;
                transition: transform 0.2s;
            }
            .product-link-wrapper:hover {
                transform: scale(1.02);
            }
            /* Visual Link Styles */
            .product-link-item {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                padding: 16px 24px;
                background: #ffffff;
                border: 1px solid rgba(0,0,0,0.1);
                border-radius: 16px;
                color: #0f172a;
                text-decoration: none;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                font-family: 'Inter', sans-serif;
                font-weight: 600;
                font-size: 1.1rem;
            }
            .product-link-item img {
                width: 32px;
                height: 32px;
                object-fit: contain;
            }
            .product-link-item:hover {
                box-shadow: 0 15px 35px rgba(0,0,0,0.15);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    },

    createDropMarker: function () {
        this.marker = document.createElement('div');
        this.marker.className = 'vb-drop-marker';
        document.body.appendChild(this.marker);
    },

    bindEvents: function () {
        let currentTarget = null;
        let position = 'after'; // 'before' or 'after'

        window.addEventListener('message', (e) => {
            const data = e.data;
            if (!data || !data.type) return;

            if (data.type === 'VB_SCAN_SECTIONS') {
                this.reportSections();
            }
            if (data.type === 'VB_SCROLL_TO') {
                const el = document.getElementById(data.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (data.type === 'VB_INSERT_TEMPLATE') {
                this.insertTemplate(data.template);
            }
            if (data.type === 'VB_INIT_DRAG') {
                console.log("🚛 Drag initialized in parent");
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';

            if (!e.target || typeof e.target.closest !== 'function') return;

            const target = e.target.closest('section, header, footer, .product-link-wrapper, main, [id^="home-"], .hero-section');

            if (target && target !== document.body && target !== document.documentElement) {
                currentTarget = target;
                const rect = target.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                if (e.clientY < midpoint) {
                    position = 'before';
                    this.showMarker(rect.top + window.scrollY, rect.left + window.scrollX, rect.width);
                } else {
                    position = 'after';
                    this.showMarker(rect.bottom + window.scrollY, rect.left + window.scrollX, rect.width);
                }
            } else {
                this.hideMarker();
                currentTarget = null;
            }
        });

        document.body.addEventListener('drop', (e) => {
            e.preventDefault();
            this.hideMarker();

            let rawData = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
            if (!rawData || !currentTarget) return;

            try {
                const data = JSON.parse(rawData);
                this.insertLink(data, currentTarget, position);
            } catch (err) {
                console.error("Drop Data Error:", err);
            }
        });
    },

    showMarker: function (top, left, width) {
        if (!this.marker) return;
        this.marker.style.display = 'block';
        this.marker.style.top = top + 'px';
        this.marker.style.left = left + 'px';
        this.marker.style.width = width + 'px';
    },

    hideMarker: function () {
        if (this.marker) this.marker.style.display = 'none';
    },

    reportSections: function () {
        const sections = [];
        document.querySelectorAll('section, header, footer, .hero-section, main > div').forEach((sec, idx) => {
            if (!sec.id) sec.id = 'section-' + idx + '-' + Math.random().toString(36).substr(2, 5);

            // Determine type and config
            let type = 'standard';
            let config = {};

            if (sec.classList.contains('top-book-buy-section')) {
                type = 'top-book-buy';
                const img = sec.querySelector('.book-buy-link');
                if (img) config.book_id = img.dataset.bookId;
            } else if (sec.classList.contains('custom-empty-section')) {
                type = 'empty-section';
            }

            sections.push({
                id: sec.id,
                title: sec.title || sec.dataset.title || sec.tagName + (sec.className ? '.' + sec.className.split(' ')[0] : ''),
                section_type: type,
                config: config,
                position: idx
            });
        });
        window.parent.postMessage({ type: 'VB_REPORT_SECTIONS', sections: sections }, '*');
    },

    insertTemplate: function (templateName) {
        let html = '';
        if (templateName === 'top-book-buy') {
            html = `
                <section class="top-book-buy-section" style="padding: 60px 20px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                    <div style="max-width: 1000px; margin: 0 auto;">
                        <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #0f172a; margin-bottom: 30px;">Top Book Recommendation</h2>
                        <div class="book-buy-container" style="display: flex; gap: 40px; align-items: center; justify-content: center; flex-wrap: wrap;">
                            <div class="book-cover-wrapper" style="width: 200px; height: 300px; background: #ddd; border-radius: 8px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); overflow: hidden;">
                                <img src="assets/logo-new.png" class="book-buy-link" data-book-id="" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;">
                            </div>
                            <div style="max-width: 500px; text-align: left;">
                                <h3 style="font-size: 1.5rem; margin-bottom: 15px;">Featured Book Title</h3>
                                <p style="color: #64748b; margin-bottom: 25px;">This is a premium section where you can showcase your top affiliate book. Click the cover to see details and buy now.</p>
                                <a href="#" class="btn-primary" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: 700;">🛒 Read Full Book - Buy Now</a>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        } else if (templateName === 'empty-section') {
            html = `
                <section class="custom-empty-section" style="padding: 40px; min-height: 200px; background: rgba(0,0,0,0.02); border: 2px dashed rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                    <p style="color: #94a3b8; font-style: italic;">Empty Section - Drag Links Here</p>
                </section>
            `;
        }

        if (!html) return;

        const container = document.querySelector('main') || document.body;
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        const newSec = div.firstChild;

        container.appendChild(newSec);
        this.reportSections();
        this.saveLayout();
    },

    insertLink: function (data, referenceNode, position) {
        // Create Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'product-link-wrapper';

        // Ensure reference node has an ID (generate if missing)
        if (!referenceNode.id) {
            referenceNode.id = 'sec-' + Math.random().toString(36).substr(2, 9);
        }

        // Store placement info on the wrapper for saving
        wrapper.dataset.refId = referenceNode.id;
        wrapper.dataset.placement = position;

        // Create Link
        const el = document.createElement('a');
        el.href = data.url;
        el.className = 'product-link-item vb-draggable';
        el.target = "_blank";
        el.dataset.linkId = data.id;

        // Attributes for reconstruction later
        el.setAttribute('data-display-mode', data.display_mode || 'card');
        el.setAttribute('data-size', data.size_category || 'standard');

        // Content Generation
        const icon = data.product_icon && data.product_icon.includes('http')
            ? `<img src="${data.product_icon}">`
            : `<span style="font-size: 1.5rem;">${data.product_icon || '🔗'}</span>`;

        if (data.display_mode === 'icon') {
            el.innerHTML = icon;
            el.title = data.custom_name;
            el.style.borderRadius = '50%';
            el.style.padding = '15px';
        } else if (data.display_mode === 'text') {
            el.innerHTML = `<span>${data.custom_name || 'Product'}</span>`;
        } else {
            // Card/Standard
            el.innerHTML = `${icon} <span>${data.custom_name || 'Product Link'}</span> <span style="margin-left:auto; opacity:0.5; font-size:0.8em;">↗</span>`;
            el.style.width = '100%';
            el.style.maxWidth = '400px';
            el.style.justifyContent = 'flex-start';
        }

        // Custom Size
        if (data.size_category === 'custom') {
            if (data.custom_width) el.style.width = data.custom_width + 'px';
            if (data.custom_height) el.style.height = data.custom_height + 'px';
        }

        wrapper.appendChild(el);

        // Insert into DOM
        if (position === 'before') {
            referenceNode.parentNode.insertBefore(wrapper, referenceNode);
        } else {
            referenceNode.parentNode.insertBefore(wrapper, referenceNode.nextSibling);
        }

        // Auto-save
        this.saveLayout();
    },

    saveLayout: function () {
        const links = [];
        document.querySelectorAll('.product-link-wrapper').forEach((wrapper, index) => {
            const link = wrapper.querySelector('.product-link-item');
            if (!link) return;

            links.push({
                id: link.dataset.linkId,
                position_data: {
                    index: index,
                    type: 'flow',
                    reference_id: wrapper.dataset.refId,
                    placement: wrapper.dataset.placement
                },
                page_target: window.location.pathname.split('/').pop() || 'index.html'
            });
        });

        // Also collect sections
        const sections = [];
        document.querySelectorAll('section, header, footer, .hero-section, main > div').forEach((sec, idx) => {
            if (!sec.id) sec.id = 'section-' + idx + '-' + Math.random().toString(36).substr(2, 5);
            let type = 'standard';
            let config = {};
            if (sec.classList.contains('top-book-buy-section')) {
                type = 'top-book-buy';
                const img = sec.querySelector('.book-buy-link');
                if (img) config.book_id = img.dataset.bookId;
            } else if (sec.classList.contains('custom-empty-section')) {
                type = 'empty-section';
            }
            sections.push({
                id: sec.id,
                page_target: window.location.pathname.split('/').pop() || 'index.html',
                section_type: type,
                config: config,
                position: idx
            });
        });

        window.parent.postMessage({
            type: 'VB_SAVE_LAYOUT',
            links: links,
            sections: sections
        }, '*');
    }
};

window.VBuilder = VBuilder;
VBuilder.init();
