export class InfoWindowView {
    constructor({
        progressFilter,
        debugTableId,
        chapterTreeId,
        getChapterTreeData,
        onChapterClick,
        onDownloadChecked,
        onDownloadAll,
        onResume,
        onRecoverStale,
        onReady
    }) {
        this.index = 0;
        this.progressFilter = progressFilter;
        this.debugTableId = debugTableId;
        this.chapterTreeId = chapterTreeId;
        this.getChapterTreeData = getChapterTreeData;
        this.onChapterClick = onChapterClick;
        this.onDownloadChecked = onDownloadChecked;
        this.onDownloadAll = onDownloadAll;
        this.onResume = onResume;
        this.onRecoverStale = onRecoverStale;
        this.onReady = onReady;
    }

    ensure() {
        if (this.index !== 0) {
            return this.index;
        }
        this.index = layui.layer.tab({
            shadeClose: false,
            closeBtn: 0,
            shade: 0,
            maxmin: true,
            area: ['60%', '80%'],
            moveOut: true,
            tab: [
                {
                    title: '章节列表',
                    content: '<div style="height: 100%;width: 100%;padding-top: 10px;">' +
                        '<div id="downloadWindowDivListTreeId"></div>' +
                        '</div>'
                }, {
                    title: '下载进度',
                    content: '<div style="height: 100%;width: 100%;padding-top: 10px;">' +
                        '<div id="downloadWindowDivInfoId">' +
                        '<fieldset class="layui-elem-field">\n' +
                        '  <legend>当前下载</legend>\n' +
                        '  <div class="layui-field-box">\n' +
                        '      <a id="downloadInfoContentId" href="">暂无下载</a>\n' +
                        '  </div>\n' +
                        '</fieldset>' +
                        '<fieldset class="layui-elem-field">\n' +
                        '  <legend>进度条</legend>\n' +
                        '  <div class="layui-field-box">\n' +
                        '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="' + this.progressFilter + '">' +
                        ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
                        '</div>' +
                        '  </div>' +
                        '</fieldset>' +
                        '</div>' +
                        '</div>'
                }, {
                    title: '数据库信息',
                    content: '<div style="height: 100%;width: 100%;padding: 10px;box-sizing: border-box;">' +
                        '<div style="margin-bottom: 10px;display: flex;gap: 8px;flex-wrap: wrap;">' +
                        '  <button id="debugLoadSystemInfosBtn" type="button" class="layui-btn layui-btn-sm">system_infos</button>' +
                        '  <button id="debugLoadChaptersBtn" type="button" class="layui-btn layui-btn-sm layui-btn-normal">chapters</button>' +
                        '  <button id="debugRefreshBtn" type="button" class="layui-btn layui-btn-sm layui-btn-primary">刷新</button>' +
                        '  <button id="debugDeleteRowsBtn" type="button" class="layui-btn layui-btn-sm layui-btn-danger">删除选中</button>' +
                        '</div>' +
                        '<table id="' + this.debugTableId + '" lay-filter="' + this.debugTableId + '"></table>' +
                        '</div>'
                }],
            btn: ['下载选中章节', '下载全部章节', '继续下载', '恢复残留'],
            btn1: () => {
                this.runAsync(this.onDownloadChecked);
                return false;
            },
            btn2: () => {
                this.runAsync(this.onDownloadAll);
                return false;
            },
            btn3: () => {
                this.runAsync(this.onResume);
                return false;
            },
            btn4: () => {
                this.runAsync(this.onRecoverStale);
                return false;
            },
            success: (layero) => {
                layui.layer.setTop(layero);
                layui.element.render('progress', this.progressFilter);
                layui.element.progress(this.progressFilter, '0%');
                this.runAsync(this.onReady);
                this.renderChapterTree();
            }
        });
        return this.index;
    }

    renderChapterTree() {
        layui.tree.render({
            elem: '#downloadWindowDivListTreeId',
            data: this.getChapterTreeData(),
            showCheckbox: true,
            onlyIconControl: true,
            id: this.chapterTreeId,
            isJump: false,
            click: (obj) => {
                this.runAsync(() => this.onChapterClick(obj.data));
            }
        });
    }

    reloadChapterTree() {
        if (document.getElementById('downloadWindowDivListTreeId')) {
            layui.tree.reload(this.chapterTreeId, { data: this.getChapterTreeData() });
        }
    }

    getCheckedChapters() {
        return layui.tree.getChecked(this.chapterTreeId);
    }

    setProgress(percent) {
        if (document.querySelector(`[lay-filter="${this.progressFilter}"]`)) {
            layui.element.progress(this.progressFilter, percent);
        }
    }

    setCurrentDownload(text, href = '') {
        const infoEl = document.getElementById('downloadInfoContentId');
        if (!infoEl) {
            return;
        }
        infoEl.innerText = text;
        infoEl.href = href;
    }

    setIdleDownload(stats) {
        if (stats.pending === 0) {
            this.setCurrentDownload(stats.total === 0 ? '暂无下载' : '下载结束');
        }
    }

    minimize() {
        layui.layer.min(this.ensure());
    }

    runAsync(handler) {
        Promise.resolve(handler?.()).catch(console.error);
    }
}

