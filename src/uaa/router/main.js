import {init} from "../../common/common.js";
import {HackTimer} from "../common/HackTimer.js";
import {ChapterController} from "../controllers/ChapterController.js";
import {ListV2Controller} from "../controllers/ListV2Controller.js";
import {IntroV3Controller} from "../controllers/IntroV3Controller.js";


(async function main() {
    const url = new URL(document.URL)
    switch (url.pathname) {
        case '/novel/intro': {
            await init();
            await new IntroV3Controller().init();
        }
            break;
        case '/novel/list': {
            await init();
            HackTimer();
            new ListV2Controller().init();

        }
            break;
        case '/novel/chapter': {
            await init()
            new ChapterController().init();
        }
            break;
        default:
            console.log('pathname 匹配失败')
    }

})();