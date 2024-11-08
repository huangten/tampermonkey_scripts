// ==UserScript==
// @name         98堂 详情页相关
// @namespace    http://tampermonkey.net/
// @version      2024-11-08.1
// @description  try to take over the world!
// @author       You
// @match        https://www.sehuatang.org/thread*
// @match        https://www.sehuatang.org/forum.php?mod=viewthread&tid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
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
        addScript('filesave_id', "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js"),
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
                bars: [{
                    type: 'getInfo',
                    content: '获取信息',
                    style: fixbarStyle
                }, {
                    type: 'copyTitleAndDownload',
                    content: '复制标题和下载种子',
                    style: fixbarStyle
                }, {
                    type: 'copyTitleAndBlockcode',
                    content: '复制标题和磁力信息',
                    style: fixbarStyle
                }],
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
                    if (type === "getInfo") {
                        getInfo(document);
                        return;
                    }
                    if (type === "copyTitleAndDownload") {
                        copyTitleAndDownload(document);
                        return;
                    }
                    if (type === "copyTitleAndBlockcode") {
                        copyTitleAndBlockcode(document);
                        return;
                    }
                }
            });
        });
        function getInfo(el) {
            unsafeWindow.scrollTo({
                top: 4000,
                left: 0,
                behavior: "smooth",
            });
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
            }, 500)

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

        function saveContentToLocal(el) {
            getDownloadBtTags(el)
            try {
                var isFileSaverSupported = !!new Blob;
                var blob = new Blob([title], { type: "text/plain;charset=utf-8" });
                saveAs(blob, getTitleText(el) + ".json");
            } catch (e) {
                console.log(e);
            }

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
            console.log(res);
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
            // console.log(attnms)
            for (let index = 0; index < attnms.length; index++) {
                attnms[index].click();
            }
        }

        function copyTitleAndDownload(el) {
            copyContext(getTitleText(el) + "\n")
            doBtDownload(el)
        }


        function getMagnets(el) {
            const magnets = [];
            var blockcode = document.getElementsByClassName("blockcode");
            for (let index = 0; index < blockcode.length; index++) {
                magnets.push(blockcode[index].getElementsByTagName("li")[0].innerText);
            }
            let replaceArr = ["播放", "复制代码", 'undefined', "立即免费观看"];
            for (let index = 0; index < magnets.length; index++) {
                for (let j = 0; j < replaceArr.length; j++) {
                    magnets[index] = magnets[index].replace(replaceArr[j], '').trim();
                }
            }
            // console.log(magnets)
            return magnets;
        }

        function copyTitleAndBlockcode(el) {
            let info = getTitleText(el) + "\n";
            info += getPageLink(el) + "\n";
            var blockcode = getMagnets(el);
            for (let index = 0; index < blockcode.length; index++) {
                info += blockcode[index] + "\n";
            }
            copyContext(info);
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
    }
})();