import { destroyIframeElementAsync, sleep, waitForElement } from "../../common/common.js";
import { getTexts, saveContentToLocal } from "../common.js";

export class ChapterDownloadService {
    constructor({ downloadInfoWindow, infoWindow, downloaderInterval }) {
        this.downloadInfoWindow = downloadInfoWindow;
        this.infoWindow = infoWindow;
        this.downloaderInterval = downloaderInterval;
    }

    async download(chapter, lastDownloadTime) {
        this.downloadInfoWindow.setTitle(chapter.bookName + " : " + chapter.chapterName);
        this.infoWindow.setCurrentDownload(chapter.chapterName, chapter.href);

        const time = Date.now() - lastDownloadTime;
        if (time < this.downloaderInterval) {
            await sleep(this.downloaderInterval - time);
        }

        const container = this.downloadInfoWindow.getContainer();
        if (!container) {
            throw new Error("下载面板容器不存在");
        }

        const oldIframes = Array.from(container.getElementsByTagName('iframe'));
        for (const iframe of oldIframes) {
            await destroyIframeElementAsync(iframe);
        }

        const iframe = document.createElement("iframe");
        iframe.id = "__uaa_iframe__" + crypto.randomUUID();
        iframe.src = chapter.href;
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        container.appendChild(iframe);

        await this.waitForChapterLoad(iframe, chapter);

        const el = iframe.contentDocument;
        this.assertChapterDocumentHealth(el, chapter);
        if (getTexts(el).some(s => s.includes('以下正文内容已隐藏'))) {
            throw new Error("章节内容不完整，结束下载");
        }

        const success = saveContentToLocal(el);
        await sleep(300);
        await destroyIframeElementAsync(iframe);

        if (!success) {
            throw new Error("章节保存失败");
        }
    }

    async waitForChapterLoad(iframe, chapter) {
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1000 * 30 * 60);
            iframe.onerror = () => {
                clearTimeout(timeout);
                reject(new Error("章节页面加载失败，可能是网络异常或浏览器页面崩溃"));
            };
            iframe.onload = async () => {
                try {
                    this.assertChapterDocumentHealth(iframe.contentDocument, chapter);
                    await waitForElement(iframe.contentDocument, '.line', 1000 * 25 * 60);
                    clearTimeout(timeout);
                    resolve();
                } catch (err) {
                    clearTimeout(timeout);
                    reject(err);
                }
            };
        });
    }

    assertChapterDocumentHealth(doc, chapter) {
        if (!doc || !doc.documentElement) {
            throw new Error("章节页面文档不可用，可能是页面崩溃");
        }

        // if (this.looksLikeCfChallenge(doc)) {
        //     throw new Error(`章节页面异常：${chapter.chapterName} 遇到 Cloudflare 人机验证`);
        // }

        const title = (doc.title || '').trim();
        const bodyText = (doc.body?.innerText || '').trim();
        const sampleText = `${title}\n${bodyText}`.slice(0, 4000);

        if (this.looksLikeErrorPage(sampleText)) {
            throw new Error(`章节页面异常：${chapter.chapterName} 可能返回了错误页`);
        }
    }

    looksLikeErrorPage(text) {
        if (!text) {
            return false;
        }

        const normalized = text.toLowerCase();
        
        return [
            '502 bad gateway',
            '503 service unavailable',
            '504 gateway timeout',
            '500 internal server error',
            'bad gateway',
            'gateway timeout',
            'service unavailable',
            'internal server error',
            'this site can’t be reached',
            'this page isn’t working',
            '无法访问此网站',
            '网页无法正常运作',
            '连接已重置',
            '连接超时',
            'network error',
            'err_connection',
            'dns_probe',
        ].some(keyword => {
            if (normalized.includes(keyword)) {
                console.warn(`检测到错误页面关键词: ${keyword}`);
                return true;
            }
        });
    }

    looksLikeCfChallenge(input) {
        if (!input) {
            return false;
        }

        let text = '';
        let html = '';

        if (typeof input === 'string') {
            text = input;
        } else if (input.documentElement) {
            text = `${input.title || ''}\n${input.body?.innerText || ''}`;
            html = input.documentElement.outerHTML || '';
        }

        const normalizedText = text.toLowerCase();
        const normalizedHtml = html.toLowerCase();

        return [
            'cloudflare',
            'attention required',
            'verify you are human',
            'checking your browser before accessing',
            'please enable javascript and cookies',
            'cf-chl',
            'cf_clearance',
            'turnstile',
            'challenge-platform',
            'just a moment',
        ].some(keyword =>
            normalizedText.includes(keyword)
            || normalizedHtml.includes(keyword)
        );
    }
}

