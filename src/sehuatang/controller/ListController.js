import {ListPageModel} from "../model/ListPageModel.js";
import {ListFixBarView} from "../view/ListFixBarView.js";
import {Downloader} from "../../common/downloader.js";
import {ListInfoWinView} from "../view/ListInfoWinView.js";
import {destroyIframeElementAsync, sleep, waitForElement} from "../../common/common.js";
import {getInfo} from "../common.js";
import {DetailPageModel} from "../model/DetailPageModel.js";

export class ListController {


    constructor({
                    model = new ListPageModel(document),
                    fixBarView = new ListFixBarView()
                } = {}) {
        this.doc = document;
        this.model = model;
        this.fixBarView = fixBarView;
        this.listInfoWinView = new ListInfoWinView();
        this.downloadScheduler = new Downloader();


        this.configureDownloadScheduler();
    }

    init() {
        this.fixBarView.renderFixbar({
            onAction: (type) => this.handleAction(type)
        });
    }

    async handleAction(type) {
        switch (type) {
            case "打开菜单面板":
                this.openInfoWindow();
                break;

        }
    }

    openInfoWindow() {
        this.listInfoWinView.openInfoWin({
            data: this.model.getTree(),
            downloadAll: () => this.downloadAll(),
            downloadChecked: (data) => this.downloadChecked(data),
            clearNotDownload: () => this.clearNotDownload(),
            downloadScheduler: this.downloadScheduler
        });
    }

    configureDownloadScheduler() {
        this.downloadScheduler.setConfig({
            interval: 500,
            onTaskBefore: (task) => {
                layui.layer.title(task.title, this.listInfoWinView.openBookListWindowIndex);
                this.doc.getElementById(this.listInfoWinView.downloadInfoContentId).href = task.href;
                this.doc.getElementById(this.listInfoWinView.downloadInfoContentId).innerText = task.title;
            },

            downloadHandler: async (task) => {
                const oldIframes =
                    this.doc.getElementById(this.listInfoWinView.downloadWindowDivIntroId).getElementsByTagName('iframe');
                for (let i = 0; i < oldIframes.length; i++) {
                    await destroyIframeElementAsync(oldIframes[i])
                }
                await sleep(500);
                // 创建 iframe
                const iframe = document.createElement("iframe");
                iframe.id = "_iframe_" + crypto.randomUUID();
                iframe.src = task.href;
                iframe.style.display = "block";
                iframe.style.border = "none";
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                this.doc.getElementById(this.listInfoWinView.downloadWindowDivIntroId).appendChild(iframe)
                // 等待页面加载
                await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);
                    iframe.onload = async () => {
                        try {
                            await waitForElement(iframe.contentDocument, '.plhin', 1000 * 25 * 60);
                            clearTimeout(timeout);
                            resolve();
                        } catch (err) {
                            clearTimeout(timeout);
                            reject(new Error("正文元素未找到"));
                        }
                    };
                });
                const detailPageModel = new DetailPageModel(iframe.contentDocument);
                await detailPageModel.getInfo();
                await destroyIframeElementAsync(iframe);
                return true;
            },
            onTaskComplete: (task, success) => {
                let percent = (
                    (
                        this.downloadScheduler.doneSet.size +
                        this.downloadScheduler.failedSet.size
                    )
                    /
                    (
                        this.downloadScheduler.doneSet.size +
                        this.downloadScheduler.failedSet.size +
                        this.downloadScheduler.pendingSet.size
                    )
                    *
                    100
                ).toFixed(2) + '%'
                layui.element.progress(this.listInfoWinView.progressId, percent);
                console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
            },
            onFinish: (downloaded, failed) => {
                console.log("下载结束 ✅");
                console.log("已下载:", downloaded.map(t => t));
                console.log("未下载:", failed.map(t => t));
                // ✅ 全部完成 — 销毁 iframe
                layui.layer.alert('下载完毕', {icon: 1, shadeClose: true});
            },
            onCatch: (err) => {
                layui.layer.alert('出现错误：' + err.message, {icon: 5, shadeClose: true});
            }
        });
    }

    async downloadAll() {
        this.model.getMenuArray(this.model.getTree()).forEach(d => this.downloadScheduler.add(d));
        await this.downloadScheduler.start();
    }

    async downloadChecked(data) {
        this.model.getMenuArray(data).forEach(d => this.downloadScheduler.add(d))
        await this.downloadScheduler.start();
    }

    clearNotDownload() {
        this.downloadScheduler.clear();
    }
}