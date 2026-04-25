export class ChapterFixbarView {
    renderFixbar({ onAction }) {
        layui.use(() => {
            layui.util.fixbar({
                bars: [
                    {
                        type: '获取标题文本',
                        icon: 'layui-icon-fonts-strong'
                    },
                    {
                        type: '获取标题HTML',
                        icon: 'layui-icon-fonts-code'
                    },
                    {
                        type: '获取内容文本',
                        icon: 'layui-icon-tabs'
                    },
                    {
                        type: '获取内容HTML',
                        icon: 'layui-icon-fonts-html'
                    },
                    {
                        type: '获取标题和内容文本',
                        icon: 'layui-icon-align-center'
                    },
                    {
                        type: '获取标题和内容HTML',
                        icon: 'layui-icon-code-circle'
                    },
                    {
                        type: '保存内容到本地',
                        icon: 'layui-icon-download-circle'
                    },
                    {
                        type: '上一章',
                        icon: 'layui-icon-prev'
                    },
                    {
                        type: '本书',
                        icon: 'layui-icon-link'
                    },
                    {
                        type: '下一章',
                        icon: 'layui-icon-next'
                    }
                ],
                default: false,
                css: { bottom: "15%" },
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
