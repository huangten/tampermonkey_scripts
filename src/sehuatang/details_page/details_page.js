import {copyContext, init} from '../../common/common.js'
import {check18R, copyTitleAndBlockcode, copyTitleAndDownload, getInfo, getTitleText} from "../common.js";

init().then(() => {
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

    GM_registerMenuCommand('在 missav.ai 中打开', (event) => {
        const a = document.createElement('a');
        a.href = 'https://missav.ai/dm45/cn/' + document.getSelection().toString().trim();
        a.target = '_blank';
        a.click();
    });
    GM_registerMenuCommand('在 jable.tv 中打开', (event) => {
        const a = document.createElement('a');
        a.href = `https://jable.tv/videos/${document.getSelection().toString().trim()}/?lang=jp`;
        a.target = '_blank';
        a.click();
    });

    layui.use(function () {
        const util = layui.util;
        const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        // 自定义固定条
        util.fixbar({
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
            css: {bottom: "21%"},
            bgcolor: '#BA350F',
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
            // 点击事件
            click: function (type) {
                console.log(this, type);
                // layer.msg(type);

                if (type === "下载信息和种子") {
                    getInfo(document);
                }
                if (type === "仅复制标题") {
                    copyContext(getTitleText(document).trim()).then()
                }
                if (type === "复制标题和下载种子") {
                    copyTitleAndDownload(document);
                }
                if (type === "复制标题和磁力信息") {
                    copyTitleAndBlockcode(document);
                }
            }
        });
    });

}
