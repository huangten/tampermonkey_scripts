import {init,} from "../../common/common.js";
import {buildEpub} from "../buildEpub.js";
import {Downloader} from "../../common/downloader.js";


let openBookListWindowIndex = 0;
const openNewWindowScheduler = new Downloader();
openNewWindowScheduler.setConfig({
    interval: 50,
    downloadHandler: function (task) {
        const a = document.createElement('a');
        a.href = task.href;
        a.target = '_blank';
        a.click();
        return true;
    },
    onTaskBefore: (task) => {
        document.getElementById('openNewWindowInfo').innerText = '书籍: ' + task.title + ' 开始打开。。。';
        document.getElementById('openNewWindowInfo').href = task.href;
    },

    onTaskComplete: (task, success) => {
        document.getElementById('openNewWindowInfo').innerText = '书籍: ' + task.title + ' 打开完毕';
        document.getElementById('openNewWindowInfo').href = task.href;
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
        console.log("打开结束 ✅");
        document.getElementById('openNewWindowInfo').innerText = '书籍打开完毕';
        document.getElementById('openNewWindowInfo').href = 'javascript:void(0);';
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
        document.getElementById('exportInfoContentId').innerText = '书籍: ' + task.title + ' 开始导出。。。';
        document.getElementById('exportInfoContentId').href = task.href;
    },
    downloadHandler: async function (task) {
        await buildEpub(task.href);
        return true;
    },
    onTaskComplete: (task, success) => {
        let percent = (
            (exportEpubScheduler.doneSet.size + exportEpubScheduler.failedSet.size)
            /
            (exportEpubScheduler.doneSet.size + exportEpubScheduler.failedSet.size + exportEpubScheduler.pendingSet.size)
            * 100
        ).toFixed(2) + '%';
        layui.element.progress('exportProgress', percent);
        document.getElementById('exportInfoContentId').innerText = '书籍: ' + task.title + ' 导出成功';
        document.getElementById('exportInfoContentId').href = task.href;
        console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
        document.getElementById('exportInfoContentId').innerText = '书籍导出完毕';
        document.getElementById('exportInfoContentId').href = 'javascript:void(0);';
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
    openBookListWindowIndex = layui.layer.tab({
        type: 1,
        // title: "书籍列表",
        shadeClose: false,
        closeBtn: false,
        // offset: 'r',
        shade: 0,
        // anim: 'slideLeft', // 从右往左
        area: ['60%', '80%'],
        // skin: 'layui-layer-win10', // 加上边框
        moveOut: true,
        maxmin: true, //开启最大化最小化按钮
        tab: [
            {
                title: '书籍列表',
                content: '<div style="height: 100%;width: 99%;padding-top: 10px;">' +
                    '<div id="bookListWindowDiv"></div>' +
                    '</div>'
            }
            , {
                title: '导出和打开新窗口信息',
                content: '<div style="height: 100%;width: 99%;padding-top: 10px;">' +
                    '<div id="exportAndOpenNewWindow">' +
                    '<fieldset class="layui-elem-field">' +
                    '  <legend>打开新窗口的信息</legend>' +
                    '  <div class="layui-field-box">' +
                    '      <a id="openNewWindowInfo" href="">暂未打开新窗口</a>' +
                    '  </div>' +
                    '</fieldset>' +
                    '<fieldset class="layui-elem-field">' +
                    '  <legend>当前导出</legend>' +
                    '  <div class="layui-field-box">' +
                    '      <a id="exportInfoContentId" href="">暂无导出</a>' +
                    '  </div>' +
                    '</fieldset>' +
                    '<fieldset class="layui-elem-field">' +
                    '  <legend>导出进度条</legend>' +
                    '  <div class="layui-field-box">' +
                    '<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="exportProgress">' +
                    ' <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div>' +
                    '</div>' +
                    '  </div>' +
                    '</fieldset>' +
                    '</div>' +
                    '</div>'
            }
            , {
                title: '测试面板',
                content: '<div style="height: 100%;width: 99%;padding-top: 10px;">' +
                    '<div id="testWindowDiv" style="height: 100%;width: 99%;"></div>' +
                    '</div>'
            }
        ],
        // content: `<div id='bookListWindowDiv'></div>`,
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
            document.getElementById('testWindowDiv').innerHTML = getCheckboxDom();
            console.log(document.getElementById('testWindowDiv'))
            layui.form.render('checkbox', 'form-demo-skin')

            layui.element.render('progress', 'exportProgress');
            layui.element.progress('exportProgress', '0%');

            layui.tree.render({
                elem: '#bookListWindowDiv',
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
    checkedData.forEach((date) => {
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
        // 获取当前URL对象
        let params = new URL(lis[index].href).searchParams; // 获取 searchParams 对象
        let coverHref = lis[index].getElementsByTagName('img').length > 0 ?
            lis[index].getElementsByTagName('img')[0].src : '';
        menus.push({
            'id': params.get('id'),
            "title": lis[index].title,
            "href": lis[index].href,
            "spread": true,
            "field": "",
            "checked": false,
            'cover_href': coverHref,
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


function getCheckboxDom() {
    let bookElements = [];
    const bookList = getMenuTree();
    bookList.forEach((book) => {
        bookElements.push(`
    <div class="layui-col-xs12 layui-col-sm6 layui-col-md3">
      <input type="checkbox" id="book_id_${book.id}" name="book[${book.id}]" value="${book.id}" lay-skin="none" checked>
      <div lay-checkbox class="lay-skin-checkcard lay-check-dot" style="width: 250px;height: 100px;">
        <div class="lay-skin-checkcard-avatar">
          <img class="layui-icon" style="font-size: 30px;width: 80px;height: auto;" alt="" src="${book.cover_href}"/>
        </div>
        <div class="lay-skin-checkcard-detail">
          <div class="lay-skin-checkcard-header"></div>
          <div class="lay-skin-checkcard-description lay-ellipsis-multi-line">
            ${book.title}
          </div>
        </div>
      </div>
    </div>
        `);
    });


    return `
<style>
  /*
   * 基于复选框和单选框的卡片风格多选组件
   * 需要具备一些基础的 CSS 技能，以下样式均为外部自主实现。
   */
  /* 主体 */
  .layui-form-checkbox > .lay-skin-checkcard,
  .layui-form-radio > .lay-skin-checkcard {
    display: table;
    display: flex;
    padding: 12px;
    white-space: normal;
    border-radius: 10px;
    border: 1px solid #e5e5e5;
    color: #000;
    background-color: #fff;
  }
  .layui-form-checkbox > .lay-skin-checkcard>*,
  .layui-form-radio > .lay-skin-checkcard>* {
    /* display: table-cell; */  /* IE */
    vertical-align: top;
  }
  /* 悬停 */
  .layui-form-checkbox:hover > .lay-skin-checkcard,
  .layui-form-radio:hover > .lay-skin-checkcard {
    border-color: #16b777;
  }
  /* 选中 */
  .layui-form-checked > .lay-skin-checkcard,
  .layui-form-radioed[lay-skin="none"] > .lay-skin-checkcard {
    color: #000;
    border-color: #16b777;
    background-color: rgb(22 183 119 / 10%) !important;
    /* box-shadow: 0 0 0 3px rgba(22, 183, 119, 0.08); */
  }
  /* 禁用 */
  .layui-checkbox-disabled > .lay-skin-checkcard,
  .layui-radio-disabled > .lay-skin-checkcard {
    box-shadow: none;
    border-color: #e5e5e5 !important;
    background-color: #eee !important;
  }
  /* card 布局 */
  .lay-skin-checkcard-avatar {
    padding-right: 8px;
  }
  .lay-skin-checkcard-detail {
    overflow: hidden;
    word-wrap:break-word
    word-break: break-all;
    width: 100%;
  }
  .lay-skin-checkcard-header {
    font-weight: 500;
    font-size: 16px;
    white-space: nowrap;
    margin-bottom: 4px;
  }
  .lay-skin-checkcard-description {
    font-size: 13px;
    color: #5f5f5f;
  }
  .layui-disabled  .lay-skin-checkcard-description{
    color: #c2c2c2! important;
  }
  /* 选中 dot */
  .layui-form-checked > .lay-check-dot:after,
  .layui-form-radioed > .lay-check-dot:after {
    position: absolute;
    content: "";
    top: 2px;
    right: 2px;
    width: 0;
    height: 0;
    display: inline-block;
    vertical-align: middle;
    border-width: 10px;
    border-style: dashed;
    border-color: transparent;
    border-top-left-radius: 0px;
    border-top-right-radius: 6px;
    border-bottom-right-radius: 0px;
    border-bottom-left-radius: 6px;
    border-top-color: #16b777;
    border-top-style: solid;
    border-right-color: #16b777;
    border-right-style: solid;
    overflow: hidden;
  }
  .layui-checkbox-disabled > .lay-check-dot:after,
  .layui-radio-disabled > .lay-check-dot:after {
    border-top-color: #d2d2d2;
    border-right-color: #d2d2d2;
  }
  /* 选中 dot-2 */
  .layui-form-checked > .lay-check-dot-2:before,
  .layui-form-radioed > .lay-check-dot-2:before {
    position: absolute;
    font-family: "layui-icon";
    content: "\\e605";
    color: #fff;
    bottom: 4px;
    right: 3px;
    font-size: 9px;
    z-index: 12;
  }
  .layui-form-checked > .lay-check-dot-2:after,
  .layui-form-radioed > .lay-check-dot-2:after {
    position: absolute;
    content: "";
    bottom: 2px;
    right: 2px;
    width: 0;
    height: 0;
    display: inline-block;
    vertical-align: middle;
    border-width: 10px;
    border-style: dashed;
    border-color: transparent;
    border-top-left-radius: 6px;
    border-top-right-radius: 0px;
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 0px;
    border-right-color: #16b777;
    border-right-style: solid;
    border-bottom-color: #16b777;
    border-bottom-style: solid;
    overflow: hidden;
  }
  .layui-checkbox-disabled > .lay-check-dot-2:before,
  .layui-radio-disabled > .lay-check-dot-2:before {
    color: #eee !important;
  }
  .layui-checkbox-disabled > .lay-check-dot-2:after,
  .layui-radio-disabled > .lay-check-dot-2:after {
    border-bottom-color: #d2d2d2;
    border-right-color: #d2d2d2;
  }
  .lay-ellipsis-multi-line {
    overflow: hidden;
    word-break: break-all;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
</style>
<!-- 标签风格 -->
<style>
  .layui-form-radio > .lay-skin-tag,
  .layui-form-checkbox > .lay-skin-tag {
    font-size: 13px;
    border-radius: 100px;
  }
  .layui-form-checked > .lay-skin-tag,
  .layui-form-radioed > .lay-skin-tag {
    color: #fff !important;
    background-color: #16b777 !important;
  }
</style>
<!-- 单选框 Color Picker -->
<style>
  /* 主体 */
  .layui-form-radio > .lay-skin-color-picker {
    border-radius: 50%;
    border-width: 1px;
    border-style: solid;
    width: 20px;
    height: 20px;
  }
  /* 选中 */
  .layui-form-radioed > .lay-skin-color-picker {
    box-shadow: 0 0 0 1px #ffffff, 0 0 0 4px currentColor;
  }
</style>
<div class="layui-form" lay-filter="form-demo-skin">

  <div class="layui-row layui-col-space8">
  
  ${bookElements.join('\n')}
  
<!--    <div class="layui-col-xs12 layui-col-sm6 layui-col-md3">-->
<!--      <input type="checkbox" name="browser[0]" value="chrome" lay-skin="none" >-->
<!--      <div lay-checkbox class="lay-skin-checkcard lay-check-dot" style="width: 250px;height: 100px;">-->
<!--        <div class="lay-skin-checkcard-avatar">-->
<!--          <img class="layui-icon" style="font-size: 30px;width: 80px;height: auto;" alt="" src="https://cdn.uameta.ai/file/bucket-media/image/cover/81b17c6bd9964366aa665c26e33544dd.jpg"/>-->
<!--        </div>-->
<!--        <div class="lay-skin-checkcard-detail">-->
<!--          <div class="lay-skin-checkcard-header"></div>-->
<!--          <div class="lay-skin-checkcard-description lay-ellipsis-multi-line">-->
<!--            酒店，出租屋，豪车，夫妻卧室；禁欲美艳黑丝闷骚人妻熟母莉音妄断女儿恋情反遭诱迫，拍片，屈从，不伦，知味，寸止，偷穿女儿千咲的校服油丝夜袭，揭穿，沦陷，全家福前献媚，雌竞，母女丼-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->
<!--    </div>-->
   
  </div>  
</div>
`;
}
