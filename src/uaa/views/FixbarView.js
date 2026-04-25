export function renderIntroFixbar(handlers) {
    layui.use(function () {
        layui.util.fixbar({
            bars: [
                {
                    type: '复制书名',
                    icon: 'layui-icon-success'
                }, {
                    type: '添加全部',
                    icon: 'layui-icon-add-1'
                }, {
                    type: '导出本书EPUB文件',
                    icon: 'layui-icon-release'
                }, {
                    type: '启动',
                    icon: 'layui-icon-play'
                }, {
                    type: '停止',
                    icon: 'layui-icon-pause'
                }, {
                    type: '恢复残留',
                    icon: 'layui-icon-refresh-3'
                }, {
                    type: '章节列表',
                    icon: 'layui-icon-list'
                }
            ],
            default: false,
            bgcolor: '#ff5722',
            css: { bottom: "20%", right: 0 },
            margin: 0,
            on: {
                mouseenter: function (type) {
                    layui.layer.tips(type, this, {
                        tips: 4,
                        fixed: true
                    });
                },
                mouseleave: function () {
                    layui.layer.closeAll('tips');
                }
            },
            click: function (type) {
                const handler = handlers[type];
                if (handler) {
                    Promise.resolve(handler()).catch(console.error);
                }
            }
        });
    });
}

