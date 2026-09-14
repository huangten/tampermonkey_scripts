import {init} from "../../common/common.js";
import {HackTimer} from "../common/HackTimer.js";
import {ChapterController} from "../controllers/ChapterController.js";
import {ListV2Controller} from "../controllers/ListV2Controller.js";
import {IntroV3Controller} from "../controllers/IntroV3Controller.js";


(function main() {
    const url = new URL(document.URL)
    switch (url.pathname) {
        case '/novel/intro': {
            init().then(async () => {
                await new IntroV3Controller().init();
            }).catch((e) => {
                console.log(e);
            });
        }
            break;
        case '/novel/list': {
            init().then(() => {
                HackTimer();
                new ListV2Controller().init();
            }).catch((e) => {
                console.log(e);
            });
        }
            break;
        case '/novel/chapter': {
            init().then(() => {
                new ChapterController().init();
            }).catch((e) => {
                console.log(e);
            });
        }
            break;
        default:
            console.log('pathname 匹配失败')
    }

})();