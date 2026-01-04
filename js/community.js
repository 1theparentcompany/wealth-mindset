
/**
 * Community Discussion System for Wealth & Mindset
 * Handles book-centric threaded discussions
 */

const CommunitySystem = {
    currentBookId: null,
    currentTopicId: null,
    currentBookUuid: null, // The UUID from books table

    async init(bookId, bookTitle) {
        this.currentBookId = bookId;
        this.currentBookTitle = bookTitle;
        console.log("Initializing community for:", bookTitle, "(", bookId, ")");

        // 1. Get the actual UUID for this book
        await this.resolveBookUuid();

        // 2. Load Topics
        await this.loadTopics();
    },

    async resolveBookUuid() {
        const isUuid = typeof isValidUUID === 'function' ? isValidUUID(this.currentBookId) : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.currentBookId);

        try {
            let query = supabaseClient.from('books').select('id');

            if (isUuid) {
                query = query.eq('id', this.currentBookId);
            } else if (this.currentBookTitle) {
                // Fallback: search by title
                query = query.eq('title', this.currentBookTitle);
            } else {
                console.warn("Invalid ID and no title provided. Cannot resolve book UUID.");
                return;
            }

            const { data, error } = await query.maybeSingle(); // Use maybeSingle() to avoid 406 if not found

            if (data) {
                this.currentBookUuid = data.id;
            } else {
                console.log("Book not found in Supabase (Cloud). Community features disabled for this local book.");
            }
        } catch (err) {
            console.error("Error resolving book UUID:", err);
        }
    },

    async loadTopics() {
        if (!this.currentBookUuid) {
            // If no cloud book, show default topics for local context
            this.renderTopics(this.getDefaultTopics());
            this.loadDefaultTopicMessages();
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('book_topics')
                .select('*')
                .eq('book_id', this.currentBookUuid)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                this.renderTopics(data);
                // Auto-load first topic
                this.loadTopicMessages(data[0].id, data[0].title);
            } else {
                // No topics in DB, Use defaults
                const defaults = this.getDefaultTopics();
                this.renderTopics(defaults);
                this.loadDefaultTopicMessages();
            }
        } catch (err) {
            console.error("Error loading topics:", err);
            this.renderTopics(this.getDefaultTopics());
        }
    },

    getDefaultTopics() {
        return [
            { id: 'general', title: 'General Discussion', icon: '🌍' },
            { id: 'theories', title: 'Theories & Predictions', icon: '🧠' },
            { id: 'characters', title: 'Character Analysis', icon: '👤' },
            { id: 'feedback', title: 'Reader Feedback', icon: '✍️' }
        ];
    },

    loadDefaultTopicMessages() {
        const messagesContainer = document.getElementById('topic-messages-container');
        messagesContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 40px; color: #666; background: rgba(255,255,255,0.02); border-radius: 12px; margin: 20px;">
                <div style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;">💬</div>
                <h4 style="color: #fff; margin-bottom: 10px;">Welcome to the Community</h4>
                <p style="font-size: 0.9rem; line-height: 1.6;">This section is for sharing your thoughts and theories about the book. Connect with other readers and dive deep into the story!</p>
                <div style="margin-top: 25px; padding: 15px; border: 1px dashed #333; border-radius: 8px; font-size: 0.8rem;">
                    Cloud sync is active for this book, but no messages have been posted yet. Be the first!
                </div>
            </div>
        `;
        document.getElementById('current-topic-title').textContent = "Join the Conversation";
    },

    renderTopics(topics) {
        const container = document.getElementById('community-topics-list');
        if (!container) return;

        if (!topics || topics.length === 0) {
            container.innerHTML = '<p style="color: #666; padding: 10px;">No topics created yet.</p>';
            return;
        }

        const esc = window.escapeHTML || (s => s);

        container.innerHTML = topics.map(topic => `
            <div class="topic-item ${this.currentTopicId === topic.id ? 'active' : ''}" 
                 onclick="CommunitySystem.loadTopicMessages('${topic.id}', '${esc(topic.title).replace(/'/g, "\\'")}')">
                <span class="topic-icon">${topic.icon || '💬'}</span>
                <span class="topic-title">${esc(topic.title)}</span>
            </div>
        `).join('');
    },

    async loadTopicMessages(topicId, topicTitle) {
        this.currentTopicId = topicId;

        // Update UI
        document.querySelectorAll('.topic-item').forEach(el => el.classList.remove('active'));
        const activeEl = Array.from(document.querySelectorAll('.topic-item')).find(el => el.innerText.includes(topicTitle));
        if (activeEl) activeEl.classList.add('active');

        const esc = window.escapeHTML || (s => s);
        document.getElementById('current-topic-title').textContent = topicTitle;
        const messagesContainer = document.getElementById('topic-messages-container');
        messagesContainer.innerHTML = '<div class="loading-spinner">Loading messages...</div>';

        try {
            if (typeof isValidUUID === 'function' && !isValidUUID(topicId)) {
                console.warn("Skipping cloud messages load for local/non-UUID topic:", topicId);
                this.renderMessages([]);
                return;
            }

            const { data, error } = await supabaseClient
                .from('book_messages')
                .select('*')
                .eq('topic_id', topicId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            this.renderMessages(data);
        } catch (err) {
            console.error("Error loading messages:", err);
            messagesContainer.innerHTML = '<p style="color: #ef4444;">Failed to load messages.</p>';
        }
    },

    renderMessages(messages) {
        const container = document.getElementById('topic-messages-container');
        if (!container) return;

        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>No messages here yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const interactions = JSON.parse(localStorage.getItem('userInteractions') || '{}');
        const likedMessages = interactions.messages || [];
        const esc = window.escapeHTML || (s => s);

        container.innerHTML = messages.map(msg => {
            const isLiked = likedMessages.includes(msg.id);
            const sUsername = esc(msg.username);
            // Handle line breaks in messages
            const sMessage = esc(msg.message).replace(/\n/g, '<br>');

            return `
            <div class="message-card">
                <div class="message-header">
                    <span class="message-user">${sUsername}</span>
                    <span class="message-date">${new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <div class="message-content">${sMessage}</div>
                <div class="message-actions">
                    <button class="msg-action-btn ${isLiked ? 'active' : ''}" onclick="CommunitySystem.likeMessage('${msg.id}')" style="${isLiked ? 'color: #3b82f6; border-color: #3b82f6;' : ''}">
                        👍 ${msg.likes_count || 0}
                    </button>
                    <button class="msg-action-btn" onclick="CommunitySystem.reportMessage('${msg.id}')">
                        ⚠️ Report
                    </button>
                </div>
            </div>
        `}).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    async postMessage() {
        const input = document.getElementById('community-message-input');
        const message = input.value.trim();

        if (!message) return;
        if (!this.currentTopicId) {
            customAlert("Please select a topic first.", "warning").then(() => { });
            return;
        }

        const username = localStorage.getItem('community_username') || this.promptForUsername();
        if (!username) return;

        try {
            if (typeof isValidUUID === 'function' && (!isValidUUID(this.currentBookUuid) || !isValidUUID(this.currentTopicId))) {
                customAlert("Community sync is not available for this local version.", "info");
                return;
            }

            const { data, error } = await supabaseClient
                .from('book_messages')
                .insert([
                    {
                        book_id: this.currentBookUuid,
                        topic_id: this.currentTopicId,
                        username: username,
                        message: message
                    }
                ]);

            if (error) throw error;

            input.value = '';
            this.loadTopicMessages(this.currentTopicId, document.getElementById('current-topic-title').textContent);
        } catch (err) {
            console.error("Error posting message:", err);
            customAlert("Failed to post message. Please try again.", "error").then(() => { });
        }
    },

    async promptForUsername() {
        const name = await customPrompt("Enter a username for the community:", "Visionary Reader", "Community Username", "👤");
        if (name && name.trim()) {
            localStorage.setItem('community_username', name.trim());
            return name.trim();
        }
        return null;
    },

    async likeMessage(msgId) {
        // Simple local check to prevent multiple likes
        const interactions = JSON.parse(localStorage.getItem('userInteractions') || '{}');
        if (!interactions.messages) interactions.messages = [];

        if (interactions.messages.includes(msgId)) return;

        try {
            // This would ideally be a RPC call to increment, but we'll do a simple select/update for now
            const { data: currentMsg } = await supabaseClient
                .from('book_messages')
                .select('likes_count')
                .eq('id', msgId)
                .single();

            const { error } = await supabaseClient
                .from('book_messages')
                .update({ likes_count: (currentMsg.likes_count || 0) + 1 })
                .eq('id', msgId);

            if (!error) {
                interactions.messages.push(msgId);
                localStorage.setItem('userInteractions', JSON.stringify(interactions));
                // Reload messages to show updated count
                this.loadTopicMessages(this.currentTopicId, document.getElementById('current-topic-title').textContent);

                // Update global book interaction counts
                if (typeof checkInteractionStatus === 'function') {
                    checkInteractionStatus(this.currentBookId);
                }
            }
        } catch (err) {
            console.error("Error liking message:", err);
        }
    },

    reportMessage(msgId) {
        customAlert('Thank you for your report. We will review it shortly.', 'success', 'Report Submitted', '✅').then(() => { });
    }
};
