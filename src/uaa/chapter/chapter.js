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
                type: 'titleText',
                content: '获取标题文本',
                style: fixbarStyle
            }, {
                type: 'titleHtml',
                content: '获取标题HTML',
                style: fixbarStyle
            }, {
                type: 'contentText',
                content: '获取内容文本',
                style: fixbarStyle
            }, {
                type: 'contentHtml',
                content: '获取内容HTML',
                style: fixbarStyle
            }, {
                type: 'titleAndContentText',
                content: '获取标题和内容文本',
                style: fixbarStyle
            }, {
                type: 'titleAndContentHtml',
                content: '获取标题和内容HTML',
                style: fixbarStyle
            }, {
                type: 'saveContentToLocal',
                content: '保存内容到本地',
                style: fixbarStyle
            }, {
                type: 'prev',
                content: '上一章',
                style: fixbarStyle
            }, {
                type: 'self',
                content: '本书',
                style: fixbarStyle
            }, {
                type: 'next',
                content: '下一章',
                style: fixbarStyle
            }
            ],
            default: false,
            css: {bottom: "15%"},
            margin: 0,
            // 点击事件
            click: function (type) {
                console.log(this, type);
                // layer.msg(type);
                if (type === "titleText") {
                    titleText();
                    return;
                }
                if (type === "titleHtml") {
                    titleHtml();
                    return;
                }
                if (type === "contentText") {
                    contentText();
                    return;
                }
                if (type === "contentHtml") {
                    contentHtml();
                    return;
                }
                if (type === "titleAndContentText") {
                    titleAndContentText();
                    return;
                }
                if (type === "titleAndContentHtml") {
                    titleAndContentHtml();
                    return;
                }
                if (type === "saveContentToLocal") {
                    saveContentToLocal(document);
                    return;
                }

                if (type === "prev") {
                    let prev = document.getElementsByClassName("bottom_box")[0].firstElementChild
                    if (prev.nodeName.indexOf("A") > -1) {
                        prev.click();
                        return
                    }
                    return;
                }
                if (type === "self") {
                    let s = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling
                    s.click();
                    return;
                }
                if (type === "next") {
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
