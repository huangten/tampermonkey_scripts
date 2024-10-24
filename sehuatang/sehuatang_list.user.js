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
    unsafeWindow.onload = function () {

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
                }, 1000 * 2);
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
            // return
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
                    let iframes = document.getElementsByTagName('iframe');
                    console.log(iframes)
                    for (let index = 0; index < iframes.length; index++) {
                        iframes[index].contentWindow.scrollTo({
                            top: 4000,
                            left: 0,
                            behavior: "smooth",
                        });
                    }

                    setTimeout(() => {
                        let iframeDocument = layer.getChildFrame('html', index);
                        let idocument = iframeDocument[0];
                        // saveContentToLocal(idocument);
                        console.log(idocument)
                        getInfo(idocument)
                        let msg = {
                            "handle": "lhd_close",
                            "layer_index": index
                        }
                        unsafeWindow.postMessage(msg);
                    }, 1000);

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


        function getInfo(el) {
            setTimeout(() => {

                const type = getType(el);

                const imageLinks = getImages(el);
                console.log(imageLinks);
                const imgs = [];

                for (let index = 0; index < imageLinks.length; index++) {
                    let paths = imageLinks[index].split('/')
                    let file = paths[paths.length - 1].split('.');
                    let ext = file[file.length - 1];
                    let name = getSelfFilename(el) + "_" + index + "." + ext
                    imgs.push(
                        {
                            'isExist': false,
                            "hasDownload": false,
                            "filename": name,
                            "href": imageLinks[index]
                        }
                    );
                }

                const magnets = getMagnets(el);
                const btNames = getBtNames(el);

                const time = getTime(el);

                const selfFilename = getFileName(getSelfFilename(el), 'txt');
                const sehuatangTexts = getsehuatangTexts(el);
                let info = {
                    "title": getTitleText(el),
                    "avNumber": getAvNumber(el),
                    "selfFilename": selfFilename,
                    "year": time.split(' ')[0].split('-')[0],
                    "month": time.split(' ')[0].split('-')[1],
                    'day': time.split(' ')[0].split('-')[2],
                    "date": time.split(' ')[0],
                    "time": time,
                    "sehuatangInfo": {
                        "type": type,
                        "link": getPageLink(el),
                        "infos": sehuatangTexts,
                        "imgs": imgs,
                        "magnets": magnets,
                        "bts": btNames
                    }
                }

                try {
                    var isFileSaverSupported = !!new Blob;
                    var blob = new Blob([JSON.stringify(info, null, 4)], { type: "text/plain;charset=utf-8" });
                    saveAs(blob, selfFilename);
                } catch (e) {
                    console.log(e);
                }
                doBtDownload(el)
            }, 10)

        }

        function saveImage(imageLink, name) {
            let res = false;
            fetch(imageLink)
                // 获取 blob 对象
                .then(res => res.blob())
                .then(blob => {
                    let blob1 = new Blob(blob, { type: "image/jpeg;" });
                    saveAs(blob1, name);
                });
            try {

                res = true;
            } catch (e) {
                res = false;
            }
            return res;
        }

        function getAvNumber(el) {
            const sehuatangTexts = getsehuatangTexts(el);
            let avNumber = '';
            for (let index = 0; index < sehuatangTexts.length; index++) {
                const element = sehuatangTexts[index];
                if (element.indexOf("品番：") > -1) {
                    avNumber = element.replace("品番：", "").trim();
                    return avNumber
                }
            }
            const title = getTitleText(el);
            const type = getType(el);
            if (type.localeCompare("高清中文字幕") === 0 || type.localeCompare('4K原版') === 0) {
                return title.split(' ')[0];
            }
            return title;
        }

        function getTime(el) {
            let time = '';
            try {
                time = el.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].getElementsByTagName('span')[0].getAttribute("title")
            } catch (e) {
                time = el.getElementsByClassName("authi")[1].getElementsByTagName('em')[0].innerText.replace("发表于", '').trim()
            }
            return time
        }

        function getType(el) {
            return el.getElementsByClassName("bm cl")[0].getElementsByTagName("a")[3].innerText.trim();
        }

        function getImages(el) {
            const imgs = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('img');
            let res = [];
            for (let index = 0; index < imgs.length; index++) {
                const element = imgs[index];
                if (element.getAttribute("id") !== null && element.getAttribute("id").indexOf('aimg') > -1) {
                    res.push(element.src);
                }
            }
            return res;
        }

        function getsehuatangTexts(el) {
            let sehuatangTextArray = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].innerText.split("\n").filter((item) => {
                return item !== null && typeof item !== "undefined" && item !== "";
            });
            let replaceArr = ["播放", "复制代码", 'undefined', "立即免费观看"];
            for (let index = 0; index < sehuatangTextArray.length; index++) {
                for (let j = 0; j < replaceArr.length; j++) {
                    sehuatangTextArray[index] = sehuatangTextArray[index].replace(replaceArr[j], '').trim();
                }
            }
            return sehuatangTextArray;
        }

        function getSelfFilename(el) {
            let title = getTitleText(el);
            let replaceList = '/?*:|\<>'.split('');
            let equalList = ["con", "aux", "nul", "prn", "com0", "com1", "com2", "com3", "com4", "com5", "com6", "com7",
                "com8", "com9", "lpt0", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"];

            for (let i = 0; i < replaceList.length; i++) {
                title = title.replaceAll(replaceList[i], "_");
            }
            return title;
        }
        function getFileName(name, ext) {
            return name + '.' + ext;
        }

        function getDownloadBtTags(el) {
            let attnms = el.getElementsByClassName("attnm");
            let res = [];
            if (attnms !== null && attnms.length === 0) {
                res = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('a')
            } else {
                for (let index = 0; index < attnms.length; index++) {
                    let as = attnms[index].getElementsByTagName('a')
                    for (let j = 0; j < as.length; j++) {
                        res.push(as[j]);
                    }
                }
            }
            // console.log(res);
            return res
        }

        function getBtNames(el) {
            let attnms = getDownloadBtTags(el);
            let btNames = [];
            for (let index = 0; index < attnms.length; index++) {
                btNames.push(attnms[index].innerText.trim());
            }
            return btNames;
        }

        function doBtDownload(el) {
            let attnms = getDownloadBtTags(el);
            console.log(attnms)
            for (let index = 0; index < attnms.length; index++) {
                attnms[index].click();
            }
        }

        function getMagnets(el) {
            const magnets = [];
            var blockcode = document.getElementsByClassName("blockcode");
            for (let index = 0; index < blockcode.length; index++) {
                magnets.push(blockcode[index].getElementsByTagName("li")[0].innerText);
            }
            return magnets;
        }

        function getTitle(el) {
            return el.querySelector("#thread_subject");
        }
        function getTitleText(el) {
            return getTitle(el).innerText;
        }

        function getPageLink(el) {
            return el.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
        }



    }
})();