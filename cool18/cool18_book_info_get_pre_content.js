// ==UserScript==
// @name         获取禁忌书屋书籍内容
// @namespace    http://tampermonkey.net/
// @version      2025-08-03.2
// @description  try to take over the world!
// @author       You
// @match        *://www.cool18.com/bbs4/index.php?app=forum&act=threadview&tid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cool18.com
// @grant        GM_xmlhttpRequest
// @connect      *
// @grant        GM_download
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';



    function addCss(id, src) {
        return new Promise((resolve, reject) => {
            if (!document.getElementById(id)) {
                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.id = id;
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = src;
                link.media = 'all';
                link.onload = () => { resolve(); };
                link.onerror = () => { reject(); };
                head.appendChild(link);
            }
        });
    }

    function addScript(id, src) {
        return new Promise((resolve, reject) => {
            if (!document.getElementById(id)) {
                var script = document.createElement('script');
                script.src = src;
                script.id = id;
                script.onload = () => { resolve(); };
                script.onerror = () => { reject(); };
                document.body.appendChild(script);
            }
        });
    }

    Promise.all([
        addCss('layui_css', 'https://cdn.jsdelivr.net/npm/layui@2.9.18/dist/css/layui.min.css'),
        // addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js")
    ]).then(() => {
        run();
    });

    /*global $,layui,layer,saveAs,FileSaver,util*/



    function run() {
        function copyContext(str) {
            navigator.clipboard.writeText(str).then(() => {
                console.log('Content copied to clipboard');
                /* Resolved - 文本被成功复制到剪贴板 */
                layer.msg('复制成功', { icon: 1 });
            }, () => {
                console.error('Failed to copy');
                /* Rejected - 文本未被复制到剪贴板 */
            });
        }

        layui.use(function () {
            var util = layui.util;
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
                css: { bottom: "21%" },
                bgcolor: '#ba350f', // bar 的默认背景色
                margin: 0,
                on: {
                    mouseenter: function (type) {
                        console.log(this.innerText)
                        layer.tips(type, this, {
                            tips: 4,
                            fixed: true
                        });
                    },
                    mouseleave: function (type) {
                        layer.closeAll('tips');
                    }
                },
                // 点击事件
                click: function (type) {
                    console.log(this, type);
                    // layer.msg(type);
                    if (type === "CopyContent") {
                        copyContext(getPreTagContent(unsafeWindow));
                        return;
                    }

                    if (type === "CopyContentHtml") {
                        copyContext(getPreTagContentHtml(unsafeWindow));
                        return;
                    }

                }
            });
        });


        function getPreTagContent(uw) {
            return uw.document.getElementsByTagName('pre')[0].innerText;
        }
        function getPreTagContentHtml(uw) {
            return uw.document.getElementsByTagName('pre')[0].innerHTML;
        }
    }
})();