export function initCommand(doc = document) {
    GM_registerMenuCommand('在 missav.ai 中打开', (event) => {
        const a = doc.createElement('a');
        a.href = 'https://missav.ai/dm45/cn/' + doc.getSelection().toString().trim();
        a.target = '_blank';
        a.click();
    });
    GM_registerMenuCommand('在 jable.tv 中打开', (event) => {
        const a = doc.createElement('a');
        a.href = `https://jable.tv/videos/${doc.getSelection().toString().trim()}/?lang=jp`;
        a.target = '_blank';
        a.click();
    });
}