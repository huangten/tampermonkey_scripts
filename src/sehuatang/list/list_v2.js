import {check18R, getInfo} from "../common.js";
import {init, sleep, waitForElement} from "../../common/common.js";
import {destroyIframeAsync, Downloader} from "./download.js";


const downloader = new Downloader();
let downloadWindowId = 0
const divId = 'downloadWindowDivId';


downloader.setConfig({
    interval: 500,
    downloadHandler: downloadV1,
    onTaskComplete: (task, success) => {
        let percent = ((downloader.doneSet.size + downloader.failedSet.size) / (downloader.doneSet.size + downloader.failedSet.size + downloader.pendingSet.size) * 100).toFixed(2) + '%'
        layui.element.progress('demo-filter-progress', percent);
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: (downloaded, failed) => {
        console.log("下载结束 ✅");
        console.log("已下载:", downloaded.map(t => t));
        console.log("未下载:", failed.map(t => t));

        // console.log(document.getElementsByTagName('iframe'));
        layui.layer.close(downloadWindowId)
        downloadWindowId = 0;
        // ✅ 全部完成 — 销毁 iframe
        layui.layer.alert('下载完毕', {icon: 1, shadeClose: true});
    },
    onCatch: (err) => {
        layui.layer.alert('出现错误：' + err.message, {icon: 5, shadeClose: true});
    }
});


async function createDownloadWindow(divId) {
    return new Promise((resolve, reject) => {
        layui.layer.open({
            type: 1,
            title: '下载窗口',
            shadeClose: false,
            shade: 0,
            offset: 'l',
            skin: 'layui-layer-win10', // 加上边框
            maxmin: true, //开启最大化最小化按钮
            area: ['70%', '90%'],
            content: '<fieldset class="layui-elem-field">\n' +
                '  <legend>进度条</legend>\n' +
                '  <div class="layui-field-box">\n' +
                '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="demo-filter-progress">' +
                ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
                '</div>' +
                '  </div>' +
                '</fieldset>' + `<div id="${divId}" style="width: 100%;height: 100%;"></div>`,
            success: function (layero, index, that) {
                layui.element.render('progress', 'demo-filter-progress');
                layui.element.progress('demo-filter-progress', '0%');
                // layui.layer.min(index);
                resolve(index);
            }
        });
    });
}

async function ensureDownloadWindow(divId = 'downloadWindowDivId') {
    if (downloadWindowId !== 0) {
        return downloadWindowId;
    }
    downloadWindowId = await createDownloadWindow(divId);
    return downloadWindowId;
}

async function downloadV1(task) {
    const winId = await ensureDownloadWindow(divId);
    layui.layer.title(task.title, winId)
    // 创建 iframe
    const iframe = document.createElement("iframe");
    const IframeId = "_iframe__" + crypto.randomUUID();
    iframe.id = IframeId
    iframe.src = task.href;
    iframe.style.display = "block";
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    document.getElementById(divId).appendChild(iframe)

    // 等待页面加载
    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);
        iframe.onload = async () => {
            try {
                await waitForElement(iframe.contentDocument, '.plhin', 1000 * 25 * 60);
                clearTimeout(timeout);
                resolve();
            } catch (err) {
                clearTimeout(timeout);
                reject(new Error("正文元素未找到"));
            }
        };
    });
    getInfo(iframe.contentDocument);
    await sleep(100);
    await destroyIframeAsync(IframeId);
    return true;
}


init().then(() => {
    run();
});

function run() {
    document.onvisibilitychange = () => {
        if (document.visibilityState === 'visible' && document.readyState === 'complete') {
            check18R();
        }
    }
    setTimeout(() => {
        check18R();
    }, 500);
    if (document.location.href === 'https://sehuatang.org/forum.php') {
        return
    }
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
            css: {bottom: "18%", right: 10},
            margin: 0,
            // 点击事件
            click: function (type) {
                if (type === "downloadAll") {
                    downloadAll();
                }
                if (type === "clearDownloadList") {
                    downloader.clear();
                }
                if (type === "menuList") {
                    openMenuPage();
                }
            }
        });
    });
}


function downloadAll() {
    getMenuArray(getTree()).forEach(d => downloader.add(d))
    downloader.start().then();
}

function openMenuPage() {
    layui.layer.open({
        type: 1,
        title: "章节列表",
        shadeClose: false,
        offset: 'r',
        shade: 0,
        anim: 'slideLeft', // 从右往左
        area: ['20%', '90%'],
        skin: 'layui-layer-win10', // 加上边框
        maxmin: true, //开启最大化最小化按钮
        content: `<div id='openPage'></div>`,
        success: function (layero, index, that) {
            console.log(layero, index, that)
            const util = layui.util;
            const tree = layui.tree;
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
                css: {bottom: "10%", right: 10},
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
                    getMenuArray([data]).forEach(d => downloader.add(d))
                    downloader.start().then();

                }
            });

            function treeCheckedDownload() {
                let checkedData = tree.getChecked('titleList'); // 获取选中节点的数据
                console.log(checkedData[0]);
                if (checkedData.length === 0) {
                    return;
                }
                getMenuArray(checkedData).forEach(d => downloader.add(d))
                downloader.start().then();

            }

            function reloadTree() {
                tree.reload('titleList', { // options
                    data: getTree()
                }); // 重载实例
                downloader.clear();
            }
        }
    });
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
