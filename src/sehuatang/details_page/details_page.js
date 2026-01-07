import {addCss, copyContext, addScript} from '../../common/common.js'
import {check18R, copyTitleAndBlockcode, copyTitleAndDownload, getInfo, getTitleText} from "../common.js";

Promise.all([
    addCss('layui_css', 'https://cdn.jsdelivr.net/npm/layui@2.9.18/dist/css/layui.min.css'),
    // addScript('filesave_id', ""),
    addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js")
]).then(() => {
    run();
});


function run() {
    document.onvisibilitychange = () => {
        if (document.visibilityState === 'visible' && document.readyState === 'complete') {
            check18R();
        }
    }
    setTimeout(() => {
        check18R();
    }, 500);

    layui.use(function () {
        const util = layui.util;
        const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: 'getInfo',
                    content: '下载信息和种子',
                    style: fixbarStyle
                },
                {
                    type: 'onlyCopyTitle',
                    content: '仅复制标题',
                    style: fixbarStyle
                },
                {
                    type: 'copyTitleAndDownload',
                    content: '复制标题和下载种子',
                    style: fixbarStyle
                },
                {
                    type: 'copyTitleAndBlockcode',
                    content: '复制标题和磁力信息',
                    style: fixbarStyle
                }
            ],
            default: false,
            css: {bottom: "21%"},
            margin: 0,
            // 点击事件
            click: function (type) {
                console.log(this, type);
                // layer.msg(type);

                if (type === "getInfo") {
                    getInfo(document);
                }
                if (type === "onlyCopyTitle") {
                    copyContext(getTitleText(document).trim()).then()
                }
                if (type === "copyTitleAndDownload") {
                    copyTitleAndDownload(document);
                }
                if (type === "copyTitleAndBlockcode") {
                    copyTitleAndBlockcode(document);
                }
            }
        });
    });

}
