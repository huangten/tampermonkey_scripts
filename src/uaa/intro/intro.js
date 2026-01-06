// import { createApp } from 'vue'
// import App from './App.vue'
// import elCss from 'element-plus/dist/index.css?raw'
//
// function createShadowRoot() {
//   const host = document.createElement('div')
//   host.id = '__tm_ui_root__'
//   document.body.appendChild(host)
//   const style = document.createElement('style')
//   style.textContent = elCss
//   document.body.appendChild(style)
//   return host
// }
//
// const mountEl = createShadowRoot()
//
// const app = createApp(App)
//
// app.mount(mountEl)

import {init, copyContext, waitForElement, Downloader} from "../../common/common.js";
import {
    getMenuArray,
    getMenuTree,
    saveContentToLocal
} from "../common.js";

const downloader = new Downloader();

init().then(() => {
    run();

}).catch(() => {
    console.log('初始化失败');
});

async function downloadChapter(task) {
    let iframeId = "__uaa_iframe__" + crypto.randomUUID();
    const iframe = ensureIframe(iframeId, task.href);
    updateIframeHeader(task.title);
    slideInIframe();
    console.log(task.href);
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
    const success = saveContentToLocal(el);

    // 动画滑出 + 清空 iframe
    slideOutIframe(iframeId);
    return success;
}

function run() {
    const layer = layui.layer;
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
            // ✅ 全部完成 — 销毁 iframe
            layer.alert('下载完毕', {icon: 1, shadeClose: true});
        }
    });

    const fixbarStyle = `
    background-color: #ff5555;
    font-size: 16px;
    width:100px;
    height:36px;
    line-height:36px;
    margin-bottom:6px;
    border-radius:10px;`.trim();

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
                mouseleave: function (type) {
                    layer.closeAll('tips');
                }
            },
            // 点击事件
            click: function (type) {
                console.log(this, type);
                // layer.msg(type);
                if (type === "downloadAll") {
                    if (downloader.running) {
                        layer.tips("正在下载中，请等待下载完后再继续", this, {
                            tips: 4,
                            fixed: true
                        });
                        return;
                    }
                    downloadAll();
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
                    openPage();
                }
            }
        });
    });
}

function downloadAll() {
    const downloadArray = getMenuArray(getMenuTree())
    downloadArray.forEach(data => {
        downloader.add(data);
    });
    downloader.start().then(r => {
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
        area: ['20%', '80%'],
        skin: 'layui-layer-rim', // 加上边框
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
                default: true, // 是否显示默认的 bar 列表 --  v2.8.0 新增
                bgcolor: '#16baaa', // bar 的默认背景色
                css: {bottom: "15%", right: 30},
                target: layero, // 插入 fixbar 节点的目标元素选择器
                click: function (type) {
                    // console.log(this, type);
                    // layer.msg(type);
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
                if (downloader.running) {
                    layer.msg("正在下载中，请等待下载完后再继续");
                    return;
                }
                const downloadArray = getMenuArray(checkedData)
                downloader.clear();
                downloadArray.forEach(data => {
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
                    if (downloader.running) {
                        layer.tips("正在下载中，请等待下载完后再继续", obj, {
                            tips: 4,
                            fixed: true
                        });
                        return;
                    }
                    const downloadArray = getMenuArray([data])
                    downloadArray.forEach((task) => {
                        downloader.add(task)
                    })
                    downloader.start().then();
                }
            });
        }
    });
}


function ensureIframe(iframeId, iframeUrl) {
    let containerId = "__uaa_iframe_container__";
    let container = document.getElementById(containerId);
    if (!container) {
        // 创建容器
        container = document.createElement("div");
        container.id = containerId;
        container.style.position = "fixed";
        container.style.top = "10%";
        container.style.left = "0";
        container.style.width = "70%";
        container.style.height = "80%";
        container.style.zIndex = "999999";
        container.style.transform = "translateX(-100%)";
        container.style.transition = "transform 0.5s ease";
        container.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
        container.style.background = "#fff";
        document.body.appendChild(container);

        // 创建标题栏
        const header = document.createElement("div");
        header.id = "__iframe_header__";
        header.style.width = "100%";
        header.style.height = "35px";
        header.style.lineHeight = "35px";
        header.style.background = "#ff5555";
        header.style.color = "#fff";
        header.style.fontWeight = "bold";
        header.style.textAlign = "center";
        header.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
        header.innerText = "加载中...";
        container.appendChild(header);
    }

    // 创建 iframe
    const iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.src = iframeUrl;
    iframe.style.width = "100%";
    iframe.style.height = "calc(100% - 35px)";
    iframe.style.position = "fixed";
    iframe.style.zIndex = "999999";
    iframe.style.boxShadow = "0 0 15px rgba(0,0,0,0.3)";
    iframe.style.border = " 2px solid #ff5555";
    iframe.style.background = "#fff";
    iframe.style.border = "none";
    container.appendChild(iframe);

    return document.getElementById(iframeId);
}

function slideInIframe() {
    const iframe = document.getElementById("__uaa_iframe_container__");
    iframe.style.transform = "translateX(0)";
}

function slideOutIframe(iframeId) {
    const container = document.getElementById("__uaa_iframe_container__");
    const iframe = document.getElementById(iframeId);
    if (!container || !iframe) return;

    // 滑出动画
    container.style.transform = "translateX(-100%)";

    destroyIframe(iframeId);
    // 动画结束后清空 iframe
    setTimeout(() => {
        try {
            if (iframe) {
                iframe.src = "about:blank";
                iframe.contentDocument.write("");
                iframe.contentDocument.close();
                console.log("✅ iframe 已清空为白页");
            }
        } catch (e) {
            console.error("清空 iframe 失败", e);
        }
    }, 100); // 等待动画完成 0.5s
}

function updateIframeHeader(title) {
    const header = document.getElementById("__iframe_header__");
    if (header) {
        header.innerText = title || "加载中...";
    }
}

function destroyIframe(iframeId) {
    let iframe = document.getElementById(iframeId);
    if (iframe) {
        setTimeout(async () => {
            try {
                iframe.onload = null;
                iframe.onerror = null;
                iframe.contentDocument.write("");
                iframe.contentDocument.close();
                iframe.src = "about:blank";
                await new Promise(r => setTimeout(r, 0))
                iframe.remove();
                iframe = null;
            } catch (e) {
                console.error("清空 iframe 失败", e);
            }

            console.log("✅ iframe 已完全清理并销毁");
        }, 100); // 等待动画完成 0.5s
    }
}



