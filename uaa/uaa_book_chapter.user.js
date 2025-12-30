// ==UserScript==
// @name         uaa 章节内容复制
// @namespace    http://tampermonkey.net/
// @version      2025-12-29.01
// @description  try to take over the world!
// @author       You
// @match        https://*.uaa.com/novel/chapter*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @noframes
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    function addCss(id, src) {
        return new Promise((resolve, reject) => {
            if (!document.getElementById(id)) {
                const head = document.getElementsByTagName('head')[0];
                const link = document.createElement('link');
                link.id = id;
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = src;
                link.media = 'all';
                link.onload = () => {
                    resolve();
                };
                link.onerror = () => {
                    reject();
                };
                head.appendChild(link);
            }
        });
    }

    function addScript(id, src) {
        return new Promise((resolve, reject) => {
            if (!document.getElementById(id)) {
                const script = document.createElement('script');
                script.src = src;
                script.id = id;
                script.onload = () => {
                    resolve();
                };
                script.onerror = () => {
                    reject();
                };
                document.body.appendChild(script);
            }
        });
    }

    Promise.all([
        addCss('layui_css', 'https://cdn.jsdelivr.net/npm/layui@2.9.18/dist/css/layui.min.css'),
        addScript("jq_id", "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"),
        addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js")
    ]).then(() => {
        run();
    }).catch((e) => {
        console.log(e);
    });

    /*global $,layui,layer,util,saveAs*/

    function copyContext(str) {
        navigator.clipboard.writeText(str).then(() => {
            console.log('Content copied to clipboard');
            /* Resolved - 文本被成功复制到剪贴板 */
            layer.msg('复制成功', {icon: 1});
        }, () => {
            console.error('Failed to copy');
            /* Rejected - 文本未被复制到剪贴板 */
        });
    }

    function run() {


        const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g;

        function cleanText(str) {
            return str.replace(/\u00A0/g, ' ').replace(INVISIBLE_RE, '');
        }

        function getFileNameFromPath(filePath) {
            // 兼容 / 和 \
            const parts = filePath.split(/[\\/]/);
            return parts[parts.length - 1];
        }

        // 标题内容
        let level = document.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0] !== undefined ?
            document.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0].innerText + " " : "";
        const titleBox = cleanText(level + document.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText);
        // 行内容
        const lines = document.getElementsByClassName("line");
        const texts = [];
        const htmlLines = [];
        for (let i = 0; i < lines.length; i++) {
            let spanElement = lines[i].getElementsByTagName('span');
            if (spanElement.length > 0) {
                for (let j = 0; j < spanElement.length; j++) {
                    console.log(spanElement[j])
                    spanElement[j].parentNode.removeChild(spanElement[j]);
                }
            }
            let imgElement = lines[i].getElementsByTagName('img');
            if (imgElement.length > 0) {
                for (let j = 0; j < imgElement.length; j++) {
                    htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>`);
                    texts.push(`【image_src】: ${imgElement[j].src},${getFileNameFromPath(imgElement[j].src)}`);
                }
            }

            if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
                continue;
            }
            let t = cleanText(lines[i].innerText.trim());
            if (t.length === 0) {
                continue;
            }
            htmlLines.push(`<p>${t}</p>`);
            texts.push(t);
        }

        // 找到指定的 div 元素
        const targetDiv = document.querySelector('body div.title_box')
        const fixbarStyle = "background-color: #ff5555;font-size: 14px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        layui.use(function () {
            var util = layui.util;
            // 自定义固定条
            util.fixbar({
                bars: [{
                    type: 'titleText',
                    content: '获取标题文本',
                    style: fixbarStyle
                }, {
                    type: 'titleHtml',
                    content: '获取标题HTML',
                    style: fixbarStyle
                }, {
                    type: 'contentText',
                    content: '获取内容文本',
                    style: fixbarStyle
                }, {
                    type: 'contentHtml',
                    content: '获取内容HTML',
                    style: fixbarStyle
                }, {
                    type: 'titleAndContentText',
                    content: '获取标题和内容文本',
                    style: fixbarStyle
                }, {
                    type: 'titleAndContentHtml',
                    content: '获取标题和内容HTML',
                    style: fixbarStyle
                }, {
                    type: 'saveContentToLocal',
                    content: '保存内容到本地',
                    style: fixbarStyle
                }
                    , {
                        type: 'prev',
                        content: '上一章',
                        style: fixbarStyle
                    }
                    , {
                        type: 'self',
                        content: '本书',
                        style: fixbarStyle
                    }
                    , {
                        type: 'next',
                        content: '下一章',
                        style: fixbarStyle
                    }

                    , {
                        type: 'toBottom',
                        content: '底部',
                        style: fixbarStyle
                    }],
                default: true,
                css: {bottom: "15%"},
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
                    if (type === "titleText") {
                        titleText();
                        return;
                    }
                    if (type === "titleHtml") {
                        titleHtml();
                        return;
                    }
                    if (type === "contentText") {
                        contentText();
                        return;
                    }
                    if (type === "contentHtml") {
                        contentHtml();
                        return;
                    }
                    if (type === "titleAndContentText") {
                        titleAndContentText();
                        return;
                    }
                    if (type === "titleAndContentHtml") {
                        titleAndContentHtml();
                        return;
                    }
                    if (type === "saveContentToLocal") {
                        saveContentToLocal();
                        return;
                    }

                    if (type === "prev") {
                        let prev = document.getElementsByClassName("bottom_box")[0].firstElementChild
                        if (prev.nodeName.indexOf("A") > -1) {
                            prev.click();
                            return
                        }
                        return;
                    }
                    if (type === "self") {
                        let s = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling
                        s.click();
                        return;
                    }
                    if (type === "next") {
                        let next = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling.nextElementSibling
                        if (next.nodeName.indexOf("A") > -1) {
                            next.click();
                            return
                        }
                        return;
                    }
                    if (type === "toBottom") {
                        toBottom();
                    }
                }
            });
        });


        function toBottom() {
            let windowHeight = parseInt($("body").css("height"));//jq
            $("html,body").animate({"scrollTop": windowHeight}, 200);
        }

        // 添加按钮的点击事件
        function titleText() {
            copyContext(titleBox)
        }

        function titleHtml() {
            copyContext("<h2>" + titleBox + "</h2>")
        }

        function contentText() {
            copyContext(texts.map((s) => `　　${s}`).join('\n'))
        }

        function contentHtml() {
            copyContext(htmlLines.join('\n'))
        }

        function titleAndContentText() {
            copyContext(titleBox + "\n\n" + texts.map((s) => `　　${s}`).join('\n'))
        }

        function titleAndContentHtml() {
            copyContext("<h2>" + titleBox + "</h2>\n\n" + htmlLines.join('\n'))
        }

        function saveContentToLocal() {
            let title = titleBox;

            let separator = "\n\n=============================================\n";
            let content = "book name:\n" + getBookName2()
                + separator +
                "author:\n" + getAuthorInfo()
                + separator +
                "title:\n" + title
                + separator +
                "text:\n" + texts.map((s) => `　　${s}`).join('\n')
                + separator +
                "html:\n" + htmlLines.join('\n');
            try {
                const isFileSaverSupported = !!new Blob;
                const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
                saveAs(blob, getBookName2() + " " + getAuthorInfo() + " " + title + ".txt");
            } catch (e) {
                console.log(e);
            }

        }

        // if (unsafeWindow.top.location !== unsafeWindow.self.location) {
        //     setTimeout(function () {
        //         var id = unsafeWindow.setInterval(function () {
        //         }, 0);
        //         while (id--) unsafeWindow.clearInterval(id);
        //         // saveContentToLocal();
        //         // unsafeWindow.parent.postMessage('lhd_close');
        //     }, 1000)
        // }

        function getBookName2() {
            return cleanText(document.getElementsByClassName('chapter_box')[0]
                .getElementsByClassName("title_box")[0]
                .getElementsByTagName('a')[0].innerText.trim())
        }

        function getBookName() {
            let htmlTitle = document.getElementsByTagName("title")[0].innerText;
            let bookName = htmlTitle.split(" | ")[0].split(" - ").pop();
            bookName = bookName.replaceAll("/", "_");
            return bookName;
        }

        function getAuthorInfo() {
            return cleanText(document.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].nextElementSibling.getElementsByTagName("span")[0].innerText);
        }
    }
})();