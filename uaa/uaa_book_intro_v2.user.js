// ==UserScript==
// @name         uaa 详情页V2版
// @namespace    http://tampermonkey.net/
// @version      2025-12-25.01
// @description  try to take over the world!
// @author       You
// @match        https://*.uaa.com/novel/intro*
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
                var script = document.createElement('script');
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function waitForElement(doc, selector, timeout = 10000) {
        return new Promise(resolve => {
            const interval = 100;
            let elapsed = 0;
            const checker = setInterval(() => {
                if (doc.querySelector(selector) || elapsed >= timeout) {
                    clearInterval(checker);
                    resolve();
                }
                elapsed += interval;
            }, interval);
        });
    }

    var downloadArray = new Array();

    class Downloader {
        constructor() {
            if (Downloader.instance) return Downloader.instance;

            this.queue = [];                  // 待下载任务
            this.running = false;             // 下载器是否在执行
            this.downloaded = [];             // 已下载成功
            this.failed = [];                 // 下载失败
            this.config = {
                interval: 2000,               // 任务间间隔 ms
                onTaskComplete: () => {
                },     // 单任务完成回调
                onFinish: () => {
                },           // 全部任务完成回调
                downloadHandler: null         // 下载逻辑回调
            };

            Downloader.instance = this;
        }

        static getInstance() {
            if (!Downloader.instance) Downloader.instance = new Downloader();
            return Downloader.instance;
        }

        // 更新配置
        setConfig(options = {}) {
            this.config = {...this.config, ...options};
        }

        // 添加任务
        add(task) {
            this.queue.push(task);
        }

        // 清空队列
        clear() {
            this.queue = [];
        }

        // 启动下载
        async start() {
            if (this.running) return;
            if (typeof this.config.downloadHandler !== 'function') {
                throw new Error("请先通过 setConfig 设置 downloadHandler 回调");
            }

            this.running = true;

            while (this.queue.length > 0) {
                const task = this.queue.shift();

                try {
                    const success = await this.config.downloadHandler(task);
                    task.endTime = new Date();
                    if (success) {
                        this.downloaded.push(task);
                    } else {
                        this.failed.push(task);
                    }

                    this.config.onTaskComplete(task, success);

                } catch (err) {
                    task.endTime = new Date();
                    this.failed.push(task);
                    this.config.onTaskComplete(task, false);
                    this.running = false;
                    alert(`下载失败: ${task.title}\n原因: ${err.message}`);
                    return;
                }

                // 任务间暂停
                if (this.queue.length > 0) await sleep(this.config.interval);
            }

            this.running = false;
            this.config.onFinish(this.downloaded, this.failed);
        }
    }

    async function downloadChapter(task) {
        let iframeId = "__uaa_iframe__" + crypto.randomUUID();
        const iframe = ensureIframe(iframeId);
        updateIframeHeader(task.title);
        iframe.src = task.href;
        slideInIframe();
        console.log(task.href);
        await fetch(task.href).then(content => content.text()).then((data) => {
            console.log(data);
        });

        // 等待页面加载
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);
            iframe.onload = async () => {
                try {
                    await waitForElement(iframe.contentDocument, '.line', 1000 * 25 * 60);
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(new Error("正文元素未找到"));
                }
            };
        });

        // 保存内容
        const el = iframe.contentDocument;
        const success = saveContentToLocal(el);

        // 动画滑出 + 清空 iframe
        slideOutIframe(iframeId);
        return success;
    }

    const downloader = Downloader.getInstance();

    downloader.setConfig({
        interval: 2500,
        downloadHandler: downloadChapter,
        onTaskComplete: (task, success) => {
            console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
        },
        onFinish: (downloaded, failed) => {
            console.log("下载完成 ✅");
            console.log("已下载:", downloaded.map(t => t));
            console.log("未下载:", failed.map(t => t));
            // ✅ 全部完成 — 销毁 iframe
            layer.alert('下载完毕', {icon: 1, shadeClose: true});
        }
    });

    function run() {
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
                    if (type === "downloadAll") {
                        if (downloadArray.running) {
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
                        downloader.clear();
                        return;
                    }
                    if (type === "menuList") {
                        openPage();
                        return;
                    }
                }
            });
        });
    }

    function downloadAll() {
        downloadArray = getMenuArray(getMenuTree())
        // doDownload()
        downloadArray.forEach(data => {
            downloader.add(data);
        });
        downloader.start();
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
                    css: {bottom: "15%", right: 30},
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
                    if (downloader.running) {
                        layer.msg("正在下载中，请等待下载完后再继续");
                        return;
                    }
                    downloadArray = getMenuArray(checkedData)
                    downloader.clear();
                    downloadArray.forEach(data => {
                        downloader.add(data);
                    });
                    downloader.start();

                    return
                }

                function reloadTree() {
                    tree.reload('title', { // options
                        data: getMenuTree()
                    }); // 重载实例
                    downloader.clear();
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
                        "checked": alist[j].innerText.indexOf("new") > 0 ? true : false,
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
                        "checked": alist[j].innerText.indexOf("new") > 0 ? true : false,
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

    function ensureIframe(iframeId) {
        let containerId = "__uaa_iframe_container__";
        let container = document.getElementById(containerId);
        if (!container) {
            // 创建容器
            container = document.createElement("div");
            container.id = containerId;
            container.style.position = "fixed";
            container.style.top = "10%";
            container.style.left = "0";
            container.style.width = "70%";
            container.style.height = "80%";
            container.style.zIndex = "999999";
            container.style.transform = "translateX(-100%)";
            container.style.transition = "transform 0.5s ease";
            container.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
            container.style.background = "#fff";
            document.body.appendChild(container);

            // 创建标题栏
            const header = document.createElement("div");
            header.id = "__iframe_header__";
            header.style.width = "100%";
            header.style.height = "35px";
            header.style.lineHeight = "35px";
            header.style.background = "#ff5555";
            header.style.color = "#fff";
            header.style.fontWeight = "bold";
            header.style.textAlign = "center";
            header.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            header.innerText = "加载中...";
            container.appendChild(header);
        }

        // 创建 iframe
        const iframe = document.createElement("iframe");
        iframe.id = iframeId;
        iframe.src = "about:blank";
        iframe.style.width = "100%";
        iframe.style.height = "calc(100% - 35px)";
        iframe.style.position = "fixed";
        iframe.style.zIndex = "999999";
        iframe.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
        iframe.style.border = " 2px solid #ff5555";
        iframe.style.background = "#fff";
        iframe.style.border = "none";
        container.appendChild(iframe);

        return document.getElementById(iframeId);
    }

    function slideInIframe() {
        const iframe = document.getElementById("__uaa_iframe_container__");
        iframe.style.transform = "translateX(0)";
    }

    function slideOutIframe(iframeId) {
        const container = document.getElementById("__uaa_iframe_container__");
        const iframe = document.getElementById(iframeId);
        if (!container || !iframe) return;

        // 滑出动画
        container.style.transform = "translateX(-100%)";


        destroyIframe(iframeId);
        // 动画结束后清空 iframe
        setTimeout(() => {
            try {
                if (iframe) {
                    iframe.src = "about:blank";
                    iframe.contentDocument.write("");
                    iframe.contentDocument.close();
                    console.log("✅ iframe 已清空为白页");
                }
            } catch (e) {
                console.error("清空 iframe 失败", e);
            }
        }, 100); // 等待动画完成 0.5s
    }

    function updateIframeHeader(title) {
        const header = document.getElementById("__iframe_header__");
        if (header) {
            header.innerText = title || "加载中...";
        }
    }

    function destroyIframe(iframeId) {
        let iframe = document.getElementById(iframeId);
        if (iframe) {
            setTimeout(async () => {
                try {
                    iframe.onload = null;
                    iframe.onerror = null;
                    iframe.contentDocument.write("");
                    iframe.contentDocument.close();
                    iframe.src = "about:blank";
                    await new Promise(r => setTimeout(r, 0))
                    iframe.remove();
                    iframe = null;
                } catch (e) {
                    console.error("清空 iframe 失败", e);
                }

                console.log("✅ iframe 已完全清理并销毁");
            }, 100); // 等待动画完成 0.5s
        }
    }

    function saveContentToLocal(el) {
        try {
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
            let content = "book name:\n" + getBookName2(el)
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
                var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
                saveAs(blob, getBookName2(el) + " " + getAuthorInfo(el) + " " + title + ".txt");
            } catch (e) {
                console.log(e);
            }
            return true;

        } catch (e) {
            console.error("保存失败", e);
            return false;
        }

    }

    function getTitle(el) {
        let level = el.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0] != undefined ?
            el.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0].innerText + " " : "";
        return level + el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText;
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

    function getBookName2(el) {
        return el.getElementsByClassName('chapter_box')[0]
            .getElementsByClassName("title_box")[0]
            .getElementsByTagName('a')[0].innerText.trim()
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
})();