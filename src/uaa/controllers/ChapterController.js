import { copyContext } from "../../common/common.js";
import { ChapterPageModel } from "../models/ChapterPageModel.js";
import { ChapterFixbarView } from "../views/chapter/ChapterFixbarView.js";

export class ChapterController {
    constructor({
        model = new ChapterPageModel(),
        view = new ChapterFixbarView()
    } = {}) {
        this.model = model;
        this.view = view;
    }

    init() {
        this.model.load();
        this.view.renderFixbar({
            onAction: (type) => this.handleAction(type)
        });
    }

    handleAction(type) {
        console.log(type);
        switch (type) {
            case "获取标题文本":
                this.copy(this.model.getTitleText());
                break;
            case "获取标题HTML":
                this.copy(this.model.getTitleHtml());
                break;
            case "获取内容文本":
                this.copy(this.model.getContentText());
                break;
            case "获取内容HTML":
                this.copy(this.model.getContentHtml());
                break;
            case "获取标题和内容文本":
                this.copy(this.model.getTitleAndContentText());
                break;
            case "获取标题和内容HTML":
                this.copy(this.model.getTitleAndContentHtml());
                break;
            case "保存内容到本地":
                this.model.saveToLocal();
                break;
            case "上一章":
                this.clickIfLink(this.model.getPrevChapterElement());
                break;
            case "本书":
                this.clickIfLink(this.model.getBookElement());
                break;
            case "下一章":
                this.clickIfLink(this.model.getNextChapterElement());
                break;
        }
    }

    copy(content) {
        copyContext(content).then();
    }

    clickIfLink(el) {
        if (el && el.nodeName.indexOf("A") > -1) {
            el.click();
        }
    }
}
