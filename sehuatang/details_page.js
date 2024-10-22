// ==UserScript==
// @name         98堂 详情页相关
// @namespace    http://tampermonkey.net/
// @version      2024-10-17
// @description  try to take over the world!
// @author       You
// @match        https://www.sehuatang.org/thread*
// @match        https://www.sehuatang.org/forum.php?mod=viewthread&tid=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
// @require https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @require https://cdn.jsdelivr.net/npm/layui@2.9.18/dist/layui.min.js
// @require https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    var cssId = 'myCss'; // you could encode the css path itself to generate id..
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
    /*global $,layui,layer,saveAs,util*/


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
        // 自定义固定条
        util.fixbar({
            bars: [{
                type: 'getInfo',
                content: '获取信息',
                style: 'background-color: #FF5722;font-size: 14px;width:160px;'
            }, {
                type: 'copyTitleAndDownload',
                content: '复制标题和下载种子',
                style: 'background-color: #FF5722;font-size: 14px;width:160px;'
            }, {
                type: 'copyTitleAndBlockcode',
                content: '复制标题和磁力信息',
                style: 'background-color: #FF5722;font-size: 14px;width:160px;'
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
                if (type === "getInfo") {
                    getInfo();
                    return;
                }
                if (type === "copyTitleAndDownload") {
                    copyTitleAndDownload();
                    return;
                }
                if (type === "copyTitleAndBlockcode") {
                    copyTitleAndBlockcode();
                    return;
                }
            }
        });
    });
    function getInfo() {
        let el = document
        let sehuatangType = el.getElementsByClassName("bm cl")[0].getElementsByTagName("a")[3].innerText
        console.log(sehuatangType)

        let sehuatangTextArray = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].innerText.split("\n").filter((item) => {
            return item !== null && typeof item !== "undefined" && item !== "";
        });
        let replaceArr = ["播放", "复制代码", 'undefined', "立即免费观看"];
        for (let index = 0; index < sehuatangTextArray.length; index++) {
            for (let j = 0; j < replaceArr.length; j++) {
                sehuatangTextArray[index] = sehuatangTextArray[index].replace(replaceArr[j], '').trim();
            }
        }

        let info = {
            "title": "",
            "fanhao": "",
            "info_filename": "",
            "date": "",
            "sehuatangLink": "",
            "sehuatangText": sehuatangTextArray,
            "sehuatangImg": [
                {
                    "isExist": false,
                    "filename": "",
                    "href": ""
                }
            ],
            "magnet": ["", ""],
            "sehuatangBTInfo": [{
                "isExist": false,
                "filename": "",
                "href": ""
            }]
        }
        try {
            var isFileSaverSupported = !!new Blob;
            var blob = new Blob([JSON.stringify(info, null, 4)], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "test.txt");
        } catch (e) {
            console.log(e);
        }
        console.log(sehuatangTextArray)
        doBtDownload(el)
        console.log(getBtNames(el))
    }

    function saveContentToLocal(el) {
        getDownloadBtTags(el)
        try {
            var isFileSaverSupported = !!new Blob;
            var blob = new Blob([title], { type: "text/plain;charset=utf-8" });
            saveAs(blob, "test.txt");
        } catch (e) {
            console.log(e);
        }

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
        // console.log(attnms)
        for (let index = 0; index < attnms.length; index++) {
            attnms[index].click();
        }
    }

    function copyTitleAndDownload() {
        copyContext(getTitleText() + "\n")
        var attnms = document.getElementsByClassName("attnm");
        for (let index = 0; index < attnms.length; index++) {
            attnms[index].getElementsByTagName("a")[0].click();
        }
    }

    function copyTitleAndBlockcode() {
        let info = getTitleText() + "\n";
        info += getPageLink() + "\n";
        var blockcode = document.getElementsByClassName("blockcode");
        for (let index = 0; index < blockcode.length; index++) {
            info += blockcode[index].getElementsByTagName("li")[0].innerText + "\n";
        }
        copyContext(info);
    }

    function getTitle() {
        return document.getElementById("thread_subject");
    }
    function getTitleText() {
        return getTitle().innerText;
    }

    function getPageLink() {
        return document.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
    }
})();