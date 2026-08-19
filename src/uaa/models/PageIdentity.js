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
    const bookName = doc.getElementsByTagName('h1')[0]?.cloneNode(true);
    const spans = bookName?.getElementsByTagName('span');
    if (spans) {
        for (const span of spans) {
            span.remove();
        }
    }
    return `${bookName} [${pageId.slice(0, 8)}]`;
}

