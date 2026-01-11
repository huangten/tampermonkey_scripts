import {cleanText, copyContext, init} from "../../common/common.js";
import {getLines, getTexts, saveContentToLocal} from "../common.js";


init().then(() => {
    run();
}).catch((e) => {
    console.log(e);
});


function run() {
    // 标题内容
    let level = document.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0] !== undefined ?
        document.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0].innerText + " " : "";
    const titleBox = cleanText(level + document.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText);

    const texts = getTexts(document);
    const htmlLines = getLines(document);


    // 找到指定的 div 元素
    const targetDiv = document.querySelector('body div.title_box')
    const fixbarStyle = "background-color: #ff5555;font-size: 14px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
    layui.use(function () {
        const util = layui.util;
        // 自定义固定条
        util.fixbar({
            bars: [{
                type: '获取标题文本',
                icon: 'layui-icon-fonts-strong'
            }, {
                type: '获取标题HTML',
                icon: 'layui-icon-fonts-code'
            }, {
                type: '获取内容文本',
                icon: 'layui-icon-tabs'
            }, {
                type: '获取内容HTML',
                icon: 'layui-icon-fonts-html'
            }, {
                type: '获取标题和内容文本',
                icon: 'layui-icon-align-center'
            }, {
                type: '获取标题和内容HTML',
                icon: 'layui-icon-code-circle'
            }, {
                type: '保存内容到本地',
                icon: 'layui-icon-download-circle'
            }, {
                type: '上一章',
                icon: 'layui-icon-prev'
            }, {
                type: '本书',
                icon: 'layui-icon-link'
            }, {
                type: '下一章',
                icon: 'layui-icon-next'
            }
            ],
            default: false,
            css: {bottom: "15%"},
            margin: 0,
            // 点击事件
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
                console.log(this, type);
                // layer.msg(type);
                if (type === "获取标题文本") {
                    titleText();
                    return;
                }
                if (type === "获取标题HTML") {
                    titleHtml();
                    return;
                }
                if (type === "获取内容文本") {
                    contentText();
                    return;
                }
                if (type === "获取内容HTML") {
                    contentHtml();
                    return;
                }
                if (type === "获取标题和内容文本") {
                    titleAndContentText();
                    return;
                }
                if (type === "获取标题和内容HTML") {
                    titleAndContentHtml();
                    return;
                }
                if (type === "保存内容到本地") {
                    saveContentToLocal(document);
                    return;
                }

                if (type === "上一章") {
                    let prev = document.getElementsByClassName("bottom_box")[0].firstElementChild
                    if (prev.nodeName.indexOf("A") > -1) {
                        prev.click();
                        return
                    }
                    return;
                }
                if (type === "本书") {
                    let s = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling
                    s.click();
                    return;
                }
                if (type === "下一章") {
                    let next = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling.nextElementSibling
                    if (next.nodeName.indexOf("A") > -1) {
                        next.click();
                    }
                }

            }
        });
    });


    // 添加按钮的点击事件
    function titleText() {
        copyContext(titleBox).then()
    }

    function titleHtml() {
        copyContext("<h2>" + titleBox + "</h2>").then()
    }

    function contentText() {
        copyContext(texts.map((s) => `　　${s}`).join('\n')).then()
    }

    function contentHtml() {
        copyContext(htmlLines.join('\n')).then()
    }

    function titleAndContentText() {
        copyContext(titleBox + "\n\n" + texts.map((s) => `　　${s}`).join('\n')).then()
    }

    function titleAndContentHtml() {
        copyContext("<h2>" + titleBox + "</h2>\n\n" + htmlLines.join('\n')).then();
    }
}
