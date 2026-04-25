import { init } from "../../common/common.js";
import { IntroV3Controller } from "../controllers/IntroV3Controller.js";

init().then(async () => {
    await new IntroV3Controller().init();
}).catch((e) => {
    console.log(e);
});
