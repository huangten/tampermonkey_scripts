import {init} from '../common/common.js'
import {ChapterController} from './chapter/chapter.js'

(function main() {
    const url = new URL(document.URL);
    // console.log(url)
    if (url.searchParams.get('act') && url.pathname === '/bbs4/index.php' && url.searchParams.get('act') === 'threadview') {
        init().then(() => {
            const chapterController = new ChapterController(document);
            chapterController.run();
        });
    }


})();
