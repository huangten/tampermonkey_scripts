import {copyContext} from "../../common/common.js";
import {saveAs} from "file-saver";
import {ChapterView} from "../views/ChapterView.js";
import {EditorPageView} from "../views/EditorPageView.js";
import {EditorModel} from "../models/EditorModel.js";

export class ChapterController {
    constructor(doc = document) {
        this.doc = doc;
        this.chapterView = new ChapterView()
        this.editorPageView = null;
        this.editorModel = null;
        this.editor = null;
    }

    handleAction(type) {
        switch (type) {
            case "复制书名": {this.getBookname();}break;
            case "复制内容": {this.getPreTagContent();}break;
            case "原样下载": {this.downloadChapterContent();}break;
            case "添加空白符下载": {this.downloadChapterContent('blank');}break;
            case "复制内容HTML": {this.getPreTagContentHtml();}break;
            case "调整排版并复制": {this.copyChapterContent();}break;
            case "编辑文本": {this.editorText().then(r => {});}break;
            default:console.log(type);
        }
    }

    async editorText(){
        if (!this.editorPageView) {
            this.editorPageView = new EditorPageView(this.doc);
            await this.editorPageView.ensure();
        }
        if (!this.editorModel) {
            this.editorModel = new EditorModel(this.doc);
            this.editor = this.editorModel.create(this.editorPageView.containerId, this.getChapterContent());
        }
    }

    run() {
        this.chapterView.renderFixbar({
            onAction:(type) => this.handleAction(type)
        });
    }

    getPreElement() {
        return this.doc.getElementsByTagName('pre')[0];
    }

    getPreTagContent() {
        copyContext(this.getPreElement().innerText.split('\n').filter(Boolean).join('\n')).then();
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
        const filename = title;
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

        this.saveContentToLocationTxtFile(filename, content);
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
