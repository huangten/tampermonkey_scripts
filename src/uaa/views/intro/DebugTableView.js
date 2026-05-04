import { saveAs } from "file-saver";
import { topLayerConfirm, topLayerMsg } from "./layerUtils.js";

export class DebugTableView {
    constructor({ db, tableId, onRowsDeleted }) {
        this.db = db;
        this.tableId = tableId;
        this.tableMode = 'chapters';
        this.onRowsDeleted = onRowsDeleted;
        this.pageLimits = [10, 20, 50, 100];
        this.pageState = {
            curr: 1,
            limit: this.pageLimits[0]
        };
    }

    bindEvents() {
        const chaptersBtn = document.getElementById('debugLoadChaptersBtn');
        const refreshBtn = document.getElementById('debugRefreshBtn');
        const exportChaptersBtn = document.getElementById('debugExportChaptersBtn');
        const exportChaptersJsonBtn = document.getElementById('debugExportChaptersJsonBtn');
        const importChaptersJsonBtn = document.getElementById('debugImportChaptersJsonBtn');
        const deleteBtn = document.getElementById('debugDeleteRowsBtn');
        const deleteDownloadedBtn = document.getElementById('debugDeleteDownloadedChaptersBtn');
        const deletePendingByBookIdBtn = document.getElementById('debugDeletePendingByBookIdBtn');
        const deleteByBookIdBtn = document.getElementById('debugDeleteByBookIdBtn');

        if (chaptersBtn && !chaptersBtn.dataset.bound) {
            chaptersBtn.dataset.bound = '1';
            chaptersBtn.addEventListener('click', () => {
                this.tableMode = 'chapters';
                this.render().then();
            });
        }
        if (refreshBtn && !refreshBtn.dataset.bound) {
            refreshBtn.dataset.bound = '1';
            refreshBtn.addEventListener('click', () => {
                this.render().then();
            });
        }
        if (exportChaptersBtn && !exportChaptersBtn.dataset.bound) {
            exportChaptersBtn.dataset.bound = '1';
            exportChaptersBtn.addEventListener('click', () => {
                this.exportChapters().then();
            });
        }
        if (exportChaptersJsonBtn && !exportChaptersJsonBtn.dataset.bound) {
            exportChaptersJsonBtn.dataset.bound = '1';
            exportChaptersJsonBtn.addEventListener('click', () => {
                this.exportChaptersJson().then();
            });
        }
        if (importChaptersJsonBtn && !importChaptersJsonBtn.dataset.bound) {
            importChaptersJsonBtn.dataset.bound = '1';
            importChaptersJsonBtn.addEventListener('click', () => {
                this.importChaptersJson().then();
            });
        }
        if (deleteBtn && !deleteBtn.dataset.bound) {
            deleteBtn.dataset.bound = '1';
            deleteBtn.addEventListener('click', () => {
                this.deleteSelectedRows().then();
            });
        }
        if (deleteDownloadedBtn && !deleteDownloadedBtn.dataset.bound) {
            deleteDownloadedBtn.dataset.bound = '1';
            deleteDownloadedBtn.addEventListener('click', () => {
                this.deleteDownloadedChapters().then();
            });
        }
        if (deletePendingByBookIdBtn && !deletePendingByBookIdBtn.dataset.bound) {
            deletePendingByBookIdBtn.dataset.bound = '1';
            deletePendingByBookIdBtn.addEventListener('click', () => {
                this.deletePendingChaptersByBookId().then();
            });
        }
        if (deleteByBookIdBtn && !deleteByBookIdBtn.dataset.bound) {
            deleteByBookIdBtn.dataset.bound = '1';
            deleteByBookIdBtn.addEventListener('click', () => {
                this.deleteChaptersByBookId().then();
            });
        }
    }

    async render() {
        if (!document.getElementById(this.tableId)) {
            return;
        }
        const total = await this.db.countDebugRows(this.tableMode);
        const pageConfig = this.getPageConfig(total);
        const rows = await this.db.getDebugRows(this.tableMode, pageConfig.curr, pageConfig.limit);

        layui.table.render({
            elem: '#' + this.tableId,
            id: this.tableId,
            data: rows,
            lineStyle: null,
            loading: true,
            skin: 'row',
            // height: '#chapterTabId',
            page: false,
            limit: pageConfig.limit,
            even: true,
            cols: this.getChapterCols()
        });

        this.renderPager(pageConfig);
    }

    getPageConfig(total) {
        const pageLimit = Number(this.pageState.limit);
        const limit = this.pageLimits.includes(pageLimit) ? pageLimit : this.pageLimits[0];
        const pages = Math.max(1, Math.ceil(total / limit));
        const pageCurr = Math.max(Number(this.pageState.curr) || 1, 1);
        const curr = Math.min(pageCurr, pages);

        this.pageState.curr = curr;
        this.pageState.limit = limit;
        return {
            curr,
            limit,
            limits: this.pageLimits,
            count: total
        };
    }

    renderPager(pageConfig) {
        const pager = this.ensurePagerContainer();
        if (!pager) {
            return;
        }

        layui.laypage.render({
            elem: pager,
            count: pageConfig.count,
            curr: pageConfig.curr,
            limit: pageConfig.limit,
            limits: pageConfig.limits,
            layout: ['count', 'prev', 'page', 'next', 'limit', 'skip'],
            jump: (obj, first) => {
                this.pageState.curr = obj.curr;
                this.pageState.limit = obj.limit;
                if (!first) {
                    this.render().then();
                }
            }
        });
    }

    ensurePagerContainer() {
        const pagerId = `${this.tableId}Pager`;
        let pager = document.getElementById(pagerId);
        if (pager) {
            return pager;
        }

        const table = document.getElementById(this.tableId);
        if (!table?.parentElement) {
            return null;
        }

        pager = document.createElement('div');
        pager.id = pagerId;
        pager.style.marginTop = '8px';
        table.parentElement.appendChild(pager);
        return pager;
    }

    async deleteSelectedRows() {
        const checked = layui.table.checkStatus(this.tableId).data;
        if (!checked || checked.length === 0) {
            topLayerMsg('未选中任何数据');
            return;
        }
        const deleted = await this.db.deleteDebugRows(this.tableMode, checked.map(item => item.id));
        await this.onRowsDeleted?.();
        await this.render();
        topLayerMsg(`已删除 ${deleted} 条 chapters 数据`);
    }

    async exportChapters() {
        const rows = await this.db.getDebugRows('chapters');
        if (!rows || rows.length === 0) {
            topLayerMsg('chapters 表暂无数据可导出');
            return;
        }

        try {
            const sql = this.buildChaptersInsertSql(rows);
            const blob = new Blob([sql], { type: "application/sql;charset=utf-8" });
            saveAs(blob, this.getChaptersExportFileName());
            topLayerMsg(`已导出 ${rows.length} 条 chapters 数据`);
        } catch (e) {
            console.error('导出 chapters 数据失败', e);
            topLayerMsg('导出 chapters 数据失败');
        }
    }

    async exportChaptersJson() {
        const rows = await this.db.getDebugRows('chapters');
        if (!rows || rows.length === 0) {
            topLayerMsg('chapters 表暂无数据可导出');
            return;
        }

        try {
            const json = JSON.stringify(rows, null, 2);
            const blob = new Blob([json], { type: "application/json;charset=utf-8" });
            saveAs(blob, this.getChaptersJsonExportFileName());
            topLayerMsg(`已导出 ${rows.length} 条 chapters JSON 数据`);
        } catch (e) {
            console.error('导出 chapters JSON 数据失败', e);
            topLayerMsg('导出 chapters JSON 数据失败');
        }
    }

    async importChaptersJson() {
        const file = await this.pickJsonFile();
        if (!file) {
            return;
        }

        try {
            const text = await this.readFileText(file);
            const rows = this.parseChaptersJson(text);
            if (!rows || rows.length === 0) {
                topLayerMsg('未读取到可导入的 chapters 数据');
                return;
            }

            const confirmed = await this.confirm(`确定导入 ${rows.length} 条 chapters JSON 数据吗？导入时会忽略 id，已存在章节只按需更新状态。`);
            if (!confirmed) {
                return;
            }

            const result = await this.db.importChapters(rows);
            this.tableMode = 'chapters';
            await this.onRowsDeleted?.();
            await this.render();
            topLayerMsg(`导入完成：新增 ${result.added}，更新状态 ${result.updated}，跳过 ${result.skipped}，无效 ${result.invalid}`);
        } catch (e) {
            console.error('导入 chapters JSON 数据失败', e);
            topLayerMsg('导入 chapters JSON 数据失败：' + this.getErrorMessage(e));
        }
    }

    parseChaptersJson(text) {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
            return json;
        }
        if (Array.isArray(json?.chapters)) {
            return json.chapters;
        }
        return null;
    }

    pickJsonFile() {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,application/json';
            input.style.display = 'none';

            let resolved = false;
            const finish = file => {
                if (resolved) {
                    return;
                }
                resolved = true;
                window.removeEventListener('focus', onFocus);
                input.remove();
                resolve(file);
            };
            const onFocus = () => {
                setTimeout(() => {
                    if (!input.files || input.files.length === 0) {
                        finish(null);
                    }
                }, 300);
            };

            input.addEventListener('change', () => {
                finish(input.files?.[0] ?? null);
            }, { once: true });
            window.addEventListener('focus', onFocus, { once: true });
            document.body.appendChild(input);
            input.click();
        });
    }

    readFileText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    buildChaptersInsertSql(rows) {
        const columns = [
            'id',
            'chapterId',
            'bookId',
            'status',
            'href',
            'chapterName',
            'bookName',
            'volumeName',
            'createTime',
            'updateTime'
        ];
        const columnSql = columns.join(', ');

        return rows.map(row => {
            const valueSql = columns.map(column => this.toSqlValue(row[column])).join(', ');
            return `INSERT INTO chapters (${columnSql}) VALUES (${valueSql});`;
        }).join('\n') + '\n';
    }

    toSqlValue(value) {
        if (value === null || typeof value === 'undefined') {
            return 'NULL';
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return String(value);
        }
        if (typeof value === 'boolean') {
            return value ? '1' : '0';
        }
        return `'${String(value).replace(/'/g, "''")}'`;
    }

    getChaptersExportFileName() {
        const now = new Date();
        const pad = value => String(value).padStart(2, '0');
        const date = [
            now.getFullYear(),
            pad(now.getMonth() + 1),
            pad(now.getDate())
        ].join('');
        const time = [
            pad(now.getHours()),
            pad(now.getMinutes()),
            pad(now.getSeconds())
        ].join('');
        return `chapters_${date}_${time}.sql`;
    }

    getChaptersJsonExportFileName() {
        const now = new Date();
        const pad = value => String(value).padStart(2, '0');
        const date = [
            now.getFullYear(),
            pad(now.getMonth() + 1),
            pad(now.getDate())
        ].join('');
        const time = [
            pad(now.getHours()),
            pad(now.getMinutes()),
            pad(now.getSeconds())
        ].join('');
        return `chapters_${date}_${time}.json`;
    }

    async deleteDownloadedChapters() {
        const confirmed = await this.confirm('确定删除所有已下载章节记录吗？');
        if (!confirmed) {
            return;
        }
        const deleted = await this.db.deleteDownloadedChapters();
        this.tableMode = 'chapters';
        await this.onRowsDeleted?.();
        await this.render();
        topLayerMsg(`已删除 ${deleted} 条已下载章节记录`);
    }

    async deletePendingChaptersByBookId() {
        const bookId = await this.promptBookId();
        if (bookId === null) {
            return;
        }
        if (!bookId) {
            topLayerMsg('bookId 不能为空');
            return;
        }

        const confirmed = await this.confirm(`确定删除 bookId=${bookId} 的未下载章节记录吗？`);
        if (!confirmed) {
            return;
        }

        const deleted = await this.db.deletePendingChaptersByBookId(bookId);
        this.tableMode = 'chapters';
        await this.onRowsDeleted?.();
        await this.render();
        topLayerMsg(`已删除 bookId=${bookId} 的 ${deleted} 条未下载章节记录`);
    }

    async deleteChaptersByBookId() {
        const bookId = await this.promptBookId();
        if (bookId === null) {
            return;
        }
        if (!bookId) {
            topLayerMsg('bookId 不能为空');
            return;
        }

        const confirmed = await this.confirm(`确定删除 bookId=${bookId} 的所有章节记录吗？已下载章节也会删除。`);
        if (!confirmed) {
            return;
        }

        const deleted = await this.db.deleteChaptersByBookId(bookId);
        this.tableMode = 'chapters';
        await this.onRowsDeleted?.();
        await this.render();
        topLayerMsg(`已删除 bookId=${bookId} 的 ${deleted} 条章节记录`);
    }

    getChapterCols() {
        return [[
            { type: 'checkbox'},
            { field: 'id', title: 'ID', width: 70, sort: true },
            { field: 'status', title: '状态', width: 80, templet: d => {
                    if (d.status === 0) {
                        return '<span style="color: #FF5722;">待下载</span>';
                    } else if (d.status === 1) {
                        return '<span style="color: #4CAF50;">已下载</span>';
                    } else {
                        return d.status;
                    }
                }
            },
            { field: 'bookName', title: '书名', minwidth: 80 },
            { field: 'volumeName', title: '卷名', minwidth: 70 },
            { field: 'chapterName', title: '章节名', minwidth: 70 },
            { field: 'href', title: '地址', minwidth: 70 },
            { field: 'chapterId', title: '章节ID', minwidth: 70 },
            { field: 'bookId', title: '书ID', minwidth: 70 },
            { field: 'createTime', title: '创建时间', minwidth: 70, templet: d => this.formatTime(d.createTime) },
            { field: 'updateTime', title: '更新时间', minwidth: 70, templet: d => this.formatTime(d.updateTime) }
        ]];
    }

    formatTime(timestamp) {
        if (!timestamp) {
            return '';
        }
        return new Date(timestamp).toLocaleString();
    }

    confirm(message) {
        return new Promise(resolve => {
            topLayerConfirm(message, index => {
                layui.layer.close(index);
                resolve(true);
            }, index => {
                layui.layer.close(index);
                resolve(false);
            });
        });
    }

    promptBookId() {
        return new Promise(resolve => {
            let resolved = false;
            const finish = value => {
                if (resolved) {
                    return;
                }
                resolved = true;
                resolve(value);
            };

            layui.layer.prompt({
                title: '请输入 bookId',
                zIndex: layui.layer.zIndex,
                formType: 0,
                success(layero) {
                    layui.layer.setTop(layero);
                },
                cancel(index) {
                    layui.layer.close(index);
                    finish(null);
                },
                end() {
                    finish(null);
                }
            }, (value, index) => {
                layui.layer.close(index);
                finish(String(value ?? '').trim());
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
