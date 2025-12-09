/**
 * Main Application Logic
 */
import * as storage from './storage.js';

// DOM Elements
const pageList = document.getElementById('pageList');
const newPageBtn = document.getElementById('newPageBtn');
const pageTitleInput = document.getElementById('pageTitle');
const pageIcon = document.getElementById('pageIcon');
const editor = document.getElementById('editor');
const editorContainer = document.querySelector('.editor-container');
const emptyState = document.getElementById('emptyState');
const saveFileBtn = document.getElementById('saveFileBtn');
const loadFileBtn = document.getElementById('loadFileBtn');
const fileInput = document.getElementById('fileInput');

let activePageId = null;

// Initialize
function init() {
    const data = storage.loadData();
    activePageId = data.activePageId;

    renderSidebar();

    if (activePageId) {
        loadPage(activePageId);
    } else {
        showEmptyState();
    }

    setupEventListeners();
}

// Render Sidebar
function renderSidebar() {
    const data = storage.loadData();
    pageList.innerHTML = '';

    data.pages.forEach(page => {
        const li = document.createElement('li');
        li.className = `page-item ${page.id === activePageId ? 'active' : ''}`;
        li.dataset.id = page.id;

        li.innerHTML = `
            <span class="icon">${page.icon}</span>
            <span class="title">${page.title || '제목 없음'}</span>
            <button class="delete-btn" title="삭제">🗑️</button>
        `;

        // Page Selection
        li.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn')) {
                activePageId = page.id;
                renderSidebar(); // Update active class
                loadPage(activePageId);
            }
        });

        // Delete Page
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('이 페이지를 삭제하시겠습니까?')) {
                const nextId = storage.deletePage(page.id);
                activePageId = nextId;
                renderSidebar();
                if (activePageId) {
                    loadPage(activePageId);
                } else {
                    showEmptyState();
                }
            }
        });

        pageList.appendChild(li);
    });
}

// Load Page Content
function loadPage(pageId) {
    const page = storage.getPage(pageId);
    if (!page) return;

    // Show Editor
    editorContainer.style.display = 'block';
    emptyState.style.display = 'none';

    // Set Header
    pageTitleInput.value = page.title;
    pageIcon.textContent = page.icon;

    // Set Content
    editor.innerHTML = '';
    if (page.content && page.content.length > 0) {
        page.content.forEach(block => {
            createBlock(block.text);
        });
    } else {
        createBlock(''); // Empty block
    }
}

// Create a new content block
function createBlock(text = '', focus = false) {
    const div = document.createElement('div');
    div.className = 'block';
    div.contentEditable = true;
    div.textContent = text;
    div.setAttribute('placeholder', "명령어를 사용하려면 '/'를 입력하세요");

    // Event Listeners for Block
    div.addEventListener('keydown', handleBlockKeydown);
    div.addEventListener('input', handleBlockInput);

    editor.appendChild(div);

    if (focus) {
        div.focus();
    }

    return div;
}

// Handle Keydown in Block
function handleBlockKeydown(e) {
    const block = e.target;

    // Enter: Create new block
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const nextBlock = createBlock('', true);

        // If cursor was in middle, move text after cursor to new block
        // (Simplified: just create new empty block for now)
    }

    // Backspace: Merge with previous block if empty
    if (e.key === 'Backspace' && block.textContent === '') {
        const prevBlock = block.previousElementSibling;
        if (prevBlock) {
            e.preventDefault();
            block.remove();
            prevBlock.focus();
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(prevBlock);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            saveCurrentPage();
        }
    }

    // Arrow Up/Down navigation could be added here
}

// Handle Input in Block
function handleBlockInput(e) {
    saveCurrentPage();
}

// Save Current Page State
function saveCurrentPage() {
    if (!activePageId) return;

    const title = pageTitleInput.value;
    const blocks = Array.from(editor.children).map(block => ({
        type: 'text',
        text: block.textContent
    }));

    storage.updatePage(activePageId, {
        title,
        content: blocks
    });

    // Update Sidebar Title (Debounced ideally, but direct for simplicity)
    const sidebarItem = pageList.querySelector(`li[data-id="${activePageId}"] .title`);
    if (sidebarItem) {
        sidebarItem.textContent = title || '제목 없음';
    }
}

// Show Empty State
function showEmptyState() {
    editorContainer.style.display = 'none';
    emptyState.style.display = 'flex';
}

// Save to File
function saveToFile() {
    const data = storage.loadData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    alert('노트가 파일로 저장되었습니다!');
}

// Load from File
function loadFromFile() {
    fileInput.click();
}

function handleFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);

            // Validate data structure
            if (!data.pages || !Array.isArray(data.pages)) {
                throw new Error('Invalid data format');
            }

            // Confirm before overwriting
            if (confirm('현재 노트를 덮어쓰시겠습니까? (기존 데이터는 삭제됩니다)')) {
                storage.saveData(data);
                activePageId = data.activePageId;
                renderSidebar();
                if (activePageId) {
                    loadPage(activePageId);
                } else {
                    showEmptyState();
                }
                alert('노트를 불러왔습니다!');
            }
        } catch (error) {
            alert('파일을 읽는 중 오류가 발생했습니다: ' + error.message);
        }
    };

    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
}

// Setup Global Event Listeners
function setupEventListeners() {
    // New Page Button
    newPageBtn.addEventListener('click', () => {
        const newPage = storage.createPage();
        activePageId = newPage.id;
        renderSidebar();
        loadPage(activePageId);
    });

    // Title Input
    pageTitleInput.addEventListener('input', saveCurrentPage);

    // Icon (Randomize for fun)
    pageIcon.addEventListener('click', () => {
        const icons = ['📄', '📝', '💡', '📅', '✅', '🚀', '🎨', '📚'];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        pageIcon.textContent = randomIcon;
        storage.updatePage(activePageId, { icon: randomIcon });
        renderSidebar();
    });

    // Save/Load Buttons
    saveFileBtn.addEventListener('click', saveToFile);
    loadFileBtn.addEventListener('click', loadFromFile);
    fileInput.addEventListener('change', handleFileLoad);
}

// Run
init();
