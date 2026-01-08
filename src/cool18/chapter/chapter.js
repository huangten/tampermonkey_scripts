import {copyContext, init} from '../../common/common.js'


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
                    type: 'CopyContent',
                    content: '复制内容',
                    style: fixbarStyle
                },
                {
                    type: 'CopyContentHtml',
                    content: '复制内容HTML',
                    style: fixbarStyle
                },
                {
                    type: 'CopyChapter',
                    content: '复制章节',
                    style: fixbarStyle
                },
                {
                    type: 'CopyChapterHtml',
                    content: '复制章节HTML',
                    style: fixbarStyle
                }
            ],
            default: false,
            css: {bottom: "21%"},
            margin: 0,
            click: function (type) {
                if (type === "CopyContent") {
                    getPreTagContent();
                }
                if (type === "CopyContentHtml") {
                    getPreTagContentHtml();
                }
                if (type === "CopyChapter") {
                    copyChapterContent();
                }
                if (type === "CopyChapterHtml") {
                    copyChapterHtml();
                }
            }
        });
    });
}

function getPreTagContent() {
    copyContext(document.getElementsByTagName('pre')[0].innerText).then();
}

function getPreTagContentHtml() {
    copyContext(document.getElementsByTagName('pre')[0].innerHTML).then();
}

function copyChapterContent() {
    const preElement = document.getElementsByTagName('pre')[0];
    const brs = preElement.getElementsByTagName('br');
    if (brs) {
        for (let i = brs.length - 1; i >= 0; i--) {
            brs[i].remove();
        }
    }

    console.log(preElement);
    copyContext(preElement.innerText).then();
}

function copyChapterHtml() {
    const preElement = document.getElementsByTagName('pre')[0];
    const brs = preElement.getElementsByTagName('br');
    if (brs) {
        for (let i = brs.length - 1; i >= 0; i--) {
            brs[i].remove();
        }
    }
    console.log(preElement);
    copyContext(preElement.innerHTML).then();
}
