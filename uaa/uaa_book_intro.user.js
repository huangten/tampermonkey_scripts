// ==UserScript==
// @name         uaa 详情页相关操作
// @namespace    http://tampermonkey.net/
// @version      2024-11-24
// @description  try to take over the world!
// @author       You
// @match        https://*.uaa.com/novel/intro*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uaa.com
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
        addScript("jq_id", "https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"),
        addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js")
    ]).then(() => {
        run();
    });

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

    function run() {
        var downloadArray = new Array();
        const fixbarStyle = "background-color: #ff5555;font-size: 16px;width:100px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        layui.use(function () {
            var util = layui.util;
            // 自定义固定条
            util.fixbar({
                bars: [
                    {
                        type: 'copyBookName',
                        content: '复制书名',
                        style: fixbarStyle
                    },
                    {
                        type: 'downloadAll',
                        content: '下载全部',
                        style: fixbarStyle
                    },
                    {
                        type: 'clearDownloadList',
                        content: '清除待下载',
                        style: fixbarStyle
                    },
                    {
                        type: 'menuList',
                        content: '章节列表',
                        style: fixbarStyle
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
                    if (type === "downloadAll") {
                        if (downloadArray.length !== 0) {
                            layer.tips("正在下载中，请等待下载完后再继续", this, {
                                tips: 4,
                                fixed: true
                            });
                        } else {
                            downloadAll();
                        }
                        return;
                    }

                    if (type === "copyBookName") {
                        let bookName = document.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText
                        copyContext(bookName)
                        return;
                    }

                    if (type === "clearDownloadList") {
                        downloadArray = new Array();
                        return;
                    }
                    if (type === "menuList") {
                        openPage();
                        return;
                    }
                }
            });
        });


        function downloadAll() {
            downloadArray = getMenuArray(getMenuTree())
            doDownload()
        }

        function openPage() {
            layui.layer.open({
                type: 1,
                title: "章节列表",
                shadeClose: false,
                offset: 'r',
                shade: 0,
                anim: 'slideLeft', // 从右往左
                area: ['20%', '80%'],
                skin: 'layui-layer-rim', // 加上边框
                maxmin: true, //开启最大化最小化按钮
                content: `<div id='openPage'></div>`,
                success: function (layero, index, that) {
                    // console.log(layero, index,that)

                    var tree = layui.tree;
                    var layer = layui.layer;
                    var util = layui.util;

                    // 自定义固定条
                    util.fixbar({
                        bars: [
                            {
                                type: 'getCheckedNodeData',
                                content: '选',
                            },
                            {
                                type: 'clear',
                                icon: 'layui-icon-refresh',
                            }],
                        default: true, // 是否显示默认的 bar 列表 --  v2.8.0 新增
                        bgcolor: '#16baaa', // bar 的默认背景色
                        css: { bottom: "15%", right: 30 },
                        target: layero, // 插入 fixbar 节点的目标元素选择器
                        click: function (type) {
                            // console.log(this, type);
                            // layer.msg(type);
                            if (type === "getCheckedNodeData") {
                                treeCheckedDownload()
                            }
                            if (type === "clear") {
                                reloadTree()
                            }
                        }
                    });

                    function treeCheckedDownload() {
                        let checkedData = tree.getChecked('title'); // 获取选中节点的数据

                        console.log(checkedData[0]);
                        if (checkedData.length === 0) {
                            layer.msg("未选中任何数据");
                            return;
                        }
                        if (downloadArray.length !== 0) {
                            layer.msg("正在下载中，请等待下载完后再继续");
                            return;
                        }
                        downloadArray = getMenuArray(checkedData)
                        doDownload()
                    }
                    function reloadTree() {
                        tree.reload('title', { // options
                            data: getMenuTree()
                        }); // 重载实例
                        downloadArray = new Array();
                    }


                    tree.render({
                        elem: '#openPage',
                        data: getMenuTree(),
                        showCheckbox: true,
                        onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                        id: 'title',
                        isJump: false, // 是否允许点击节点时弹出新窗口跳转
                        click: function (obj) {
                            var data = obj.data; //获取当前点击的节点数据
                            if (downloadArray.length !== 0) {
                                layer.tips("正在下载中，请等待下载完后再继续", obj, {
                                    tips: 4,
                                    fixed: true
                                });
                                return;
                            }
                            downloadArray = getMenuArray([data])
                            doDownload()
                        }
                    });
                }
            });
        }



        var timer = 0;
        const ListenMessage = (e) => {
            if (e.data.handle === 'lhd_close') {
                layui.layer.closeAll('iframe', () => {
                    let iframeDocument = layer.getChildFrame('iframe', e.data.layer_index);
                    // console.log(iframeDocument)
                    iframeDocument.attr('src', 'about:blank');
                    iframeDocument.remove();
                    iframeDocument.prevObject.attr('src', 'about:blank');
                    iframeDocument.prevObject.remove();
                    iframeDocument = null;
                    // return
                    let iframes = document.getElementsByTagName("iframe");
                    for (let index = 0; index < iframes.length; index++) {
                        const el = iframes[index];
                        el.src = "about:blank";
                        if (el.contentWindow) {
                            setTimeout(cycleClear(el), 100);
                        }
                    }
                });

                if (timer !== 0) {
                    clearTimeout(timer);
                }
                if (downloadArray.length === 0) {
                    // layer.msg('下载完毕', {icon: 1});
                    layui.layer.alert('下载完毕', { icon: 1, shadeClose: true }, function (index) {
                        layer.close(index);
                    });
                    return;
                }
                timer = setTimeout(() => {
                    doDownload()
                }, 1000 * 5);
            }
        }
        function cycleClear(el) {
            try {
                if (el) {
                    el.contentDocument.write("")
                    el.contentWindow.document.write('');
                    el.contentWindow.document.clear();
                    el.contentWindow.close();
                    var p = el.parentNode;
                    p.removeChild(el);
                }
            } catch (e) {
                // setTimeout(cycleClear(el), 100);
            }
        }

        unsafeWindow.addEventListener('message', ListenMessage);

        function getMenuTree() {
            let menus = new Array();
            let lis = document.querySelectorAll(".catalog_ul > li");
            for (let index = 0; index < lis.length; index++) {
                let preName = "";
                if (lis[index].className.indexOf("menu") > -1) {
                    let alist = lis[index].getElementsByTagName("a");
                    for (let j = 0; j < alist.length; j++) {
                        menus.push({
                            'id': (index + 1) * 100000000 + j,
                            "title": preName + alist[j].innerText.replace("new", "").trim(),
                            "href": alist[j].href,
                            "children": [],
                            "spread": true,
                            "field": "",
                        });
                    }
                }
                if (lis[index].className.indexOf("volume") > -1) {
                    preName = lis[index].querySelector("span").innerText;
                    let children = new Array();
                    let alist = lis[index].getElementsByTagName("a");
                    for (let j = 0; j < alist.length; j++) {
                        children.push({
                            'id': (index + 1) * 100000000 + j + 1,
                            "title": alist[j].innerText.replace("new", "").trim(),
                            "href": alist[j].href,
                            "children": [],
                            "spread": true,
                            "field": "",
                        });
                    }
                    menus.push({
                        'id': (index + 1) * 100000000,
                        "title": preName,
                        "href": "",
                        "children": children,
                        "spread": true,
                        "field": "",
                    });
                }
            }
            return menus;
        }

        function getMenuArray(trees) {
            let menus = new Array();
            for (let index = 0; index < trees.length; index++) {
                if (trees[index].children.length === 0) {
                    menus.push({
                        'id': trees[index].id,
                        "title": trees[index].title,
                        "href": trees[index].href
                    });
                } else {
                    for (let j = 0; j < trees[index].children.length; j++) {
                        let preName = trees[index].title + " ";
                        menus.push({
                            'id': trees[index].children[j].id,
                            "title": preName + trees[index].children[j].title,
                            "href": trees[index].children[j].href
                        });
                    }

                }
            }
            return menus;
        }

        function doDownload() {
            if (downloadArray.length === 0) {
                clearTimeout(timer);
                return;
            }
            let menu = downloadArray.shift();
            layui.layer.open({
                type: 2,
                title: menu.title,
                shadeClose: false,
                shade: 0,
                offset: 'l',
                anim: 'slideRight',
                skin: 'layui-layer-rim', // 加上边框
                maxmin: true, //开启最大化最小化按钮
                area: ['75%', '80%'],
                content: menu.href,
                success: function (layero, index, that) {
                    // console.log(layero, index);

                    let iframeDocument = layer.getChildFrame('html', index);
                    // console.log(iframeDocument)
                    let idocument = iframeDocument[0];
                    saveContentToLocal(idocument);
                    let msg = {
                        "handle": "lhd_close",
                        "layer_index": index
                    }
                    unsafeWindow.postMessage(msg);
                }

            });
        }


        function saveContentToLocal(el) {
            let title = getTitle(el);
            let text = "";
            let html = "";
            let lines = getLines(el);

            for (let i = 0; i < lines.length; i++) {
                text += "　　" + lines[i] + "\n";
            }

            for (let i = 0; i < lines.length; i++) {
                html += "<p>" + lines[i] + "</p>\n";
            }
            let separator = "\n\n=============================================\n";
            let content = "book name:\n" + getBookName(el)
                + separator +
                "author:\n" + getAuthorInfo(el)
                + separator +
                "title:\n" + title
                + separator +
                "text:\n" + text
                + separator +
                "html:\n" + html;
            try {
                var isFileSaverSupported = !!new Blob;
                var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                saveAs(blob, getBookName(el) + " " + getAuthorInfo(el) + " " + title + ".txt");
            } catch (e) {
                console.log(e);
            }

        }

        function getTitle(el) {
            return el.getElementsByClassName("head_title_box")[0].getElementsByTagName("h2")[0].innerText;
        }

        function getLines(el) {
            let lines = el.getElementsByClassName("line");
            let texts = new Array();
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
                    continue;
                }
                texts.push(lines[i].innerText);
            }
            return texts;
        }

        function getBookName(el) {
            let htmlTitle = el.getElementsByTagName("title")[0].innerText;
            let bookName = htmlTitle.split(" | ")[0].split(" - ").pop();
            bookName = bookName.replaceAll("/", "_");
            return bookName;
        }
        function getAuthorInfo(el) {
            return el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].nextElementSibling.getElementsByTagName("span")[0].innerText;
        }
    }
})();