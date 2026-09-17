import initMonaca, {init} from '../common/common.js'
import {ChapterController} from './chapter/chapter.js'

(async function main() {
    const url = new URL(document.URL);
    // console.log(url)
    if (url.searchParams.get('act') && url.pathname === '/bbs4/index.php' && url.searchParams.get('act') === 'threadview') {
        await Promise.all([
            init(),
            initMonaca()
        ]);
        new ChapterController(document);
    }
})();
