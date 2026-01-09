import {cleanText, copyContext, init} from "../../common/common.js";
import {saveContentToLocal} from "../common.js";

let downloadArray = [];
let timer = 0;
unsafeWindow.onmessage = ListenMessage;

init().then(() => {
    run()
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
            css: {bottom: "10%", right: 0},
            margin: 0,
            // 点击事件
            click: function (type) {
                if (type === "downloadAll") {
                    if (downloadArray.length !== 0) {
                        layui.layer.tips("正在下载中，请等待下载完后再继续", this, {
                            tips: 4,
                            fixed: true
                        });
                    } else {
                        downloadAll();
                    }
                    return;
                }

                if (type === "copyBookName") {
                    let bookName = document.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText
                    copyContext(bookName).then();
                    return;
                }

                if (type === "clearDownloadList") {
                    downloadArray = [];
                    return;
                }
                if (type === "menuList") {
                    openChapterMenuPage();
                }
            }
        });
    });
}

function ListenMessage(e) {
    if (e.data.handle === 'lhd_close') {
        layui.layer.closeAll('iframe', () => {

            let iframeDocument = layui.layer.getChildFrame('iframe', e.data.layer_index);
            // console.log(iframeDocument)
            iframeDocument.attr('src', 'about:blank');
            iframeDocument.remove();
            iframeDocument.prevObject.attr('src', 'about:blank');
            iframeDocument.prevObject.remove();
            iframeDocument = null;

            let iframes = document.getElementsByTagName("iframe");
            for (let index = 0; index < iframes.length; index++) {
                const el = iframes[index];
                el.src = "about:blank";
                if (el.contentWindow) {
                    setTimeout((el) => cycleClear(el), 100);
                }
            }
        });

        if (timer !== 0) {
            clearTimeout(timer);
        }
        if (downloadArray.length === 0) {
            layui.layer.alert('下载完毕', {icon: 1, shadeClose: true}, function (index) {
                layui.layer.close(index);
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
            // el.contentWindow.document.clear();
            el.contentWindow.close();
            el.parentNode.removeChild(el);
        }
    } catch (e) {
        // setTimeout(cycleClear(el), 100);
    }
}

function downloadAll() {
    downloadArray = getMenuArray(getMenuTree())
    doDownload()
}

function openChapterMenuPage() {
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
                css: {bottom: "15%", right: 15},
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

                // console.log(checkedData[0]);
                if (checkedData.length === 0) {
                    layer.msg("未选中任何数据");
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
                tree.reload('title', { // options
                    data: getMenuTree()
                }); // 重载实例
                downloadArray = [];
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
                    if (downloadArray.length !== 0) {
                        layui.layer.tips("正在下载中，请等待下载完后再继续", obj, {
                            tips: 4,
                            fixed: true
                        });
                        return;
                    }
                    downloadArray = getMenuArray([data])
                    doDownload()
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
                    "checked": alist[j].innerText.indexOf("new") > 0
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
                    "checked": alist[j].innerText.indexOf("new") > 0
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

function doDownload() {
    if (downloadArray.length === 0) {
        clearTimeout(timer);
        return;
    }
    let menu = downloadArray.shift();
    layui.layer.open({
        type: 2,
        title: menu.title,
        shadeClose: false,
        shade: 0,
        offset: 'l',
        anim: 'slideRight',
        skin: 'layui-layer-win10', // 加上边框
        maxmin: true, //开启最大化最小化按钮
        area: ['75%', '80%'],
        content: menu.href,
        success: function (layero, index, that) {
            let iframeDocument = layui.layer.getChildFrame('html', index);
            let iDocument = iframeDocument[0];
            saveContentToLocal(iDocument);
            let msg = {
                "handle": "lhd_close",
                "layer_index": index
            }
            unsafeWindow.postMessage(msg);
        }
    });
}
