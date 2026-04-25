export class BookListWindowView {
    constructor() {
        this.openBookListWindowIndex = 0;
        this.treeId = 'bookListTree';
        this.treeElem = '#bookListWindowDiv';
        this.openProgressFilter = 'openNewWindowProgress';
        this.progressFilter = 'exportProgress';
    }

    renderFixbar({ onOpenBookList }) {
        layui.use(() => {
            layui.util.fixbar({
                bars: [{
                    type: '本页书籍单',
                    icon: 'layui-icon-list'
                }],
                default: false,
                bgcolor: '#ff5722',
                css: { bottom: "15%", right: 0 },
                margin: 0,
                click: (type) => {
                    if (type === "本页书籍单") {
                        onOpenBookList();
                    }
                }
            });
        });
    }

    openBookListWindow(options) {
        if (this.openBookListWindowIndex !== 0) {
            return this.openBookListWindowIndex;
        }

        this.openBookListWindowIndex = layui.layer.tab({
            type: 1,
            shadeClose: false,
            closeBtn: false,
            shade: 0,
            area: ['60%', '80%'],
            moveOut: true,
            maxmin: true,
            tab: [
                {
                    title: '书籍列表',
                    content: this.getBookListTabContent()
                },
                {
                    title: '导出和打开新窗口信息',
                    content: this.getTaskInfoTabContent()
                }
            ],
            btn: ['全选', '1-12', '13-24', '25-36', '37-49', '打开选中书籍', '导出EPUB', '导出EPUB+入库', '清除选中'],
            btn1: () => this.handleSelectRange(options, '全选'),
            btn2: () => this.handleSelectRange(options, '1-12'),
            btn3: () => this.handleSelectRange(options, '13-24'),
            btn4: () => this.handleSelectRange(options, '25-36'),
            btn5: () => this.handleSelectRange(options, '37-49'),
            btn6: () => {
                options.onOpenSelected();
                return false;
            },
            btn7: () => {
                options.onExportSelected();
                return false;
            },
            btn8: () => {
                options.onExportAndAddChapters();
                return false;
            },
            btn9: () => {
                options.onClearSelected();
                return false;
            },
            success: () => {
                layui.form.render('checkbox', 'form-demo-skin');
                this.resetOpenProgress();
                this.resetExportProgress();
                this.renderBookTree(options.data, options.onBookClick);
            }
        });

        return this.openBookListWindowIndex;
    }

    renderBookTree(data, onBookClick) {
        layui.tree.render({
            elem: this.treeElem,
            data,
            showCheckbox: true,
            onlyIconControl: true,
            id: this.treeId,
            isJump: false,
            click: (obj) => {
                onBookClick(obj.data);
            }
        });
    }

    reloadBookTree(data) {
        layui.tree.reload(this.treeId, { data });
    }

    getCheckedBooks() {
        return layui.tree.getChecked(this.treeId);
    }

    getCheckedBookIds() {
        return this.getCheckedBooks().map(book => book.id);
    }

    setOpenInfo(text, href = '') {
        this.setAnchorText('openNewWindowInfo', text, href);
    }

    setOpenProgress(percent) {
        layui.element.progress(this.openProgressFilter, percent);
    }

    resetOpenProgress() {
        layui.element.render('progress', this.openProgressFilter);
        this.setOpenProgress('0%');
    }

    setExportInfo(text, href = '') {
        this.setAnchorText('exportInfoContentId', text, href);
    }

    setChapterDbInfo(text, href = '') {
        this.setAnchorText('chapterDbInfoContentId', text, href);
    }

    resetChapterDbHistory(text = '暂无入库') {
        this.setChapterDbInfo(text);
        const body = document.getElementById('chapterDbHistoryBodyId');
        if (body) {
            body.innerHTML = '';
        }
    }

    setChapterDbSummary({ processed = 0, totalBooks = 0, added = 0, duplicated = 0 } = {}) {
        const totalChapters = added + duplicated;
        this.setChapterDbInfo(
            `章节入库：${processed}/${totalBooks} 本，共计 ${totalChapters} 章，新增 ${added} 章，重复 ${duplicated} 章`,
            'javascript:void(0);'
        );
    }

    appendChapterDbHistory({ index, title, href = '', added = 0, duplicated = 0 } = {}) {
        const body = document.getElementById('chapterDbHistoryBodyId');
        if (!body) {
            return;
        }

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f2f2f2;';

        const link = document.createElement('a');
        link.href = href || 'javascript:void(0);';
        link.textContent = `${index}. ${title}`;
        link.style.cssText = 'flex:1;min-width:0;word-break:break-all;';

        const stats = document.createElement('span');
        stats.textContent = `新增 ${added} 章，重复 ${duplicated} 章，共 ${added + duplicated} 章`;
        stats.style.cssText = 'white-space:nowrap;color:#666;';

        row.appendChild(link);
        row.appendChild(stats);
        body.appendChild(row);
        body.scrollTop = body.scrollHeight;
    }

    setExportProgress(percent) {
        layui.element.progress(this.progressFilter, percent);
    }

    resetExportProgress() {
        layui.element.render('progress', this.progressFilter);
        this.setExportProgress('0%');
    }

    minimizeBookListWindow() {
        if (this.openBookListWindowIndex !== 0) {
            layui.layer.min(this.openBookListWindowIndex);
        }
    }

    msg(content, options) {
        layui.layer.msg(content, options);
    }

    alert(content, options) {
        layui.layer.alert(content, options);
    }

    handleSelectRange(options, type) {
        options.onSelectRange(type);
        return false;
    }

    setAnchorText(id, text, href = '') {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }
        el.innerText = text;
        el.href = href;
    }

    getBookListTabContent() {
        return '<div style="height: 100%;width: 99%;padding-top: 10px;">' +
            '<div id="bookListWindowDiv"></div>' +
            '</div>';
    }

    getTaskInfoTabContent() {
        return '<div style="height: 100%;width: 99%;padding-top: 10px;">' +
            '<div id="exportAndOpenNewWindow">' +
            '<fieldset class="layui-elem-field">' +
            '  <legend>打开新窗口的信息</legend>' +
            '  <div class="layui-field-box">' +
            '      <a id="openNewWindowInfo" href="">暂未打开新窗口</a>' +
            '      <div style="margin-top: 12px;" class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="openNewWindowProgress">' +
            '          <div class="layui-progress-bar layui-bg-blue" lay-percent="0%"></div>' +
            '      </div>' +
            '  </div>' +
            '</fieldset>' +
            '<fieldset class="layui-elem-field">' +
            '  <legend>当前导出</legend>' +
            '  <div class="layui-field-box">' +
            '      <a id="exportInfoContentId" href="">暂无导出</a>' +
            '  </div>' +
            '</fieldset>' +

            '<fieldset class="layui-elem-field">' +
            '  <legend>导出进度条</legend>' +
            '  <div class="layui-field-box">' +
            '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="exportProgress">' +
            ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
            '</div>' +
            '  </div>' +
            '</fieldset>' +
            '<fieldset class="layui-elem-field">' +
            '  <legend>章节入库</legend>' +
            '  <div class="layui-field-box">' +
            '      <a id="chapterDbInfoContentId" href="">暂无入库</a>' +
            '      <div id="chapterDbHistoryBodyId" style="margin-top: 10px;max-height: 220px;overflow-y: auto;"></div>' +
            '  </div>' +
            '</fieldset>' +
            '</div>' +
            '</div>';
    }
}
