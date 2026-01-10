import {sleep} from "../../common/common.js";

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
            onCatch: (err) => {

            },
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
                this.config.onCatch(err);
                return;
            }

            // 任务间暂停
            if (this.queue.length > 0) await sleep(this.config.interval);
        }

        this.running = false;
        this.config.onFinish(this.downloaded, this.failed);
    }
}



export function destroyIframe(iframeId) {
    let iframe = document.getElementById(iframeId);
    if (iframe) {
        setTimeout(async () => {
            try {
                iframe.onload = null;
                iframe.onerror = null;
                // iframe.contentDocument.write("");
                // iframe.contentDocument.close();
                iframe.src = "about:blank";
                await new Promise(r => setTimeout(r, 0))
                iframe.remove();
                iframe = null;
            } catch (e) {
                console.error("清空 iframe 失败", e);
            }

            console.log("✅ iframe 已完全清理并销毁");
        }, 0); // 等待动画完成 0.5s
    }
}