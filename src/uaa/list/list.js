import {init,} from "../../common/common.js";
import {buildEpub} from "./buildEpub.js";
import {Downloader} from "../../common/downloader.js";



let openBookListWindowIndex = 0;
const openNewWindowScheduler = new Downloader();
openNewWindowScheduler.setConfig({
    interval: 50,
    downloadHandler: async function (task) {
        const a = document.createElement('a');
        a.href = task.href;
        a.target = '_blank';
        a.click();
    },
    onTaskComplete: (task, success) => {
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
        console.log("打开结束 ✅");
        // layui.layer.alert('书籍打开完毕', {icon: 1, shadeClose: true});
    },
    onCatch: async (err) => {
        layui.layer.alert('出现错误：' + err.message, {icon: 5, shadeClose: true});
    }
});


const exportEpubScheduler = new Downloader();

exportEpubScheduler.setConfig({
    interval: 50,
    onTaskBefore: (task) => {
    },
    downloadHandler: async function (task) {
        await buildEpub(task.href);
    },
    onTaskComplete: (task, success) => {
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
        console.log("打开结束 ✅");
        layui.layer.min(openBookListWindow());
        layui.layer.msg('书籍导出完毕', {icon: 1, shadeClose: true});
    },
    onCatch: async (err) => {
        layui.layer.alert('导出失败：' + err.message, {icon: 5, shadeClose: true});
    }
});


init().then(() => {
    run();
});

function run() {
    layui.use(function () {
        layui.util.fixbar({
            bars: [{
                type: '本页书籍单',
                icon: 'layui-icon-list'
            }],
            default: false,
            bgcolor: '#ff5722',
            css: {bottom: "15%", right: 0},
            margin: 0,
            // 点击事件
            click: function (type) {
                if (type === "openCurrentPageAllBook") {

                }
                if (type === "本页书籍单") {
                    openBookListWindow();
                }
            }
        });
    });
}


function openBookListWindow() {
    if (openBookListWindowIndex !== 0) {
        return openBookListWindowIndex;
    }
    openBookListWindowIndex = layui.layer.open({
        type: 1,
        title: "书籍列表",
        shadeClose: false,
        closeBtn:false,
        offset: 'r',
        shade: 0,
        anim: 'slideLeft', // 从右往左
        area: ['60%', '80%'],
        skin: 'layui-layer-win10', // 加上边框
        moveOut: true,
        maxmin: true, //开启最大化最小化按钮
        content: `<div id='openPage'></div>`,
        btn: ['全选', '1-12', '13-24', '25-36', '37-49', '打开选中书籍', '导出EPUB', '清除选中'],
        btn1: function (index, layero, that) {
            const type = '全选';
            layui.tree.reload('bookListTree', {data: setMenuTreeChecked(layui.tree, 'bookListTree', type)});
            return false;
        },
        btn2: function (index, layero, that) {
            const type = '1-12';
            layui.tree.reload('bookListTree', {data: setMenuTreeChecked(layui.tree, 'bookListTree', type)});
            return false;
        },
        btn3: function (index, layero, that) {
            const type = '13-24';
            layui.tree.reload('bookListTree', {data: setMenuTreeChecked(layui.tree, 'bookListTree', type)});
            return false;
        },
        btn4: function (index, layero, that) {
            const type = '25-36';
            layui.tree.reload('bookListTree', {data: setMenuTreeChecked(layui.tree, 'bookListTree', type)});
            return false;
        },
        btn5: function (index, layero, that) {
            const type = '37-49';
            layui.tree.reload('bookListTree', {data: setMenuTreeChecked(layui.tree, 'bookListTree', type)});
            return false;
        },
        btn6: function (index, layero, that) {
            // const type = '打开选中书籍';
            if (openNewWindowScheduler.running) {
                layui.layer.msg("正在打开中，请等待打开完后再继续");
                return;
            }
            openNewWindow().then();
            return false;
        },
        btn7: function (index, layero, that) {
            // const type = '导出EPUB';
            if (exportEpubScheduler.running) {
                layui.layer.msg("正在导出中，请等待导出完后再继续");
                return;
            }
            exportEpub().then();
            return false;
        },
        btn8: function (index, layero, that) {
            // const type = '清除选中';
            reloadTree();
            openNewWindowScheduler.clear();
            exportEpubScheduler.clear();
            return false;
        },
        success: function (layero, index, that) {
            layui.tree.render({
                elem: '#openPage',
                data: getMenuTree(),
                showCheckbox: true,
                onlyIconControl: true, // 是否仅允许节点左侧图标控制展开收缩
                id: 'bookListTree',
                isJump: false, // 是否允许点击节点时弹出新窗口跳转
                click: function (obj) {
                    let data = obj.data; //获取当前点击的节点数据
                    let all = getMenuTreeChecked(layui.tree, 'bookListTree');
                    for (let i = 0; i < all.length; i++) {
                        if (data.id === all[i].id) {
                            all[i].checked = !data.checked;
                        }
                    }
                    layui.tree.reload('bookListTree', {data: all}); // 重载实例
                }
            });
        }
    });


    return openBookListWindowIndex;
}

async function openNewWindow() {
    let checkedData = layui.tree.getChecked('bookListTree'); // 获取选中节点的数据
    checkedData.reverse();
    checkedData.forEach((data) => {
        openNewWindowScheduler.add(data);
    });
    await openNewWindowScheduler.start();
}

async function exportEpub() {
    let checkedData = layui.tree.getChecked('bookListTree'); // 获取选中节点的数据
    checkedData.reverse();
    checkedData.forEach((date)=>{
        exportEpubScheduler.add(date);
    })
    await exportEpubScheduler.start();
}

function reloadTree() {
    layui.tree.reload('bookListTree', { // options
        data: getMenuTree()
    }); // 重载实例
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
    let checked = t.getChecked(treeId);
    let checkedIds = [];
    for (let i = 0; i < checked.length; i++) {
        checkedIds.push(checked[i].id);
    }
    let all = getMenuTree();
    for (let i = 0; i < all.length; i++) {
        if (checkedIds.includes(all[i].id)) {
            all[i].checked = true;
        }
    }
    return all;
}

