/**
 * Wealth & Mindset - Interactive Book Popup
 * Handles premium glassmorphism popups for book previews and buy links.
 */

(function () {
    console.log("🚀 Popup Manager Initialized");

    // --- STYLES ---
    const injectStyles = () => {
        if (document.getElementById('vb-popup-styles')) return;
        const style = document.createElement('style');
        style.id = 'vb-popup-styles';
        style.innerHTML = `
            .vb-popup-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            .vb-popup-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .vb-popup-content {
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                width: 90%;
                max-width: 600px;
                padding: 40px;
                color: white;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                transform: scale(0.9) translateY(20px);
                transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                position: relative;
                text-align: center;
            }
            .vb-popup-overlay.active .vb-popup-content {
                transform: scale(1) translateY(0);
            }
            .vb-popup-close {
                position: absolute;
                top: 20px; right: 20px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                width: 36px; height: 36px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.2rem;
                display: flex;
                align-items: center; justify-content: center;
                transition: background 0.2s;
            }
            .vb-popup-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            .vb-popup-grid {
                display: grid;
                grid-template-columns: 180px 1fr;
                gap: 30px;
                text-align: left;
            }
            @media (max-width: 600px) {
                .vb-popup-grid { grid-template-columns: 1fr; text-align: center; }
                .vb-popup-grid img { margin: 0 auto; }
            }
            .vb-popup-grid img {
                width: 180px;
                height: 260px;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            }
            .vb-popup-title {
                font-family: 'Playfair Display', serif;
                font-size: 1.8rem;
                margin: 0 0 10px 0;
                color: #fff;
            }
            .vb-popup-author {
                color: #94a3b8;
                font-size: 0.95rem;
                margin-bottom: 20px;
            }
            .vb-popup-desc {
                font-size: 0.9rem;
                line-height: 1.6;
                color: #cbd5e1;
                margin-bottom: 25px;
                max-height: 120px;
                overflow-y: auto;
            }
            .vb-popup-btn {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                padding: 14px 28px;
                border-radius: 12px;
                text-decoration: none;
                font-weight: 700;
                display: inline-block;
                transition: transform 0.2s, box-shadow 0.2s;
                border: none;
                cursor: pointer;
            }
            .vb-popup-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px rgba(37, 99, 235, 0.3);
            }
        `;
        document.head.appendChild(style);
    };

    // --- DOM ELEMENTS ---
    let overlay, content;

    const createPopupHTML = () => {
        overlay = document.createElement('div');
        overlay.className = 'vb-popup-overlay';
        overlay.innerHTML = `
            <div class="vb-popup-content">
                <button class="vb-popup-close">×</button>
                <div id="vb-popup-data">
                    <div class="vb-popup-grid">
                        <img src="assets/logo-new.png" alt="Book Cover" id="vb-pop-img">
                        <div>
                            <h3 class="vb-popup-title" id="vb-pop-title">Loading...</h3>
                            <div class="vb-popup-author" id="vb-pop-author">Author Name</div>
                            <p class="vb-popup-desc" id="vb-pop-desc">Loading description...</p>
                            <a href="#" class="vb-popup-btn" id="vb-pop-btn">🛒 Buy Now / Read Full</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closePopup();
        });
        overlay.querySelector('.vb-popup-close').addEventListener('click', closePopup);
    };

    const openPopup = async (bookId) => {
        if (!bookId) return;

        overlay.classList.add('active');

        // Reset to loading state
        document.getElementById('vb-pop-title').textContent = "Loading...";
        document.getElementById('vb-pop-desc').textContent = "Fetching book details...";

        try {
            // Check if we have book data in global (from site-analytics or library)
            // Or fetch from Supabase if client is available
            let bookData = null;

            if (window.supabaseClient) {
                const { data, error } = await window.supabaseClient
                    .from('books')
                    .select('*')
                    .eq('id', bookId)
                    .single();
                if (!error) bookData = data;
            }

            if (bookData) {
                document.getElementById('vb-pop-title').textContent = bookData.title;
                document.getElementById('vb-pop-author').textContent = bookData.author || "Unknown Author";
                document.getElementById('vb-pop-desc').textContent = bookData.description || "No description available.";
                document.getElementById('vb-pop-img').src = bookData.cover || bookData.image || 'assets/logo-new.png';

                const buyBtn = document.getElementById('vb-pop-btn');
                buyBtn.href = bookData.affiliate_link || `book-detail.html?id=${bookId}`;
                buyBtn.textContent = bookData.affiliate_link ? '🛒 Buy Now on Amazon' : '📖 Read Full Book';
            } else {
                document.getElementById('vb-pop-title').textContent = "Book Not Found";
                document.getElementById('vb-pop-desc').textContent = "We couldn't load the details for this book.";
            }

        } catch (e) {
            console.error("Popup fetch failed:", e);
        }
    };

    const closePopup = () => {
        overlay.classList.remove('active');
    };

    // --- EVENT DELEGATION ---
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.book-buy-link');
        if (target) {
            e.preventDefault();
            const bookId = target.dataset.bookId;
            openPopup(bookId);
        }
    });

    // --- INITIALIZE ---
    injectStyles();
    createPopupHTML();

})();
