// ==UserScript==
// @name         uaa 列表页相关操作
// @namespace    http://tampermonkey.net/
// @version      2025-12-27.01
// @description  try to take over the world!
// @author       You
// @match        https://*.uaa.com/novel/list*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @grant        unsafeWindow
// @grant GM_xmlhttpRequest
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
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js"),
        addScript('jszip_id', "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"),
    ]).then(() => {
        run();
    });

    /*global $,layui,layer,util,JSZip,saveAs*/


    function run() {

        class BackgroundTabScheduler {
            constructor({
                            interval = 1000,
                            jitter = 600
                        } = {}) {
                this.queue = [];
                this.interval = interval;
                this.jitter = jitter;
                this.running = false;
            }

            enqueue(url) {
                if (this.running) return;
                this.queue.push(url);
            }

            start() {
                // if (!userEvent || !userEvent.isTrusted) {
                //     console.warn('必须在用户事件中启动');
                //     return;
                // }

                if (this.running) return;
                this.running = true;

                this._tick();
            }

            clear() {
                if (this.running) return;
                this.running = false;
                this.queue = null;
            }

            async _tick() {
                if (!this.queue.length) {
                    this.running = false;
                    return;
                }

                const url = this.queue.shift();
                this._openInBackground(url);

                // 此处为导出完成后发出通知
                if (!this.queue.length) {
                    layui.layer.alert('打开完毕',
                        {icon: 1, shadeClose: true},
                        function (index) {
                            layer.close(index);
                        });
                }

                const delay =
                    this.interval +
                    Math.random() * this.jitter;

                setTimeout(() => this._tick(), delay);
            }

            _openInBackground(url) {
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';

                // 不插入 DOM，降低痕迹
                a.dispatchEvent(
                    new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        ctrlKey: true,
                        // view: window
                    })
                );
            }
        }

        const scheduler = new BackgroundTabScheduler({
            interval: 100,
            jitter: 100
        });

        class BackgroundExportEpubScheduler {
            constructor({
                            interval = 1000, jitter = 600
                        } = {}) {
                this.queue = [];
                this.interval = interval;
                this.jitter = jitter;
                this.running = false;
            }

            enqueue(url) {
                if (this.running) return;
                this.queue.push(url);
            }

            async start() {
                if (this.running) return;
                this.running = true;

                await this._tick();
            }

            clear() {
                if (this.running) return;
                this.running = false;
                this.queue = null;
            }

            async _tick() {
                if (!this.queue.length) {
                    this.running = false;
                    return;
                }

                const url = this.queue.shift();
                await this._openInBackground(url);

                // 此处为导出完成后发出通知
                if (!this.queue.length) {
                    layui.layer.alert('导出完毕',
                        {icon: 1, shadeClose: true},
                        function (index) {
                            layer.close(index);
                        });
                }

                const delay = this.interval + Math.random() * this.jitter;

                setTimeout(() => this._tick(), delay);
            }

            async _openInBackground(url) {
                await buildEpub(url);
            }
        }

        const exportEpubScheduler = new BackgroundExportEpubScheduler({
            interval: 500, jitter: 100
        });


        const fixbarStyle = `
                    background-color: #ff5555;
                    font-size: 12px;
                    width:80px;
                    height:36px;
                    line-height:36px;
                    margin-bottom:6px;
                    border-radius:10px;
                    `;


        layui.use(function () {
            var util = layui.util;
            // 自定义固定条
            util.fixbar({
                bars: [
                    // {
                    //     type: 'openCurrentPageAllBook',
                    //     content: '打开本页全部书籍',
                    //     style: fixbarStyle
                    // },
                    {
                        type: 'bookList',
                        content: '本页书籍单',
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
                    mouseleave: function () {
                        layer.closeAll('tips');
                    }
                },
                // 点击事件
                click: function (type) {
                    // console.log(this, type);

                    if (type === "openCurrentPageAllBook") {


                    }
                    if (type === "bookList") {
                        openPage();
                    }
                }
            });
        });


        function openPage() {
            layui.layer.open({
                type: 1,
                title: "书籍列表",
                shadeClose: false,
                offset: 'r',
                shade: 0,
                anim: 'slideLeft', // 从右往左
                area: ['25%', '80%'],
                skin: 'layui-layer-rim', // 加上边框
                maxmin: true, //开启最大化最小化按钮
                content: `<div id='openPage'></div>`,
                success: function (layero, index, that) {

                    var tree = layui.tree;
                    var layer = layui.layer;
                    var util = layui.util;
                    tree.render({
                        elem: '#openPage',
                        data: getMenuTree(),
                        showCheckbox: true,
                        onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                        id: 'title',
                        isJump: false, // 是否允许点击节点时弹出新窗口跳转
                        click: function (obj) {
                            let data = obj.data; //获取当前点击的节点数据
                            let all = getMenuTreeChecked(tree, 'title');
                            for (let i = 0; i < all.length; i++) {
                                if (data.id === all[i].id) {
                                    all[i].checked = !data.checked;
                                }
                            }
                            tree.reload('title', {data: all}); // 重载实例
                            //tree.setChecked('title', [data.id]);
                        }
                    });

                    const openPagefixbarStyle = `
                    background-color: #ff5555;
                    font-size: 16px;
                    width:120px;
                    height:36px;
                    line-height:36px;
                    margin-bottom:6px;
                    border-radius:10px;
                    `
                    // 自定义固定条
                    util.fixbar({
                        bars: [
                            {
                                type: '全选',
                                content: '全选',
                                style: openPagefixbarStyle,
                            },
                            {
                                type: '1-12',
                                content: '选中1-12',
                                style: openPagefixbarStyle,
                            },
                            {
                                type: '13-24',
                                content: '选中13-24',
                                style: openPagefixbarStyle,
                            },
                            {
                                type: '25-36',
                                content: '选中25-36',
                                style: openPagefixbarStyle,
                            },
                            {
                                type: '37-49',
                                content: '选中37-49',
                                style: openPagefixbarStyle,
                            },
                            {
                                id: "getCheckedNodeData",
                                type: 'getCheckedNodeData',
                                content: '打开选中书籍',
                                style: openPagefixbarStyle,
                            },
                            {
                                type: 'exportEpub',
                                content: '导出EPUB',
                                style: openPagefixbarStyle,
                            },
                            {
                                type: 'clear',
                                content: '清除选中',
                                style: openPagefixbarStyle,
                            }],
                        default: true, // 是否显示默认的 bar 列表 --  v2.8.0 新增
                        css: {bottom: "15%", right: 30},
                        target: layero, // 插入 fixbar 节点的目标元素选择器
                        click: function (type) {
                            if (type === "getCheckedNodeData") {
                                if (scheduler.running) {
                                    layer.msg("正在打开中，请等待打开完后再继续");
                                    return;
                                }
                                getCheckedNodeData()
                                scheduler.start();
                                return;
                            }
                            if (type === "exportEpub") {
                                if (exportEpubScheduler.running) {
                                    layer.msg("正在导出中，请等待导出完后再继续");
                                    return;
                                }
                                exportEpub().then(() => {
                                });
                                return;
                            }
                            if (type === "clear") {
                                reloadTree();
                                scheduler.clear();
                                exportEpubScheduler.clear();
                                return;
                            }
                            tree.reload('title', {data: setMenuTreeChecked(tree, 'title', type)}); // 重载实例
                        }
                    });

                    function getCheckedNodeData() {
                        let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                        checkedData.reverse();

                        for (let i = 0; i < checkedData.length; i++) {
                            // console.log(checkedData[i]);
                            scheduler.enqueue(checkedData[i].href)
                        }
                    }

                    async function exportEpub() {
                        let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                        checkedData.reverse();

                        for (let i = 0; i < checkedData.length; i++) {
                            // console.log(checkedData[i]);
                            exportEpubScheduler.enqueue(checkedData[i].href)
                        }
                        await exportEpubScheduler.start();
                    }

                    function reloadTree() {
                        tree.reload('title', { // options
                            data: getMenuTree()
                        }); // 重载实例
                    }


                }
            });
        }

        function getMenuTree() {
            let menus = [];
            let lis = document.querySelectorAll(".cover_box > a");
            for (let index = 0; index < lis.length; index++) {
                // console.log(lis[index].href)
                let url = new URL(lis[index].href); // 获取当前URL对象
                let params = url.searchParams; // 获取 searchParams 对象
                menus.push({
                    'id': params.get('id'),
                    "title": lis[index].title,
                    "href": lis[index].href,
                    "spread": true,
                    "field": "",
                    "checked": false
                });
            }
            // console.log(menus)
            return menus;
        }

        function setMenuTreeChecked(t, treeId, type) {
            let all = getMenuTreeChecked(t, treeId)
            switch (type) {
                case "全选": {
                    for (let i = 0; i < all.length; i++) {
                        all[i].checked = true;
                    }
                }
                    break;
                case "1-12": {
                    for (let i = 0; i < all.length; i++) {
                        if (i >= 0 && i < 12) {
                            all[i].checked = !all[i].checked;
                        }
                    }
                }
                    break;
                case "13-24": {
                    for (let i = 0; i < all.length; i++) {
                        if (i >= 12 && i < 24) {
                            all[i].checked = !all[i].checked;
                        }
                    }
                }
                    break;
                case "25-36": {
                    for (let i = 0; i < all.length; i++) {
                        if (i >= 24 && i < 36) {
                            all[i].checked = !all[i].checked;
                        }
                    }
                }
                    break;
                case "37-49": {
                    for (let i = 0; i < all.length; i++) {
                        if (i >= 36 && i <= 48) {
                            all[i].checked = !all[i].checked;
                        }
                    }
                }
                    break;
            }
            return all;
        }

        function getMenuTreeChecked(t, treeId) {
            let checkeds = t.getChecked(treeId);
            let checkedIds = [];
            for (let i = 0; i < checkeds.length; i++) {
                checkedIds.push(checkeds[i].id);
            }
            // console.log(checkeds)
            let all = getMenuTree();
            for (let i = 0; i < all.length; i++) {
                if (checkedIds.includes(all[i].id)) {
                    all[i].checked = true;
                }
            }
            return all;
        }


        function fetchBookIntro(url) {
            return fetch(url)
                .then(response => {
                    // 确保请求成功
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    // 2. 获取 HTML 文本
                    return response.text();
                })
                .then(htmlString => {
                    // 3. 使用 DOMParser 解析 HTML 字符串
                    const parser = new DOMParser();
                    return parser.parseFromString(htmlString, 'text/html');
                })
                .catch(error => {
                    console.error('获取或解析 HTML 时发生错误:', error);
                });
        }

        function fetchImage(url) {
            return fetch(url, {credentials: 'include', mode: 'cors'})
                .then(res => {
                    if (!res.ok) throw new Error('fetch failed');
                    return res.blob();
                });
        }


        class CommonRes {

            static logoImg = null
            static girlImg = null
            static line1Img = null
            static mainCss = null
            static fontsCss = null

            static gmFetchCoverImageBlob(url) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET', url, responseType: 'blob', headers: {
                            Referer: "https://www.uaa.com/",
                        }, onload: res => {
                            if (res.status === 200) {
                                resolve(res.response);
                            } else {
                                reject(new Error('HTTP ' + res.status));
                            }
                        }, onerror: err => reject(err),
                    });
                });
            }

            static gmFetchImageBlob(url) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET', url, responseType: 'blob', onload: res => {
                            if (res.status === 200) {
                                resolve(res.response);
                            } else {
                                reject(new Error('HTTP ' + res.status));
                            }
                        }, onerror: err => reject(err),
                    });
                });
            }

            static gmFetchText(url) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: 'GET', url,
                        responseType: 'arraybuffer',
                        onload: res => {
                            if (res.status !== 200) {
                                reject(new Error(res.status));
                                return;
                            }

                            //const decoder = new TextDecoder('utf-8');
                            //const text = decoder.decode(res.response);
                            resolve(res.response);
                        },
                        onerror: reject,
                    });
                });
            }

            static async getLogoImg() {
                if (this.logoImg === null) {
                    this.logoImg = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp');
                }
                return this.logoImg;
            }

            static async getGirlImg() {
                if (this.girlImg === null) {
                    this.girlImg = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg');
                }
                return this.girlImg;
            }

            static async getLine1Img() {
                if (this.line1Img === null) {
                    this.line1Img = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/line1.webp');
                }
                return this.line1Img;
            }

            static async getMainCss() {
                if (this.mainCss === null) {
                    this.mainCss = await this.gmFetchText('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/main.css');
                }
                return this.mainCss;
            }

            static async getFontsCss() {
                if (this.fontsCss === null) {
                    this.fontsCss = await this.gmFetchText('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/fonts.css');
                }
                return this.fontsCss;
            }
        }

        function getChapterMenu(doc) {
            let menus = [];
            let lis = doc.querySelectorAll(".catalog_ul > li");
            for (let index = 0; index < lis.length; index++) {
                let preName = "";
                if (lis[index].className.indexOf("menu") > -1) {
                    let alist = lis[index].getElementsByTagName("a");
                    for (let j = 0; j < alist.length; j++) {
                        let aspan = alist[j].querySelector("span");
                        if (aspan) {
                            aspan.remove()
                        }
                        menus.push({
                            'id': (index + 1) * 100000000 + j,
                            "title": preName + alist[j].innerText.trim(),
                            "href": alist[j].href,
                            "children": [],
                        });
                    }
                }
                if (lis[index].className.indexOf("volume") > -1) {
                    preName = lis[index].querySelector("span").innerText.trim();
                    let children = [];
                    let alist = lis[index].getElementsByTagName("a");
                    for (let j = 0; j < alist.length; j++) {
                        let aspan = alist[j].querySelector("span");
                        if (aspan) {
                            aspan.remove()
                        }
                        children.push({
                            'id': (index + 1) * 100000000 + j + 1,
                            "title": alist[j].innerText.trim(),
                            "href": alist[j].href,
                            "children": [],
                        });
                    }
                    menus.push({
                        'id': (index + 1) * 100000000, "title": preName, "href": "", "children": children,
                    });
                }
            }
            return menus;
        }


        async function buildEpub(url) {
            const zip = new JSZip();

            let doc = await fetchBookIntro(url)

            let bookName = doc.getElementsByClassName('info_box')[0].getElementsByTagName("h1")[0].innerText.trim();
            let author = '';
            let type = ""
            let tags = doc.getElementsByClassName('tag_box')[0].innerText.replaceAll('\n', '').replaceAll('标签：', '').replaceAll(' ', '').replaceAll('#', ' #').trim()
            //       console.log(tags);
            let rou = doc.getElementsByClassName('props_box')[0].getElementsByTagName('li')[0].innerText.trim();
            let score = "";
            let lastUpdateTime = "";
            let intro = doc.getElementsByClassName('brief_box')[0].innerText.replaceAll('小说简介：', "").replaceAll('\n', '').trim();
            //         console.log(intro);

            let infoBox = doc.getElementsByClassName('info_box')[0].getElementsByTagName("div");

            for (let i = 0; i < infoBox.length; i++) {
                if (infoBox[i].innerText.trim().includes("最新：")) {
                    lastUpdateTime = infoBox[i].innerText.replace("最新：", '').trim();
                }
                if (infoBox[i].innerText.trim().includes("作者：")) {
                    author = infoBox[i].innerText.replace("作者：", '').trim();
                }
                if (infoBox[i].innerText.trim().includes("题材：")) {
                    type = infoBox[i].innerText.replace("题材：", '').replaceAll('\n', '').replaceAll(' ', '').trim();
                }
                if (infoBox[i].innerText.trim().includes("评分：")) {
                    score = infoBox[i].innerText.replace("评分：", '').trim();
                }
            }


            let chapters = getChapterMenu(doc)

            zip.file('mimetype', 'application/epub+zip', {compression: 'STORE'});
            zip.folder('META-INF').file('container.xml', `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

            const o = zip.folder('OEBPS');
            const cssFolder = o.folder("Styles");
            cssFolder.file('main.css', CommonRes.getMainCss());
            cssFolder.file('fonts.css', CommonRes.getFontsCss());

            const imgFolder = o.folder("Images")

            let coverUrl = doc.getElementsByClassName("cover")[0].src;

            imgFolder.file("cover.jpg", await CommonRes.gmFetchCoverImageBlob(coverUrl));

            imgFolder.file("logo.webp", await CommonRes.getLogoImg());

            imgFolder.file("girl.jpg", await CommonRes.getGirlImg());


            const manifest = [], spine = [], ncxNav = [];
            const textFolder = o.folder('Text');

            // cover.xhtml
            textFolder.file(`cover.xhtml`, genCoverHtmlPage());
            manifest.push(`<item id="cover.xhtml" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>`);
            spine.push(`<itemref idref="cover.xhtml"  properties="duokan-page-fullscreen"/>`);
            ncxNav.push(`<navPoint id="cover.xhtml" playOrder="10000">
    <navLabel><text>封面</text></navLabel>
    <content src="Text/cover.xhtml"/>
</navPoint>`);
            // fy.xhtml
            textFolder.file(`fy.xhtml`, genFyHtmlPage({
                name: bookName, author: author,
            }));
            manifest.push(`<item id="fy.xhtml" href="Text/fy.xhtml" media-type="application/xhtml+xml"/>`);
            spine.push(`<itemref idref="fy.xhtml"/>`);
            ncxNav.push(`<navPoint id="fy.xhtml" playOrder="10001">
    <navLabel><text>扉页</text></navLabel>
    <content src="Text/fy.xhtml"/>
</navPoint>`);

            // intro.xhtml
            textFolder.file(`intro.xhtml`, genIntroHtmlPage({
                bookName: bookName,
                author: author,
                type: type,
                tags: tags,
                rou: rou,
                score: score,
                lastUpdateTime: lastUpdateTime,
                intro: intro
            }));
            manifest.push(`<item id="intro.xhtml" href="Text/intro.xhtml" media-type="application/xhtml+xml"/>`);
            spine.push(`<itemref idref="intro.xhtml"/>`);
            ncxNav.push(`<navPoint id="intro.xhtml" playOrder="10002">
    <navLabel><text>内容简介</text></navLabel>
    <content src="Text/intro.xhtml"/>
</navPoint>`);

            chapters.forEach((c, i) => {
                let volumeIndex = 0;
                const id = `vol_${String(i + 1).padStart(4, '0')}`;
                manifest.push(`<item id="${id}" href="Text/${id}.xhtml" media-type="application/xhtml+xml"/>`);
                spine.push(`<itemref idref="${id}"/>`);

                if (c.children.length === 0) {
                    textFolder.file(`${id}.xhtml`, genHtmlPage(c.title));
                    ncxNav.push(`<navPoint id="${id}" playOrder="${i + 1}">
    <navLabel><text>${c.title}</text></navLabel>
    <content src="Text/${id}.xhtml"/>
</navPoint>`);
                } else {
                    ++volumeIndex;
                    textFolder.file(`${id}.xhtml`, genVolumeHtmlPage(c.title, volumeIndex));

                    let volumeNcxNav = `<navPoint id="${id}" playOrder="${i + 1}">
    <navLabel><text>${c.title}</text></navLabel>
    <content src="Text/${id}.xhtml"/>`

                    c.children.forEach((d, j) => {
                        const did = `vol_${String(i + 1).padStart(4, '0')}_${String(j + 1).padStart(4, '0')}`;
                        manifest.push(`<item id="${did}" href="Text/${did}.xhtml" media-type="application/xhtml+xml"/>`);
                        spine.push(`<itemref idref="${did}"/>`);
                        textFolder.file(`${did}.xhtml`, genHtmlPage(d.title));
                        let ncxNav = `
 <navPoint id="${did}" playOrder="${i + 1}">
    <navLabel><text>${d.title}</text></navLabel>
    <content src="Text/${did}.xhtml"/>
</navPoint>
                        `;
                        volumeNcxNav += `\n${ncxNav}`
                    });

                    volumeNcxNav += `</navPoint>`;
                    ncxNav.push(volumeNcxNav);
                }


            });

            let contentOpfStr = `<?xml version="1.0"?>
<package version="2.0" unique-identifier="duokan-book-id" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <metadata xmlns:opf="http://www.idpf.org/2007/opf">
      <dc:identifier id="duokan-book-id" opf:scheme="UUID" xmlns:opf="http://www.idpf.org/2007/opf">${crypto.randomUUID()}</dc:identifier>
      <dc:title>${bookName}</dc:title>
      <dc:language>zh-CN</dc:language>
      <dc:creator opf:role="aut" opf:file-as="${author}, " xmlns:opf="http://www.idpf.org/2007/opf">${author}</dc:creator>
      <dc:date opf:event="creation" xmlns:opf="http://www.idpf.org/2007/opf">${new Date()}</dc:date>
      <meta name="cover" content="cover" />
  </metadata>
  <manifest>
        ${manifest.join('\n        ')}
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="main.css" href="Styles/main.css" media-type="text/css"/>
        <item id="fonts.css" href="Styles/fonts.css" media-type="text/css"/>
        <item id="cover" href="Images/cover.jpg" media-type="image/jpeg"/>
        <item id="logo.webp" href="Images/logo.webp" media-type="image/webp"/>
        <item id="girl.jpg" href="Images/girl.jpg" media-type="image/jpeg"/>
    </manifest>
    <spine toc="ncx">
        ${spine.join('\n        ')}
    </spine>
</package>`;
            o.file('content.opf', contentOpfStr);


            let tocNcxStr = `<?xml version="1.0"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
<head>
    <meta name="dtb:uid" content="${crypto.randomUUID()}"/>
    <meta name="dtb:depth" content="2" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
</head>
<docTitle>
    <text>${bookName}</text>
</docTitle>
  <docAuthor>
    <text>${author}, </text>
  </docAuthor>
<navMap>
${ncxNav.join('\n')}
</navMap>
</ncx>`;
            o.file('toc.ncx', tocNcxStr);

            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `${bookName} 作者：${author}.epub`);
        }


    }

    function genCoverHtmlPage() {
        return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>Cover</title>
</head>

<body>
<div style="text-align: center;padding: 0pt;margin: 0pt;"><img width="100%" src="../Images/cover.jpg"/>
</div>
</body>
</html>`;
    }

    function genFyHtmlPage(book = {
        name: "书名", author: "作者名",
    }) {
        return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>扉页</title>
    <style type="text/css">
\t\t.pic {
\t\t\tmargin: 0% 0% 0 0%;
\t\t\tpadding: 2px 2px;
\t\t\tborder: 1px solid #f5f5dc;
\t\t\tbackground-color: rgba(250,250,250, 0);
\t\t\tborder-radius: 1px;
\t\t}
    </style>
</head>
<body style="text-align: center;">
<div class="pic"><img src="../Images/cover.jpg" style="width: 100%; height: auto;"/></div>
<h1 style="margin-top: 5%; font-size: 110%;">${book.name}</h1>
<div class="author" style="margin-top: 0;"><b>${book.author}</b> <span style="font-size: smaller;">/ 著</span></div>
</body>
</html>`;
    }

    function genIntroHtmlPage(intro = {
        bookName: "书名",
        author: "作者名",
        type: "分类",
        tags: "标签",
        rou: "肉量",
        score: "评分",
        lastUpdateTime: "最后更新时间",
        intro: "简介",
    }) {
        return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">
<head>
    <title>Intro</title>
    <link href="../Styles/fonts.css" type="text/css" rel="stylesheet" />
    <link href="../Styles/main.css" type="text/css" rel="stylesheet" />
</head>
<body class="speci">
<div class="oval">
<h2 class="ovaltitle" style="margin-bottom:2em;">内容简介</h2>
    <p>📖 书名：${intro.bookName}</p>
    <p>👤 作者：${intro.author}</p>
    <p>🗂 分类：${intro.type}</p>
    <p>🔖 标签：${intro.tags}</p>
    <p>🗿 肉量：${intro.rou}</p>
    <p>✏ 评分：${intro.score}</p>
    <p>🕰 上次更新：${intro.lastUpdateTime}</p>
    <p>🏷 简介：${intro.intro}</p>
</div>
</body>
</html>
`;
    }

    function genHtmlPage(title) {
        const titleArray = title.split(' ');
        let t1 = titleArray[0];
        let t2 = "";
        if (titleArray.length > 1) {
            t2 = titleArray.slice(1).join(' ');
        }

        return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${title}</title>
    <link href="../Styles/fonts.css" rel="stylesheet" type="text/css"/>
    <link href="../Styles/main.css" rel="stylesheet" type="text/css"/>
  </head>
  <body>
     <div class="chapter-head"><img alt="logo" class="chapter-head" src="../Images/logo.webp"/></div>
     <h2 class="chapter-title"><span>${t1}</span><br/>${t2}</h2>
     
     <p>null</p>
  </body>
</html>`;
    }


    function genVolumeHtmlPage(title, i = 0) {
        const titleArray = title.split(' ');
        return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>${title}</title>
    <link href="../Styles/fonts.css" type="text/css" rel="stylesheet"/>
    <link href="../Styles/main.css" type="text/css" rel="stylesheet"/>
</head>

<body class="bg_${String(i + 1).padStart(2, '0')}">
<h1>${titleArray.join("<br />")}</h1>

</body>
</html>`;
    }
})();