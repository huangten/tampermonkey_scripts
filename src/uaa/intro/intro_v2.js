import {cleanText, copyContext, init, waitForElement} from "../../common/common.js";
import {Downloader} from "./download.js";
import {saveContentToLocal} from "../common.js";

const downloader = new Downloader();

downloader.setConfig({
    interval: 2500,
    downloadHandler: downloadChapter,
    onTaskComplete: (task, success) => {
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: (downloaded, failed) => {
        console.log("下载完成 ✅");
        console.log("已下载:", downloaded.map(t => t));
        console.log("未下载:", failed.map(t => t));

        console.log(document.getElementsByTagName('iframe'));

        // ✅ 全部完成 — 销毁 iframe
        layui.layer.alert('下载完毕', {icon: 1, shadeClose: true});
    }
});


async function downloadChapter(task) {
    // 等待页面加载
    const doc = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);

        layui.layer.open({
            type: 2,
            title: task.title,
            shadeClose: false,
            shade: 0,
            offset: 'l',
            anim: 'slideRight',
            skin: 'layui-layer-win10', // 加上边框
            maxmin: true, //开启最大化最小化按钮
            area: ['75%', '80%'],
            content: task.href,
            success: async function (layero, index, that) {
                let iframeDocument = layui.layer.getChildFrame('html', index);
                let iDocument = iframeDocument[0];
                try {
                    await waitForElement(iDocument, '.line', 1000 * 25 * 60);
                    clearTimeout(timeout);
                    resolve(iDocument);
                } catch (err) {
                    clearTimeout(timeout);
                    reject(new Error("正文元素未找到"));
                }
            }
        });

    });

    const success = saveContentToLocal(doc);

    await new Promise((re, rj) => {
        setTimeout(() => {
            layui.layer.closeAll('iframe');
            return re();
        }, 300)
    })

    return success;
}

init().then(() => {
    run();
}).catch((e) => {
    console.log(e);
});


function run() {
    const fixbarStyle = "background-color: #ff5555;font-size: 16px;width:100px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
    layui.use(function () {
        const util = layui.util;
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: 'copyBookName',
                    content: '复制书名',
                    style: fixbarStyle
                },
                {
                    type: 'downloadAll',
                    content: '下载全部',
                    style: fixbarStyle
                },
                {
                    type: 'clearDownloadList',
                    content: '清除待下载',
                    style: fixbarStyle
                },
                {
                    type: 'menuList',
                    content: '章节列表',
                    style: fixbarStyle
                }],
            default: false,
            css: {bottom: "15%", right: 5},
            margin: 0,
            // 点击事件
            click: function (type) {
                if (type === "downloadAll") {
                    downloadAll();
                    return;
                }

                if (type === "copyBookName") {
                    let bookName = document.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText
                    copyContext(bookName).then();
                    return;
                }

                if (type === "clearDownloadList") {
                    downloader.clear();
                    return;
                }
                if (type === "menuList") {
                    openBookChapterListPage();
                }
            }
        });
    });
}

function downloadAll() {
    getMenuArray(getMenuTree()).forEach(data => {
        downloader.add(data);
    });
    downloader.start().then();
}

function openBookChapterListPage() {
    layui.layer.open({
        type: 1,
        title: "章节列表",
        shadeClose: false,
        offset: 'r',
        shade: 0,
        anim: 'slideLeft', // 从右往左
        area: ['20%', '80%'],
        skin: 'layui-layer-win10', // 加上边框
        maxmin: true, //开启最大化最小化按钮
        content: `<div id='openPage'></div>`,
        success: function (layero, index, that) {
            const tree = layui.tree;
            const layer = layui.layer;
            const util = layui.util;

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
                default: false, // 是否显示默认的 bar 列表 --  v2.8.0 新增
                bgcolor: '#16baaa', // bar 的默认背景色
                css: {bottom: "15%", right: 10},
                target: layero, // 插入 fixbar 节点的目标元素选择器
                click: function (type) {
                    if (type === "getCheckedNodeData") {
                        treeCheckedDownload()
                    }
                    if (type === "clear") {
                        reloadTree()
                    }
                }
            });

            function treeCheckedDownload() {
                let checkedData = tree.getChecked('title'); // 获取选中节点的数据
                if (checkedData.length === 0) {
                    layer.msg("未选中任何数据");
                    return;
                }
                getMenuArray(checkedData).forEach(data => {
                    downloader.add(data);
                });
                downloader.start().then();
            }

            function reloadTree() {
                tree.reload('title', { // options
                    data: getMenuTree()
                }); // 重载实例
                downloader.clear();
            }

            tree.render({
                elem: '#openPage',
                data: getMenuTree(),
                showCheckbox: true,
                onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                id: 'title',
                isJump: false, // 是否允许点击节点时弹出新窗口跳转
                click: function (obj) {
                    const data = obj.data; //获取当前点击的节点数据
                    downloader.add(data);
                    downloader.start().then();
                }
            });
        }
    });
}

function getMenuTree() {
    let menus = [];
    let lis = document.querySelectorAll(".catalog_ul > li");
    for (let index = 0; index < lis.length; index++) {
        let preName = "";
        if (lis[index].className.indexOf("menu") > -1) {
            let alist = lis[index].getElementsByTagName("a");
            for (let j = 0; j < alist.length; j++) {
                menus.push({
                    'id': (index + 1) * 100000000 + j,
                    "title": cleanText(preName + alist[j].innerText.trim()),
                    "href": alist[j].href,
                    "children": [],
                    "spread": true,
                    "field": "",
                    "checked": alist[j].innerText.indexOf("new") > 0,
                });
            }
        }
        if (lis[index].className.indexOf("volume") > -1) {
            preName = cleanText(lis[index].querySelector("span").innerText);
            let children = [];
            let alist = lis[index].getElementsByTagName("a");
            for (let j = 0; j < alist.length; j++) {
                children.push({
                    'id': (index + 1) * 100000000 + j + 1,
                    "title": cleanText(alist[j].innerText.trim()),
                    "href": alist[j].href,
                    "children": [],
                    "spread": true,
                    "field": "",
                    "checked": alist[j].innerText.indexOf("new") > 0,
                });
            }
            menus.push({
                'id': (index + 1) * 100000000,
                "title": cleanText(preName),
                "href": "",
                "children": children,
                "spread": true,
                "field": "",
            });
        }
    }
    return menus;
}

function getMenuArray(trees) {
    let menus = [];
    for (let index = 0; index < trees.length; index++) {
        if (trees[index].children.length === 0) {
            menus.push({
                'id': trees[index].id,
                "title": trees[index].title,
                "href": trees[index].href
            });
        } else {
            for (let j = 0; j < trees[index].children.length; j++) {
                let preName = trees[index].title + " ";
                menus.push({
                    'id': trees[index].children[j].id,
                    "title": preName + trees[index].children[j].title,
                    "href": trees[index].children[j].href
                });
            }

        }
    }
    return menus;
}



