export function getOrCreatePageId(storage = sessionStorage) {
    const storageKey = '__uaa_intro_v3_page_id__';
    let storedPageId = storage.getItem(storageKey);
    if (!storedPageId) {
        storedPageId = crypto.randomUUID();
        storage.setItem(storageKey, storedPageId);
    }
    return storedPageId;
}

export function getPageLabel(pageId, doc = document) {
    const bookName = doc.getElementsByClassName('info_box')[0]
        ?.getElementsByTagName('h1')[0]
        ?.innerText
        ?.trim() || '未知书籍';
    return `${bookName} [${pageId.slice(0, 8)}]`;
}

