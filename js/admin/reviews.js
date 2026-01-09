// Review Management for Admin Panel

window.initReviewManager = async function () {
    const selector = document.getElementById('review-book-select');
    if (!selector) return;

    selector.innerHTML = '<option value="">-- All Books --</option>';

    try {
        if (typeof supabaseClient === 'undefined') return;
        const { data, error } = await supabaseClient
            .from('books')
            .select('id, title')
            .order('title', { ascending: true });

        if (data) {
            data.forEach(book => {
                const opt = document.createElement('option');
                opt.value = book.id;
                opt.textContent = book.title;
                selector.appendChild(opt);
            });
        }
    } catch (e) {
        console.warn("Failed to load books for review manager:", e);
    }

    // Initial load
    loadBookReviewsAdmin();
};

window.loadBookReviewsAdmin = async function () {
    const bookId = document.getElementById('review-book-select').value;
    const tbody = document.getElementById('reviews-admin-table-body');
    const emptyMsg = document.getElementById('reviews-admin-empty');

    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #64748b;">Loading reviews...</td></tr>';
    if (emptyMsg) emptyMsg.style.display = 'none';

    try {
        let query = supabaseClient.from('book_reviews').select('*').order('created_at', { ascending: false });

        if (bookId) {
            if (typeof isValidUUID === 'function' && !isValidUUID(bookId)) {
                console.warn("Skipping review filter for legacy/non-UUID bookId:", bookId);
                // If it's not a UUID, don't query by it to avoid 400 error
                query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Force empty result safely
            } else {
                query = query.eq('book_id', bookId);
            }
        }

        const { data, error } = await query;

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        const esc = window.escapeHTML || (s => s);

        tbody.innerHTML = data.map(rev => {
            const sName = esc(rev.reviewer_name || rev.username || 'Anonymous');
            const sComment = esc(rev.comment);
            const sReply = rev.admin_reply ? esc(rev.admin_reply) : null;
            const sBookId = esc(rev.book_id);

            return `
            <tr style="border-bottom: 1px solid #1e293b;" id="review-row-${rev.id}">
                <td style="padding: 15px; color: #64748b; font-size: 0.85rem;">${new Date(rev.created_at).toLocaleDateString()}</td>
                <td style="padding: 15px;">
                    <div style="color: white; font-weight: 500;">${sName}</div>
                    <div style="color: #64748b; font-size: 0.75rem;">Book ID: ${sBookId}</div>
                </td>
                <td style="padding: 15px; color: #fbbf24;">${'★'.repeat(rev.rating)}</td>
                <td style="padding: 15px; color: #e2e8f0; font-size: 0.9rem; max-width: 300px;">
                    ${sComment}
                    ${sReply ? `<div style="margin-top:8px; padding:8px; background:rgba(59,130,246,0.1); border-left:3px solid #3b82f6; font-size:0.85rem; color:#93c5fd;"><strong>Admin:</strong> ${sReply}</div>` : ''}
                </td>
                <td style="padding: 15px; display: flex; gap: 8px; align-items: center;">
                    <button onclick="editReviewAdmin('${rev.id}')" title="Edit Review" 
                        style="background: #3b82f6; border: none; color: white; border-radius: 4px; padding: 6px 10px; cursor: pointer;">
                        ✏️
                    </button>
                    <button onclick="replyReviewAdmin('${rev.id}')" title="Reply to Review" 
                        style="background: #10b981; border: none; color: white; border-radius: 4px; padding: 6px 10px; cursor: pointer;">
                        ↩️
                    </button>
                    <button onclick="featureReviewAdmin('${sName.replace(/'/g, "\\'")}', \`${sComment.replace(/`/g, '\\`')}\`)" title="Feature on Detail Pages" 
                        style="background: #f59e0b; border: none; color: white; border-radius: 4px; padding: 6px 10px; cursor: pointer;">
                        ✨
                    </button>
                    <button onclick="likeReviewAdmin('${rev.id}', '${rev.book_id}')" title="Like (Admin)" 
                        style="background: rgba(255,255,255,0.1); border: 1px solid #334155; color: #3b82f6; border-radius: 4px; padding: 6px 10px; cursor: pointer;">
                        👍
                    </button>
                    <button onclick="dislikeReviewAdmin('${rev.id}', '${rev.book_id}')" title="Dislike (Admin)" 
                        style="background: rgba(255,255,255,0.1); border: 1px solid #334155; color: #ef4444; border-radius: 4px; padding: 6px 10px; cursor: pointer;">
                        👎
                    </button>
                    <button onclick="deleteReviewAdmin('${rev.id}')" title="Delete Review" 
                        style="background: #ef4444; border: none; color: white; border-radius: 4px; padding: 6px 10px; cursor: pointer;">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
        }).join('');
    } catch (e) {
        console.error("Error loading reviews admin:", e);
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #ef4444;">Error loading reviews. Make sure the table exists.</td></tr>';
    }
};

// --- Actions ---

window.editReviewAdmin = async function (id) {
    try {
        const { data, error } = await supabaseClient.from('book_reviews').select('*').eq('id', id).single();
        if (error || !data) throw new Error("Review not found");

        document.getElementById('edit-review-id').value = data.id;
        document.getElementById('edit-review-user').value = data.reviewer_name || data.username || '';
        document.getElementById('edit-review-rating').value = data.rating;
        document.getElementById('edit-review-likes').value = data.likes || 0;
        document.getElementById('edit-review-dislikes').value = data.dislikes || 0;
        document.getElementById('edit-review-comment').value = data.comment;

        document.getElementById('review-editor-modal').style.display = 'flex';
    } catch (e) {
        showToast("Error loading review for editing", "error");
    }
};

window.saveReviewEdit = async function () {
    const id = document.getElementById('edit-review-id').value;
    const name = document.getElementById('edit-review-user').value;
    const rating = document.getElementById('edit-review-rating').value;
    const likes = document.getElementById('edit-review-likes').value;
    const dislikes = document.getElementById('edit-review-dislikes').value;
    const comment = document.getElementById('edit-review-comment').value;


    try {
        const updateData = {
            rating: parseInt(rating),
            likes: parseInt(likes),
            dislikes: parseInt(dislikes),
            comment: comment
        };

        // Update both columns for compatibility, but prioritize reviewer_name in schema
        if (name && name.trim()) {
            updateData.username = name;
        }

        const { error } = await supabaseClient.from('book_reviews').update(updateData).eq('id', id);

        if (error) throw error;

        showToast("Review updated successfully", "success");
        closeReviewModal();
        loadBookReviewsAdmin();
    } catch (e) {
        console.error('Review update error:', e);
        const errorMsg = e.message || e.hint || 'Unknown error';
        showToast(`Failed to update review: ${errorMsg}`, "error");
    }
};

window.closeReviewModal = function () {
    document.getElementById('review-editor-modal').style.display = 'none';
};

window.replyReviewAdmin = function (id) {
    document.getElementById('reply-review-id').value = id;
    document.getElementById('reply-review-text').value = '';
    document.getElementById('review-reply-modal').style.display = 'flex';
};

window.saveReviewReply = async function () {
    const id = document.getElementById('reply-review-id').value;
    const reply = document.getElementById('reply-review-text').value;

    try {
        // Try updating an 'admin_reply' column directly on book_reviews
        const { error } = await supabaseClient.from('book_reviews').update({
            admin_reply: reply
        }).eq('id', id);

        if (error) throw error;

        showToast("Reply posted successfully", "success");
        closeReplyModal();
        loadBookReviewsAdmin();
    } catch (e) {
        console.error(e);
        showToast("Failed to post reply (Column might be missing)", "error");
    }
};

window.closeReplyModal = function () {
    document.getElementById('review-reply-modal').style.display = 'none';
};

window.deleteReviewAdmin = async function (id) {
    const confirmed = await customConfirm("Are you sure you want to delete this review?", "Delete Review", "🗑️");
    if (!confirmed) return;

    try {
        const { error } = await supabaseClient
            .from('book_reviews')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast("Review deleted.", "success");
        loadBookReviewsAdmin();
    } catch (e) {
        console.error("Error deleting review:", e);
        showToast("Failed to delete review.", "error");
    }
};

// Admin Like/Dislike (Acts as regular user interaction but from Admin panel context)
// This will just add/remove a like/dislike from the ADMIN's IP/Session.
// It does NOT artificially inflate numbers in the DB arbitrarily without a record.
// If you want to artificially edit numbers, that requires a different approach (editing metadata).
window.likeReviewAdmin = async function (reviewId, bookId) {
    await toggleAdminInteraction(reviewId, bookId, 'helpful');
};

window.dislikeReviewAdmin = async function (reviewId, bookId) {
    await toggleAdminInteraction(reviewId, bookId, 'unhelpful');
};

async function toggleAdminInteraction(reviewId, bookId, type) {
    // Basic implementation re-using existing logic logic structure
    // We assume getIpAddress exists globally (from utils.js or injected)
    let ip = window.sessionStorage.getItem('user_ip');
    if (!ip) {
        try {
            const r = await fetch('https://api.ipify.org?format=json');
            const d = await r.json();
            ip = d.ip;
            window.sessionStorage.setItem('user_ip', ip);
        } catch (e) {
            ip = 'admin-manual';
        }
    }

    const actionType = type === 'helpful' ? 'helpful_review' : 'unhelpful_review';

    // Check if exists
    const { data: existing } = await supabaseClient
        .from('user_activity')
        .select('*')
        .eq('ip_address', ip)
        .eq('metadata->>review_id', reviewId)
        .eq('activity_type', actionType)
        .single();

    if (existing) {
        // Remove
        await supabaseClient.from('user_activity').delete().eq('id', existing.id);
        showToast(`Removed ${type} reaction`, "success");
    } else {
        // Add
        await supabaseClient.from('user_activity').insert([{
            ip_address: ip,
            activity_type: actionType,
            metadata: { review_id: reviewId, book_id: bookId },
            page_url: 'admin-panel'
        }]);
        showToast(`Added ${type} reaction`, "success");
    }
    // Note: We don't update UI counts here purely because the table doesn't show them yet, 
    // but the request implies just adding the option.
}

window.featureReviewAdmin = function (name, comment) {
    const showCheckbox = document.getElementById('common-review-show');
    const textInput = document.getElementById('common-review-text');
    const nameInput = document.getElementById('common-review-author');

    if (showCheckbox) showCheckbox.checked = true;
    if (textInput) textInput.value = comment;
    if (nameInput) nameInput.value = name;

    if (typeof showSection === 'function') {
        showSection('detail-page-commons');
        showToast("Review copied to Global Highlights. Don't forget to save!", "success");
    } else {
        showToast("Review selected, but navigation failed. Go to 'Detail Page Commons' to save.", "info");
    }
};
