import { Downloader } from "../../common/downloader.js";
import { buildEpub } from "../buildEpub.js";
import { DatabaseService } from "../db/DatabaseService.js";
import { ChapterCatalogModel } from "../models/ChapterCatalogModel.js";
import { BookListModel } from "../models/BookListModel.js";
import { BookListWindowView } from "../views/list/BookListWindowView.js";

export class ListV2Controller {
    constructor({
        model = new BookListModel(),
        view = new BookListWindowView(),
        db = new DatabaseService(),
        openNewWindowScheduler = new Downloader(),
        exportEpubScheduler = new Downloader()
    } = {}) {
        this.model = model;
        this.view = view;
        this.db = db;
        this.openNewWindowScheduler = openNewWindowScheduler;
        this.exportEpubScheduler = exportEpubScheduler;
        this.currentOpenRun = {
            total: 0,
            completed: 0
        };
        this.currentExportRun = {
            total: 0,
            completed: 0,
            added: 0,
            duplicated: 0,
            chapterDbProcessed: 0
        };

        this.configureOpenNewWindowScheduler();
        this.configureExportEpubScheduler();
    }

    init() {
        this.view.renderFixbar({
            onOpenBookList: () => this.openBookListWindow()
        });
    }

    openBookListWindow() {
        return this.view.openBookListWindow({
            data: this.model.getBookTree(),
            onSelectRange: (type) => this.selectRange(type),
            onOpenSelected: () => this.openSelectedBooks(),
            onExportSelected: () => this.exportSelectedBooks(),
            onExportAndAddChapters: () => this.exportSelectedBooks({ addChaptersToDb: true }),
            onClearSelected: () => this.clearSelected(),
            onBookClick: (book) => this.toggleBook(book)
        });
    }

    selectRange(type) {
        const data = this.model.applySelection(type, this.view.getCheckedBookIds());
        this.view.reloadBookTree(data);
    }

    toggleBook(book) {
        const data = this.model.toggleBook(book, this.view.getCheckedBookIds());
        this.view.reloadBookTree(data);
    }

    async openSelectedBooks() {
        if (this.openNewWindowScheduler.running) {
            this.view.msg("正在打开中，请等待打开完后再继续");
            return;
        }

        const checkedBooks = this.view.getCheckedBooks();
        if (checkedBooks.length === 0) {
            this.view.msg("未选中任何书籍");
            return;
        }

        this.resetOpenScheduler(checkedBooks.length);
        this.view.resetOpenProgress();
        checkedBooks.forEach(book => {
            this.openNewWindowScheduler.add(book);
        });
        await this.openNewWindowScheduler.start();
    }

    async exportSelectedBooks(options = {}) {
        if (this.exportEpubScheduler.running) {
            this.view.msg("正在导出中，请等待导出完后再继续");
            return;
        }

        const checkedBooks = this.view.getCheckedBooks();
        if (checkedBooks.length === 0) {
            this.view.msg("未选中任何书籍");
            return;
        }

        checkedBooks.reverse();
        this.resetExportScheduler(checkedBooks.length);
        this.view.resetExportProgress();
        if (options.addChaptersToDb) {
            this.view.resetChapterDbHistory('等待章节入库');
        } else {
            this.view.setChapterDbInfo('本次未启用章节入库');
        }
        checkedBooks.forEach(book => {
            this.exportEpubScheduler.add({
                ...book,
                addChaptersToDb: options.addChaptersToDb === true
            });
        });
        await this.exportEpubScheduler.start();
    }

    clearSelected() {
        this.view.reloadBookTree(this.model.getBookTree());
        this.view.resetOpenProgress();
        this.view.resetExportProgress();
        this.view.resetChapterDbHistory('暂无入库');
        this.openNewWindowScheduler.clear();
        this.exportEpubScheduler.clear();
    }

    configureOpenNewWindowScheduler() {
        this.openNewWindowScheduler.setConfig({
            interval: 2000,
            downloadHandler: (task) => {
                GM_openInTab(task.href, { active: false });
                return true;
            },
            onTaskBefore: (task) => {
                this.view.setOpenInfo('书籍: ' + task.title + ' 开始打开。。。', task.href);
            },
            onTaskComplete: (task, success) => {
                this.currentOpenRun.completed++;
                this.view.setOpenProgress(this.getOpenProgressPercent());
                this.view.setOpenInfo('书籍: ' + task.title + (success ? ' 打开完毕' : ' 打开失败'), task.href);
                console.log(`${task.title} 打开 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
            },
            onFinish: async () => {
                console.log("打开结束 ✅");
                this.view.setOpenInfo('书籍打开完毕', 'javascript:void(0);');
            },
            onCatch: async (err) => {
                this.view.alert('出现错误：' + err.message, { icon: 5, shadeClose: true });
            }
        });
    }

    resetOpenScheduler(total) {
        this.openNewWindowScheduler = new Downloader();
        this.currentOpenRun = {
            total,
            completed: 0
        };
        this.configureOpenNewWindowScheduler();
    }

    configureExportEpubScheduler() {
        this.exportEpubScheduler.setConfig({
            interval: 2000,
            onTaskBefore: (task) => {
                const actionName = task.addChaptersToDb ? '开始导出并入库。。。' : '开始导出。。。';
                this.view.setExportInfo('书籍: ' + task.title + ' ' + actionName, task.href);
            },
            downloadHandler: async (task) => {
                await buildEpub(task.href, {
                    onIntroParsed: async ({ url, doc }) => {
                        if (!task.addChaptersToDb) {
                            return;
                        }
                        await this.addBookChaptersToDb(task, doc, url);
                    }
                });
                return true;
            },
            onTaskComplete: (task, success) => {
                this.currentExportRun.completed++;
                this.view.setExportProgress(this.getExportProgressPercent());
                this.view.setExportInfo('书籍: ' + task.title + (success ? ' 导出成功' : ' 导出失败'), task.href);
                console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
            },
            onFinish: async () => {
                this.view.setExportInfo('书籍导出完毕', 'javascript:void(0);');
                if (this.currentExportRun.added > 0 || this.currentExportRun.duplicated > 0) {
                    const totalChapters = this.currentExportRun.added + this.currentExportRun.duplicated;
                    this.view.setChapterDbInfo(
                        `章节入库完毕：共计 ${totalChapters} 章，新增 ${this.currentExportRun.added} 章，共计重复 ${this.currentExportRun.duplicated} 章`,
                        'javascript:void(0);'
                    );
                }
                console.log("打开结束 ✅");
                this.view.minimizeBookListWindow();
                this.view.msg('书籍导出完毕', { icon: 1, shadeClose: true });
            },
            onCatch: async (err) => {
                this.view.alert('导出失败：' + err.message, { icon: 5, shadeClose: true });
            }
        });
    }

    resetExportScheduler(total) {
        this.exportEpubScheduler = new Downloader();
        this.currentExportRun = {
            total,
            completed: 0,
            added: 0,
            duplicated: 0,
            chapterDbProcessed: 0
        };
        this.configureExportEpubScheduler();
    }

    async addBookChaptersToDb(task, doc, url) {
        const catalog = new ChapterCatalogModel(doc, { href: url });
        const chapters = catalog
            .toChapterList(catalog.getChapterListTree())
            .filter(chapter => chapter.href && chapter.href.trim().length > 0);

        const result = await this.db.addChaptersIfAbsent(chapters);
        this.currentExportRun.added += result.added;
        this.currentExportRun.duplicated += result.duplicated;
        this.currentExportRun.chapterDbProcessed++;

        this.view.appendChapterDbHistory({
            index: this.currentExportRun.chapterDbProcessed,
            title: task.title,
            href: task.href,
            added: result.added,
            duplicated: result.duplicated
        });
        this.view.setChapterDbSummary({
            processed: this.currentExportRun.chapterDbProcessed,
            totalBooks: this.currentExportRun.total,
            added: this.currentExportRun.added,
            duplicated: this.currentExportRun.duplicated
        });
        console.log(
            `${task.title} 章节入库完成，新增 ${result.added} 章，重复 ${result.duplicated} 章，共 ${result.added + result.duplicated} 章`,
            task.href
        );
    }

    getExportProgressPercent() {
        if (this.currentExportRun.total === 0) {
            return '0%';
        }
        return (this.currentExportRun.completed / this.currentExportRun.total * 100).toFixed(2) + '%';
    }

    getOpenProgressPercent() {
        if (this.currentOpenRun.total === 0) {
            return '0%';
        }
        return (this.currentOpenRun.completed / this.currentOpenRun.total * 100).toFixed(2) + '%';
    }
}
