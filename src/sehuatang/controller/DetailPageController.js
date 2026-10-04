import {copyContext} from "../../common/common.js";
import {DetailPageModel} from "../model/DetailPageModel.js";
import {DetailPageFixBarView} from "../view/DetailPageFixBarView.js";
import {initCommand} from "../common.js";

export class DetailPageController {


    constructor({
                    model = new DetailPageModel(document),
                    view = new DetailPageFixBarView()
                } = {}) {
        this.model = model;
        this.view = view;
    }

    init() {
        initCommand(document);
        this.view.renderFixbar({
            onAction: (type) => this.handleAction(type)
        });
    }

    async handleAction(type) {
        switch (type) {
            case "下载信息和种子":
                await this.model.getInfo();
                break;
            case "仅复制标题":
                await copyContext(this.model.getTitleText().trim());
                break;
            case "复制标题和下载种子":
                await this.model.copyTitleAndDownload();
                break;
            case "复制标题和磁力信息":
                await this.model.copyTitleAndBlockcode();
                break;
        }
    }


}