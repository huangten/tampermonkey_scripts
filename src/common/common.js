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

export class Downloader {
    constructor() {
        if (Downloader.instance) return Downloader.instance;

        this.queue = [];                  // 待下载任务
        this.running = false;             // 下载器是否在执行
        this.downloaded = [];             // 已下载成功
        this.failed = [];                 // 下载失败
        this.config = {
            interval: 2000,               // 任务间间隔 ms
            onTaskComplete: () => {
            },     // 单任务完成回调
            onFinish: () => {
            },           // 全部任务完成回调
            downloadHandler: null         // 下载逻辑回调
        };

        Downloader.instance = this;
    }

    static getInstance() {
        if (!Downloader.instance) Downloader.instance = new Downloader();
        return Downloader.instance;
    }

    // 更新配置
    setConfig(options = {}) {
        this.config = {...this.config, ...options};
    }

    // 添加任务
    add(task) {
        this.queue.push(task);
    }

    // 清空队列
    clear() {
        this.queue = [];
    }

    // 启动下载
    async start() {
        if (this.running) return;
        if (typeof this.config.downloadHandler !== 'function') {
            throw new Error("请先通过 setConfig 设置 downloadHandler 回调");
        }

        this.running = true;

        while (this.queue.length > 0) {
            const task = this.queue.shift();

            try {
                const success = await this.config.downloadHandler(task);
                task.endTime = new Date();
                if (success) {
                    this.downloaded.push(task);
                } else {
                    this.failed.push(task);
                }

                this.config.onTaskComplete(task, success);

            } catch (err) {
                task.endTime = new Date();
                this.failed.push(task);
                this.config.onTaskComplete(task, false);
                this.running = false;
                alert(`下载失败: ${task.title}\n原因: ${err.message}`);
                return;
            }

            // 任务间暂停
            if (this.queue.length > 0) await sleep(this.config.interval);
        }

        this.running = false;
        this.config.onFinish(this.downloaded, this.failed);
    }
}

