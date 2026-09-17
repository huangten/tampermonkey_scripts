export class ChapterView {
    renderFixbar({onAction}) {
        layui.use(() => {
            layui.util.fixbar({
                bars: [
                    {
                        type: '复制书名',
                        icon: 'layui-icon-auz'
                    },
                    {
                        type: '复制内容',
                        icon: 'layui-icon-success'
                    }, {
                        type: '原样下载',
                        icon: 'layui-icon-download-circle'
                    }
                    , {
                        type: '添加空白符下载',
                        icon: 'layui-icon-release'
                    }
                    , {
                        type: '复制内容HTML',
                        icon: 'layui-icon-fonts-code'
                    }
                    , {
                        type: '调整排版并复制',
                        icon: 'layui-icon-spread-left'
                    }
                    , {
                        type: '编辑文本',
                        icon: 'layui-icon-list'
                    }
                ],
                default: false,
                css: {bottom: "20%",right: 5},
                bgcolor: '#ad2fec',
                margin: 0,
                on: { // 任意事件 --  v2.8.0 新增
                    mouseenter: function (type) {
                        layui.layer.tips(type, this, {
                            tips: 4,
                            fixed: true
                        });
                    },
                    mouseleave: function (type) {
                        console.log(type);
                        layui.layer.closeAll('tips');
                    }
                },
                click: async function (type) {
                    await onAction(type);
                }
            });
        });
    }
}