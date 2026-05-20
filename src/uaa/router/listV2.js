import { init } from "../../common/common.js";
import { ListV2Controller } from "../controllers/ListV2Controller.js";
import { HackTimer } from "../common/HackTimer.js";

init().then(() => {
    HackTimer();
    new ListV2Controller().init();
}).catch((e) => {
    console.log(e);
});
