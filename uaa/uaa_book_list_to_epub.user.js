// ==UserScript==
// @name         uaa 列表页相关操作
// @namespace    http://tampermonkey.net/
// @version      2025-12-25.04
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
        addScript('jszip_id', "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js")
    ]).then(() => {
        run();
    });

    /*global $,layui,layer,util,JSZip,saveAs*/


    function run() {


        class BackgroundTabScheduler {
            constructor({
                            interval = 1000, jitter = 600
                        } = {}) {
                this.queue = [];
                this.interval = interval;
                this.jitter = jitter;
                this.running = false;
            }

            enqueue(url) {
                this.queue.push(url);
            }

            async start() {
                // if (!userEvent || !userEvent.isTrusted) {
                //     console.warn('必须在用户事件中启动');
                //     return;
                // }

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

                const delay = this.interval + Math.random() * this.jitter;

                setTimeout(() => this._tick(), delay);
            }

            async _openInBackground(url) {
                await buildEpub(url);
            }
        }

        const scheduler = new BackgroundTabScheduler({
            interval: 100, jitter: 100
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
                bars: [// {
                    //     type: 'openCurrentPageAllBook',
                    //     content: '打开本页全部书籍',
                    //     style: fixbarStyle
                    // },
                    {
                        type: 'bookList', content: '本页书籍单', style: fixbarStyle
                    }],

                default: true, css: {bottom: "15%"}, margin: 0, on: {
                    mouseenter: function (type) {
                        console.log(this.innerText)
                        layer.tips(type, this, {
                            tips: 4, fixed: true
                        });
                    }, mouseleave: function () {
                        layer.closeAll('tips');
                    }
                }, // 点击事件
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
                type: 1, title: "书籍列表", shadeClose: false, offset: 'r', shade: 0, anim: 'slideLeft', // 从右往左
                area: ['25%', '80%'], skin: 'layui-layer-rim', // 加上边框
                maxmin: true, //开启最大化最小化按钮
                content: `<div id='openPage'></div>`, success: function (layero, index, that) {

                    var tree = layui.tree;
                    var layer = layui.layer;
                    var util = layui.util;
                    tree.render({
                        elem: '#openPage', data: getMenuTree(), showCheckbox: true, onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                        id: 'title', isJump: false, // 是否允许点击节点时弹出新窗口跳转
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
                        bars: [{
                            type: '全选', content: '全选', style: openPagefixbarStyle,
                        }, {
                            type: '1-12', content: '选中1-12', style: openPagefixbarStyle,
                        }, {
                            type: '13-24', content: '选中13-24', style: openPagefixbarStyle,
                        }, {
                            type: '25-36', content: '选中25-36', style: openPagefixbarStyle,
                        }, {
                            type: '37-49', content: '选中37-49', style: openPagefixbarStyle,
                        }, {
                            id: "getCheckedNodeData",
                            type: 'getCheckedNodeData',
                            content: '打开选中书籍',
                            style: openPagefixbarStyle,
                        }, {
                            type: 'clear', content: '清除选中', style: openPagefixbarStyle,
                        }], default: true, // 是否显示默认的 bar 列表 --  v2.8.0 新增
                        css: {bottom: "15%", right: 30}, target: layero, // 插入 fixbar 节点的目标元素选择器
                        click: function (type) {
                            if (type === "getCheckedNodeData") {
                                getCheckedNodeData().then(r => {
                                })
                                // scheduler.start();
                                return;
                            }
                            if (type === "clear") {
                                reloadTree();
                                scheduler.clear();
                                return;
                            }
                            tree.reload('title', {data: setMenuTreeChecked(tree, 'title', type)}); // 重载实例
                        }
                    });

                    async function getCheckedNodeData() {
                        let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                        checkedData.reverse();

                        for (let i = 0; i < checkedData.length; i++) {
                            console.log(checkedData[i]);
                            scheduler.enqueue(checkedData[i].href)
                        }
                        await scheduler.start().then(() => {
                            console.log("aaaaaaaaaaaaa")
                        })
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

        function gmFetchImageBlob(url) {
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
            cssFolder.file('main.css', genMainCss());
            cssFolder.file('fonts.css', genFontCss());

            const imgFolder = o.folder("Images")

            let coverUrl = doc.getElementsByClassName("cover")[0].src;

            imgFolder.file("cover.jpg", await fetchImage(coverUrl));

            imgFolder.file("logo.webp", await gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp'));

            imgFolder.file("girl.jpg", await gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg'));


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

            // console.log(genIntroHtmlPage({
            //     bookName: bookName,
            //     author: author,
            //     type: type,
            //     tags: tags,
            //     rou: rou,
            //     score: score,
            //     lastUpdateTime: lastUpdateTime,
            //     intro: intro
            // }));
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


    function genMainCss() {
        return `@charset "utf-8";
@import url("fonts.css");
body {
  padding: 0px;
  margin-top: 0px;
  margin-bottom: 0px;
  margin-left: 10px;
  margin-right: 10px;
  line-height: 130%;
  text-align: justify;
}

div {
  margin: 0px;
  padding: 0px;
  line-height: 130%;
  text-align: justify;
}

p {
  margin: 1.2em 0;
  text-align: justify;
  font-size: 1em;
  duokan-text-indent: 2em;
  text-indent: 2em;
  line-height: 1.5em;
  font-family: "未来圆", serif;
}

.P_Box_Heading {
  line-height: 130%;
  margin-left: 2em;
  margin-right: 2em;
  margin-bottom: 0;
  padding: 5px;
  background: #999;
  text-align: center;
  font-family: "黑体", sans-serif;
  text-indent: 0em;
}

.P_Box {
  margin-left: 2em;
  margin-right: 2em;
  padding: 5px;
  background: #DDD;
  text-align: justify;
  font-family: "楷体", serif;
}

span.talk {
  font-family: "楷体", serif;
  color: #89001C;
}

span.danyinhao {
  font-family: "楷体", serif;
  color: blue;
}

span.kuohao {
  font-family: "行楷", serif;
  color: red;
}

span.shuminghao {
  font-family: "宋体", serif;
  color: #89001C;
}

.bodycontent {
  margin: 1em 0 0;
/*图片说明的段间距*/
  font-family: "仿宋";
/*图片说明使用的字体*/
  font-size: .8em;
/*字体大小*/
  text-indent: 0;
/*首行缩进为零，当你使用单标签p来指定首行缩进为2em时，记得在需要居中的文本中清除缩进，因为样式是叠加的*/
  text-align: center;
/*图片说明水平居中*/
  color: #a52a2a;
/*字体颜色*/
  line-height: 1.25em;
/*行高，防止有很长的图片说明*/
}

h1 {
  float: right;
  text-align: right;
  color: #FF5C30;
  font-size: 2em;
  line-height: 130%;
  border-width: 0.16em;
  border-style: none double none none;
  border-color: #FF5C38;
  margin: 70% 0.3em 0 0;
  padding: 0 0.4em 0 0;
  text-indent: 0em;
  font-family: "cwgkf","大标宋","宋体", sans-serif;
}

span.zhu {
  font-family: "楷体", serif;
  font-size: 55%;
}

h2 {
  margin-bottom: 0.5em;
  line-height: 130%;
  text-align: center;
  padding: 5px 5px 5px 5px;
  color: red;
  border-width: 0.1em;
  border-style: none none dotted none;
  border-color: #FF5C00;
  font-weight: bold;
  font-size: 1.35em;
  font-family: "行楷","宋体","DK-SONGTI","大标宋", sans-serif;
  text-indent: 0em;
}

h2.chapter-title {
  text-align: center;
  font-size: 1.3em;
  font-family: "隶变", "宋体","DK-SONGTI","大标宋";
  color: red;
  margin: -2% 0 2em 0;
}

h2.chapter-title span {
  text-align: center;
  font-size: 0.8em;
  font-family:"行楷", "DK-FANGSONG","仿宋";
  color: #E2DA9A;
  border-width: 0.16em;
}

div.chapter-head {
  text-align: center;
  text-indent: 0;
  duokan-text-indent: 0;
  duokan-bleed: lefttopright;
}

img.chapter-head {
  width: 100%;
}

h3 {
  line-height: 130%;
  text-align: center;
  font-weight: bold;
  font-size: 1.35em;
  font-family: "行楷", sans-serif;
  margin-top: 0.8em;
  color: #2e3f9c;
  border-width: 0.25em;
  border-style: double double;
  border-color: #985CFF;
  margin-left: 5%;
  margin-right: 5%;
  text-indent: 0em;
}

h4 {
  line-height: 130%;
  text-align: center;
  font-weight: bold;
  font-size: 100%;
  font-family: "行楷", sans-serif;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  text-indent: 0em;
}

/*图片*/
div.duokan-image-single {
  text-align: center;
  margin: .5em auto;
/*插图盒子上下外边距为0.5em，左右设置auto是为了水平居中这个盒子*/
}

img.picture-80 {
  margin: 0;
/*清除img元素的外边距*/
  width: 80%;
/*预览窗口的宽度*/
  box-shadow: 3px 3px 10px #bfbfbf;
/*给图片添加阴影效果*/
}

p.duokan-image-maintitle {
  margin: 1em 0 0;
/*图片说明的段间距*/
  font-family: "楷体";
/*图片说明使用的字体*/
  font-size: .9em;
/*字体大小*/
  text-indent: 0;
/*首行缩进为零，当你使用单标签p来指定首行缩进为2em时，记得在需要居中的文本中清除缩进，因为样式是叠加的*/
  text-align: center;
/*图片说明水平居中*/
  color: #a52a2a;
/*字体颜色*/
  line-height: 1.25em;
/*行高，防止有很长的图片说明*/
}

div.duokan-image-gallery-cell img {
  margin: 0;
/*清除画廊盒子中的图像外边距*/
  width: 100%;
/*设置画廊盒子中的图像以预览窗口的100%宽度显示*/
}

p.duokan-image-subtitle {
  margin: 0 0 .5em;
/*清除副标题的外边距*/
  font-family: "黑体";
/*定义副标题字体*/
  font-size: .8em;
/*副标题字体大小*/
  text-indent: 0;
/*清除缩进*/
}

div.duokan-image-gallery {
  margin: .5em auto;
/*定义画廊图盒子的上下外边距*/
  width: 100%;
/*定义画廊图盒子的宽度*/
  text-align: center;
/*画廊图中的元素水平居中*/
}


.bg_01 {
  background: #f7fcf6 url(../Images/bg_01.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}

.bg_02 {
  background: #f7fcf6 url(../Images/bg_02.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_03 {
  background: #f7fcf6 url(../Images/bg_03.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_04 {
  background: #f7fcf6 url(../Images/bg_04.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_05 {
  background: #f7fcf6 url(../Images/bg_05.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_06 {
  background: #f7fcf6 url(../Images/bg_06.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_07 {
  background: #f7fcf6 url(../Images/bg_07.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_08 {
  background: #f7fcf6 url(../Images/bg_08.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_09 {
  background: #f7fcf6 url(../Images/bg_09.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_10 {
  background: #f7fcf6 url(../Images/bg_10.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_11 {
  background: #f7fcf6 url(../Images/bg_11.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_12 {
  background: #f7fcf6 url(../Images/bg_12.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_13 {
  background: #f7fcf6 url(../Images/bg_13.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_14 {
  background: #f7fcf6 url(../Images/bg_14.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_15 {
  background: #f7fcf6 url(../Images/bg_15.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_16 {
  background: #f7fcf6 url(../Images/bg_16.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}
.bg_17 {
  background: #f7fcf6 url(../Images/bg_17.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}


.bg_18 {background: #f7fcf6 url(../Images/bg_18.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_19 {background: #f7fcf6 url(../Images/bg_19.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_20 {background: #f7fcf6 url(../Images/bg_20.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_21 {background: #f7fcf6 url(../Images/bg_21.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_22 {background: #f7fcf6 url(../Images/bg_22.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_23 {background: #f7fcf6 url(../Images/bg_23.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_24 {background: #f7fcf6 url(../Images/bg_24.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_25 {background: #f7fcf6 url(../Images/bg_25.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_26 {background: #f7fcf6 url(../Images/bg_26.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_27 {background: #f7fcf6 url(../Images/bg_27.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_28 {background: #f7fcf6 url(../Images/bg_28.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_29 {background: #f7fcf6 url(../Images/bg_29.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_30 {background: #f7fcf6 url(../Images/bg_30.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_31 {background: #f7fcf6 url(../Images/bg_31.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_32 {background: #f7fcf6 url(../Images/bg_32.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_33 {background: #f7fcf6 url(../Images/bg_33.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_34 {background: #f7fcf6 url(../Images/bg_34.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_35 {background: #f7fcf6 url(../Images/bg_35.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_36 {background: #f7fcf6 url(../Images/bg_36.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_37 {background: #f7fcf6 url(../Images/bg_37.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_38 {background: #f7fcf6 url(../Images/bg_38.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_39 {background: #f7fcf6 url(../Images/bg_39.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}
.bg_40 {background: #f7fcf6 url(../Images/bg_40.jpg) no-repeat center;background-size: cover;background-attachment: fixed;}


/*书籍信息*/
.bei2 {
  background: #f7fcf6 url(../Images/cover.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}

.fmhz {
  margin: 5% 32.5% 0 32.5%;
  padding: 2px 2px;
  border: 1px solid #f5f5dc;
  background-color: rgba(250, 250, 250, 0);
  border-radius: 1px;
}

div.feng {
  text-align: center;
  text-indent: 0;
}

img.feng {
  width: 100%;
  height: auto;
}

h3.sjmc {
  font-family: "黑体", sans-serif;
  font-size: 115%;
  font-weight: normal;
  text-align: center;
  text-indent: 0;
  margin: 1em 0 1em 0;
  color: #232931;
}

span.sjzz {
  font-size: 75%;
}

.sjfl {
  margin: 0 0;
  padding: 0 0.15em;
  border: 1px none #ffffff;
  background-color: rgba(250, 250, 250, 0);
}

table.sjlb {
  width: 100%;
  text-align: center;
}

table.sjlb td {
  color: #232931;
  border: 1px none #ffffff;
}

.pai1 {
  font-family: "楷体", serif;
  font-size: 100%;
  font-weight: normal;
  text-align: center;
  color: #ff9410;
}

.pai2 {
  font-family: "仿宋", sans-serif;
  font-size: 70%;
  text-align: center;
  text-indent: 0;
  color: #E9967A;
}

/*制作说明页*/
.oval {
  margin: 2em 5% 0px 5%;
  background-color: rgba(255, 255, 255, 0.5);
  border-style: solid;
  border-width: 1px;
  border-color: #000;
  border-radius: 10px;
  box-sizing: border-box;
  text-align: left;
  color: #fff;
  padding: 1em;
}

.oval p{
  font-family: "楷体", sans-serif;
  font-size: 100%;
  font-style: normal;
  duokan-text-indent: 0em;
  text-indent: 0em;
  color: blue;
  padding-left: 15px;
  padding-right: 15px;
}

.ovaltitle {
  font-family: "行楷", "黑体", sans-serif;
  duokan-text-indent: 0em;
  text-indent: 0em;
  font-size: 140%;
  color: blue;
  font-style: normal;
  padding-top: 15px;
  padding-bottom: 14px;
  margin: 3px;
  text-align: center;
  text-shadow: 0 1px 1px #111;
}

.ovaltxt {
  font-family: "楷体", sans-serif;
  font-size: 100%;
  font-style: normal;
  duokan-text-indent: 0em;
  text-indent: 0em;
  color: blue;
  padding-left: 15px;
  padding-right: 15px;
}

.ovalnote {
  font-family: "宋体", sans-serif;
  font-size: 90%;
  color: black;
  duokan-text-indent: 0em;
  text-indent: 0em;
  padding-left: 15px;
  padding-right: 15px;
  padding-bottom: 15px;
}

.line {
  border: dotted #A2906A;
  border-width: 1px 0 0 0;
}

.speci {
  background: #f7fcf6 url(../Images/girl.jpg) no-repeat center;
  background-size: cover;
  background-attachment: fixed;
}


/********************************************/

.oval1 {
  float: right;
  margin: 1em 5% 0px 5%;
  background-color: rgba(255, 255, 255, 0.5);
  border-style: solid;
  border-width: 1px;
  border-color: #000;
  border-radius: 10px;
  box-sizing: border-box;
  text-align: left;
  color: #fff;
  padding: 1em;
}


.ovaltxt1 {
  font-family:"楷体", "黑体", sans-serif;
  font-size: 1em;
  font-style: normal;
  duokan-text-indent: 0em;
  text-indent: 0em;
  color: blue;
}

/*正文中表情图片*/
img.rarefont {
  margin: 0;
/*清除外边距*/
  padding: 0;
/*清除内边距*/
  height: 1.5em;
/*高度为一个汉字的高度*/
  vertical-align: middle;
/*垂直居中*/
}

/*音频*/
div.content-speaker {
  text-align: center;
  margin: 1em auto;
}

audio.content-speaker {
  width: 50%;
}

/*视频*/
video.content-matrix {
  text-align: center;
  margin: 0;
  width: 80%;
  box-shadow: 3px 3px 10px #bfbfbf;
}

/*注释*/
ol.duokan-footnote-content {
  padding: 0 auto;
  text-align: left;
}

.duokan-footnote img {
  width: 0.85em;
  vertical-align: middle;
}

ol.duokan-footnote-content {
  padding: 10px auto 10px auto;
  border: 1px dashed #366;
  box-shadow: 0 0 0.5em #AAA;
}

li.duokan-footnote-item {
  margin: 0.3em 0 0.3em 0;
  padding: 5px 0;
  line-height: 120%;
  list-style-type: decimal;
  font-family: "细黑体", sans-serif;
  text-align: left;
  font-size: 95%;
  text-indent: 0;
  duokan-text-indent: 0;
}





img.width100{
  width: 100%;
}

div.roundsolid {
  margin: 1em 0.2em;
  padding: 0.8em 0.5em;
  -moz-border-radius: 19px;
  -webkit-border-radius: 19px;
  border-radius: 19px;
  border: #151B54 dotted 2px;
  text-align: justify;
  text-indent: 2em;
  duokan-text-indent: 2em;
  line-height: 130%;
  font-family: "zdy3", "未来圆";
  color: #151B54;
  font-size: 0.85em;
}`;
    }

    function genFontCss() {
        return `@font-face {
  font-family: "楷体";
  font-weight: normal;
  font-style: normal;
  src: local("Caecilia"),local("楷体"),local("楷体_GB2312"),
\tlocal("Kaiti"),local("Kaiti SC"),local("Kaiti TC"),\t\t\t\t/*iOS6+iBooks3*/
\tlocal("MKai PRC"),local("MKaiGB18030C-Medium"),local("MKaiGB18030C-Bold"),\t\t\t/*Kindle Paperwihite*/
\tlocal("DK-KAITI"),
\turl(../Fonts/kaiti.ttf),
\turl(../Fonts/kt.ttf),
\turl(res:///opt/sony/ebook/FONT/kt.ttf),
\turl(res:///Data/FONT/kt.ttf),
\turl(res:///opt/sony/ebook/FONT/tt0011m_.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/kt.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/kt.ttf),
\turl(res:///ebook/fonts/kt.ttf),
\turl(res:///ebook/fonts/DroidSansFallback.ttf),
\turl(res:///fonts/ttf/kt.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/kt.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/kt.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/kt.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/kt.ttf),
\turl(res:///system/fonts/kt.ttf),
\turl(res:///system/media/sdcard/fonts/kt.ttf),
\turl(res:///media/fonts/kt.ttf),
\turl(res:///sdcard/fonts/kt.ttf),
\turl(res:///system/fonts/DroidSansFallback.ttf),
\turl(res:///mnt/MOVIFAT/font/kt.ttf),
\turl(res:///media/flash/fonts/kt.ttf),
\turl(res:///media/sd/fonts/kt.ttf),
\turl(res:///opt/onyx/arm/lib/fonts/AdobeHeitiStd-Regular.otf),
\turl(res:///../../fonts/kt.ttf),
\turl(res:///../fonts/kt.ttf),
\turl(../../../../../kt.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/kt.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/kt.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/kt.ttf);\t\t\t\t\t\t /*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "大标宋";
  font-weight: normal;
  font-style: normal;
  src: local("方正大标宋_GBK"),local("方正大标宋简体"),local("方正大标宋繁体"),
\tlocal("Dabiaosong"),
\turl(file:///storage/emulated/0/Books/fonts/Fonts/Fonts/方正大标宋_GBK.ttf),
\turl(res:///opt/sony/ebook/FONT/方正大标宋_GBK.ttf),
\turl(res:///Data/FONT/方正大标宋_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正大标宋_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正大标宋_GBK.ttf),
\turl(res:///ebook/fonts/方正大标宋_GBK.ttf),
\turl(res:///ebook/fonts/DroidSansFallback.ttf),
\turl(res:///fonts/ttf/方正大标宋_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正大标宋_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正大标宋_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正大标宋_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正大标宋_GBK.ttf),
\turl(res:///system/fonts/方正大标宋_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正大标宋_GBK.ttf),
\turl(res:///media/fonts/方正大标宋_GBK.ttf),
\turl(res:///sdcard/fonts/方正大标宋_GBK.ttf),
\turl(res:///system/fonts/方正大标宋_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正大标宋_GBK.ttf),
\turl(res:///media/flash/fonts/方正大标宋_GBK.ttf),
\turl(res:///media/sd/fonts/方正大标宋_GBK.ttf),
\turl(res:///../../fonts/方正大标宋_GBK.ttf),
\turl(res:///../fonts/方正大标宋_GBK.ttf),
\turl(../../../../../方正大标宋_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正大标宋_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正大标宋_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正大标宋_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "仿宋";
  font-weight: normal;
  font-style: normal;
  src: url(../Fonts/fangsong.ttf),
       local("方正仿宋_GBK"),local("方正仿宋简体"),local("方正仿宋繁体"),
\tlocal("Fangsong"),
\tlocal("DK-FANGSONG"),
\turl(file:///storage/emulated/0/Books/fonts/Fonts/Fonts/Fonts/方正仿宋_GBK.ttf),
\turl(res:///opt/sony/ebook/FONT/方正仿宋_GBK.ttf),
\turl(res:///Data/FONT/方正仿宋_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正仿宋_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正仿宋_GBK.ttf),
\turl(res:///ebook/fonts/方正仿宋_GBK.ttf),
\turl(res:///fonts/ttf/方正仿宋_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正仿宋_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正仿宋_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正仿宋_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正仿宋_GBK.ttf),
\turl(res:///system/fonts/方正仿宋_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正仿宋_GBK.ttf),
\turl(res:///media/fonts/方正仿宋_GBK.ttf),
\turl(res:///sdcard/fonts/方正仿宋_GBK.ttf),
\turl(res:///system/fonts/方正仿宋_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正仿宋_GBK.ttf),
\turl(res:///media/flash/fonts/方正仿宋_GBK.ttf),
\turl(res:///media/sd/fonts/方正仿宋_GBK.ttf),
\turl(res:///../../fonts/方正仿宋_GBK.ttf),
\turl(res:///../fonts/方正仿宋_GBK.ttf),
\turl(../../../../../方正仿宋_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正仿宋_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正仿宋_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正仿宋_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "细黑体";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/Fonts/Fonts/方正细黑_GBK.ttf),
    url(../Fonts/xihei.ttf),
    local("方正细黑_GBK"),local("方正细黑简体"),local("方正细黑繁体"),
\turl(res:///opt/sony/ebook/FONT/方正细黑_GBK.ttf),
\turl(res:///Data/FONT/方正细黑_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正细黑_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正细黑_GBK.ttf),
\turl(res:///ebook/fonts/方正细黑_GBK.ttf),
\turl(res:///fonts/ttf/方正细黑_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正细黑_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正细黑_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正细黑_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正细黑_GBK.ttf),
\turl(res:///system/fonts/方正细黑_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正细黑_GBK.ttf),
\turl(res:///media/fonts/方正细黑_GBK.ttf),
\turl(res:///sdcard/fonts/方正细黑_GBK.ttf),
\turl(res:///system/fonts/方正细黑_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正细黑_GBK.ttf),
\turl(res:///media/flash/fonts/方正细黑_GBK.ttf),
\turl(res:///media/sd/fonts/方正细黑_GBK.ttf),
\turl(res:///../../fonts/方正细黑_GBK.ttf),
\turl(res:///../fonts/方正细黑_GBK.ttf),
\turl(../../../../../方正细黑_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正细黑_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正细黑_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正细黑_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "新书宋";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/Fonts/方正书宋_GBK.ttf),
  url(../Fonts/xinshusong.ttf),
    local("方正书宋_GBK"),local("方正书宋简体"),local("方正书宋繁体"),
\turl(res:///opt/sony/ebook/FONT/方正书宋_GBK.ttf),
\turl(res:///Data/FONT/方正书宋_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正书宋_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正书宋_GBK.ttf),
\turl(res:///ebook/fonts/方正书宋_GBK.ttf),
\turl(res:///fonts/ttf/方正书宋_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正书宋_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正书宋_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正书宋_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正书宋_GBK.ttf),
\turl(res:///system/fonts/方正书宋_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正书宋_GBK.ttf),
\turl(res:///media/fonts/方正书宋_GBK.ttf),
\turl(res:///sdcard/fonts/方正书宋_GBK.ttf),
\turl(res:///system/fonts/方正书宋_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正书宋_GBK.ttf),
\turl(res:///media/flash/fonts/方正书宋_GBK.ttf),
\turl(res:///media/sd/fonts/方正书宋_GBK.ttf),
\turl(res:///../../fonts/方正书宋_GBK.ttf),
\turl(res:///../fonts/方正书宋_GBK.ttf),
\turl(../../../../../方正书宋_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正书宋_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正书宋_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正书宋_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "未来圆";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/未来圆SC.ttf),
  url(../Fonts/weilaiyuan.ttf),
       local("未来圆SC"),
\turl(res:///opt/sony/ebook/FONT/未来圆SC.ttf),
\turl(res:///Data/FONT/未来圆SC.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/未来圆SC.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/未来圆SC.ttf),
\turl(res:///ebook/fonts/未来圆SC.ttf),
\turl(res:///fonts/ttf/未来圆SC.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/未来圆SC.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/未来圆SC.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/未来圆SC.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/未来圆SC.ttf),
\turl(res:///system/fonts/未来圆SC.ttf),
\turl(res:///system/media/sdcard/fonts/未来圆SC.ttf),
\turl(res:///media/fonts/未来圆SC.ttf),
\turl(res:///sdcard/fonts/未来圆SC.ttf),
\turl(res:///system/fonts/未来圆SC.ttf),
\turl(res:///mnt/MOVIFAT/font/未来圆SC.ttf),
\turl(res:///media/flash/fonts/未来圆SC.ttf),
\turl(res:///media/sd/fonts/未来圆SC.ttf),
\turl(res:///../../fonts/未来圆SC.ttf),
\turl(res:///../fonts/未来圆SC.ttf),
\turl(../../../../../未来圆SC.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/未来圆SC.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/未来圆SC.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/未来圆SC.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "隶变";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/方正隶变_GBK.ttf),
  url(../Fonts/libian.ttf),
    local("方正隶变_GBK"),
\turl(../Fonts/方正隶变_GBK.ttf),
\turl(res:///opt/sony/ebook/FONT/方正隶变_GBK.ttf),
\turl(res:///Data/FONT/方正隶变_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正隶变_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正隶变_GBK.ttf),
\turl(res:///ebook/fonts/方正隶变_GBK.ttf),
\turl(res:///fonts/ttf/方正隶变_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正隶变_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正隶变_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正隶变_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正隶变_GBK.ttf),
\turl(res:///system/fonts/方正隶变_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正隶变_GBK.ttf),
\turl(res:///media/fonts/方正隶变_GBK.ttf),
\turl(res:///sdcard/fonts/方正隶变_GBK.ttf),
\turl(res:///system/fonts/方正隶变_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正隶变_GBK.ttf),
\turl(res:///media/flash/fonts/方正隶变_GBK.ttf),
\turl(res:///media/sd/fonts/方正隶变_GBK.ttf),
\turl(res:///../../fonts/方正隶变_GBK.ttf),
\turl(res:///../fonts/方正隶变_GBK.ttf),
\turl(../../../../../方正隶变_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正隶变_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正隶变_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正隶变_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "行楷";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/方正行楷_GBK.ttf),
  url(../Fonts/xingkai.ttf),
    local("方正行楷_GBK"),
\turl(../Fonts/方正行楷_GBK.ttf),
\turl(res:///opt/sony/ebook/FONT/方正行楷_GBK.ttf),
\turl(res:///Data/FONT/方正行楷_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正行楷_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正行楷_GBK.ttf),
\turl(res:///ebook/fonts/方正行楷_GBK.ttf),
\turl(res:///fonts/ttf/方正行楷_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正行楷_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正行楷_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正行楷_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正行楷_GBK.ttf),
\turl(res:///system/fonts/方正行楷_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正行楷_GBK.ttf),
\turl(res:///media/fonts/方正行楷_GBK.ttf),
\turl(res:///sdcard/fonts/方正行楷_GBK.ttf),
\turl(res:///system/fonts/方正行楷_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正行楷_GBK.ttf),
\turl(res:///media/flash/fonts/方正行楷_GBK.ttf),
\turl(res:///media/sd/fonts/方正行楷_GBK.ttf),
\turl(res:///../../fonts/方正行楷_GBK.ttf),
\turl(res:///../fonts/方正行楷_GBK.ttf),
\turl(../../../../../方正行楷_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正行楷_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正行楷_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正行楷_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "悦宋";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/方正清刻本悦宋简体.ttf),
  url(../Fonts/yuesong.ttf),
    local("方正清刻本悦宋简体"),
\turl(res:///opt/sony/ebook/FONT/方正清刻本悦宋简体.ttf),
\turl(res:///Data/FONT/方正清刻本悦宋简体.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///ebook/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///fonts/ttf/方正清刻本悦宋简体.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正清刻本悦宋简体.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正清刻本悦宋简体.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正清刻本悦宋简体.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///system/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///system/media/sdcard/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///media/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///sdcard/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///system/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///mnt/MOVIFAT/font/方正清刻本悦宋简体.ttf),
\turl(res:///media/flash/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///media/sd/fonts/方正清刻本悦宋简体.ttf),
\turl(res:///../../fonts/方正清刻本悦宋简体.ttf),
\turl(res:///../fonts/方正清刻本悦宋简体.ttf),
\turl(../../../../../方正清刻本悦宋简体.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正清刻本悦宋简体.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正清刻本悦宋简体.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正清刻本悦宋简体.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
@font-face {
  font-family: "cwgkf";
  font-weight: normal;
  font-style: normal;
  src: url(../Fonts/cwgkf.ttf);
}

@font-face {
  font-family: "手写体";
  font-weight: normal;
  font-style: normal;
  src: url(../Fonts/gangbishouxieti.ttf);
}

@font-face {
  font-family: "准圆";
  font-weight: normal;
  font-style: normal;
  src: url(file:///storage/emulated/0/Books/fonts/方正准圆_GBK.ttf),
  url(../Fonts/zhunyuan.ttf),
    local("方正准圆_GBK"),
\turl(res:///opt/sony/ebook/FONT/方正准圆_GBK.ttf),
\turl(res:///Data/FONT/方正准圆_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/sdcard/fonts/方正准圆_GBK.ttf),
\turl(res:///ebook/fonts/../../mnt/extsd/fonts/方正准圆_GBK.ttf),
\turl(res:///ebook/fonts/方正准圆_GBK.ttf),
\turl(res:///fonts/ttf/方正准圆_GBK.ttf),
\turl(res:///../../media/mmcblk0p1/fonts/方正准圆_GBK.ttf),
\turl(file:///mnt/us/DK_System/system/fonts/方正准圆_GBK.ttf),\t\t\t\t/*Duokan Old Path*/
\turl(file:///mnt/us/DK_System/xKindle/res/userfonts/方正准圆_GBK.ttf),\t\t/*Duokan 2012 Path*/
\turl(res:///abook/fonts/方正准圆_GBK.ttf),
\turl(res:///system/fonts/方正准圆_GBK.ttf),
\turl(res:///system/media/sdcard/fonts/方正准圆_GBK.ttf),
\turl(res:///media/fonts/方正准圆_GBK.ttf),
\turl(res:///sdcard/fonts/方正准圆_GBK.ttf),
\turl(res:///system/fonts/方正准圆_GBK.ttf),
\turl(res:///mnt/MOVIFAT/font/方正准圆_GBK.ttf),
\turl(res:///media/flash/fonts/方正准圆_GBK.ttf),
\turl(res:///media/sd/fonts/方正准圆_GBK.ttf),
\turl(res:///../../fonts/方正准圆_GBK.ttf),
\turl(res:///../fonts/方正准圆_GBK.ttf),
\turl(../../../../../方正准圆_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*EpubReaderI*/
\turl(res:///mnt/sdcard/fonts/方正准圆_GBK.ttf),\t\t\t\t\t\t\t/*Nook for Android: fonts in TF Card*/
\turl(res:///fonts/方正准圆_GBK.ttf),\t\t\t\t\t\t\t\t\t\t/*ADE1,8, 2.0 Program Path*/
\turl(res:///../../../../Windows/fonts/方正准圆_GBK.ttf);\t\t\t\t\t/*ADE1,8, 2.0 Windows Path*/
}
`;
    }

})();