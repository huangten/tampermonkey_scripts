import {copyContext} from "../../common/common.js";
import {ChapterPageModel} from "../models/ChapterPageModel.js";
import {ChapterFixbarView} from "../views/chapter/ChapterFixbarView.js";
import {DatabaseService} from "../db/DatabaseService.js";

export class ChapterController {
    constructor({
                    model = new ChapterPageModel(),
                    view = new ChapterFixbarView()
                } = {}) {
        this.model = model;
        this.view = view;
    }

    init() {
        // console.log(document.cookie);
        // console.log(unsafeWindow)
        this.model.load();
        this.view.renderFixbar({
            onAction: (type) => this.handleAction(type)
        });
    }

    async handleAction(type) {
        // console.log(type);
        switch (type) {
            case "获取标题文本":
                await copyContext(this.model.getTitleText());
                break;
            case "获取标题HTML":
                await copyContext(this.model.getTitleHtml());
                break;
            case "获取内容文本":
                await copyContext(this.model.getContentText());
                break;
            case "获取内容HTML":
                await copyContext(this.model.getContentHtml());
                break;
            case "获取标题和内容文本":
                await copyContext(this.model.getTitleAndContentText());
                break;
            case "获取标题和内容HTML":
                await copyContext(this.model.getTitleAndContentHtml());
                break;
            case "保存内容到本地": {
                if (this.model.saveToLocal()) {
                    const href = this.model.doc.location.href
                    const dbServer = new DatabaseService();
                    await dbServer.updateChaptersDownloadedByHref(href)
                }
            }
                break;
            case "上一章":
                this.model.getPrevChapterElement();
                break;
            case "本书":
                this.model.getBookElement()
                break;
            case "下一章":
                this.model.getNextChapterElement();
                break;
        }
    }
}
