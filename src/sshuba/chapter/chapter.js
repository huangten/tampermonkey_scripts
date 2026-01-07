import {addCss, copyContext, addScript} from '../../common/common.js'

Promise.all([
    addCss('layui_css', 'https://cdn.jsdelivr.net/npm/layui@2.11.5/dist/css/layui.min.css'),
    // addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
    addScript('layui_id', "https://cdn.jsdelivr.net/npm/layui@2.11.5/dist/layui.min.js")
]).then(() => {
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
                    type: 'CopyContent',
                    content: '复制内容',
                    style: fixbarStyle
                },
                {
                    type: 'CopyContentHtml',
                    content: '复制内容HTML',
                    style: fixbarStyle
                }
            ],
            default: false,
            css: {bottom: "21%"},
            margin: 0,
            click: function (type) {
                if (type === "CopyContent") {
                    copyPreTagContent();
                }
                if (type === "CopyContentHtml") {
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