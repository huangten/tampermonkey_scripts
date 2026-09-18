import {copyContext} from "../../common/common.js";
import {saveAs} from "file-saver";

export class ChapterModel {
    constructor(doc = document) {
        this.doc = doc;
    }

    dispose() {
        this.doc = null;
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

    getDownloadContent(tag) {
        let title = this.getDownloadFilename();
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

        return title + '\n\n\n\n' + this.getChapterContent(tag) + '\n\n\n\n\n\n\n\n\n';
    }

    getDownloadFilename() {
        const titleElements = this.doc.getElementsByClassName('main-title');
        const titleContent = titleElements[0].innerText.trim();
        // const bookName = titleContent.match(/^【(.*?)】/)[1];
        // const author = titleContent.match(/(.*?)作者(.*?)/)
        // console.log(bookName)
        return titleContent.replace(/^【(.*?)】/, "$1");
    }

    downloadChapterContent(tag) {
        this.saveContentToLocationTxtFile(this.getDownloadFilename(), this.getDownloadContent(tag));
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