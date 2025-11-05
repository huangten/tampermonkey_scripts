// ==UserScript==
// @name         获取sis001书籍内容
// @namespace    http://tampermonkey.net/
// @version      2025-11-05
// @description  try to take over the world!
// @author       You
// @match        *://*.sis001.com/forum/thread-*-1-1.html
// @match        *://*.sis001.com/bbs/viewthread.php?tid=*
// @match        *://*.sis001.com/bbs/thread-*-1-1.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cool18.com
// @connect      *
// @grant        unsafeWindow
// @noframes
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
        addCss('layui_css', 'https://cdn.jsdelivr.net/npm/layui@2.11.5/dist/css/layui.min.css'),
        // addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
        addScript('layui_id', "https://cdn.jsdelivr.net/npm/layui@2.11.5/dist/layui.min.js")
    ]).then(() => {
        run();
    });

    /*global layui,layer */



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

        function getElement(uw) {
            let e = uw.document.getElementsByClassName('postcontent')[0].getElementsByClassName("postmessage")[0];

            let e1 = e.cloneNode(true);

            let fieldset = e1.getElementsByTagName("fieldset")[0];
            let table = e1.getElementsByTagName("table")[0];


            // 1. 选中所有后代元素（包括直接子元素和非直接子元素）
            const allDescendants = e1.querySelectorAll('*');

            // 2. 遍历所有后代元素
            allDescendants.forEach(element => {
                // 3. 判断元素的直接父元素是否就是目标父元素
                if (element === fieldset) {
                    // 4. 如果不是，则它是非直接子元素（孙子、曾孙等），执行移除
                    element.remove();
                }
                if (element === table) {
                    // 4. 如果不是，则它是非直接子元素（孙子、曾孙等），执行移除
                    element.remove();
                }
                if (element.tagName == "A") {
                    element.remove();
                }
            });
            
            return e1;
        }

        function getPreTagContent(uw) {

            return getElement(uw).innerText;
        }
        function getPreTagContentHtml(uw) {
            return getElement(uw).innerHTML;
        }
    }
})();