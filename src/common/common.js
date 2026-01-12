export function addCss(id, src) {
    return new Promise((resolve, reject) => {
        if (!document.getElementById(id)) {
            const head = document.getElementsByTagName('head')[0];
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = src;
            link.media = 'all';
            link.onload = () => {
                resolve();
            };
            link.onerror = () => {
                reject();
            };
            head.appendChild(link);
        } else {
            return resolve();
        }
    });
}

export function addScript(id, src) {
    return new Promise((resolve, reject) => {

        if (!document.getElementById(id)) {
            const script = document.createElement('script');
            script.src = src;
            script.id = id;
            script.onload = () => {
                resolve();
            };
            script.onerror = () => {
                reject();
            };
            document.body.appendChild(script);
        } else {
            return resolve()
        }
    });
}

const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g;

export function cleanText(str) {
    return str.replace(/\u00A0/g, ' ').replace(INVISIBLE_RE, '');
}


export function getFileNameFromPath(filePath) {
    // 兼容 / 和 \
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
}

export function copyContext(str) {
    return new Promise((resolve, reject) => {
        navigator.clipboard.writeText(str).then(() => {
            console.log('Content copied to clipboard');
            /* Resolved - 文本被成功复制到剪贴板 */
            return resolve
        }, () => {
            console.error('Failed to copy');
            /* Rejected - 文本未被复制到剪贴板 */
            return reject
        });
    });
}


export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function waitForElement(doc, selector, timeout = 10000) {
    return new Promise(resolve => {
        const interval = 100;
        let elapsed = 0;
        const checker = setInterval(() => {
            if (doc.querySelector(selector) || elapsed >= timeout) {
                clearInterval(checker);
                resolve();
            }
            elapsed += interval;
        }, interval);
    });
}

export function init() {
    return Promise.all([
        addCss('layui_css', 'https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css'),
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
}

