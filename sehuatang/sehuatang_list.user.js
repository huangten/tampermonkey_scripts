// ==UserScript==
// @name         98堂 列表页相关操作
// @namespace    http://tampermonkey.net/
// @version      2024-10-21
// @description  try to take over the world!
// @author       You
// @match        https://*.sehuatang.org/forum*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
// @require https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @require https://cdn.jsdelivr.net/npm/layui@2.9.18/dist/layui.min.js
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


    /*global $,layui,layer,saveAs,util*/

    var downloadArray = new Array();
    window.onload = function () {

        var timer = 0;
        const ListenMessage = (e) => {
            if (e.data === 'lhd_close') {
                // unsafeWindow.removeEventListener('message', ListenMessage)

                layui.layer.closeAll('iframe');
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
                }, 1000 * 2);
            }
        }

        unsafeWindow.addEventListener('message', ListenMessage);

        layui.use(function () {
            var util = layui.util;
            // 自定义固定条
            util.fixbar({
                bars: [{
                    type: 'downloadAll',
                    content: '下载全部',
                    style: 'background-color: #FF5722;font-size: 12px;width:80px;'
                }, {
                    type: 'clearDownloadList',
                    content: '清除待下载',
                    style: 'background-color: #FF5722;font-size: 12px;width:80px;'
                }, {
                    type: 'menuList',
                    content: '章节列表',
                    style: 'font-size: 12px;width:80px;'
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
            downloadArray = getMenuArray(getTree())
            doDownload()
        }
        function doDownload() {
            console.log(downloadArray.length)
            if (downloadArray.length === 0) {
                clearTimeout(timer);
                return;
            }
            let menu = downloadArray.shift();
            return
            layui.layer.open({
                type: 2,
                title: menu.sehuatang_type + " " + menu.title,
                shadeClose: false,
                shade: 0,
                offset: 'l',
                anim: 'slideRight',
                skin: 'layui-layer-rim', // 加上边框
                maxmin: true, //开启最大化最小化按钮
                area: ['70%', '80%'],
                content: menu.href,
                success: function (layero, index, that) {
                    console.log(layero, index);

                    let iframeDocument = layer.getChildFrame('html', index);
                    let idocument = iframeDocument.prevObject[0];

                    saveContentToLocal(idocument);
                    console.log(idocument)

                    unsafeWindow.postMessage('lhd_close');
                }
            });
        }

        function openPage() {
            layui.layer.open({
                type: 1,
                title: "章节列表",
                shadeClose: false,
                offset: 'r',
                shade: 0,
                anim: 'slideLeft', // 从右往左
                area: ['25%', '90%'],
                skin: 'layui-layer-rim', // 加上边框
                maxmin: true, //开启最大化最小化按钮
                content: `<div class='layui-btn-container'>
            <button type='button' id='getCheckedNodeData' class='layui-btn layui-btn-sm' lay-on='getChecked'>获取选中节点数据</button>
            <button type='button' class='layui-btn layui-btn-sm' lay-on='reload'>重载实例</button>
            <div id='openPage'></div></div>`,
                success: function (layero, index, that) {
                    // console.log(layero, index,that)
                    var util = layui.util;
                    var tree = layui.tree;
                    var layer = layui.layer;
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
                        css: { bottom: "20%" },
                        target: layero, // 插入 fixbar 节点的目标元素选择器
                        click: function (type) {
                            // console.log(this, type);
                            // layer.msg(type);
                            if (type === "getCheckedNodeData") {
                                $("#getCheckedNodeData").click();
                            }
                            if (type === "clear") {
                                tree.reload('titleList', { // options
                                    data: getTree()
                                }); // 重载实例
                                downloadArray = new Array();
                            }
                        }
                    });


                    tree.render({
                        elem: '#openPage',
                        data: getTree(),
                        showCheckbox: true,
                        onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                        id: 'titleList',
                        isJump: false, // 是否允许点击节点时弹出新窗口跳转
                        click: function (obj) {
                            var data = obj.data; //获取当前点击的节点数据
                            if (downloadArray.length !== 0) {
                                layer.msg("正在下载中，请等待下载完后再继续");
                                return;
                            }
                            console.log([data])
                            downloadArray = getMenuArray([data])
                            doDownload()
                        }
                    });
                    // 按钮事件
                    layui.util.event('lay-on', {
                        getChecked: function (othis) {
                            console.log(othis)
                            var checkedData = tree.getChecked('titleList'); // 获取选中节点的数据

                            console.log(checkedData[0]);
                            if (checkedData.length === 0) {
                                return;
                            }
                            if (downloadArray.length !== 0) {
                                layer.msg("正在下载中，请等待下载完后再继续");
                                return;
                            }
                            downloadArray = getMenuArray(checkedData)
                            doDownload()
                        },
                        reload: function () {
                            tree.reload('titleList', { // options
                                data: getTree()
                            }); // 重载实例
                            downloadArray = new Array();
                        }
                    });
                }
            });
        }


        function getTree() {
            let indexMap = new Map();
            let index = 0;
            let tree = new Array();
            let allLines = getAllLines();
            for (let i = 0; i < allLines.length; i++) {
                if (!indexMap.hasOwnProperty(allLines[i].date)) {
                    indexMap[allLines[i].date] = {
                        "id": i,
                        "sehuatang_type": allLines[index].sehuatang_type,
                        "title": allLines[i].date,
                        "href": "",
                        "children": [],
                        "spread": true,
                        "field": ""
                    }
                }
                indexMap[allLines[i].date].children.push({
                    'id': allLines[i].id,
                    "sehuatang_type": allLines[index].sehuatang_type,
                    "title": allLines[i].title,
                    "href": allLines[i].href,
                    "date": allLines[i].date,
                    "children": [],
                    "spread": true,
                    "field": "",
                });
            }
            for (let key in indexMap) {
                tree.push(indexMap[key]);
            }
            return tree;
        }

        function getAllLines() {
            let lines = new Array();
            /*
            {
            "id":"",
            "title": "",
            "href" : "",
            "date": ""
            }
            */
            let nav = document.getElementById("pt").getElementsByTagName("a")
            let sehuatang_type = nav[nav.length - 1].innerText;
            let tbodys = document.getElementsByTagName("tbody");
            for (let index = 0; index < tbodys.length; index++) {
                // console.log(tbodys[index])
                if (tbodys[index].getAttribute("id") !== null && tbodys[index].getAttribute("id").indexOf("normalthread") > -1) {
                    let id = tbodys[index].getAttribute("id").split('_')[1];
                    console.log(id)
                    let eldate = tbodys[index].getElementsByTagName("td")[1].getElementsByTagName('span')
                    let date = eldate[1] === undefined ? eldate[0].innerText : eldate[1].getAttribute("title")
                    console.log(date)
                    console.log(sehuatang_type)
                    let titleBox = tbodys[index].getElementsByTagName("th")[0].getElementsByTagName("a")
                    let href = ''; let title = '';
                    for (let i = 0; i < titleBox.length; i++) {
                        if (titleBox[i].getAttribute("class") !== null && titleBox[i].getAttribute("class") == 's xst') {
                            href = titleBox[i].href
                            title = titleBox[i].innerText
                            break;
                        }
                    }

                    console.log(title)
                    console.log(href)
                    lines.push({
                        "id": id,
                        "sehuatang_type": sehuatang_type,
                        "title": title,
                        "href": href,
                        "date": date
                    });

                }
            }
            return lines;
        }
        function getMenuArray(trees) {
            let menus = new Array();
            for (let index = 0; index < trees.length; index++) {
                if (trees[index].children.length === 0) {
                    menus.push({
                        'id': trees[index].id,
                        "sehuatang_type": trees[index].sehuatang_type,
                        "title": trees[index].title,
                        "href": trees[index].href,
                        "date": trees[index].date
                    });
                } else {
                    for (let j = 0; j < trees[index].children.length; j++) {
                        menus.push({
                            'id': trees[index].children[j].id,
                            "sehuatang_type": trees[index].sehuatang_type,
                            "title": trees[index].children[j].title,
                            "href": trees[index].children[j].href,
                            "date": trees[index].date
                        });
                    }

                }
            }
            return menus;
        }



    }
    function saveContentToLocal(el) {
        let title = getTitleText(el);
        console.log(title)
        DownloadBT(el)
        try {
            var isFileSaverSupported = !!new Blob;
            var blob = new Blob([title], { type: "text/plain;charset=utf-8" });
            saveAs(blob, title + ".txt");
        } catch (e) {
            console.log(e);
        }

    }
    function DownloadBT(el) {
        var attnms = el.getElementsByClassName("attnm");
        for (let index = 0; index < attnms.length; index++) {
            attnms[index].getElementsByTagName("a")[0].click();
        }
    }

    function copyTitleAndBlockcode(el) {
        let info = getTitleText(el) + "\n";
        info += getPageLink(el) + "\n";
        var blockcode = el.getElementsByClassName("blockcode");
        for (let index = 0; index < blockcode.length; index++) {
            info += blockcode[index].getElementsByTagName("li")[0].innerText + "\n";
        }
        console.log(info);
    }

    function getTitle(el) {
        return el.getElementById("thread_subject");
    }
    function getTitleText(el) {
        return getTitle(el).innerText;
    }

    function getPageLink(el) {
        return el.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
    }
})();