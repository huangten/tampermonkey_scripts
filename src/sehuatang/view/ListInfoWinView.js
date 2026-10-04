export class ListInfoWinView {
    constructor(doc = document) {
        this.doc = doc;
        this.openBookListWindowIndex = 0;
        this.downloadWindowDivIntroId = 'downloadWindowDivIntroId';
        this.progressId = 'demo-filter-progress';
        this.downloadInfoContentId = 'downloadInfoContentId';
    }

    openInfoWin(options = {}) {
        if (options.downloadScheduler.running || options.downloadScheduler.running) {
            return layui.layer.msg('请等待当前任务完成后再打开列表窗口', {icon: 0, time: 2000});
        }

        if (this.openBookListWindowIndex !== 0) {
            this.reloadTree(options);
            return this.openBookListWindowIndex;
        }

        const self = this;

        this.openBookListWindowIndex = layui.layer.open({
            type: 1,
            title: "增强面板",
            shadeClose: false,
            closeBtn: 0,
            shade: 0,
            area: ['80%', '80%'],
            skin: 'layui-layer-win10', // 加上边框
            maxmin: true, //开启最大化最小化按钮
            content: '<div id="downloadWindowDivId"></div>',
            moveOut: true,
            btn: ['下载全部', '下载选中的', '清除未下载的'],
            btn1: async (index, layero, that) => {
                options.downloadAll();
                return false;
            },
            btn2: function (index, layero, that) {
                self.treeCheckedDownload()
                return false;
            },
            btn3: function (index, layero, that) {
                self.reloadTree(options);
                return false;
            },
            // btnAlign: 'c',
            success: function (layero, index, that) {
                const tabs = layui.tabs;
                // 方法渲染
                tabs.render({
                    elem: '#downloadWindowDivId',
                    id: 'downloadWindowDivTabsId',
                    // trigger: 'mouseenter',
                    header: [
                        {title: '说明信息'}
                    ],
                    body: [
                        {content: `<div></div>`}
                    ],
                });
                tabs.add('downloadWindowDivTabsId', {
                    title: '下载详情',
                    content: `<div id="${self.downloadWindowDivIntroId}" style="width: 100%;height: 100%;"></div>`,
                    mode: 'prepend',
                    done: () => {
                        const tabs = document.getElementsByClassName('layui-tabs-item');
                        for (let i = 0; i < tabs.length; i++) {
                            tabs[i].style.height = (window.innerHeight * 0.649) + 'px';
                        }
                    }
                });
                tabs.add('downloadWindowDivTabsId', {
                    title: '下载进度',
                    content: '<div id="downloadWindowDivInfoId">' +
                        '<fieldset class="layui-elem-field">\n' +
                        '  <legend>当前下载</legend>\n' +
                        '  <div class="layui-field-box">\n' +
                        '      <a id="downloadInfoContentId" href="">暂无下载</a>\n' +
                        '  </div>\n' +
                        '</fieldset>' +
                        '<fieldset class="layui-elem-field">\n' +
                        '  <legend>进度条</legend>\n' +
                        '  <div class="layui-field-box">\n' +
                        '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="demo-filter-progress">' +
                        ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
                        '</div>' +
                        '  </div>' +
                        '</fieldset>' +
                        '</div>',
                    mode: 'prepend',
                    done: () => {
                        layui.element.render('progress', 'demo-filter-progress');
                        layui.element.progress('demo-filter-progress', '0%');
                    }
                });

                tabs.add('downloadWindowDivTabsId', {
                    title: '番号列表',
                    content: '<div id="downloadWindowDivListTreeId"></div>',
                    mode: 'prepend',
                    done: () => {
                        const util = layui.util;
                        const tree = layui.tree;
                        tree.render({
                            elem: '#downloadWindowDivListTreeId',
                            data: options.data,
                            showCheckbox: true,
                            onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                            id: 'titleList',
                            isJump: false, // 是否允许点击节点时弹出新窗口跳转
                            click: function (obj) {
                                const data = obj.data; //获取当前点击的节点数据
                                options.downloadChecked([data]);
                            }
                        });
                    }
                })
            }
        });
        return this.openBookListWindowIndex;
    }


    treeCheckedDownload(options) {
        let checkedData = layui.tree.getChecked('titleList'); // 获取选中节点的数据
        console.log(checkedData[0]);
        if (checkedData.length === 0) {
            return;
        }
        options.downloadChecked(checkedData);
    }

    reloadTree(options) {
        layui.tree.reload('titleList', {data: options.data}); // 重载实例
        options.clearNotDownload();
    }

}