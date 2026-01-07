import {check18R, getInfo} from "../common.js";
import {init} from "../../common/common.js";


init().then(() => {
    run();
});


let downloadArray = [];

function run() {

    document.onvisibilitychange = () => {
        if (document.visibilityState === 'visible' && document.readyState === 'complete') {
            check18R();
        }
    }
    setTimeout(() => {
        check18R();
    }, 500);

    let timer = 0;
    const ListenMessage = (e) => {
        if (e.data.handle === 'lhd_close') {
            layui.layer.closeAll('iframe', () => {
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
            }, 200);
        }
    }

    function cycleClear(el) {
        try {
            if (el) {
                el.contentDocument.write("")
                el.contentWindow.document.write('');
                el.contentWindow.close();
                el.parentNode.removeChild(el);
            }
        } catch (e) {
            console.log('cycleClear', e)
            // setTimeout(cycleClear(el), 100);
        }
    }

    unsafeWindow.addEventListener('message', ListenMessage);
    const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:100px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
    layui.use(function () {
        const util = layui.util;
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
            default: false,
            css: {bottom: "18%"},
            margin: 0,
            // 点击事件
            click: function (type) {
                console.log(this, type);
                // layer.msg(type);
                if (type === "downloadAll") {
                    if (downloadArray.length !== 0) {
                        layui.layer.tips("正在下载中，请等待下载完后再继续", this, {
                            tips: 4,
                            fixed: true
                        });
                    } else {
                        downloadAll();
                    }
                }
                if (type === "clearDownloadList") {
                    downloadArray = [];
                }
                if (type === "menuList") {
                    openPage();
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
                let iframeDocument = layui.layer.getChildFrame('html', index);
                let documentElement = iframeDocument[0];
                getInfo(documentElement)
                setTimeout(() => {
                    let msg = {
                        "handle": "lhd_close",
                        "layer_index": index
                    }
                    unsafeWindow.postMessage(msg);
                }, 500);
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
                const util = layui.util;
                const tree = layui.tree;
                const layer = layui.layer;
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
                    css: {bottom: "10%", right: 30},
                    target: layero, // 插入 fixbar 节点的目标元素选择器
                    bgcolor: '#ba350f',
                    click: function (type) {
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
                        const data = obj.data; //获取当前点击的节点数据
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
                    downloadArray = [];
                }
            }
        });
    }
}

function getTree() {
    let indexMap = new Map();
    let index = 0;
    let tree = [];
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
    let lines = [];
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
            let href = '';
            let title = '';
            for (let i = 0; i < titleBox.length; i++) {
                if (titleBox[i].getAttribute("class") !== null && titleBox[i].getAttribute("class") === 's xst') {
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
    let menus = [];
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
