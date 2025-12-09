/**
 * Storage Module
 * Handles saving and loading notes from localStorage
 */

const STORAGE_KEY = 'notion_clone_data';

// Initial data structure
const initialData = {
    pages: [
        {
            id: 'page-1',
            title: '시작하기',
            icon: '👋',
            content: [
                { type: 'text', text: '안녕하세요! 이것은 간단한 노션 클론입니다.' },
                { type: 'text', text: '왼쪽 사이드바에서 페이지를 추가하거나 선택하세요.' },
                { type: 'text', text: '텍스트를 클릭하여 편집할 수 있습니다.' }
            ],
            updatedAt: Date.now()
        }
    ],
    activePageId: 'page-1'
};

export function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialData;
}

export function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createPage() {
    const data = loadData();
    const newPage = {
        id: `page-${Date.now()}`,
        title: '',
        icon: '📄',
        content: [{ type: 'text', text: '' }],
        updatedAt: Date.now()
    };

    data.pages.push(newPage);
    data.activePageId = newPage.id;
    saveData(data);
    return newPage;
}

export function updatePage(pageId, updates) {
    const data = loadData();
    const pageIndex = data.pages.findIndex(p => p.id === pageId);

    if (pageIndex !== -1) {
        data.pages[pageIndex] = { ...data.pages[pageIndex], ...updates, updatedAt: Date.now() };
        saveData(data);
        return data.pages[pageIndex];
    }
    return null;
}

export function deletePage(pageId) {
    const data = loadData();
    data.pages = data.pages.filter(p => p.id !== pageId);

    if (data.activePageId === pageId) {
        data.activePageId = data.pages.length > 0 ? data.pages[0].id : null;
    }

    saveData(data);
    return data.activePageId;
}

export function getPage(pageId) {
    const data = loadData();
    return data.pages.find(p => p.id === pageId);
}
