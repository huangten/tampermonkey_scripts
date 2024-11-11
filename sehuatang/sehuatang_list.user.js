// ==UserScript==
// @name         98堂 列表页相关操作
// @namespace    http://tampermonkey.net/
// @version      2024-11-11.1
// @description  try to take over the world!
// @author       You
// @match        https://*.sehuatang.org/forum*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
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
        addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js")
    ]).then(() => {
        run();
    });

    /*global $ layui layer saveAs util*/

    class DownloadManager {
        downloadStatus = {
            // 未开始
            // 下载中
            // 等待中
            // 暂停中
            // 下载完成
        };
        constructor() {
            this.allList = [];
            this.currentIndex = 0;
            this.status = 0;
        }
    }

    var downloadArray = new Array();
    function run() {

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
                }, 500);
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
        const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:100px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        layui.use(function () {
            var util = layui.util;
            // 自定义固定条
            util.fixbar({
                bars: [{
                    type: 'downloadAll',
                    content: '下载全部',
                    style: fixbarStyle
                }, {
                    type: 'clearDownloadList',
                    content: '清除待下载',
                    style: fixbarStyle
                }, {
                    type: 'menuList',
                    content: '章节列表',
                    style: fixbarStyle
                }],
                bgcolor: '#ba350f', // bar 的默认背景色
                default: false,
                css: { bottom: "18%" },
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
                area: ['75%', '80%'],
                content: menu.href,
                success: function (layero, index, that) {
                    // console.log(layero, index);
                    let iframes = document.getElementsByTagName('iframe');
                    // console.log(iframes)
                    for (let index = 0; index < iframes.length; index++) {
                        iframes[index].focus()
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
                        // console.log(idocument)
                        getInfo(idocument)
                        setTimeout(() => {
                            let msg = {
                                "handle": "lhd_close",
                                "layer_index": index
                            }
                            unsafeWindow.postMessage(msg);
                        }, 500);
                    }, 500)


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
                content: `<div id='openPage'></div>`,
                success: function (layero, index, that) {
                    console.log(layero, index, that)
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
                        css: { bottom: "10%", right: 30 },
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


                    function treeCheckedDownload() {
                        let checkedData = tree.getChecked('titleList'); // 获取选中节点的数据

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
                    }
                    function reloadTree() {
                        tree.reload('titleList', { // options
                            data: getTree()
                        }); // 重载实例
                        downloadArray = new Array();
                    }
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
                        "spread": false,
                        "checked": true,
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
                    "checked": true,
                    "spread": false,
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
            let replaceList = '/?*:|\\<>"'.split('');
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
            let aTags = [];
            if (attnms !== null && attnms.length === 0) {
                aTags = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('a')
            } else {
                for (let index = 0; index < attnms.length; index++) {
                    let as = attnms[index].getElementsByTagName('a')
                    for (let j = 0; j < as.length; j++) {
                        aTags.push(as[j]);
                    }
                }
            }
            let res = [];
            for (let index = 0; index < aTags.length; index++) {
                if (aTags[index].innerText.trim().indexOf('torrent') > -1) {
                    res.push(aTags[index])
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
            var blockcode = el.getElementsByClassName("blockcode");
            for (let index = 0; index < blockcode.length; index++) {
                magnets.push(blockcode[index].getElementsByTagName("li")[0].innerText);
            }
            let replaceArr = ["播放", "复制代码", 'undefined', "立即免费观看"];
            for (let index = 0; index < magnets.length; index++) {
                for (let j = 0; j < replaceArr.length; j++) {
                    magnets[index] = magnets[index].replace(replaceArr[j], '').trim();
                }
            }
            console.log(magnets)
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