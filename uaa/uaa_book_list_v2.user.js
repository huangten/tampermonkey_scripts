// ==UserScript==
// @name         uaa 列表页相关操作
// @namespace    http://tampermonkey.net/
// @version      2025-12-25.03
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
        addScript('layui_id', "https://cdnjs.cloudflare.com/ajax/libs/layui/2.9.18/layui.js")
    ]).then(() => {
        run();
    });

    /*global $,layui,layer,util,saveAs*/


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
                area: ['30%', '80%'],
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
                                getCheckedNodeData()
                                scheduler.start();
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

                    function getCheckedNodeData() {
                        let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                        checkedData.reverse();

                        for (let i = 0; i < checkedData.length; i++) {
                            console.log(checkedData[i]);
                            scheduler.enqueue(checkedData[i].href)
                        }
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
    }
})();