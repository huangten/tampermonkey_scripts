import {copyContext, init} from '../../common/common.js'

init().then(() => {
    run();
});

function run() {
    layui.use(function () {
        const util = layui.util;
        const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: '复制内容',
                    icon: 'layui-icon-auz'
                }
                , {
                    type: '复制内容HTML',
                    icon: 'layui-icon-fonts-code'
                }
                // , {
                //     type: '复制内容（第二版）',
                //     icon: 'layui-icon-vercode'
                // }
                // , {
                //     type: '复制内容HTML（第二版）',
                //     icon: 'layui-icon-code-circle'
                // }
            ],
            default: false,
            css: {bottom: "21%"},
            margin: 0,
            on: { // 任意事件 --  v2.8.0 新增
                mouseenter: function (type) {
                    layui.layer.tips(type, this, {
                        tips: 4,
                        fixed: true
                    });
                },
                mouseleave: function (type) {
                    layui.layer.closeAll('tips');
                }
            },
            click: function (type) {
                if (type === "复制内容") {
                    copyPreTagContent();
                }
                if (type === "复制内容HTML") {
                    copyPreTagContentHtml();
                }
            }
        });
    });
}


function copyPreTagContent() {
    copyContext(unsafeWindow.document.getElementsByClassName("page-content")[0].innerText).then();
}

function copyPreTagContentHtml() {
    copyContext(unsafeWindow.document.getElementsByClassName("page-content")[0].innerHTML).then();
}