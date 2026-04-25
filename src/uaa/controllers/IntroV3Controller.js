import { copyContext } from "../../common/common.js";
import { buildEpub } from "../buildEpub.js";
import { DatabaseService } from "../db/DatabaseService.js";
import { WorkerSingleton } from "../common/WorkerSingleton.js";
import {
    CHAPTER_TREE_ID,
    DEBUG_TABLE_ID,
    DOWNLOAD_INFO_WINDOW_DIV_ID,
    DOWNLOADER_INTERVAL,
    INFO_WINDOW_PROGRESS_FILTER
} from "../router/introV3Constants.js";
import { ChapterCatalogModel } from "../models/ChapterCatalogModel.js";
import { getOrCreatePageId, getPageLabel } from "../models/PageIdentity.js";
import { ChapterDownloadService } from "../services/ChapterDownloadService.js";
import { DebugTableView } from "../views/intro/DebugTableView.js";
import { DownloadInfoWindowView } from "../views/intro/DownloadInfoWindowView.js";
import { renderIntroFixbar } from "../views/intro/FixbarView.js";
import { InfoWindowView } from "../views/intro/InfoWindowView.js";
import { topLayerMsg } from "../views/intro/layerUtils.js";

export class IntroV3Controller {
    constructor() {
        this.db = new DatabaseService();
        this.worker = new WorkerSingleton();
        this.catalog = new ChapterCatalogModel();
        this.pageId = getOrCreatePageId();
        this.pageLabel = getPageLabel(this.pageId);

        this.handlingWorkerMessage = false;
        this.workerRunning = false;
        this.releaseAfterCurrentTask = false;

        this.downloadInfoWindow = new DownloadInfoWindowView(DOWNLOAD_INFO_WINDOW_DIV_ID);
        this.debugTable = new DebugTableView({
            db: this.db,
            tableId: DEBUG_TABLE_ID,
            onRowsDeleted: () => this.updateProgress()
        });
        this.infoWindow = new InfoWindowView({
            progressFilter: INFO_WINDOW_PROGRESS_FILTER,
            debugTableId: DEBUG_TABLE_ID,
            chapterTreeId: CHAPTER_TREE_ID,
            getChapterTreeData: () => this.catalog.getChapterListTree(),
            onChapterClick: (data) => this.addChaptersToDb(this.catalog.toChapterList([data])),
            onDownloadChecked: () => this.treeCheckedDownload(),
            onDownloadAll: () => this.downloadAll(),
            onResume: () => this.resumeDownload(),
            onRecoverStale: () => this.recoverStaleSystemState(),
            onReady: () => this.onInfoWindowReady()
        });
        this.downloadService = new ChapterDownloadService({
            downloadInfoWindow: this.downloadInfoWindow,
            infoWindow: this.infoWindow,
            downloaderInterval: DOWNLOADER_INTERVAL
        });

        this.worker.updateInterval(DOWNLOADER_INTERVAL);
        this.worker.handleCallBack = async () => {
            await this.consumeNextChapter();
        };
    }

    async init() {
        await this.db.getSystemInfo();
        this.bindPageLifecycle();
        this.renderFixbar();
    }

    renderFixbar() {
        renderIntroFixbar({
            '添加全部': () => {
                this.infoWindow.minimize();
                return this.downloadAll();
            },
            '复制书名': () => copyContext(this.catalog.getBookName()),
            '导出本书EPUB文件': () => buildEpub(document.location.href),
            '启动': () => this.startWorker(),
            '停止': () => this.stopWorker(),
            '恢复残留': () => this.recoverStaleSystemState(),
            '章节列表': () => this.openBookChapterListPage()
        });
    }

    async onInfoWindowReady() {
        await this.updateProgress();
        await this.updateSystemInfoPanel();
        this.debugTable.bindEvents();
        await this.debugTable.render();
    }

    async consumeNextChapter() {
        if (this.handlingWorkerMessage || !this.workerRunning) {
            return;
        }

        this.handlingWorkerMessage = true;
        try {
            const hasLease = await this.db.renewConsumerHeartbeat(this.pageId, this.pageLabel);
            await this.updateSystemInfoPanel();
            if (!hasLease) {
                await this.stopWorker(false, false);
                topLayerMsg("当前页面已失去下载控制权");
                return;
            }

            const systemInfo = await this.db.getSystemInfo();
            if (systemInfo.status === 2) {
                return;
            }

            const chapter = await this.db.claimNextChapterForDownload(this.pageId);
            if (!chapter) {
                await this.updateProgress();
                return;
            }
            await this.updateSystemInfoPanel();

            await this.downloadService.download(chapter, systemInfo.lastDownloadTime);
            const lastDownloadTime = Date.now();
            await this.db.markChapterDownloaded(chapter.id, this.pageId, lastDownloadTime);
            await this.updateProgress();
            await this.updateSystemInfoPanel();

            const stats = await this.db.getChapterStats();
            if (stats.pending === 0) {
                this.finishDownloadWindow();
                topLayerMsg('章节下载完毕', { icon: 1, shadeClose: true });
            }
        } catch (err) {
            await this.db.markDownloadError(this.pageId);
            await this.updateSystemInfoPanel();
            await this.stopWorker(false, false);
            this.infoWindow.minimize();
            this.downloadInfoWindow.restore();
            layui.layer.alert('出现错误：' + this.getErrorMessage(err), { icon: 5, shadeClose: true });
        } finally {
            if (this.releaseAfterCurrentTask) {
                await this.db.releaseConsumer(this.pageId);
                this.releaseAfterCurrentTask = false;
                await this.updateSystemInfoPanel();
            }
            this.handlingWorkerMessage = false;
        }
    }

    async treeCheckedDownload() {
        const checkedData = this.infoWindow.getCheckedChapters();
        if (checkedData.length === 0) {
            topLayerMsg("未选中任何数据");
            return;
        }
        await this.addChaptersToDb(this.catalog.toChapterList(checkedData));
    }

    async downloadAll() {
        await this.addChaptersToDb(this.catalog.toChapterList(this.catalog.getChapterListTree()));
    }

    async addChaptersToDb(chapters) {
        const validChapters = chapters.filter(data => data.href && data.href.trim().length > 0);
        const result = await this.db.addChaptersIfAbsent(validChapters);
        await this.updateProgress();
        topLayerMsg(`已加入 ${result.added} 章，重复 ${result.duplicated} 章`);
    }

    async clearPendingChapters() {
        await this.db.deletePendingChapters();
        this.infoWindow.reloadChapterTree();
        await this.updateProgress();
        topLayerMsg("未下载章节已清除");
    }

    async stopWorker(releaseConsumer = true, showMessage = true) {
        this.worker.stop();
        this.workerRunning = false;
        if (releaseConsumer && this.handlingWorkerMessage) {
            this.releaseAfterCurrentTask = true;
        } else if (releaseConsumer) {
            await this.db.releaseConsumer(this.pageId);
        }
        if (showMessage) {
            topLayerMsg(this.handlingWorkerMessage ? "当前章节完成后暂停" : "下载系统已暂停");
        }
    }

    async startWorker() {
        const result = await this.db.tryBecomeConsumer(this.pageId, this.pageLabel);
        if (!result.acquired) {
            topLayerMsg("已有其他页面正在下载，请在该页面继续");
            return false;
        }
        this.worker.start();
        this.workerRunning = true;
        this.releaseAfterCurrentTask = false;
        topLayerMsg("下载系统已启动");
        return true;
    }

    async resumeDownload() {
        const started = await this.startWorker();
        if (!started) {
            return;
        }
        await this.db.resetSystemInfoStatus(this.pageId);
        await this.updateProgress();
    }

    async recoverStaleSystemState() {
        const result = await this.db.recoverStaleSystemState();
        await this.updateProgress();
        await this.debugTable.render();

        if (result.recovered) {
            topLayerMsg("已清理过期的下载页残留");
            return;
        }

        if (result.reason === 'active_consumer') {
            topLayerMsg("当前没有可恢复的过期残留");
        }
    }

    async updateProgress() {
        const stats = await this.db.getChapterStats();
        const percent = stats.total === 0 ? '0%' : ((stats.downloaded / stats.total) * 100).toFixed(2) + '%';
        this.infoWindow.setProgress(percent);
        this.infoWindow.setIdleDownload(stats);
    }

    async updateSystemInfoPanel() {
        const systemInfo = await this.db.getSystemInfo();
        this.infoWindow.setSystemInfo(systemInfo);
    }

    finishDownloadWindow() {
        this.downloadInfoWindow.resetTitle();
        this.infoWindow.setCurrentDownload('下载结束');
        this.downloadInfoWindow.minimize();
    }

    async openBookChapterListPage() {
        this.infoWindow.ensure();
    }

    bindPageLifecycle() {
        window.addEventListener('beforeunload', () => {
            if (!this.workerRunning) {
                return;
            }
            this.worker.stop();
            this.workerRunning = false;
            this.db.releaseConsumer(this.pageId).catch(() => {
            });
        });
    }

    getErrorMessage(err) {
        if (err instanceof Error) {
            return err.message;
        }
        return String(err);
    }
}
