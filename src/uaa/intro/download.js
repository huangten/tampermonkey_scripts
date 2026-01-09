import {sleep, waitForElement} from "../../common/common.js";
import {saveContentToLocal} from "../common.js";

export class Downloader {
    constructor() {
        if (Downloader.instance) return Downloader.instance;

        this.queue = [];                  // 待下载任务
        this.running = false;             // 下载器是否在执行
        this.downloaded = [];             // 已下载成功
        this.failed = [];


        // === 新增：去重索引 ===
        this.pendingSet = new Set();  // 未处理
        this.doneSet = new Set();     // 已成功
        this.failedSet = new Set();   // 已失败

        // 下载失败
        this.config = {
            interval: 2000,               // 任务间间隔 ms
            onTaskComplete: () => {
            },     // 单任务完成回调
            onFinish: () => {
            },           // 全部任务完成回调
            downloadHandler: null,      // 下载逻辑回调
            // === 新增策略 ===
            retryFailed: false,       // 是否允许失败任务再次 add
            uniqueKey: task => task?.href  // 去重字段提取器
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

        const key = this.config.uniqueKey(task);
        if (!key) return false;

        // 已在待处理队列
        if (this.pendingSet.has(key)) return false;

        // 已成功处理
        if (this.doneSet.has(key)) return false;

        // 已失败处理
        if (this.failedSet.has(key) && !this.config.retryFailed) return false;

        // 允许添加
        task.startTime = new Date();
        this.queue.push(task);
        this.pendingSet.add(key);
        return true;
    }

    // 清空队列
    clear() {
        this.queue = [];
        this.pendingSet.clear();
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

            const key = this.config.uniqueKey(task);

            try {
                const success = await this.config.downloadHandler(task);
                task.endTime = new Date();

                this.pendingSet.delete(key);

                if (success) {
                    this.downloaded.push(task);
                    this.doneSet.add(key);
                } else {
                    this.failed.push(task);
                    this.failedSet.add(key);
                }

                this.config.onTaskComplete(task, success);

            } catch (err) {
                task.endTime = new Date();
                this.pendingSet.delete(key);
                this.failed.push(task);
                this.failedSet.add(key);
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


export async function downloadChapterV2(task) {
    let iframeId = "__uaa_iframe__" + crypto.randomUUID();
    const iframe = ensureIframe(iframeId, task.href);
    updateIframeHeader(task.title);
    slideInIframe();


    // 等待页面加载
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);
        iframe.onload = async () => {
            try {
                await waitForElement(iframe.contentDocument, '.line', 1000 * 25 * 60);
                clearTimeout(timeout);
                resolve();
            } catch (err) {
                clearTimeout(timeout);
                reject(new Error("正文元素未找到"));
            }
        };
    });

    // 保存内容
    const el = iframe.contentDocument;
    const success = saveContentToLocal(el);
    await sleep(300);
    // 动画滑出 + 清空 iframe
    slideOutIframe(iframeId);
    return success;
}

function ensureIframe(iframeId, iframeUrl) {
    let containerId = "__uaa_iframe_container__";
    let container = document.getElementById(containerId);
    if (!container) {
        // 创建容器
        container = document.createElement("div");
        container.id = containerId;
        container.style.position = "fixed";
        container.style.top = "10%";
        container.style.left = "0";
        container.style.width = "70%";
        container.style.height = "80%";
        container.style.zIndex = "999999";
        container.style.transform = "translateX(-100%)";
        container.style.transition = "transform 0.5s ease";
        container.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
        container.style.background = "#fff";
        document.body.appendChild(container);

        // 创建标题栏
        const header = document.createElement("div");
        header.id = "__iframe_header__";
        header.style.width = "100%";
        header.style.height = "35px";
        header.style.lineHeight = "35px";
        header.style.background = "#ff5555";
        header.style.color = "#fff";
        header.style.fontWeight = "bold";
        header.style.textAlign = "center";
        header.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        header.innerText = "加载中...";
        container.appendChild(header);
    }

    // 创建 iframe
    const iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.src = iframeUrl;
    iframe.style.width = "100%";
    iframe.style.height = "calc(100% - 35px)";
    iframe.style.position = "fixed";
    iframe.style.zIndex = "999999";
    iframe.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
    iframe.style.border = " 2px solid #ff5555";
    iframe.style.background = "#fff";
    iframe.style.border = "none";
    container.appendChild(iframe);

    return document.getElementById(iframeId);
}

function slideInIframe() {
    const iframe = document.getElementById("__uaa_iframe_container__");
    iframe.style.transform = "translateX(0)";
}

function slideOutIframe(iframeId) {
    const container = document.getElementById("__uaa_iframe_container__");
    const iframe = document.getElementById(iframeId);
    if (!container || !iframe) return;

    // 滑出动画
    container.style.transform = "translateX(-100%)";

    destroyIframe(iframeId);
    // 动画结束后清空 iframe
    setTimeout(() => {
        try {
            if (iframe) {
                iframe.src = "about:blank";
                iframe.contentDocument.write("");
                iframe.contentDocument.close();
                console.log("✅ iframe 已清空为白页");
                iframe.remove();
            }
        } catch (e) {
            console.error("清空 iframe 失败", e);
        }
    }, 100); // 等待动画完成 0.5s
}

function updateIframeHeader(title) {
    const header = document.getElementById("__iframe_header__");
    if (header) {
        header.innerText = title || "加载中...";
    }
}

function destroyIframe(iframeId) {
    let iframe = document.getElementById(iframeId);
    if (iframe) {
        setTimeout(async () => {
            try {
                iframe.onload = null;
                iframe.onerror = null;
                iframe.contentDocument.write("");
                iframe.contentDocument.close();
                iframe.src = "about:blank";
                await new Promise(r => setTimeout(r, 0))
                iframe.remove();
                iframe = null;
            } catch (e) {
                console.error("清空 iframe 失败", e);
            }

            console.log("✅ iframe 已完全清理并销毁");
        }, 100); // 等待动画完成 0.5s
    }
}