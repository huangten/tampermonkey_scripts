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
                , {
                    type: '复制内容（第二版）',
                    icon: 'layui-icon-vercode'
                }
                , {
                    type: '复制内容HTML（第二版）',
                    icon: 'layui-icon-code-circle'
                }
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
                    getPreTagContent();
                }
                if (type === "复制内容HTML") {
                    getPreTagContentHtml();
                }
                if (type === "复制内容（第二版）") {
                    copyChapterContent();
                }
                if (type === "复制内容HTML（第二版）") {
                    copyChapterHtml();
                }
            }
        });
    });
}

function getPreTagContent() {
    copyContext(document.getElementsByTagName('pre')[0].innerText).then();
}

function getPreTagContentHtml() {
    copyContext(document.getElementsByTagName('pre')[0].innerHTML).then();
}

function copyChapterContent() {
    const preElement = document.getElementsByTagName('pre')[0];
    const brs = preElement.getElementsByTagName('br');
    if (brs) {
        for (let i = brs.length - 1; i >= 0; i--) {
            brs[i].remove();
        }
    }

    console.log(preElement);
    copyContext(preElement.innerText).then();
}

function copyChapterHtml() {
    const preElement = document.getElementsByTagName('pre')[0];
    const brs = preElement.getElementsByTagName('br');
    if (brs) {
        for (let i = brs.length - 1; i >= 0; i--) {
            brs[i].remove();
        }
    }
    console.log(preElement);
    copyContext(preElement.innerHTML).then();
}
