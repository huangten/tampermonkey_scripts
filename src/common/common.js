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
        }
        return resolve();
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
        }
        return resolve()
    });
}

const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g;

export function cleanText(str) {
    return str.replace(/\u00A0/g, ' ').replace(INVISIBLE_RE, '');
}


