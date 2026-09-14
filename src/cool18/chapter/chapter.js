import {copyContext} from "../../common/common.js";
import {saveAs} from "file-saver";

export class ChapterController {
    constructor(doc = document) {
        this.doc = doc;
    }

    run() {
        const self = this;
        layui.use(function () {
            const util = layui.util;
            util.fixbar({
                bars: [
                    {
                        type: '复制书名',
                        icon: 'layui-icon-auz'
                    },
                    {
                        type: '复制内容',
                        icon: 'layui-icon-success'
                    }, {
                        type: '原样下载',
                        icon: 'layui-icon-download-circle'
                    }
                    , {
                        type: '添加空白符下载',
                        icon: 'layui-icon-release'
                    }
                    , {
                        type: '复制内容HTML',
                        icon: 'layui-icon-fonts-code'
                    }
                    , {
                        type: '调整排版并复制',
                        icon: 'layui-icon-spread-left'
                    }
                ],
                default: false,
                css: {bottom: "21%"},
                bgcolor: '#ad2fec',
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
                    if (type === "复制书名") {
                        self.getBookname();
                    }
                    if (type === "复制内容") {
                        self.getPreTagContent();
                    }
                    if (type === "原样下载") {
                        self.downloadChapterContent();
                    }
                    if (type === "添加空白符下载") {
                        self.downloadChapterContent('blank');
                    }
                    if (type === "复制内容HTML") {
                        self.getPreTagContentHtml();
                    }
                    if (type === "调整排版并复制") {
                        self.copyChapterContent();
                    }
                }
            });
        });
    }

    getPreElement() {
        return this.doc.getElementsByTagName('pre')[0];
    }

    getPreTagContent() {
        copyContext(this.getPreElement().innerText).then();
    }


    getBookname() {
        const titleElements = this.doc.getElementsByClassName('main-title');
        const titleContent = titleElements[0].innerText.trim();
        let bookName = titleContent.match(/^【(.*?)】/);
        if (!bookName) {
            bookName = titleContent;
        } else {
            bookName = bookName[1];
        }
        copyContext(bookName).then();
        return bookName;
    }

    downloadChapterContent(tag) {
        const titleElements = this.doc.getElementsByClassName('main-title');
        const titleContent = titleElements[0].innerText.trim();
        // const bookName = titleContent.match(/^【(.*?)】/)[1];
        // const author = titleContent.match(/(.*?)作者(.*?)/)
        // console.log(bookName)
        let title = titleContent.replace(/^【(.*?)】/, "$1");

        const prentTitleElements = this.doc.getElementsByClassName('reply-info');
        if (prentTitleElements.length > 0) {
            try {
                const prentTitle = prentTitleElements[0].getElementsByTagName('a')[0].innerText.trim();
                const pTitle = prentTitle.replace(/^【(.*?)】/, "$1");
                title = title + '\n\n' + `回复于：${pTitle}`;
            } catch (e) {
                console.log(e);
            }
        }

        const content = title +
            '\n\n' +
            this.getChapterContent(tag) +
            '\n\n\n\n\n\n\n';

        this.saveContentToLocationTxtFile(title, content);
    }

    getChapterContent(tag = '') {
        return this.getPreElement().innerText.split('\n')
            .filter(Boolean).map((c) => {
                c = c.trimEnd();
                // const a = c.length;

                // const b = c.length;
                if (tag === 'blank') {
                    c = c.replace(/^[ \t\r\n\f\v]+|[ \t\r\n\f\v]+$/g, '');
                    c = `　　${c}`;
                }
                return c;
            }).join('\n');
    }

    getPreTagContentHtml() {
        copyContext(this.getPreElement().innerHTML).then();
    }

    getPreElementV2() {
        const preElement = this.getPreElement();
        const brs = preElement.getElementsByTagName('br');
        if (brs) {
            for (let i = brs.length - 1; i >= 0; i--) {
                brs[i].remove();
            }
        }
        return preElement;
    }

    copyChapterContent() {
        copyContext(this.getPreElementV2().innerText.split('\n').filter(Boolean).join('\n')).then();
    }

    saveContentToLocationTxtFile(filename, content) {
        try {
            !!new Blob;
            const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
            saveAs(blob, filename + ".txt");
        } catch (e) {
            console.log(e);
            return false;
        }
        return true;
    }
}
