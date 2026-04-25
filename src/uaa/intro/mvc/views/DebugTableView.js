import { topLayerConfirm, topLayerMsg } from "./layerUtils.js";

export class DebugTableView {
    constructor({ db, tableId, onRowsDeleted }) {
        this.db = db;
        this.tableId = tableId;
        this.tableMode = 'chapters';
        this.onRowsDeleted = onRowsDeleted;
    }

    bindEvents() {
        const chaptersBtn = document.getElementById('debugLoadChaptersBtn');
        const refreshBtn = document.getElementById('debugRefreshBtn');
        const deleteBtn = document.getElementById('debugDeleteRowsBtn');
        const deleteDownloadedBtn = document.getElementById('debugDeleteDownloadedChaptersBtn');

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
    }

    async render() {
        if (!document.getElementById(this.tableId)) {
            return;
        }
        const rows = await this.db.getDebugRows('chapters');

        layui.table.render({
            elem: '#' + this.tableId,
            id: this.tableId,
            data: rows,
            lineStyle: null,
            loading: true,
            skin: 'row',
            // height: '#chapterTabId',
            page: true,
            limit: 10,
            limits: [10, 20, 50, 100],
            even: true,
            cols: this.getChapterCols()
        });
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
}
