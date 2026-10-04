import {init} from "../../common/common.js";
import {DetailPageController} from "../controller/DetailPageController.js";
import {ListController} from "../controller/ListController.js";

export async function router() {
    // 检查是否需要过验证
    if (document.getElementsByTagName("head")[0].getElementsByTagName('title')[0].innerText.trim().indexOf("SEHUATANG.ORG") > -1) {
        const enterBts = document.getElementsByClassName("enter-btn")
        for (let index = 0; index < enterBts.length; index++) {
            if (enterBts[index].innerText.trim().indexOf("满18岁，请点此进入") > -1) {
                enterBts[index].click();
                break;
            }
        }
        return
    }
    const url = document.URL;
    // 走列表页逻辑
    const listRegx = /forum-(\d+)-(\d+)\.html/;
    if (listRegx.test(url)) {
        await init();
        const listController = new ListController();
        listController.init();
        return
    }
    // 走详情页逻辑
    const detailPageRegx = [
        /thread-(\d+)-1-(\d+)\.html/,
        /forum\.php\?mod=viewthread&tid=(\d+)/
    ];
    if (detailPageRegx.some(regex => regex.test(url))) {
        await init();
        const detailPage = new DetailPageController();
        detailPage.init();
    }

}