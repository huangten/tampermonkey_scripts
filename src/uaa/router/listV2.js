import { init } from "../../common/common.js";
import { ListV2Controller } from "../controllers/ListV2Controller.js";

init().then(() => {
    new ListV2Controller().init();
}).catch((e) => {
    console.log(e);
});
