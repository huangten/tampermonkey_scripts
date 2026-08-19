import { cleanText } from "../../common/common.js";
import {getChapterTitleText, getLines, getTexts, saveContentToLocal } from "../common.js";

export class ChapterPageModel {
    constructor(doc = document) {
        this.doc = doc;
        this.titleText = '';
        this.texts = [];
        this.htmlLines = [];
    }

    load() {
        this.titleText = getChapterTitleText();
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
}
