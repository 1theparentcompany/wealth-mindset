// Translation Studio Logic
// Replaces previous Advanced Tools functionality

window.initAdvancedTools = function () {
    console.log("Translation Studio Initialized");
    loadTranslationBooks();
};

window.loadTranslationBooks = async function () {
    const select = document.getElementById('trans-book-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Loading books...</option>';

    if (typeof supabaseClient === 'undefined') {
        select.innerHTML = '<option value="">Supabase not connected</option>';
        return;
    }

    try {
        const { data: books, error } = await supabaseClient
            .from('books')
            .select('id, title, language')
            .order('title', { ascending: true });

        if (error) throw error;

        select.innerHTML = '<option value="">-- Select Book --</option>';

        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id; // This is now a proper UUID
            option.textContent = `${book.title}${book.language && book.language !== 'en' ? ` (${book.language})` : ''}`;
            select.appendChild(option);
        });
    } catch (e) {
        console.error('Error loading books:', e);
        select.innerHTML = '<option value="">Error loading books</option>';
        showToast('Failed to load books from database', 'error');
    }
};

window.loadTranslationStats = async function () {
    const bookId = document.getElementById('trans-book-select').value;
    const lang = document.getElementById('trans-lang-select').value;
    const statsBox = document.getElementById('trans-stats-box');
    const content = document.getElementById('trans-stats-content');
    const langBox = document.getElementById('trans-languages-box');
    const langContent = document.getElementById('trans-languages-content');

    if (!bookId) {
        if (statsBox) statsBox.style.display = 'none';
        if (langBox) langBox.style.display = 'none';
        return;
    }

    if (statsBox) statsBox.style.display = 'block';
    if (content) content.innerHTML = 'Checking...';

    if (typeof supabaseClient === 'undefined') {
        content.innerHTML = "Supabase not connected.";
        return;
    }

    try {
        // 1. Get Base Chapters (Source Book) & Translated Chapters (Current Target Lang)
        const { count: baseCount } = await supabaseClient
            .from('chapters')
            .select('*', { count: 'exact', head: true })
            .eq('book_id', bookId);

        // We need to find the target book (if any) to count its chapters
        const { data: targetBook } = await supabaseClient
            .from('books')
            .select('id')
            .eq('original_book_id', bookId)
            .eq('language', lang)
            .maybeSingle();

        let transCount = 0;
        if (targetBook) {
            const { count } = await supabaseClient
                .from('chapters')
                .select('*', { count: 'exact', head: true })
                .eq('book_id', targetBook.id);
            transCount = count || 0;
        }

        content.innerHTML = `
            Base Chapters: <b>${baseCount || 0}</b><br>
            ${lang.toUpperCase()} Chapters: <b>${transCount}</b>
        `;

        // 2. Fetch all translated versions of this book
        const { data: translations, error: transError } = await supabaseClient
            .from('books')
            .select('language')
            .eq('original_book_id', bookId);

        if (transError) throw transError;

        if (langBox && langContent) {
            if (translations && translations.length > 0) {
                langBox.style.display = 'block';
                langContent.innerHTML = '';

                const langNames = {
                    'en': 'English', 'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French',
                    'ar': 'Arabic', 'zh': 'Mandarin', 'bn': 'Bengali', 'pt': 'Portuguese',
                    'ru': 'Russian', 'ur': 'Urdu', 'jp': 'Japanese', 'pa': 'Punjabi',
                    'mr': 'Marathi', 'hi-en': 'Hinglish', 'de': 'German'
                };

                translations.forEach(t => {
                    const badge = document.createElement('span');
                    badge.style.cssText = 'background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; border: 1px solid rgba(59, 130, 246, 0.3);';
                    badge.textContent = langNames[t.language] || t.language.toUpperCase();
                    langContent.appendChild(badge);
                });
            } else {
                langBox.style.display = 'none';
            }
        }

    } catch (e) {
        content.textContent = "Error fetching stats.";
        console.error(e);
    }
};

window.switchTransTab = function (mode) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-btn-${mode}`).classList.add('active');

    document.getElementById('trans-mode-bulk').style.display = mode === 'bulk' ? 'block' : 'none';
    document.getElementById('trans-mode-chapter').style.display = mode === 'chapter' ? 'block' : 'none';
};

window.clearTransEditor = function () {
    document.getElementById('trans-bulk-input').value = '';
    document.getElementById('trans-single-content').value = '';
    document.getElementById('trans-single-title').value = '';
    document.getElementById('trans-single-num').value = '';
    document.getElementById('trans-log').style.display = 'none';
};

window.logTrans = function (msg) {
    const log = document.getElementById('trans-log');
    const content = document.getElementById('trans-log-content');
    if (log) log.style.display = 'block';
    if (content) {
        const line = document.createElement('div');
        line.textContent = `> ${msg}`;
        content.appendChild(line);
        content.scrollTop = content.scrollHeight;
    }
};

// Global variable to store preview chunks
window.bulkTranslationChunks = [];

window.previewBulkTranslation = async function () {
    const text = document.getElementById('trans-bulk-input').value;
    if (!text) { showToast("No text to process!", "warning"); return; }

    window.logTrans(`Analyzing text for chapters...`);

    // Simple Split Logic
    const formatted = text.replace(/\r\n/g, '\n');
    let chunks = [];

    // Strategy 1: "Chapter X" regex
    const chapterRegex = /(?:Chapter|Capítulo|Chapitre|Kapitel|第|Episode|Part)\s+([0-9]+|[A-Za-z]+)(?:[:.\s\n])/ig;
    let match;
    let indices = [];
    while ((match = chapterRegex.exec(formatted)) !== null) {
        indices.push({ index: match.index, label: match[0].trim() });
    }

    if (indices.length > 0) {
        for (let i = 0; i < indices.length; i++) {
            const start = indices[i].index;
            const end = indices[i + 1] ? indices[i + 1].index : formatted.length;
            const content = formatted.substring(start, end).trim();
            const lines = content.split('\n');
            const title = lines[0].substring(0, 100).trim();
            const body = lines.slice(1).join('\n').trim();
            chunks.push({ title, content: body || content });
        }
    } else {
        // Strategy 2: Double/Triple Newline fallback
        const parts = formatted.split(/\n\s*\n\s*\n/);
        if (parts.length > 1) {
            parts.forEach((p, i) => {
                const lines = p.trim().split('\n');
                chunks.push({
                    title: lines[0].substring(0, 50).trim() || `Part ${i + 1}`,
                    content: p.trim()
                });
            });
        } else {
            chunks.push({ title: "Translated Content (Single Chapter)", content: formatted });
        }
    }

    window.bulkTranslationChunks = chunks;
    renderBulkPreview(chunks);
};

function renderBulkPreview(chunks) {
    const container = document.getElementById('trans-bulk-preview');
    const list = document.getElementById('trans-preview-list');
    container.style.display = 'block';
    list.innerHTML = '';

    if (chunks.length === 0) {
        list.innerHTML = '<div style="color: yellow;">No chapters detected.</div>';
        return;
    }

    chunks.forEach((c, i) => {
        const item = document.createElement('div');
        item.style.cssText = "background: rgba(255,255,255,0.05); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);";
        item.innerHTML = `<b style="color:#fff;">#${i + 1}</b> ${c.title} <span style="float:right; color:#94a3b8; font-size:0.8rem;">${c.content.length} chars</span>`;
        list.appendChild(item);
    });

    window.logTrans(`Preview ready: ${chunks.length} segments found.`);
}

window.confirmBulkSave = async function () {
    const bookId = document.getElementById('trans-book-select').value;
    const lang = document.getElementById('trans-lang-select').value;
    const chunks = window.bulkTranslationChunks;

    if (!bookId) { showToast("Select a book first!", "error"); return; }
    if (!chunks || chunks.length === 0) { showToast("No chunks to save!", "error"); return; }

    window.logTrans(`Starting Bulk Save for ${lang}...`);

    let targetBookId;
    try {
        targetBookId = await getOrCreateTranslatedBook(bookId, lang);
    } catch (e) {
        window.logTrans(`❌ Error creating book: ${e.message}`);
        showToast("Failed to create translated book record.", "error");
        return;
    }

    let uploaded = 0;
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        let num = i + 1;

        // Try to parse number from title if possible, otherwise use index
        const numMatch = chunk.title.match(/\d+/);
        if (numMatch) {
            // Optional: careful with this if regex matches "10" in "Chapter 10" but we are at index 0
            // For safety in bulk append, index + 1 is often safer unless we strictly trust the parser
            // keeping existing logic or defaulting to index-based for consistency
            // num = parseInt(numMatch[0]); 
        }

        const dbRow = {
            book_id: targetBookId,
            chapter_number: num,
            title: chunk.title,
            content: chunk.content,
            language: lang,
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabaseClient.from('chapters').insert(dbRow);
            if (error) throw error;
            uploaded++;
            window.logTrans(`✅ Saved: ${chunk.title}`);
        } catch (e) {
            window.logTrans(`❌ ERROR saving ${chunk.title}: ${e.message}`);
        }
    }

    window.logTrans(`Done. ${uploaded} chapters added.`);
    showToast(`Successfully imported ${uploaded} chapters!`, 'success');

    // Reset UI
    document.getElementById('trans-bulk-preview').style.display = 'none';
    document.getElementById('trans-bulk-input').value = '';
    window.bulkTranslationChunks = [];

    loadTranslationStats();
};

// Helper: Get or Create Translated Book Entry
async function getOrCreateTranslatedBook(sourceBkId, lang) {
    // Check if we already have a translation linked to this source
    const { data: existing, error } = await supabaseClient
        .from('books')
        .select('*')
        .eq('original_book_id', sourceBkId)
        .eq('language', lang)
        .maybeSingle();

    if (existing) {
        window.logTrans(`Found existing ${lang} book: "${existing.title}"`);
        return existing.id;
    }

    // Not found, create it
    window.logTrans(`Creating new ${lang} book entry...`);

    // Fetch source details
    const { data: source } = await supabaseClient
        .from('books')
        .select('*')
        .eq('id', sourceBkId)
        .single();

    if (!source) throw new Error("Source book not found!");

    // Construct new title
    const langNames = {
        'en': 'English', 'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French',
        'ar': 'Arabic', 'zh': 'Mandarin Chinese', 'bn': 'Bengali', 'pt': 'Portuguese',
        'ru': 'Russian', 'ur': 'Urdu', 'jp': 'Japanese', 'pa': 'Western Punjabi',
        'mr': 'Marathi', 'hi-en': 'Hinglish', 'de': 'German'
    };
    const suffix = langNames[lang] || lang;
    const newTitle = `${source.title} (${suffix})`;

    const newBook = {
        title: newTitle,
        author: source.author,
        description: source.description,
        cover_image: source.cover_image,
        is_public: source.is_public,
        original_book_id: sourceBkId,
        language: lang,
        created_at: new Date().toISOString()
    };

    // Insert new book
    const { data: inserted, error: insertErr } = await supabaseClient
        .from('books')
        .insert(newBook)
        .select()
        .single();

    if (insertErr) throw insertErr;

    window.logTrans(`✅ Created new book: "${inserted.title}" (ID: ${inserted.id})`);
    return inserted.id;
}

window.processBulkTranslation = async function () {
    const sourceBookId = document.getElementById('trans-book-select').value;
    const lang = document.getElementById('trans-lang-select').value;
    const text = document.getElementById('trans-bulk-input').value;

    if (!sourceBookId) { showToast("Select a book first!", "error"); return; }
    if (!text) { showToast("No text to process!", "warning"); return; }

    if (!confirm(`This will create/update the '${lang}' version of the book. Continue?`)) return;

    window.logTrans(`Starting Bulk Import for ${lang}...`);

    let targetBookId;
    try {
        targetBookId = await getOrCreateTranslatedBook(sourceBookId, lang);
    } catch (e) {
        window.logTrans(`❌ Error creating book: ${e.message}`);
        showToast("Failed to create translated book record.", "error");
        return;
    }

    // Simple Split Logic (reuse from content-processor concept roughly)
    const formatted = text.replace(/\r\n/g, '\n');
    let chunks = [];

    // Strategy 1: "Chapter X" regex
    const chapterRegex = /(?:Chapter|Capítulo|Chapitre|Kapitel|第|Episode)\s+([0-9]+|[A-Za-z]+)(?:[:.\s\n])/ig;
    let match;
    let indices = [];
    while ((match = chapterRegex.exec(formatted)) !== null) {
        indices.push({ index: match.index, label: match[0].trim() });
    }

    if (indices.length > 0) {
        window.logTrans(`Detected ${indices.length} chapter markers.`);
        for (let i = 0; i < indices.length; i++) {
            const start = indices[i].index;
            const end = indices[i + 1] ? indices[i + 1].index : formatted.length;
            const content = formatted.substring(start, end).trim();
            // Extract title from first line
            const lines = content.split('\n');
            const title = lines[0].substring(0, 100).trim();
            const body = lines.slice(1).join('\n').trim();

            chunks.push({ title, content: body || content }); // Fallback if body empty
        }
    } else {
        // Strategy 2: Double Newline or just one big chunk?
        // Let's try splitting by Triple New Line as a backup manual separator
        const parts = formatted.split(/\n\s*\n\s*\n/);
        if (parts.length > 1) {
            window.logTrans(`Split by triple-newline into ${parts.length} parts.`);
            parts.forEach((p, i) => {
                const lines = p.trim().split('\n');
                chunks.push({
                    title: lines[0].substring(0, 50) || `Part ${i + 1}`,
                    content: p.trim()
                });
            });
        } else {
            // One big chapter
            window.logTrans(`No markers found. Importing as single chapter.`);
            chunks.push({ title: "Translated Content", content: formatted });
        }
    }

    // Process & Upload to TARGET Book ID
    let uploaded = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Try to parse number from title
        let num = i + 1;
        const numMatch = chunk.title.match(/\d+/);
        if (numMatch) num = parseInt(numMatch[0]);

        const dbRow = {
            book_id: targetBookId, // KEY: Use translated book ID
            chapter_number: num,
            title: chunk.title,
            content: chunk.content,
            language: lang,
            created_at: new Date().toISOString()
        };

        try {
            const { error } = await supabaseClient.from('chapters').insert(dbRow);
            if (error) throw error;
            uploaded++;
            window.logTrans(`✅ Saved: ${chunk.title} (#${num})`);
        } catch (e) {
            window.logTrans(`❌ ERROR saving ${chunk.title}: ${e.message}`);
        }
    }

    window.logTrans(`Done. ${uploaded} chapters added to translated book.`);
    showToast(`Imported ${uploaded} chapters!`, 'success');
    loadTranslationStats();
};

window.saveSingleTranslation = async function () {
    const sourceBookId = document.getElementById('trans-book-select').value;
    const lang = document.getElementById('trans-lang-select').value;
    const num = document.getElementById('trans-single-num').value;
    const title = document.getElementById('trans-single-title').value;
    const content = document.getElementById('trans-single-content').value;

    if (!sourceBookId || !num || !title || !content) {
        showToast("Please fill all fields.", "warning");
        return;
    }

    window.logTrans(`Saving Chapter ${num} for ${lang}...`);

    let targetBookId;
    try {
        targetBookId = await getOrCreateTranslatedBook(sourceBookId, lang);
    } catch (e) {
        window.logTrans(`❌ Error creating book: ${e.message}`);
        showToast("Failed to create book", "error");
        return;
    }

    const dbRow = {
        book_id: targetBookId,
        chapter_number: parseInt(num),
        title: title,
        content: content,
        language: lang,
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabaseClient.from('chapters').insert(dbRow);
        if (error) throw error;

        window.logTrans(`✅ Success! Saved ${title} to translated book.`);
        showToast("Chapter Saved!", "success");
        loadTranslationStats();
    } catch (e) {
        window.logTrans(`❌ Error: ${e.message}`);
        showToast("Save Failed", "error");
    }
};
