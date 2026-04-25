import { init } from "../../common/common.js";
import { ChapterController } from "../controllers/ChapterController.js";

init().then(() => {
    new ChapterController().init();
}).catch((e) => {
    console.log(e);
});
