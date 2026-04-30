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
            area: ['70%', '80%'],
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
                        this.getSystemInfoPanelHtml() +
                        '</div>' +
                        '</div>'
                }, {
                    title: '书籍章节信息',
                    content: '<div id="chapterTabId" style="height: 100%;width: 100%;padding: 10px;box-sizing: border-box;">' +
                        '<div style="margin-bottom: 10px;display: flex;gap: 8px;flex-wrap: wrap;">' +
                        // '  <button id="debugLoadChaptersBtn" type="button" class="layui-btn layui-btn-sm layui-btn-normal">chapters</button>' +
                        '  <button id="debugRefreshBtn" type="button" class="layui-btn layui-btn-sm layui-btn-primary">刷新</button>' +
                        '  <button id="debugExportChaptersBtn" type="button" class="layui-btn layui-btn-sm layui-btn-normal">导出 chapters SQL</button>' +
                        '  <button id="debugDeleteRowsBtn" type="button" class="layui-btn layui-btn-sm layui-btn-danger">删除选中</button>' +
                        '  <button id="debugDeleteDownloadedChaptersBtn" type="button" class="layui-btn layui-btn-sm layui-btn-danger">删除已下载章节</button>' +
                        '</div>' +
                        '<table id="' + this.debugTableId + '" lay-filter="' + this.debugTableId + '"></table>' +
                        '</div>'
                }],
            btn: ['添加选中章节', '添加全部章节', '继续下载', '恢复残留'],
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

    getSystemInfoPanelHtml() {
        return '<fieldset class="layui-elem-field">\n' +
            '  <legend>系统状态</legend>\n' +
            '  <div class="layui-field-box">\n' +
            '    <div id="systemInfoPanelId" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 12px;">' +
            this.getSystemInfoItemHtml('id', 'ID') +
            this.getSystemInfoItemHtml('status', '状态') +
            this.getSystemInfoItemHtml('consumerPageLabel', '消费页') +
            this.getSystemInfoItemHtml('consumerPageId', '消费页ID') +
            this.getSystemInfoItemHtml('consumerHeartbeat', '心跳') +
            this.getSystemInfoItemHtml('consumerStartedAt', '消费开始') +
            this.getSystemInfoItemHtml('currentChapterId', '当前章节ID') +
            this.getSystemInfoItemHtml('currentChapterHref', '当前章节地址') +
            this.getSystemInfoItemHtml('currentBookName', '当前书名') +
            this.getSystemInfoItemHtml('lastDownloadTime', '最后下载') +
            this.getSystemInfoItemHtml('updateTime', '系统更新时间') +
            this.getSystemInfoItemHtml('displayUpdatedAt', '展示刷新时间') +
            '    </div>' +
            '  </div>\n' +
            '</fieldset>';
    }

    getSystemInfoItemHtml(field, label) {
        return '<div style="min-width:0;">' +
            '<div style="color:#666;font-size:12px;line-height:18px;">' + label + '</div>' +
            '<div id="systemInfoValue-' + field + '" style="word-break:break-all;line-height:20px;">-</div>' +
            '</div>';
    }

    setSystemInfo(systemInfo, displayUpdatedAt = Date.now()) {
        if (!document.getElementById('systemInfoPanelId')) {
            return;
        }

        const viewModel = {
            id: systemInfo?.id ?? '',
            status: this.formatStatus(systemInfo?.status),
            consumerPageLabel: systemInfo?.consumerPageLabel ?? '',
            consumerPageId: systemInfo?.consumerPageId ?? '',
            consumerHeartbeat: this.formatTime(systemInfo?.consumerHeartbeat),
            consumerStartedAt: this.formatTime(systemInfo?.consumerStartedAt),
            currentChapterId: systemInfo?.currentChapterId ?? '',
            currentChapterHref: systemInfo?.currentChapterHref ?? '',
            currentBookName: systemInfo?.currentBookName ?? '',
            lastDownloadTime: this.formatTime(systemInfo?.lastDownloadTime),
            updateTime: this.formatTime(systemInfo?.updateTime),
            displayUpdatedAt: this.formatTime(displayUpdatedAt)
        };

        Object.entries(viewModel).forEach(([field, value]) => {
            const el = document.getElementById('systemInfoValue-' + field);
            if (el) {
                el.textContent = value || '-';
            }
        });
    }

    formatStatus(status) {
        switch (status) {
            case 0:
                return '空闲';
            case 1:
                return '下载中';
            case 2:
                return '异常';
            default:
                return typeof status === 'undefined' ? '' : String(status);
        }
    }

    formatTime(timestamp) {
        if (!timestamp) {
            return '';
        }
        return new Date(timestamp).toLocaleString();
    }

    minimize() {
        layui.layer.min(this.ensure());
    }

    runAsync(handler) {
        Promise.resolve(handler?.()).catch(console.error);
    }
}
