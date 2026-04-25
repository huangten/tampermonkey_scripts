import { cleanText } from "../../common/common.js";
import { getLines, getTexts, saveContentToLocal } from "../common.js";

export class ChapterPageModel {
    constructor(doc = document) {
        this.doc = doc;
        this.titleText = '';
        this.texts = [];
        this.htmlLines = [];
    }

    load() {
        this.titleText = this.parseTitleText();
        this.texts = getTexts(this.doc);
        this.htmlLines = getLines(this.doc);
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
        return saveContentToLocal(this.doc);
    }

    getPrevChapterElement() {
        return this.getBottomBoxElement(0);
    }

    getBookElement() {
        return this.getBottomBoxElement(1);
    }

    getNextChapterElement() {
        return this.getBottomBoxElement(2);
    }

    parseTitleText() {
        const titleBox = this.doc.getElementsByClassName("title_box")[0];
        const level = titleBox.getElementsByTagName('p')[0] !== undefined
            ? titleBox.getElementsByTagName('p')[0].innerText + " "
            : "";
        return cleanText(level + titleBox.getElementsByTagName("h2")[0].innerText);
    }

    getBottomBoxElement(index) {
        const bottomBox = this.doc.getElementsByClassName("bottom_box")[0];
        if (!bottomBox) {
            return null;
        }

        let el = bottomBox.firstElementChild;
        for (let i = 0; i < index && el; i++) {
            el = el.nextElementSibling;
        }
        return el;
    }
}
