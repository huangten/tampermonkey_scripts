export class DebugTableView {
    constructor({ db, tableId, onRowsDeleted }) {
        this.db = db;
        this.tableId = tableId;
        this.tableMode = 'chapters';
        this.onRowsDeleted = onRowsDeleted;
    }

    bindEvents() {
        const systemBtn = document.getElementById('debugLoadSystemInfosBtn');
        const chaptersBtn = document.getElementById('debugLoadChaptersBtn');
        const refreshBtn = document.getElementById('debugRefreshBtn');
        const deleteBtn = document.getElementById('debugDeleteRowsBtn');

        if (systemBtn && !systemBtn.dataset.bound) {
            systemBtn.dataset.bound = '1';
            systemBtn.addEventListener('click', () => {
                this.tableMode = 'system_infos';
                this.render().then();
            });
        }
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
    }

    async render() {
        if (!document.getElementById(this.tableId)) {
            return;
        }
        const rows = await this.db.getDebugRows(this.tableMode);
        const cols = this.tableMode === 'system_infos'
            ? this.getSystemInfoCols()
            : this.getChapterCols();

        layui.table.render({
            elem: '#' + this.tableId,
            id: this.tableId,
            data: rows,
            height: 420,
            page: true,
            limit: 20,
            limits: [20, 50, 100],
            even: true,
            cols
        });
    }

    async deleteSelectedRows() {
        const checked = layui.table.checkStatus(this.tableId).data;
        if (!checked || checked.length === 0) {
            layui.layer.msg('未选中任何数据');
            return;
        }
        const deleted = await this.db.deleteDebugRows(this.tableMode, checked.map(item => item.id));
        await this.onRowsDeleted?.();
        await this.render();
        layui.layer.msg(`已删除 ${deleted} 条 ${this.tableMode} 数据`);
    }

    getSystemInfoCols() {
        return [[
            { type: 'checkbox', fixed: 'left' },
            { field: 'id', title: 'ID', width: 70, sort: true },
            { field: 'status', title: '状态', width: 80 },
            { field: 'consumerPageLabel', title: '消费页', minWidth: 180 },
            { field: 'consumerPageId', title: '消费页ID', minWidth: 220 },
            { field: 'consumerHeartbeat', title: '心跳', minWidth: 180, templet: d => this.formatTime(d.consumerHeartbeat) },
            { field: 'currentChapterId', title: '当前章节ID', width: 110 },
            { field: 'currentChapterHref', title: '当前章节地址', minWidth: 240 },
            { field: 'currentBookName', title: '当前书名', minWidth: 160 },
            { field: 'lastDownloadTime', title: '最后下载', minWidth: 180, templet: d => this.formatTime(d.lastDownloadTime) },
            { field: 'updateTime', title: '更新时间', minWidth: 180, templet: d => this.formatTime(d.updateTime) }
        ]];
    }

    getChapterCols() {
        return [[
            { type: 'checkbox', fixed: 'left' },
            { field: 'id', title: 'ID', width: 70, sort: true },
            { field: 'status', title: '状态', width: 80 },
            { field: 'bookName', title: '书名', minWidth: 160 },
            { field: 'volumeName', title: '卷名', minWidth: 140 },
            { field: 'chapterName', title: '章节名', minWidth: 220 },
            { field: 'href', title: '地址', minWidth: 260 },
            { field: 'chapterId', title: '章节ID', width: 110 },
            { field: 'bookId', title: '书ID', width: 110 },
            { field: 'createTime', title: '创建时间', minWidth: 180, templet: d => this.formatTime(d.createTime) },
            { field: 'updateTime', title: '更新时间', minWidth: 180, templet: d => this.formatTime(d.updateTime) }
        ]];
    }

    formatTime(timestamp) {
        if (!timestamp) {
            return '';
        }
        return new Date(timestamp).toLocaleString();
    }
}

