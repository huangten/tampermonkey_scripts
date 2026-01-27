import {cleanText, copyContext, destroyIframeElementAsync, init, sleep, waitForElement} from "../../common/common.js";
import {getTexts, saveContentToLocal} from "../common.js";
import {Downloader} from "../../common/downloader.js";
import {buildEpub} from "../buildEpub.js";

let infoWindowIndex = 0;
let downloadInfoWindowIndex = 0;

// 最近一次下载的时间
let lastDownloadTime = GM_getValue('chapter_last_download_time', Date.now());
GM_addValueChangeListener("chapter_last_download_time", (key, oldVal, newVal, remote) => {
    if (remote) {
        lastDownloadTime = newVal;
    }
});

const downloader = new Downloader();
const downloadInfoWindowDivId = 'downloadInfoWindowDivId';
const infoWindowProgressFilter = 'infoWindowProgressFilter';

const downloaderInterval = 2500;
downloader.setConfig({
    interval: downloaderInterval,
    onTaskBefore: async (task) => {
        layui.layer.title(task.title, ensureDownloadInfoWindowIndex(downloadInfoWindowDivId))
        document.getElementById('downloadInfoContentId').innerText = task.title;
        document.getElementById('downloadInfoContentId').href = task.href;

        let time = Date.now() - lastDownloadTime;
        if (time < downloaderInterval) {
            await sleep(downloaderInterval - time);
        }
    },
    downloadHandler: async function (task) {
        let oldIframes = document.getElementById(downloadInfoWindowDivId).getElementsByTagName('iframe');
        for (let i = 0; i < oldIframes.length; i++) {
            await destroyIframeElementAsync(oldIframes[i])
        }
        // 创建 iframe
        let iframe = document.createElement("iframe");
        iframe.id = "__uaa_iframe__" + crypto.randomUUID()
        iframe.src = task.href;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        document.getElementById(downloadInfoWindowDivId).appendChild(iframe)

        // 等待页面加载
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);
            iframe.onload = async () => {
                try {
                    await waitForElement(iframe.contentDocument, '.line', 1000 * 25 * 60);
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(new Error("正文元素未找到"));
                }
            };
        });

        // 保存内容
        const el = iframe.contentDocument;
        if (getTexts(el).some(s => s.includes('以下正文内容已隐藏')))
            throw new Error("章节内容不完整，结束下载");
        const success = saveContentToLocal(el);
        await sleep(300);
        await destroyIframeElementAsync(iframe);
        return success;
    },
    onTaskComplete: (task, success) => {
        let percent = (
            (downloader.doneSet.size + downloader.failedSet.size)
            /
            (downloader.doneSet.size + downloader.failedSet.size + downloader.pendingSet.size)
            * 100
        ).toFixed(2) + '%'
        layui.element.progress(infoWindowProgressFilter, percent);
        lastDownloadTime = new Date(task.endTime).getTime();
        GM_setValue('chapter_last_download_time', lastDownloadTime);
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
        console.log("下载结束 ✅");

        layui.layer.title('下载面板', ensureDownloadInfoWindowIndex(downloadInfoWindowDivId))

        console.log("已下载:", downloaded.map(t => t));
        console.log("未下载:", failed.map(t => t));

        document.getElementById('downloadInfoContentId').innerText = '下载结束';
        document.getElementById('downloadInfoContentId').href = '';

        layui.layer.min(ensureDownloadInfoWindowIndex(downloadInfoWindowDivId))
        // ✅ 全部完成 — 销毁 iframe
        layui.layer.alert('下载完毕', {icon: 1, shadeClose: true});
    },
    onCatch: async (err) => {
        layui.layer.min(ensureInfoWindowIndex())
        layui.layer.restore(ensureDownloadInfoWindowIndex(downloadInfoWindowDivId))
        layui.layer.alert('出现错误：' + err.message, {icon: 5, shadeClose: true});
    }
});


init().then(() => {
    run()
}).catch((e) => {
    console.log(e);
});

function run() {
    layui.use(function () {
        const util = layui.util;
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: '复制书名',
                    icon: 'layui-icon-success'
                }, {
                    type: '下载全部',
                    icon: 'layui-icon-download-circle'
                }, {
                    type: '导出本书EPUB文件',
                    icon: 'layui-icon-release'
                }, {
                    type: '清除未下载',
                    icon: 'layui-icon-refresh'
                }, {
                    type: '章节列表',
                    icon: 'layui-icon-list'
                }
            ],
            default: false,
            bgcolor: '#ff5722',
            css: {bottom: "20%", right: 0},
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
                if (type === "下载全部") {
                    layui.layer.min(ensureInfoWindowIndex())
                    downloadAll();
                    return;
                }
                if (type === "复制书名") {
                    let bookName = document.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText
                    copyContext(bookName).then();
                    return;
                }
                if (type === "导出本书EPUB文件") {
                    buildEpub(document.location.href).then();
                    return;
                }
                if (type === "清除未下载") {
                    downloader.clear();
                    return;
                }
                if (type === "章节列表") {
                    openBookChapterListPage().then();
                }
            }
        });
    });
}

function ensureInfoWindowIndex() {
    if (infoWindowIndex !== 0) {
        return infoWindowIndex;
    }
    infoWindowIndex = layui.layer.tab({
        shadeClose: false,
        closeBtn: 0,
        shade: 0,
        maxmin: true, //开启最大化最小化按钮
        area: ['60%', '80%'],
        moveOut: true,
        tab: [
            {
                title: '章节列表',
                content: '<div style="height: 100%;width: 100%;padding-top: 10px;">' +
                    '<div id="downloadWindowDivListTreeId"></div>' +
                    '</div>'
            }, {
                title: '下载进度',
                content: '<div style="height: 100%;width: 100%;padding-top: 10px;">' +
                    '<div id="downloadWindowDivInfoId">' +
                    '<fieldset class="layui-elem-field">\n' +
                    '  <legend>当前下载</legend>\n' +
                    '  <div class="layui-field-box">\n' +
                    '      <a id="downloadInfoContentId" href="">暂无下载</a>\n' +
                    '  </div>\n' +
                    '</fieldset>' +
                    '<fieldset class="layui-elem-field">\n' +
                    '  <legend>进度条</legend>\n' +
                    '  <div class="layui-field-box">\n' +
                    '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="' + infoWindowProgressFilter + '">' +
                    ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
                    '</div>' +
                    '  </div>' +
                    '</fieldset>' +
                    '</div>' +
                    '</div>'
            }],

        btn: ['下载选中章节', '清除未下载', '下载全部章节'],
        btn1: function (index, layero, that) {
            treeCheckedDownload()
            return false;
        },
        btn2: function (index, layero, that) {
            reloadTree();
            return false;
        },
        btn3: function (index, layero, that) {
            downloadAll();
            return false;
        },
        // btnAlign: 'c',
        success: function (layero, index, that) {
            layui.element.render('progress', infoWindowProgressFilter);
            layui.element.progress(infoWindowProgressFilter, '0%');
            const tree = layui.tree;
            tree.render({
                elem: '#downloadWindowDivListTreeId',
                data: getChapterListTree(),
                showCheckbox: true,
                onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                id: 'titleList',
                isJump: false, // 是否允许点击节点时弹出新窗口跳转
                click: function (obj) {
                    const data = obj.data; //获取当前点击的节点数据
                    doTreeToChapterList([data]).forEach(d => downloader.add(d))
                    downloader.start().then();
                }
            });
        }
    });
    return infoWindowIndex;
}

function treeCheckedDownload() {
    let checkedData = layui.tree.getChecked('titleList'); // 获取选中节点的数据
    if (checkedData.length === 0) {
        layui.layer.msg("未选中任何数据");
        return;
    }
    doTreeToChapterList(checkedData).forEach(data => {
        downloader.add(data);
    });
    downloader.start().then();
}

function reloadTree() {
    layui.tree.reload('titleList', {data: getChapterListTree()});
    downloader.clear();
}

function ensureDownloadInfoWindowIndex(downloadInfoWindowDivId) {
    if (downloadInfoWindowIndex !== 0) {
        return downloadInfoWindowIndex;
    }
    downloadInfoWindowIndex = layui.layer.open({
        type: 1,
        title: '下载面板',
        shadeClose: false,
        closeBtn: 0,
        shade: 0,
        moveOut: true,
        // skin: 'layui-layer-rim', // 加上边框
        maxmin: true, //开启最大化最小化按钮
        area: ['70%', '80%'],
        content: `<div id="${downloadInfoWindowDivId}" style="width: 100%;height: 99%;"></div>`,
        success: function (layero, index, that) {
            layui.layer.min(index);
            // resolve(index);
        }
    });
    return downloadInfoWindowIndex;
}

async function openBookChapterListPage() {
    ensureInfoWindowIndex();
}

function downloadAll() {
    doTreeToChapterList(getChapterListTree()).forEach(data => {
        downloader.add(data);
    });
    downloader.start().then();
}

function getChapterListTree() {
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

function doTreeToChapterList(trees) {
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
