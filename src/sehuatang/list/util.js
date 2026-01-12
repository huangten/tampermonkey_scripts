import {sleep} from "../../common/common.js";

export async function destroyIframeAsync(iframeId) {
    let iframe = document.getElementById(iframeId);
    if (iframe) {
        try {
            if (iframe) {
                iframe.onload = null;
                iframe.onerror = null;
                iframe.contentDocument.write("");
                iframe.contentDocument.close();
                iframe.src = "about:blank";
                await sleep(0);
                iframe.remove();
                iframe = null;
            }
        } catch (e) {
            console.error("清空 iframe 失败", e);
        }
        console.log("✅ iframe 已完全清理并销毁");
    }
}