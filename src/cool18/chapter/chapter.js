import {copyContext, init} from '../../common/common.js'
import {saveAs} from "file-saver";
import {getAuthorInfo, getBookName2} from "../../uaa/common.js";


init().then(() => {
    run();
});

function run() {
    layui.use(function () {
        const util = layui.util;
        const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: '复制内容',
                    icon: 'layui-icon-success'
                }, {
                    type: '下载内容',
                    icon: 'layui-icon-download-circle'
                }
                , {
                    type: '复制内容HTML',
                    icon: 'layui-icon-fonts-code'
                }
                , {
                    type: '复制内容（第二版）',
                    icon: 'layui-icon-vercode'
                }, {
                    type: '下载内容（第二版）',
                    icon: 'layui-icon-download-circle'
                }
                , {
                    type: '复制内容HTML（第二版）',
                    icon: 'layui-icon-code-circle'
                }
            ],
            default: false,
            css: {bottom: "21%"},
            bgcolor: '#0000ff',
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
            click: function (type) {
                if (type === "复制内容") {
                    getPreTagContent();
                }
                if (type === "下载内容") {
                    downloadChapterContent();
                }
                if (type === "复制内容HTML") {
                    getPreTagContentHtml();
                }
                if (type === "复制内容（第二版）") {
                    copyChapterContent();
                }
                if (type === "下载内容（第二版）") {
                    downloadChapterContentV2()
                }
                if (type === "复制内容HTML（第二版）") {
                    copyChapterHtml();
                }
            }
        });
    });
}

function getPreElement() {
    return document.getElementsByTagName('pre')[0];
}

function getPreTagContent() {
    copyContext(getPreElement().innerText).then();
}



function downloadChapterContent() {
    const titleElements = document.getElementsByClassName('main-title');
    const titleContent = titleElements[0].innerText.trim();
    const bookName = titleContent.match(/^【(.*?)】/)[1];
    // const author = titleContent.match(/(.*?)作者(.*?)/)
    // console.log(bookName)
    const title = titleContent.replace(/^【(.*?)】/, "$1");
    const contents = getPreElement().innerText.split('\n')
        .filter(Boolean);
    const content = bookName + '\n' + title
        + '\n\n\n\n' + contents.join('\n')
    saveContentToLocationTxtFile(title, content);
}

function getPreTagContentHtml() {
    copyContext(getPreElement().innerHTML).then();
}

function getPreElementV2() {
    const preElement = document.getElementsByTagName('pre')[0];
    const brs = preElement.getElementsByTagName('br');
    if (brs) {
        for (let i = brs.length - 1; i >= 0; i--) {
            brs[i].remove();
        }
    }
    return preElement;
}

function copyChapterContent() {
    copyContext(getPreElementV2().innerText.split('\n').filter(Boolean).join('\n')).then();
}

function downloadChapterContentV2() {
    const titleElements = document.getElementsByClassName('main-title');
    const titleContent = titleElements[0].innerText.trim();
    const bookName = titleContent.match(/^【(.*?)】/)[1];
    // const author = titleContent.match(/(.*?)作者(.*?)/)
    // console.log(bookName)
    const title = titleContent.replace(/^【(.*?)】/, "$1");
    const contents = getPreElementV2().innerText.split('\n')
        .filter(Boolean)
        .map((c) => `${c.replaceAll('　', '').trim()}`);
    const content = bookName + '\n' + title
        + '\n\n\n\n' + contents.map((c) => '　　' + c).join('\n')
        + '\n\n\n\n' + contents.map((c) => `<p>${c}</p>`).join('\n')
    saveContentToLocationTxtFile(title, content);
}

function copyChapterHtml() {
    copyContext(getPreElementV2().innerHTML).then();
}

function saveContentToLocationTxtFile(filename, content) {
    try {
        const isFileSaverSupported = !!new Blob;
        const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
        saveAs(blob, filename + ".txt");
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
}