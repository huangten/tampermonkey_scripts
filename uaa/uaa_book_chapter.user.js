// ==UserScript==
// @name         uaa 章节内容复制
// @namespace    http://tampermonkey.net/
// @version      2024-10-21
// @description  try to take over the world!
// @author       You
// @match        https://*.uaa.com/novel/chapter*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @require https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @require https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    var cssId = 'layui_css'; // you could encode the css path itself to generate id..
    if (!document.getElementById(cssId)) {
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://cdn.jsdelivr.net/npm/layui@2.9.18/dist/css/layui.min.css';
        link.media = 'all';
        head.appendChild(link);
    }

    var scriptJQ = document.createElement('script');
    scriptJQ.src = "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js";
    document.body.appendChild(scriptJQ);

    var scriptLayUI = document.createElement('script');
    scriptLayUI.src = "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js";
    document.body.appendChild(scriptLayUI);

    var scriptFilesever = document.createElement('script');
    scriptFilesever.src = "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js";
    document.body.appendChild(scriptFilesever);


    /*global $,layui,layer,util,saveAs*/

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

    unsafeWindow.onload = function () {

        // 标题内容
        var titleBox = document.getElementsByClassName("head_title_box")[0].getElementsByTagName("h2")[0].innerText;
        // 行内容
        var lines = document.getElementsByClassName("line");
        var texts = new Array();
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
                continue;
            }
            texts.push(lines[i].innerText);
        }
        lines = texts;

        // 找到指定的 div 元素
        const targetDiv = document.querySelector('body div.title_box')

        layui.use(function () {
            var util = layui.util;
            // 自定义固定条
            util.fixbar({
                bars: [{
                    type: 'titleText',
                    content: '获取标题文本',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'titleHtml',
                    content: '获取标题HTML',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'contentText',
                    content: '获取内容文本',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'contentHtml',
                    content: '获取内容HTML',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'titleAndContentText',
                    content: '获取标题和内容文本',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'titleAndContentHtml',
                    content: '获取标题和内容HTML',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'saveContentToLocal',
                    content: '保存内容到本地',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }, {
                    type: 'toBottom',
                    content: '底部',
                    style: 'background-color: #FF5722;font-size: 12px;width:120px;'
                }],
                default: true,
                css: { bottom: "15%" },
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
                    if (type === "toBottom") {
                        toBottom();
                        return;
                    }
                }
            });
        });


        function toBottom() {
            var windowHeight = parseInt($("body").css("height"));//jq
            $("html,body").animate({ "scrollTop": windowHeight }, 200);
        }

        const br = document.createElement('br');

        var bottomBoxFirstElementChild = document.getElementsByClassName("chapter_box")[0].getElementsByClassName("bottom_box")[0].firstElementChild

        var prevChapter = bottomBoxFirstElementChild.tagName == 'A' ? document.createElement('a') : document.createElement('button');
        prevChapter.textContent = prevChapter.tagName == 'A' ? "上一章" : "已是第一章";
        if (prevChapter.tagName == 'A') {
            console.log(bottomBoxFirstElementChild.href)
            prevChapter.href = bottomBoxFirstElementChild.href;
        }
        prevChapter.style.position = "fixed"
        prevChapter.style.top = "250px"
        prevChapter.style.right = "20px"


        var book = document.createElement('a');
        book.textContent = "书籍"
        book.href = bottomBoxFirstElementChild.nextElementSibling.href
        book.style.position = "fixed"
        book.style.top = "300px"
        book.style.right = "20px"

        var bottomBoxThirdElementChild = bottomBoxFirstElementChild.nextElementSibling.nextElementSibling;
        var nextChapter = bottomBoxThirdElementChild.tagName == 'A' ? document.createElement('a') : document.createElement('button');
        nextChapter.textContent = bottomBoxThirdElementChild.tagName == 'A' ? "下一章" : "已是最后一章";

        if (nextChapter.tagName == 'A') {
            console.log(bottomBoxThirdElementChild.getAttribute("href"))
            nextChapter.href = bottomBoxThirdElementChild.getAttribute("href");
        }

        nextChapter.style.position = "fixed"
        nextChapter.style.top = "350px"
        nextChapter.style.right = "20px"



        // 添加按钮的点击事件
        function titleText() {
            copyContext(titleBox)
        }

        function titleHtml() {
            copyContext("<h2>" + titleBox + "</h2>")
        }
        function contentText() {
            var str = "";
            for (var i = 0; i < lines.length; i++) {
                str += "　　" + lines[i] + "\n";
            }
            copyContext(str)
        }
        function contentHtml() {
            var str = "";
            for (var i = 0; i < lines.length; i++) {
                str += "<p>" + lines[i] + "</p>\n";
            }
            copyContext(str)
        }

        function titleAndContentText() {
            var str = titleBox + "\n\n";
            for (var i = 0; i < lines.length; i++) {
                str += "　　" + lines[i] + "\n";
            }
            copyContext(str)
        }

        function titleAndContentHtml() {
            var str = "<h2>" + titleBox + "</h2>\n\n";
            for (var i = 0; i < lines.length; i++) {
                str += "<p>" + lines[i] + "</p>\n";
            }
            copyContext(str)
        }

        function saveContentToLocal() {
            let title = titleBox;
            let text = "";
            let html = "";

            for (let i = 0; i < lines.length; i++) {
                text += "　　" + lines[i] + "\n";
            }

            for (let i = 0; i < lines.length; i++) {
                html += "<p>" + lines[i] + "</p>\n";
            }
            let separator = "\n\n=============================================\n";
            let content = "book name:\n" + getBookName()
                + separator +
                "author:\n" + getAuthorInfo()
                + separator +
                "title:\n" + title
                + separator +
                "text:\n" + text
                + separator +
                "html:\n" + html;
            try {
                var isFileSaverSupported = !!new Blob;
                var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                saveAs(blob, getBookName() + " " + getAuthorInfo() + " " + title + ".txt");
            } catch (e) {
                console.log(e);
            }

        }

        if (unsafeWindow.top.location != unsafeWindow.self.location) {
            setTimeout(function () {
                var id = unsafeWindow.setInterval(function () { }, 0);
                while (id--) unsafeWindow.clearInterval(id);
                // saveContentToLocal();
                // unsafeWindow.parent.postMessage('lhd_close');
            }, 1000)
        }

        function getBookName() {
            let htmlTitle = document.getElementsByTagName("title")[0].innerText;
            let bookName = htmlTitle.split(" | ")[0].split(" - ").pop();
            bookName = bookName.replaceAll("/", "_");
            return bookName;
        }
        function getAuthorInfo() {
            return document.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].nextElementSibling.getElementsByTagName("span")[0].innerText;
        }
        function buttonAddBody(e) {
            // 将按钮添加到页面中
            document.body.appendChild(e)
            // 将按钮添加到指定的 div 元素中
            targetDiv.appendChild(e)
        }

        //         buttonAddBody(br);
        //         buttonAddBody(prevChapter);
        //         buttonAddBody(book);
        //         buttonAddBody(nextChapter);
    }
})();