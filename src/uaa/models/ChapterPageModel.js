import { cleanText, getFileNameFromPath } from "../../common/common.js";
import { saveAs } from "file-saver";

export class ChapterPageModel {
    constructor(doc = document) {
        this.doc = doc;
        this.titleText = '';
        this.texts = [];
        this.htmlLines = [];
    }

    load() {
        this.titleText = this.getChapterTitleText();
        this.texts = this.getTexts();
        this.htmlLines = this.getLines();
    }

    getTitleText() {
        return this.titleText;
    }

    getTitleHtml() {
        return "<h2>" + this.titleText + "</h2>";
    }

    getContentText() {
        return this.texts.map((s) => `　　${s}`).join('\n');
    }

    getContentHtml() {
        return this.htmlLines.join('\n');
    }

    getTitleAndContentText() {
        return this.getTitleText() + "\n\n" + this.getContentText();
    }

    getTitleAndContentHtml() {
        return this.getTitleHtml() + "\n\n" + this.getContentHtml();
    }

    saveToLocal() {
        return this.saveContentToLocal(this.doc);
    }

    getPrevChapterElement() {
        return this.getBottomBoxElement("prev");
    }

    getBookElement() {
        const topBox = this.doc.getElementsByClassName("reader-top")[0];
        if (!topBox) {
            return null;
        }
        this.doc.getElementById("readerBook")?.click();
    }

    getNextChapterElement() {
        return this.getBottomBoxElement("next");
    }

    getBottomBoxElement(index) {
        const bottomBox = this.doc.getElementsByClassName("reader-bottom")[0];
        if (!bottomBox) {
            return null;
        }
        const buttons = bottomBox.getElementsByTagName("button");
        for (const button of buttons) {
            const attribute = button.getAttribute("data-reader-action");
            if (attribute === index) {
                return button?.click();
            }
        }
        return null;
    }

    saveContentToLocal() {
        try {
            const title = this.getChapterTitleText();
            const bookName = this.getBookName();
            const authorInfo = "作者：" + this.getAuthorInfo();
            const texts = this.getTexts().map((s) => `　　${s}`).join('\n');
            const htmlLines = this.getLines().join('\n');
            const separator = "\n\n=============================================\n";
            const content = [
                "book name:\n" + bookName,
                "author:\n" + authorInfo,
                "title:\n" + title,
                "text:\n" + texts,
                "html:\n" + htmlLines
            ].join(separator);
            try {
                !!new Blob;
                saveAs(
                    new Blob([content], { type: "text/plain;charset=utf-8" }),
                    [bookName, authorInfo, title].join(' ') + ".txt"
                );
            } catch (e) {
                console.log(e);
            }
        } catch (e) {
            console.error("保存失败", e);
            return false;
        }
        return true;
    }
    
    getChapterTitleText() {
        const titleBox = this.doc.getElementsByClassName("reader-content")[0];
        const level = titleBox.getElementsByClassName('reader-vol')[0] !== undefined
            ? titleBox.getElementsByClassName('reader-vol')[0].innerText + " "
            : "";
        const title = titleBox.getElementsByTagName("h1")[0] !== undefined
            ? titleBox.getElementsByTagName("h1")[0].innerText
            : "";
        return cleanText(level + title);
    }
    
    
    getChapterLines() {
        const contentBox = this.doc.getElementsByClassName("reader-content")[0];
        if (!contentBox) {
            return [];
        }
        const contentBody = contentBox.getElementsByClassName("reader-body")[0];
        if (!contentBody) {
            return [];
        }
        let lines = contentBody.getElementsByTagName("p");
        return Array.from(lines);
    }
    
    getTexts() {
        const lines = this.getChapterLines();
        let texts = [];
        for (let i = 0; i < lines.length; i++) {
            let elements = lines[i].getElementsByTagName('button');
            if (elements.length > 0) {
                for (let j = elements.length - 1; j >= 0; j--) {
                    // console.log(spanElement[j])
                    elements[j].parentNode.removeChild(elements[j]);
                }
            }
            let imgElement = lines[i].getElementsByTagName('img');
            if (imgElement.length > 0) {
                for (let j = 0; j < imgElement.length; j++) {
                    texts.push(`【image_src】: ${imgElement[j].src},${getFileNameFromPath(imgElement[j].src)}`);
                }
            }
            if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
                continue;
            }
            let t = cleanText(lines[i].innerText.trim());
            if (t.length === 0) {
                continue;
            }
    
            texts.push(t);
        }
    
        return texts;
    }
    
    getLines() {
        let lines = this.getChapterLines();
        let htmlLines = [];
        for (let i = 0; i < lines.length; i++) {
            let elements = lines[i].getElementsByTagName('button');
            if (elements.length > 0) {
                for (let j = elements.length - 1; j >= 0; j--) {
                    // console.log(spanElement[j])
                    elements[j].parentNode.removeChild(elements[j]);
                }
            }
            let imgElement = lines[i].getElementsByTagName('img');
            if (imgElement.length > 0) {
                for (let j = 0; j < imgElement.length; j++) {
                    htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>`);
                }
            }
    
            if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
                continue;
            }
            let t = cleanText(lines[i].innerText.trim());
            if (t.length === 0) {
                continue;
            }
            htmlLines.push(`<p>${t}</p>`);
    
        }
        return htmlLines;
    }
    
    getBookName() {
        return cleanText(this.doc.getElementById('readerBook')?.innerText.trim())
    }
    
    getAuthorInfo() {
        const metaBox = this.doc.getElementsByClassName("reader-meta")[0];
        if (!metaBox) {
            return "";
        }
        const meta = metaBox.innerHTML.trim();
        // tttjjj_200 著 · 8448字
        const authorMatch = meta.match(/(.*?) 著 ·/);
        if (authorMatch && authorMatch[1]) {
            return cleanText(authorMatch[1].trim());
        }
        return '';
    }


}
