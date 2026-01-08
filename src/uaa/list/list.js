import {cleanText, init} from "../../common/common.js";
import {BackgroundExportEpubScheduler, BackgroundTabScheduler} from "./Download.js";
import JSZip from "jszip";
import {saveAs} from "file-saver";
import {CommonRes} from "../common.js";

init().then(() => {
    run();
});


function run() {
    const scheduler = new BackgroundTabScheduler({
        interval: 100,
        jitter: 100
    });
    const exportEpubScheduler = new BackgroundExportEpubScheduler({
        interval: 500,
        jitter: 100
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
        const util = layui.util;
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
            default: false,
            css: {bottom: "15%"},
            margin: 0,
            // 点击事件
            click: function (type) {
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
            skin: 'layui-layer-win10', // 加上边框
            maxmin: true, //开启最大化最小化按钮
            content: `<div id='openPage'></div>`,
            success: function (layero, index, that) {

                const tree = layui.tree;
                const layer = layui.layer;
                const util = layui.util;
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
                    default: false, // 是否显示默认的 bar 列表 --  v2.8.0 新增
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
                        scheduler.enqueue(checkedData[i].href)
                    }
                }

                async function exportEpub() {
                    let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                    checkedData.reverse();

                    for (let i = 0; i < checkedData.length; i++) {
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

