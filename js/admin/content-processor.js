// Content Processing and Splitting Logic

// Reflow Text Logic
window.reflowText = function (text) {
    if (!text) return "";
    const paragraphs = text.split(/\n/);
    const reflowedLines = [];
    const maxChars = 75;

    paragraphs.forEach(para => {
        const words = para.split(' ');
        let currentLine = "";

        // Preserve empty lines
        if (words.length === 1 && words[0] === "") {
            reflowedLines.push("");
            return;
        }

        words.forEach(word => {
            if ((currentLine.length + word.length + 1) > maxChars) {
                if (currentLine) reflowedLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? (currentLine + " " + word) : word;
            }
        });
        if (currentLine) reflowedLines.push(currentLine);
    });

    return reflowedLines.join('\n');
};

// Core Splitting Logic
window.processAndSplit = function () {
    const textToProcess = document.getElementById('manual-paste').value;
    if (!textToProcess) {
        showToast("Please add text first!", 'warning');
        return;
    }

    const splitMethod = document.getElementById('split-method').value;
    const formatted = reflowText(textToProcess);

    let newChapters = [];

    if (splitMethod === 'keyword') {
        // AI Precision: Enhanced regex for various chapter markers across languages
        const chapterRegex = /(?:Chapter|CHAPTER|Capítulo|CAPÍTULO|Chapitre|CHAPITRE|Kapitel|KAPITEL|Part|PART|Lesson|LESSON|Section|SECTION|第)\s*([0-9０-９]+|[A-Za-z]+|[\w\s]+)(?::|\s|\n|-|第|$)/gi;
        let match;
        let indices = [];
        
        // Strategy: Find all matches and their positions
        while ((match = chapterRegex.exec(formatted)) !== null) {
            indices.push({ title: match[0].trim(), index: match.index });
        }
        
        if (indices.length === 0) {
            window.logTrans && window.logTrans("No markers found. Importing as a single block.");
            newChapters = [{ title: "Full Content", content: formatted }];
        } else {
            for (let i = 0; i < indices.length; i++) {
                const start = indices[i].index;
                const end = indices[i + 1] ? indices[i + 1].index : formatted.length;
                let chunkTitle = indices[i].title;
                let chunkContent = formatted.substring(start, end).trim();
                
                // Polish: If title is just a number, prepend 'Chapter'
                if (/^\d+$/.test(chunkTitle)) {
                    chunkTitle = `Chapter ${chunkTitle}`;
                }
                
                newChapters.push({
                    title: chunkTitle,
                    content: chunkContent
                });
            }
        }
    } else {
        // AI Precision: Split by major paragraph breaks (Triple Newlines preferred)
        const chunks = formatted.split(/\n\s*\n\s*\n/);
        newChapters = chunks.map((c, i) => {
            const lines = c.trim().split('\n');
            // Try to use the first line as title if it's short and looks like a heading
            const possibleTitle = lines[0].trim();
            const title = (possibleTitle.length > 0 && possibleTitle.length < 60) ? possibleTitle : `Section ${i + 1}`;
            return {
                title: title,
                content: c.trim()
            };
        });
    }

    // Update Global State (assuming core.js defines these or we need to ensure they are available)
    window.chaptersArray = newChapters;
    window.currentChapterIndex = 0;

    if (typeof renderChapters === 'function') renderChapters();

    // Load first chapter
    if (window.chaptersArray.length > 0) {
        const previewBox = document.getElementById('preview-box');
        if (previewBox) previewBox.value = window.chaptersArray[0].content;
        if (typeof updateLineNumbers === 'function') updateLineNumbers();
    }
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

    if (typeof renderChapters === 'function') renderChapters();
    document.getElementById('preview-box').value = newPart2.content;
    if (typeof updateLineNumbers === 'function') updateLineNumbers();

    const status = document.getElementById('extraction-status');
    if (status) {
        status.textContent = `Split Done! created "${customTitle}". Now showing remaining text.`;
        status.style.color = "#eab308";
    }
};

window.handleDroppedFile = function (file) {
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
            } else {
                console.error("PDF.js library not found");
                if (status) status.textContent = "Error: PDF library missing.";
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
