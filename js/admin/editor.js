// Content Editor / Paper Studio for Admin Panel

window.reflowText = function (text) {
    if (!text) return "";
    const lines = text.split('\n');
    let reflowed = "";
    lines.forEach(line => {
        if (line.trim().length === 0) {
            reflowed += "\n\n";
            return;
        }
        let words = line.split(' ');
        let currentLine = "";
        words.forEach(word => {
            if ((currentLine + word).length > 70) {
                reflowed += currentLine.trim() + "\n";
                currentLine = word + " ";
            } else {
                currentLine += word + " ";
            }
        });
        reflowed += currentLine.trim() + " ";
    });
    return reflowed.replace(/\s\s+/g, ' ').replace(/\n /g, '\n').trim();
};

window.initContent = function (text) {
    const formatted = reflowText(text);
    const pasteEl = document.getElementById('manual-paste');
    const previewEl = document.getElementById('preview-box');

    if (pasteEl) pasteEl.value = text;
    if (previewEl) previewEl.value = formatted;

    window.chaptersArray = [{ title: "Full Text / Unsorted", content: formatted }];
    window.currentChapterIndex = 0;

    renderChapters();
    updateLineNumbers();

    const status = document.getElementById('extraction-status');
    if (status) {
        status.textContent = "Content loaded. Ready to split.";
        status.style.color = "#3b82f6";
    }
};

window.openEditModal = function (index) {
    window.editingChapterIndex = index;
    const chap = chaptersArray[index];
    const modal = document.getElementById('edit-modal');
    if (!modal) return;

    const numEl = document.getElementById('edit-chap-num');
    const titleEl = document.getElementById('edit-chap-title');

    if (numEl) numEl.value = index + 1;
    if (titleEl) titleEl.value = chap.title;

    modal.style.display = 'block';
};

window.closeEditModal = function () {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.style.display = 'none';
    window.editingChapterIndex = null;
};

window.saveEditModal = function () {
    if (window.editingChapterIndex === null) return;

    const num = document.getElementById('edit-chap-num').value;
    const title = document.getElementById('edit-chap-title').value;
    const heading = document.getElementById('edit-chap-heading').value;

    let displayTitle = title;
    if (num) displayTitle = `Chapter ${num}: ${title}`;
    if (heading) displayTitle += ` - ${heading}`;

    chaptersArray[editingChapterIndex].title = displayTitle;

    const status = document.getElementById('extraction-status');
    if (status) status.textContent = `Updated: ${displayTitle}`;

    renderChapters();
    closeEditModal();
};

window.renderChapters = function () {
    const chaptersDiv = document.getElementById('chapter-list-preview');
    const status = document.getElementById('extraction-status');
    if (!chaptersDiv) return;

    chaptersDiv.innerHTML = ``;

    chaptersArray.forEach((chap, i) => {
        const badge = document.createElement('div');
        badge.className = 'chapter-badge';
        badge.style.cursor = 'pointer';
        badge.style.display = 'flex';
        badge.style.justifyContent = 'space-between';
        badge.style.alignItems = 'center';
        badge.style.gap = '10px';

        if (i === currentChapterIndex) {
            badge.style.borderColor = "#eab308";
            badge.style.color = "#eab308";
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = chap.title;
        badge.appendChild(titleSpan);

        const editIcon = document.createElement('span');
        editIcon.innerHTML = '✏️';
        editIcon.style.fontSize = '0.9rem';
        editIcon.style.opacity = '0.7';
        editIcon.title = "Edit Details";
        editIcon.style.padding = "5px";
        editIcon.style.borderRadius = "4px";
        editIcon.onmouseover = function () { this.style.backgroundColor = 'rgba(255,255,255,0.1)'; };
        editIcon.onmouseout = function () { this.style.backgroundColor = 'transparent'; };

        badge.appendChild(editIcon);

        badge.onclick = (e) => {
            if (e.target === editIcon) {
                e.stopPropagation();
                openEditModal(i);
                return;
            }
            window.currentChapterIndex = i;
            const previewEl = document.getElementById('preview-box');
            if (previewEl) previewEl.value = chap.content;
            updateLineNumbers();
            renderChapters();
            if (status) status.textContent = `Editing: ${chap.title}`;
        };

        chaptersDiv.appendChild(badge);
    });
};

window.updateLineNumbers = function () {
    const previewBox = document.getElementById('preview-box');
    const lineNumbers = document.getElementById('line-numbers');
    if (!previewBox || !lineNumbers) return;

    const lines = previewBox.value.split('\n').length;
    let lineStr = "";
    for (let i = 1; i <= lines; i++) {
        lineStr += i + "\n";
    }
    lineNumbers.textContent = lineStr;
};

window.syncScroll = function () {
    const previewBox = document.getElementById('preview-box');
    const lineNumbers = document.getElementById('line-numbers');
    if (previewBox && lineNumbers) lineNumbers.scrollTop = previewBox.scrollTop;
};

window.insertFormatting = function (tag, targetId = 'preview-box') {
    const previewBox = document.getElementById(targetId);
    if (!previewBox) return;

    const start = previewBox.selectionStart;
    const end = previewBox.selectionEnd;
    const text = previewBox.value;
    const selected = text.substring(start, end);

    let beforeTag = `<${tag}>`;
    let afterTag = `</${tag}>`;

    if (tag === 'center') {
        beforeTag = `<div style="text-align:center;">`;
        afterTag = `</div>`;
    }

    const newText = text.substring(0, start) + beforeTag + selected + afterTag + text.substring(end);
    previewBox.value = newText;

    const event = new Event('input', { bubbles: true });
    previewBox.dispatchEvent(event);

    previewBox.focus();
    previewBox.setSelectionRange(start + beforeTag.length, start + beforeTag.length + selected.length);
    if (typeof saveDraft === 'function') saveDraft();
};

window.clearEditor = function () {
    customConfirm("Clear current content?", "Clear Editor", "🗑️")
        .then(confirmed => {
            if (!confirmed) return;
            const previewEl = document.getElementById('preview-box');
            const pasteEl = document.getElementById('manual-paste');
            if (previewEl) previewEl.value = "";
            if (pasteEl) pasteEl.value = "";

            ['book-author', 'book-cover', 'book-desc'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = "";
            });

            window.chaptersArray = [];
            window.currentChapterIndex = 0;
            renderChapters();
            updateLineNumbers();
            localStorage.removeItem('contentStudioDraft');
        });
};

window.saveDraft = function () {
    const draft = {
        title: document.getElementById('book-title')?.value || "",
        author: document.getElementById('book-author')?.value || "",
        cover: document.getElementById('book-cover')?.value || "",
        desc: document.getElementById('book-desc')?.value || "",
        type: document.getElementById('content-type')?.value || "book",
        genre: document.getElementById('content-genre')?.value || "",
        chapters: chaptersArray,
        currentIdx: currentChapterIndex
    };
    localStorage.setItem('contentStudioDraft', JSON.stringify(draft));
};

window.loadDraft = function () {
    const saved = localStorage.getItem('contentStudioDraft');
    if (!saved) return;

    customConfirm("You have a saved draft. Load it?", "Load Draft", "📂")
        .then(confirmed => {
            if (!confirmed) return;

            const draft = JSON.parse(saved);
            const fields = {
                'book-title': draft.title,
                'book-author': draft.author,
                'book-cover': draft.cover,
                'book-desc': draft.desc,
                'content-type': draft.type || 'book'
            };

            for (const [id, val] of Object.entries(fields)) {
                const el = document.getElementById(id);
                if (el) el.value = val || "";
            }

            if (typeof updateSubcategories === 'function') updateSubcategories();
            setTimeout(() => {
                const genreEl = document.getElementById('content-genre');
                if (genreEl) genreEl.value = draft.genre || "";
            }, 0);

            window.chaptersArray = draft.chapters || [];
            window.currentChapterIndex = draft.currentIdx || 0;

            if (chaptersArray.length > 0) {
                const previewEl = document.getElementById('preview-box');
                if (previewEl) {
                    previewEl.value = chaptersArray[currentChapterIndex].content;
                    updateLineNumbers();
                }
            }
            renderChapters();

            const status = document.getElementById('extraction-status');
            if (status) {
                status.textContent = "Draft loaded successfully!";
                status.style.color = "#3b82f6";
            }
        });
};

window.publishChapters = function () {
    if (chaptersArray.length === 0) {
        showToast("No chapters to publish.", 'warning');
        return;
    }

    const bookTitle = document.getElementById('book-title')?.value.trim() || "Untitled Book";
    const bookAuthor = document.getElementById('book-author')?.value.trim() || "Unknown Author";
    const bookCover = document.getElementById('book-cover')?.value.trim();
    const bookDesc = document.getElementById('book-desc')?.value.trim();
    const contentType = document.getElementById('content-type')?.value;
    const contentGenre = document.getElementById('content-genre')?.value;

    const newEntry = {
        id: currentEditId || Date.now().toString(),
        title: bookTitle,
        author: bookAuthor,
        image: bookCover,
        description: bookDesc,
        type: contentType,
        genre: contentGenre,
        chapters: chaptersArray,
        timestamp: new Date().toISOString()
    };

    let library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');

    if (currentEditId) {
        const index = library.findIndex(item => item.id === currentEditId);
        if (index !== -1) {
            library[index] = newEntry;
            showToast(`Updated "${bookTitle}" successfully!`);
        }
    } else {
        library.push(newEntry);
        showToast(`Success! Published "${bookTitle}" with ${chaptersArray.length} chapters.`);
    }

    localStorage.setItem('siteLibrary', JSON.stringify(library));
    if (typeof syncToCloud === 'function') syncToCloud('library', newEntry);

    const status = document.getElementById('extraction-status');
    if (status) {
        status.textContent = currentEditId ? `✅ Updated "${bookTitle}"!` : `🚀 Published "${bookTitle}" to Library!`;
        status.style.color = "#10b981";
    }

    window.currentEditId = null;
    const publishBtn = document.querySelector('.split-results-panel .btn-success');
    if (publishBtn) publishBtn.innerHTML = '<span>🚀</span> Publish';

    if (typeof updateDashboardStats === 'function') updateDashboardStats();
};
window.splitAtLine = function () {
    const lineNumInput = document.getElementById('split-line');
    const titleInput = document.getElementById('split-title');
    const lineNum = parseInt(lineNumInput.value);
    let customTitle = titleInput.value.trim();

    if (!lineNum || lineNum < 1) {
        showToast("Please enter a valid line number.", 'warning');
        return;
    }

    const currentContent = document.getElementById('preview-box').value;
    const lines = currentContent.split('\n');

    if (lineNum >= lines.length) {
        showToast(`Line number exceeds current section length (${lines.length} lines).`, 'error');
        return;
    }

    const part1Content = lines.slice(0, lineNum).join('\n');
    const part2Content = lines.slice(lineNum).join('\n');

    if (!customTitle) {
        customTitle = `Chapter ${window.currentChapterIndex + 1}`;
    }

    const newPart1 = { title: customTitle, content: part1Content };
    const newPart2 = { title: "Remaining Content", content: part2Content };

    window.chaptersArray.splice(window.currentChapterIndex, 1, newPart1, newPart2);

    titleInput.value = "";
    lineNumInput.value = "";

    window.currentChapterIndex = window.currentChapterIndex + 1;

    renderChapters();
    document.getElementById('preview-box').value = newPart2.content;
    if (typeof updateLineNumbers === 'function') updateLineNumbers();

    const status = document.getElementById('extraction-status');
    if (status) {
        status.textContent = `Split Done! created "${customTitle}". Now showing remaining text.`;
        status.style.color = "#eab308";
    }
};

if (!window.fileInputElement) {
    window.fileInputElement = document.createElement('input');
    window.fileInputElement.type = 'file';
    window.fileInputElement.accept = '.pdf,.txt';
    window.fileInputElement.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const status = document.getElementById('extraction-status');

        if (file.type === "application/pdf") {
            if (status) status.textContent = "Extracting text from PDF... Please wait.";
            reader.onload = async function () {
                const typedarray = new Uint8Array(this.result);
                if (typeof pdfjsLib !== 'undefined') {
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        fullText += textContent.items.map(item => item.str).join(" ") + "\n";
                    }
                    if (typeof window.initContent === 'function') window.initContent(fullText);
                    if (status) {
                        status.textContent = `File Loaded: ${file.name}`;
                        status.style.color = "#10b981";
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            if (status) status.textContent = "Reading text file...";
            reader.onload = function () {
                if (typeof window.initContent === 'function') window.initContent(this.result);
                if (status) {
                    status.textContent = `File Loaded: ${file.name}`;
                    status.style.color = "#10b981";
                }
            };
            reader.readAsText(file);
        }
    };
}

window.triggerUpload = function () {
    if (window.fileInputElement) window.fileInputElement.click();
};

window.handleDroppedFile = function (file) {
    if (window.fileInputElement) window.fileInputElement.onchange({ target: { files: [file] } });
};

// --- Restored Chapter Editor & Assistant Functions ---

window.currentEditorBookId = null;
window.currentEditorChapterIndex = null;

window.loadContentEditorBooks = function () {
    const select = document.getElementById('content-editor-book-select');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select a Book --</option>';
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');

    library.forEach(item => {
        if (item.chapters && item.chapters.length > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.title} (${item.chapters.length} chapters)`;
            select.appendChild(option);
        }
    });

    if (library.length === 0) {
        select.innerHTML = '<option value="">No books available - Please publish content first</option>';
    }
};

window.loadContentEditorBook = function () {
    const select = document.getElementById('content-editor-book-select');
    const bookId = select.value;

    if (!bookId) {
        const mainEl = document.getElementById('content-editor-main');
        if (mainEl) mainEl.style.display = 'none';
        return;
    }

    window.currentEditorBookId = bookId;
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const book = library.find(item => item.id === bookId);

    if (!book || !book.chapters) {
        showToast('Book not found or has no chapters', 'error');
        return;
    }

    const chapterSelect = document.getElementById('content-editor-chapter-select');
    if (chapterSelect) {
        chapterSelect.innerHTML = '<option value="">-- Select a Chapter --</option>';
        book.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = chapter.title || `Chapter ${index + 1}`;
            chapterSelect.appendChild(option);
        });
    }

    const mainEl = document.getElementById('content-editor-main');
    const panelEl = document.getElementById('chapter-editor-panel');
    // chapterSelect is already declared above 


    if (mainEl) mainEl.style.display = 'block';
    if (panelEl) panelEl.style.display = 'none';

    // Visual feedback: clear chapter selection
    if (chapterSelect) chapterSelect.value = "";
};

window.loadChapterForEditing = function () {
    const selector = document.getElementById('content-editor-chapter-select');
    if (!selector) return;
    const chapterIndex = parseInt(selector.value);

    if (isNaN(chapterIndex)) {
        const panelEl = document.getElementById('chapter-editor-panel');
        if (panelEl) panelEl.style.display = 'none';
        return;
    }

    window.currentEditorChapterIndex = chapterIndex;
    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const book = library.find(item => item.id === currentEditorBookId);

    if (!book || !book.chapters[chapterIndex]) {
        showToast('Chapter not found', 'error');
        return;
    }

    const chapter = book.chapters[chapterIndex];

    // Load chapter data into form
    const fields = {
        'editor-chapter-title': chapter.title,
        'editor-chapter-desc': chapter.description,
        'editor-chapter-content': chapter.content,
        'editor-chapter-bg': chapter.backgroundImage,
        'editor-chapter-bg-style': chapter.backgroundStyle || 'cover',
        'editor-chapter-music': chapter.musicUrl,
        'editor-chapter-volume': chapter.musicVolume || 30,
        'editor-chapter-reading-time': chapter.readingTime,
        'editor-chapter-type': chapter.chapterType || 'standard',
        'editor-chapter-visibility': chapter.visibility || 'public',
        'editor-chapter-custom-css': chapter.customCss,
        'editor-chapter-language': chapter.language || 'en'
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val || (id === 'editor-chapter-volume' ? 30 : '');
    }

    const loopBtn = document.getElementById('editor-chapter-music-loop');
    if (loopBtn) loopBtn.checked = chapter.musicLoop !== false;

    const volumeDisplay = document.getElementById('editor-volume-display');
    if (volumeDisplay) volumeDisplay.textContent = (chapter.musicVolume || 30) + '%';

    updateEditorLineNumbers();

    const panelEl = document.getElementById('chapter-editor-panel');
    if (panelEl) panelEl.style.display = 'block';
};

window.updateEditorLineNumbers = function () {
    const editorTextArea = document.getElementById('editor-chapter-content');
    const editorLineNumbers = document.getElementById('editor-line-numbers');
    if (!editorTextArea || !editorLineNumbers) return;

    const lines = editorTextArea.value.split('\n').length;
    let lineStr = "";
    for (let i = 1; i <= lines; i++) {
        lineStr += i + "\n";
    }
    editorLineNumbers.textContent = lineStr;
};

// Line numbering system for the new Editor
const editorTextArea = document.getElementById('editor-chapter-content');
const editorLineNumbers = document.getElementById('editor-line-numbers');
if (editorTextArea && editorLineNumbers) {
    editorTextArea.addEventListener('input', updateEditorLineNumbers);
    editorTextArea.addEventListener('scroll', () => {
        editorLineNumbers.scrollTop = editorTextArea.scrollTop;
    });
}

// Volume display update
const editorVolumeInput = document.getElementById('editor-chapter-volume');
const editorVolumeDisplay = document.getElementById('editor-volume-display');
if (editorVolumeInput && editorVolumeDisplay) {
    editorVolumeInput.addEventListener('input', () => {
        editorVolumeDisplay.textContent = editorVolumeInput.value + '%';
    });
}

window.saveChapterEdits = function () {
    if (currentEditorBookId === null || currentEditorChapterIndex === null) {
        showToast('No chapter selected for editing', 'warning');
        return;
    }

    const title = document.getElementById('editor-chapter-title')?.value.trim();
    if (!title) {
        showToast('Chapter title is required', 'error');
        return;
    }

    const content = document.getElementById('editor-chapter-content')?.value.trim();
    if (!content) {
        showToast('Chapter content cannot be empty', 'warning');
    }

    customConfirm("Save updates to this chapter?", "Update Content", "📝").then(confirmed => {
        if (!confirmed) return;

        try {
            const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
            const bookIndex = library.findIndex(item => item.id === currentEditorBookId);

            if (bookIndex === -1 || !library[bookIndex].chapters || !library[bookIndex].chapters[currentEditorChapterIndex]) {
                showToast('Error: Book or chapter not found in library', 'error');
                return;
            }

            const getValue = (id, fallback = '') => {
                const el = document.getElementById(id);
                return el ? el.value : fallback;
            };

            const chapter = library[bookIndex].chapters[currentEditorChapterIndex];

            // Update chapter data
            chapter.title = title;
            chapter.description = getValue('editor-chapter-desc');
            chapter.content = getValue('editor-chapter-content');

            chapter.backgroundImage = getValue('editor-chapter-bg');
            chapter.backgroundStyle = getValue('editor-chapter-bg-style', 'cover');
            chapter.musicUrl = getValue('editor-chapter-music');
            chapter.musicVolume = parseInt(getValue('editor-chapter-volume', '30'));

            const loopBtn = document.getElementById('editor-chapter-music-loop');
            chapter.musicLoop = loopBtn ? loopBtn.checked : true;

            chapter.readingTime = getValue('editor-chapter-reading-time', '5 min');
            chapter.chapterType = getValue('editor-chapter-type', 'standard');
            chapter.visibility = getValue('editor-chapter-visibility', 'public');
            chapter.language = getValue('editor-chapter-language', 'en');
            chapter.customCss = getValue('editor-chapter-custom-css');

            chapter.lastModified = new Date().toISOString();

            localStorage.setItem('siteLibrary', JSON.stringify(library));
            if (typeof syncToCloud === 'function') {
                syncToCloud('library', library[bookIndex]);
            }

            showToast(`Chapter "${chapter.title}" saved successfully!`, 'success');
            loadChapterForEditing();
        } catch (error) {
            console.error('Failed to save chapter edits:', error);
            showToast('Failed to save changes. Please check console.', 'error');
        }
    });
};

window.insertAssistantHeading = function () {
    const headingText = document.getElementById('assistant-heading-text').value.trim();
    const type = document.getElementById('assistant-heading-type').value;
    const font = document.getElementById('assistant-heading-font').value;
    const weight = document.getElementById('assistant-heading-weight').value;

    if (!headingText) {
        showToast('Please enter heading text', 'warning');
        return;
    }

    const style = `font-family: ${font}; font-weight: ${weight}; margin-top: 25px; margin-bottom: 15px; color: #fff; line-height: 1.4; display: block;`;
    const html = `<${type} style="${style}">${headingText}</${type}>\n`;

    smartInsertIntoContent(html);
    document.getElementById('assistant-heading-text').value = '';
};

window.insertAssistantImage = function () {
    const imageUrl = document.getElementById('assistant-image-url').value.trim();

    const html = imageUrl
        ? `\n<div style="text-align:center; margin: 30px 0;">\n    <img src="${imageUrl}" style="max-width:100%; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);" alt="Chapter Image Component">\n</div>\n`
        : `\n<div style="text-align:center; margin: 40px 0; padding: 40px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02);">\n    <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;">🖼️</div>\n    <p style="margin: 0; color: #64748b; font-size: 0.9rem;">[ Replace this with your image URL ]</p>\n</div>\n`;

    smartInsertIntoContent(html);
    document.getElementById('assistant-image-url').value = '';
};

window.smartInsertIntoContent = function (html) {
    const textarea = document.getElementById('editor-chapter-content');
    const lineNumInput = document.getElementById('assistant-line-num');
    const lineNum = parseInt(lineNumInput.value);

    if (isNaN(lineNum) || lineNum <= 0) {
        insertAtCursor(textarea, html);
    } else {
        const lines = textarea.value.split('\n');
        const insertIdx = Math.min(lineNum - 1, lines.length);
        lines.splice(insertIdx, 0, html);
        textarea.value = lines.join('\n');

        lineNumInput.value = '';
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);

        const lineHeight = 1.5 * 15.2; // approx
        textarea.scrollTop = insertIdx * lineHeight;
    }
};

function insertAtCursor(myField, myValue) {
    if (!myField) return;

    if (myField.selectionStart || myField.selectionStart === 0) {
        const startPos = myField.selectionStart;
        const endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
        myField.focus();
        myField.selectionStart = startPos + myValue.length;
        myField.selectionEnd = startPos + myValue.length;
    } else {
        myField.value += myValue;
    }
    const event = new Event('input', { bubbles: true });
    myField.dispatchEvent(event);
}

// --- Chapter Management Features ---

window.addNewChapter = function () {
    if (!window.currentEditorBookId) {
        showToast('Please select a book first', 'warning');
        return;
    }

    const title = prompt("Enter new chapter title:");
    if (!title) return;

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const bookIndex = library.findIndex(item => item.id === window.currentEditorBookId);

    if (bookIndex === -1) {
        showToast('Error: Book not found', 'error');
        return;
    }

    const newChapter = {
        title: title,
        content: '',
        description: '',
        readingTime: '5 min',
        backgroundImage: '',
        backgroundStyle: 'cover',
        chapterType: 'standard',
        visibility: 'public',
        language: 'en',
        lastModified: new Date().toISOString()
    };

    library[bookIndex].chapters.push(newChapter);
    localStorage.setItem('siteLibrary', JSON.stringify(library));

    // Sync if available
    if (typeof syncToCloud === 'function') syncToCloud('library', library[bookIndex]);

    showToast('Chapter added successfully');

    // Reload and select the new chapter (last index)
    loadContentEditorBook();
    const chapterSelect = document.getElementById('content-editor-chapter-select');
    if (chapterSelect) {
        chapterSelect.value = library[bookIndex].chapters.length - 1;
        loadChapterForEditing();
    }
};

window.deleteCurrentChapter = function () {
    if (!window.currentEditorBookId || window.currentEditorChapterIndex === null || window.currentEditorChapterIndex === undefined) {
        showToast('No chapter selected', 'warning');
        return;
    }

    if (!confirm("Are you sure you want to delete this chapter? This cannot be undone.")) return;

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const bookIndex = library.findIndex(item => item.id === window.currentEditorBookId);

    if (bookIndex === -1) return;

    // Remove chapter
    library[bookIndex].chapters.splice(window.currentEditorChapterIndex, 1);

    localStorage.setItem('siteLibrary', JSON.stringify(library));
    if (typeof syncToCloud === 'function') syncToCloud('library', library[bookIndex]);

    showToast('Chapter deleted');

    // Reload UI
    window.currentEditorChapterIndex = null;
    loadContentEditorBook();
    const panelEl = document.getElementById('chapter-editor-panel');
    if (panelEl) panelEl.style.display = 'none';
};

window.moveChapter = function (direction) {
    if (!window.currentEditorBookId || window.currentEditorChapterIndex === null || window.currentEditorChapterIndex === undefined) {
        showToast('No chapter selected', 'warning');
        return;
    }

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const bookIndex = library.findIndex(item => item.id === window.currentEditorBookId);

    if (bookIndex === -1) return;

    const chapters = library[bookIndex].chapters;
    const newIndex = window.currentEditorChapterIndex + direction;

    if (newIndex < 0 || newIndex >= chapters.length) return; // Out of bounds

    // Swap
    const temp = chapters[newIndex];
    chapters[newIndex] = chapters[window.currentEditorChapterIndex];
    chapters[window.currentEditorChapterIndex] = temp;

    localStorage.setItem('siteLibrary', JSON.stringify(library));
    if (typeof syncToCloud === 'function') syncToCloud('library', library[bookIndex]);

    // Update selection to follow the moved chapter
    window.currentEditorChapterIndex = newIndex;

    // Reload UI
    loadContentEditorBook();
    const chapterSelect = document.getElementById('content-editor-chapter-select');
    if (chapterSelect) {
        chapterSelect.value = newIndex;
        // Don't reload the full form as data is same, just update list order
    }
    showToast('Chapter order updated');
};

window.previewChapter = function () {
    const title = document.getElementById('editor-chapter-title')?.value || 'Untitled Chapter';
    const content = document.getElementById('editor-chapter-content')?.value || '';
    const bgImage = document.getElementById('editor-chapter-bg')?.value || '';
    const bgStyle = document.getElementById('editor-chapter-bg-style')?.value || 'cover';
    const customCss = document.getElementById('editor-chapter-custom-css')?.value || '';

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
        showToast('Pop-up blocked! Please allow pop-ups to preview chapters.', 'error');
        return;
    }

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Preview: ${title}</title>
            <link rel="stylesheet" href="css/style.css">
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    background: #0f172a;
                    color: white;
                    font-family: 'Inter', sans-serif;
                    ${bgImage ? `background-image: url('${bgImage}'); background-size: ${bgStyle}; background-position: center; background-attachment: fixed;` : ''}
                }
                .preview-overlay {
                    background: rgba(15, 23, 42, 0.85);
                    min-height: 100vh;
                    padding: 60px 20px;
                }
                .chapter-container {
                    max-width: 800px;
                    margin: 0 auto;
                    line-height: 1.8;
                    font-size: 1.1rem;
                }
                .chapter-title {
                    font-size: 2.5rem;
                    font-family: 'Outfit', sans-serif;
                    margin-bottom: 40px;
                    text-align: center;
                    background: linear-gradient(to right, #60a5fa, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                ${customCss}
            </style>
        </head>
        <body>
            <div class="preview-overlay">
                <div class="chapter-container">
                    <h1 class="chapter-title">${title}</h1>
                    <div class="chapter-content">${content}</div>
                </div>
            </div>
            <script>
                // Basic formatting for the preview
                const contentDiv = document.querySelector('.chapter-content');
                if (contentDiv) {
                    // Simple newline to paragraph conversion if no HTML tags found
                    if (!/<[a-z][\s\S]*>/i.test(contentDiv.innerHTML)) {
                        contentDiv.innerHTML = contentDiv.innerHTML.split('\\n').map(p => p.trim() ? \`<p>\${p}</p>\` : '').join('');
                    }
                }
            </script>
        </body>
        </html>
    `;

    previewWindow.document.write(html);
    previewWindow.document.close();
};

// --- Original Content Management ---

window.openOriginalEditor = function () {
    if (window.currentEditorBookId === null) {
        showToast('Please select a book first', 'warning');
        return;
    }

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const book = library.find(item => item.id === currentEditorBookId);
    if (!book) return;

    // Load existing original content if any
    const fields = {
        'original-edit-title': book.originalTitle,
        'original-edit-content': book.originalContent,
        'original-edit-bg': book.originalBg,
        'original-edit-music': book.originalMusic,
        'original-edit-volume': book.originalMusicVolume || 30,
        'original-edit-desc': book.originalDesc,
        'original-edit-custom-css': book.originalCustomCss
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val || (id === 'original-edit-volume' ? 30 : '');
    }

    const loopBtn = document.getElementById('original-edit-music-loop');
    if (loopBtn) loopBtn.checked = book.originalMusicLoop !== false;

    const volumeDisplay = document.getElementById('original-volume-display');
    if (volumeDisplay) volumeDisplay.textContent = (book.originalMusicVolume || 30) + '%';

    updateOriginalLineNumbers();

    const modal = document.getElementById('original-content-modal');
    if (modal) modal.style.display = 'block';
};

window.closeOriginalEditor = function () {
    const modal = document.getElementById('original-content-modal');
    if (modal) modal.style.display = 'none';
};

window.saveOriginalContent = function () {
    const title = document.getElementById('original-edit-title').value.trim();
    const content = document.getElementById('original-edit-content').value.trim();

    if (!currentEditorBookId) {
        showToast('Selection error. Please reload.', 'error');
        return;
    }

    const library = JSON.parse(localStorage.getItem('siteLibrary') || '[]');
    const bookIndex = library.findIndex(item => item.id === currentEditorBookId);

    if (bookIndex === -1) {
        showToast('Error saving original content', 'error');
        return;
    }

    const getValue = (id, fallback = '') => {
        const el = document.getElementById(id);
        return el ? el.value : fallback;
    };

    // Update book with original content and metadata
    const book = library[bookIndex];
    book.originalTitle = title;
    book.originalContent = content;
    book.originalBg = getValue('original-edit-bg');
    book.originalMusic = getValue('original-edit-music');
    book.originalMusicVolume = parseInt(getValue('original-edit-volume', '30'));

    const loopBtn = document.getElementById('original-edit-music-loop');
    book.originalMusicLoop = loopBtn ? loopBtn.checked : true;

    book.originalDesc = getValue('original-edit-desc');
    book.originalCustomCss = getValue('original-edit-custom-css');
    book.lastModified = new Date().toISOString();

    localStorage.setItem('siteLibrary', JSON.stringify(library));

    if (typeof syncToCloud === 'function') {
        syncToCloud('library', library[bookIndex]);
    }

    showToast('Original book content saved successfully!', 'success');
    closeOriginalEditor();
};

window.updateOriginalLineNumbers = function () {
    const editorTextArea = document.getElementById('original-edit-content');
    const editorLineNumbers = document.getElementById('original-editor-line-numbers');
    if (!editorTextArea || !editorLineNumbers) return;

    const lines = editorTextArea.value.split('\n').length;
    let lineStr = "";
    for (let i = 1; i <= lines; i++) {
        lineStr += i + "\n";
    }
    editorLineNumbers.textContent = lineStr;
};

// Line numbering system for the Original Editor
const originalTextArea = document.getElementById('original-edit-content');
const originalLineNumbers = document.getElementById('original-editor-line-numbers');
if (originalTextArea && originalLineNumbers) {
    originalTextArea.addEventListener('input', updateOriginalLineNumbers);
    originalTextArea.addEventListener('scroll', () => {
        originalLineNumbers.scrollTop = originalTextArea.scrollTop;
    });
}

window.insertOriginalAssistantHeading = function () {
    const headingText = document.getElementById('original-assistant-heading-text').value.trim();
    const type = document.getElementById('original-assistant-heading-type').value;
    const font = document.getElementById('original-assistant-heading-font').value;
    const weight = document.getElementById('original-assistant-heading-weight').value;

    if (!headingText) {
        showToast('Please enter heading text', 'warning');
        return;
    }

    const style = `font-family: ${font}; font-weight: ${weight}; margin-top: 25px; margin-bottom: 15px; color: #fff; line-height: 1.4; display: block;`;
    const html = `<${type} style="${style}">${headingText}</${type}>\n`;

    smartInsertIntoOriginalContent(html);
    document.getElementById('original-assistant-heading-text').value = '';
};

window.insertOriginalAssistantImage = function () {
    const imageUrl = document.getElementById('original-assistant-image-url').value.trim();

    const html = imageUrl
        ? `\n<div style="text-align:center; margin: 30px 0;">\n    <img src="${imageUrl}" style="max-width:100%; border-radius:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);" alt="Original Source Image">\n</div>\n`
        : `\n<div style="text-align:center; margin: 40px 0; padding: 40px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; background: rgba(255,255,255,0.02);">\n    <div style="font-size: 2rem; margin-bottom: 10px; opacity: 0.3;">🖼️</div>\n    <p style="margin: 0; color: #64748b; font-size: 0.9rem;">[ Replace this with your image URL ]</p>\n</div>\n`;

    smartInsertIntoOriginalContent(html);
    document.getElementById('original-assistant-image-url').value = '';
};

window.smartInsertIntoOriginalContent = function (html) {
    const textarea = document.getElementById('original-edit-content');
    const lineNumInput = document.getElementById('original-assistant-line-num');
    const lineNum = parseInt(lineNumInput.value);

    if (isNaN(lineNum) || lineNum <= 0) {
        insertAtCursor(textarea, html);
    } else {
        const lines = textarea.value.split('\n');
        const insertIdx = Math.min(lineNum - 1, lines.length);
        lines.splice(insertIdx, 0, html);
        textarea.value = lines.join('\n');

        lineNumInput.value = '';
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);
    }
};
