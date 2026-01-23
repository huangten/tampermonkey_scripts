import {check18R, getInfo} from "../common.js";
import {destroyIframeElementAsync, init, sleep, waitForElement} from "../../common/common.js";
import {Downloader} from "../../common/downloader.js";


const downloader = new Downloader();
let infoWindowIndex = 0
const downloadWindowDivIntroId = 'downloadWindowDivIntroId';


downloader.setConfig({
    interval: 0,
    downloadHandler: downloadV1,
    onTaskComplete: (task, success) => {
        let percent = (
            (downloader.doneSet.size + downloader.failedSet.size)
            /
            (downloader.doneSet.size + downloader.failedSet.size + downloader.pendingSet.size) * 100
        ).toFixed(2) + '%'
        layui.element.progress('demo-filter-progress', percent);
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: (downloaded, failed) => {
        console.log("下载结束 ✅");
        console.log("已下载:", downloaded.map(t => t));
        console.log("未下载:", failed.map(t => t));
        // ✅ 全部完成 — 销毁 iframe
        layui.layer.alert('下载完毕', {icon: 1, shadeClose: true});
    },
    onCatch: (err) => {
        layui.layer.alert('出现错误：' + err.message, {icon: 5, shadeClose: true});
    }
});


async function downloadV1(task) {
    let oldIframes =
        document.getElementById(downloadWindowDivIntroId).getElementsByTagName('iframe');
    for (let i = 0; i < oldIframes.length; i++) {
        await destroyIframeElementAsync(oldIframes[i])
    }
    layui.layer.title(task.title, infoWindowIndex);
    document.getElementById('downloadInfoContentId').href = task.href;
    document.getElementById('downloadInfoContentId').innerText = task.title;
    // 创建 iframe
    const iframe = document.createElement("iframe");
    iframe.id = "_iframe_" + crypto.randomUUID();
    iframe.src = task.href;
    iframe.style.display = "block";
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    document.getElementById(downloadWindowDivIntroId).appendChild(iframe)

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
    await destroyIframeElementAsync(iframe);
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

    layui.use(function () {
        const util = layui.util;
        // 自定义固定条
        util.fixbar({
            bars: [{
                type: '打开菜单面板',
                // style: '',
                icon: 'layui-icon-list'
            }],
            default: false,
            bgcolor: '#BA350F',
            css: {bottom: "20%", right: 10},
            margin: 0,
            on: { // 任意事件 --  v2.8.0 新增
                mouseenter: function (type) {
                    layui.layer.tips(type, this, {
                        tips: 4,
                        fixed: true
                    });
                },
                mouseleave: function (type) {
                    layui.layer.closeAll('tips');
                }
            },
            // 点击事件
            click: function (type) {
                if (type === "打开菜单面板") {
                    openMenuPage();
                }
            }
        });
    });
}

function openMenuPage() {
    if (infoWindowIndex !== 0) {
        layui.layer.restore(infoWindowIndex);
        return
    }
    infoWindowIndex = layui.layer.open({
        type: 1,
        title: "增强面板",
        shadeClose: false,
        closeBtn: 0,
        shade: 0,
        area: ['70%', '80%'],
        skin: 'layui-layer-win10', // 加上边框
        maxmin: true, //开启最大化最小化按钮
        content: '<div id="downloadWindowDivId"></div>',
        moveOut: true,
        btn: ['下载全部', '下载选中的', '清除未下载的'],
        btn1: function (index, layero, that) {
            getMenuArray(getTree()).forEach(d => downloader.add(d))
            downloader.start().then();
            return false;
        },
        btn2: function (index, layero, that) {
            treeCheckedDownload()
            return false;
        },
        btn3: function (index, layero, that) {
            reloadTree();
            return false;
        },
        // btnAlign: 'c',
        success: function (layero, index, that) {
            const tabs = layui.tabs;
            // 方法渲染
            tabs.render({
                elem: '#downloadWindowDivId',
                id: 'downloadWindowDivTabsId',
                // trigger: 'mouseenter',
                header: [
                    {title: '说明信息'}
                ],
                body: [
                    {content: `<div></div>`}
                ],
            });
            tabs.add('downloadWindowDivTabsId', {
                title: '下载详情',
                content: `<div id="${downloadWindowDivIntroId}" style="width: 100%;height: 100%;"></div>`,
                mode: 'prepend',
                done: () => {
                    const tabs = document.getElementsByClassName('layui-tabs-item');
                    for (let i = 0; i < tabs.length; i++) {
                        tabs[i].style.height = (window.innerHeight * 0.649) + 'px';
                    }
                }
            });
            tabs.add('downloadWindowDivTabsId', {
                title: '下载进度',
                content: '<div id="downloadWindowDivInfoId">' +
                    '<fieldset class="layui-elem-field">\n' +
                    '  <legend>当前下载</legend>\n' +
                    '  <div class="layui-field-box">\n' +
                    '      <a id="downloadInfoContentId" href="">暂无下载</a>\n' +
                    '  </div>\n' +
                    '</fieldset>' +
                    '<fieldset class="layui-elem-field">\n' +
                    '  <legend>进度条</legend>\n' +
                    '  <div class="layui-field-box">\n' +
                    '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="demo-filter-progress">' +
                    ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
                    '</div>' +
                    '  </div>' +
                    '</fieldset>' +
                    '</div>',
                mode: 'prepend',
                done: () => {
                    layui.element.render('progress', 'demo-filter-progress');
                    layui.element.progress('demo-filter-progress', '0%');
                }
            });

            tabs.add('downloadWindowDivTabsId', {
                title: '番号列表',
                content: '<div id="downloadWindowDivListTreeId"></div>',
                mode: 'prepend',
                done: () => {
                    const util = layui.util;
                    const tree = layui.tree;
                    tree.render({
                        elem: '#downloadWindowDivListTreeId',
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
                }
            })
        }
    });
}

function treeCheckedDownload() {
    let checkedData = layui.tree.getChecked('titleList'); // 获取选中节点的数据
    console.log(checkedData[0]);
    if (checkedData.length === 0) {
        return;
    }
    getMenuArray(checkedData).forEach(d => downloader.add(d))
    downloader.start().then();
}

function reloadTree() {
    layui.tree.reload('titleList', {data: getTree()}); // 重载实例
    downloader.clear();
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
