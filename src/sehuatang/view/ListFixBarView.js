export class ListFixBarView {
    renderFixbar({onAction}) {
        layui.use(() => {
            layui.util.fixbar({
                bars: [
                    {
                        type: '打开菜单面板',

                        icon: 'layui-icon-list'
                    }
                ],
                default: false,
                bgcolor: '#BA350F',
                css: {bottom: "20%", right: 10},
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
