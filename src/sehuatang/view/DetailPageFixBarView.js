export class DetailPageFixBarView {
    renderFixbar({onAction}) {
        layui.use(() => {
            layui.util.fixbar({
                bars: [
                    {
                        type: '下载信息和种子',
                        icon: 'layui-icon-download-circle'
                    },
                    {
                        type: '仅复制标题',
                        icon: 'layui-icon-vercode'
                    },
                    {
                        type: '复制标题和下载种子',
                        icon: 'layui-icon-release'
                    },
                    {
                        type: '复制标题和磁力信息',
                        icon: 'layui-icon-ok-circle'
                    }
                ],
                default: false,
                css: {bottom: "10%"},
                bgcolor: '#BA350F',
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
                    onAction(type);
                }
            });
        });
    }
}
