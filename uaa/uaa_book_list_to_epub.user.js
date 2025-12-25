// ==UserScript==
// @name         uaa 列表页相关操作
// @namespace    http://tampermonkey.net/
// @version      2025-12-25.04
// @description  try to take over the world!
// @author       You
// @match        https://*.uaa.com/novel/list*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=uaa.com
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
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js"),
        addScript('jszip_id', "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js")
    ]).then(() => {
        run();
    });

    /*global $,layui,layer,util,JSZip,saveAs*/


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

            const delay =
                this.interval +
                Math.random() * this.jitter;

            setTimeout(() => this._tick(), delay);
        }

        _openInBackground(url) {

        }
    }

    const scheduler = new BackgroundTabScheduler({
        interval: 100,
        jitter: 100
    });

    function run() {

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
                                type: 'clear',
                                content: '清除选中',
                                style: openPagefixbarStyle,
                            }],
                        default: true, // 是否显示默认的 bar 列表 --  v2.8.0 新增
                        css: {bottom: "15%", right: 30},
                        target: layero, // 插入 fixbar 节点的目标元素选择器
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
                        //let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                        //checkedData.reverse();
                        await buildEpub();
                        // for (let i = 0; i < checkedData.length; i++) {
                        //     console.log(checkedData[i]);
                        //     scheduler.enqueue(checkedData[i].href)
                        // }
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


        function fetchImage(url) {
            return fetch(url, {credentials: 'include'})
                .then(res => {
                    if (!res.ok) throw new Error('fetch failed');
                    return res.blob();
                });
        }

        async function buildEpub(meta = {
            "id": crypto.randomUUID(),
            "title": "女奴制度下的魅魔",
            "author": "猫猫快乐水"
        }, chapters = [
            {id: "vol_0001", title: "第1章 穿越觉醒"},
            {id: "vol_0002", title: "第2章 偏好表"},
            {id: "vol_0003", title: "第3章 温柔的告别"},
            {id: "vol_0004", title: "第4章 赤裸的仪式"},
            {id: "vol_0005", title: "第5章 全裸扫描"},
            {id: "vol_0006", title: "第6章 训练"},
            {id: "vol_0007", title: "第7章 拘束包装"},
            {id: "vol_0008", title: "第8章 长路羞耻"},
            {id: "vol_0009", title: "第9章 清洁等待"},
            {id: "vol_0010", title: "第10章 签收"},
            {id: "vol_0011", title: "第11章 品尝成年礼物"},
            {id: "vol_0012", title: "第12章 拘束性爱"},
            {id: "vol_0013", title: "第13章 标记"},
            {id: "vol_0014", title: "第14章 新开始"},
            {id: "vol_0015", title: "第15章 女奴的早晨"},
            {id: "vol_0016", title: "第16章 巨乳调教"},
            {id: "vol_0017", title: "第17章 巨乳开发"},
            {id: "vol_0018", title: "第18章 乳头自慰"},
            {id: "vol_0019", title: "第19章 初次乳交"},
            {id: "vol_0020", title: "第20章 林雪瑶"},
            {id: "vol_0021", title: "第21章 锁定通知"},
            {id: "vol_0022", title: "第22章 林的报道"},
            {id: "vol_0023", title: "第23章 培训"},
            {id: "vol_0024", title: "第24章 送达"},
            {id: "vol_0025", title: "第25章 内心的高傲"},
            {id: "vol_0026", title: "第26章 疯狂的性爱"},
            {id: "vol_0027", title: "第27章 引爆的论坛"},
            {id: "vol_0028", title: "第28章 父子通话"},
            {id: "vol_0029", title: "第29章 快感共享"},
            {id: "vol_0030", title: "第30章 放置惩罚"},
            {id: "vol_0031", title: "第31章 臣服后的性爱"},
            {id: "vol_0032", title: "第32章 教学楼的深夜"},
            {id: "vol_0033", title: "第33章 教室的羞耻性爱"},
            {id: "vol_0034", title: "第34章 晨欲焚身"},
            {id: "vol_0035", title: "第35章 财阀千金，注定沦落"},
            {id: "vol_0036", title: "第36章 古典和风美人到货在即"},
            {id: "vol_0037", title: "第37章 幸运儿计划"}

        ]) {
            const zip = new JSZip();

            zip.file('mimetype', 'application/epub+zip', {compression: 'STORE'});
            zip.folder('META-INF').file('container.xml', `<?xml version="1.0"?>
                                                            <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
                                                             <rootfiles>
                                                              <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
                                                             </rootfiles>
                                                            </container>`);

            const o = zip.folder('OEBPS');
            const cssFolder = o.folder("Styles");
            cssFolder.file('styles.css', `body{font-family:serif;line-height:1.6;margin:1em;}h1{font-size:1.2em;}`);

            const imgFolder = o.folder("Images")
            imgFolder.file("cover.jpg",await fetchImage("https://cdn.uameta.ai/file/bucket-media/image/cover/a1a45cd58b2140858030e8ec60fffe35.jpg"))

            const manifest = [], spine = [], ncxNav = [];
            const textFolder = o.folder('Text');

            chapters.forEach((c, i) => {
                const id = `ch${i + 1}`;
                const html = `<?xml version="1.0" encoding="utf-8"?>
                                    <!DOCTYPE html>
                                    <html xmlns="http://www.w3.org/1999/xhtml">
                                    <head><meta charset="utf-8"/><title>${c.title}</title>
                                    <link rel="stylesheet" href="../styles.css"/></head>
                                    <body><h1>${c.title}</h1></body>
                                    </html>`;

                textFolder.file(`${id}.xhtml`, html);
                manifest.push(`<item id="${id}" href="Text/${id}.xhtml" media-type="application/xhtml+xml"/>`);
                spine.push(`<itemref idref="${id}"/>`);
                ncxNav.push(`<navPoint id="nav-${i + 1}" playOrder="${i + 1}">
                              <navLabel><text>${c.title}</text></navLabel>
                              <content src="Text/${id}.xhtml"/>
                             </navPoint>`);
            });

            o.file('content.opf', `<?xml version="1.0"?>
                                    <package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="id">
                                      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
                                        <dc:title>${meta.title}</dc:title>
                                        <dc:creator>${meta.author}</dc:creator>
                                        <dc:language>zh-CN</dc:language>
                                        <dc:identifier id="id">${meta.id}</dc:identifier>
                                      </metadata>
                                      <manifest>
                                        ${manifest.join('\n')}
                                        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
                                        <item id="css" href="Styles/styles.css" media-type="text/css"/>
                                        <item id="cover" href="Images/cover.jpg" media-type="image/jpeg"/>
                                      </manifest>
                                      <spine toc="ncx">
                                        ${spine.join('\n')}
                                      </spine>
                                    </package>`);

            o.file('toc.ncx', `<?xml version="1.0"?>
                                <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
                                  <head><meta name="dtb:uid" content="${meta.id}"/></head>
                                  <docTitle><text>${meta.title}</text></docTitle>
                                  <navMap>${ncxNav.join('\n')}</navMap>
                                </ncx>`);

            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `${meta.title}_目录骨架.epub`);
        }
    }
})();