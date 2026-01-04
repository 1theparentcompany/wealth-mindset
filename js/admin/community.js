// Community Management for Admin Panel

window.communityActiveTopic = null;

window.initCommunityManager = async function () {
    const selector = document.getElementById('comm-book-select');
    if (!selector) return;

    selector.innerHTML = '<option value="">-- Select a Book --</option>';

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
        console.warn("Failed to load books for community manager:", e);
    }
};

window.loadCommunityTopics = async function () {
    const bookId = document.getElementById('comm-book-select').value;
    const container = document.getElementById('comm-topics-list');
    if (!container) return;

    container.innerHTML = '<p style="color: #666;">Loading topics...</p>';

    if (!bookId) return;

    try {
        const { data, error } = await supabaseClient
            .from('book_topics')
            .select('*')
            .eq('book_id', bookId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color: #666;">No topics for this book.</p>';
            return;
        }

        container.innerHTML = data.map(topic => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
                <span style="cursor: pointer; color: #fff; font-weight: 600;" onclick="loadTopicMessages('${topic.id}', '${topic.title}')">${topic.title}</span>
                <button onclick="deleteTopic('${topic.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">🗑️</button>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p style="color: #ef4444;">Error loading topics.</p>';
    }
};

window.createNewTopic = async function () {
    const bookId = document.getElementById('comm-book-select').value;
    const title = document.getElementById('new-comm-topic').value.trim();

    if (!bookId) { showToast("Please select a book first.", 'warning'); return; }
    if (!title) { showToast("Please enter a topic title.", 'warning'); return; }

    try {
        const { data, error } = await supabaseClient
            .from('book_topics')
            .insert([{ book_id: bookId, title: title }]);

        if (error) throw error;

        document.getElementById('new-comm-topic').value = '';
        loadCommunityTopics();
    } catch (e) {
        showToast("Failed to create topic.", 'error');
    }
};

window.deleteTopic = async function (topicId) {
    customConfirm("Are you sure? This will delete all messages in this topic!", "Delete Topic", "🗑️")
        .then(async confirmed => {
            if (!confirmed) return;

            try {
                const { error } = await supabaseClient
                    .from('book_topics')
                    .delete()
                    .eq('id', topicId);

                if (error) throw error;
                loadCommunityTopics();
                const msgList = document.getElementById('comm-messages-list');
                if (msgList) msgList.innerHTML = '';
            } catch (e) {
                showToast("Failed to delete topic.", 'error');
            }
        });
};

window.loadTopicMessages = async function (topicId, topicTitle) {
    window.communityActiveTopic = topicId;
    const header = document.getElementById('comm-topic-header');
    if (header) header.textContent = topicTitle;

    const container = document.getElementById('comm-messages-list');
    if (!container) return;

    container.innerHTML = '<p style="color: #666;">Loading messages...</p>';

    try {
        const { data, error } = await supabaseClient
            .from('book_messages')
            .select('*')
            .eq('topic_id', topicId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No messages in this topic.</p>';
            return;
        }

        container.innerHTML = data.map(msg => `
            <div style="background: #1e293b; padding: 15px; border-radius: 10px; border: 1px solid #334155;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #3b82f6; font-weight: 700;">${msg.username}</span>
                    <div style="display: flex; gap: 10px;">
                         <button onclick="deleteAllMessagesByUser('${msg.username}')" style="background: none; border: none; color: #f59e0b; cursor: pointer; font-size: 0.8rem;" title="Delete all from this user">🚫 Block/Spam</button>
                         <button onclick="deleteCommMessage('${msg.id}')" style="background: none; border: none; color: #ef4444; cursor: pointer;">Delete</button>
                    </div>
                </div>
                <div style="color: #e2e8f0; line-height: 1.5;">${msg.message}</div>
                <div style="margin-top: 8px; font-size: 0.75rem; color: #64748b;">
                    ${new Date(msg.created_at).toLocaleString()} | 👍 ${msg.likes_count || 0}
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p style="color: #ef4444;">Error loading messages.</p>';
    }
};

window.deleteCommMessage = async function (msgId) {
    customConfirm("Are you sure you want to delete this message?", "Delete Message", "🗑️")
        .then(async confirmed => {
            if (!confirmed) return;

            try {
                const { error } = await supabaseClient
                    .from('book_messages')
                    .delete()
                    .eq('id', msgId);

                if (error) throw error;
                const header = document.getElementById('comm-topic-header');
                loadTopicMessages(communityActiveTopic, header ? header.textContent : 'Topic');
            } catch (e) {
                showToast("Failed to delete message.", 'error');
            }
        });
};


window.refreshCurrentTopic = function () {
    if (window.communityActiveTopic) {
        const header = document.getElementById('comm-topic-header');
        loadTopicMessages(window.communityActiveTopic, header.textContent);
        showToast("Messages refreshed", "success");
    } else {
        showToast("No active topic selected", "warning");
    }
};

window.deleteAllMessagesByUser = function (username) {
    if (!username) return;

    customConfirm(`Delete ALL messages from user "${username}"? This cannot be undone.`, "Bulk Delete Spam", "🚨")
        .then(async confirmed => {
            if (!confirmed) return;

            try {
                // 1. Delete messages
                const { error } = await supabaseClient
                    .from('book_messages')
                    .delete()
                    .eq('username', username);

                if (error) throw error;

                showToast(`All messages from ${username} deleted.`, 'success');
                refreshCurrentTopic();
            } catch (e) {
                console.error(e);
                showToast("Failed to bulk delete messages.", "error");
            }
        });
};
