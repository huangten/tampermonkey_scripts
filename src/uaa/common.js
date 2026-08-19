import { cleanText, getFileNameFromPath } from "../common/common.js";
import { saveAs } from "file-saver";

export function getMenuArray(trees) {
    let menus = [];
    for (let index = 0; index < trees.length; index++) {
        if (trees[index].children.length === 0) {
            menus.push({
                'id': trees[index].id,
                "title": trees[index].title,
                "href": trees[index].href
            });
        } else {
            for (let j = 0; j < trees[index].children.length; j++) {
                let preName = trees[index].title + " ";
                menus.push({
                    'id': trees[index].children[j].id,
                    "title": preName + trees[index].children[j].title,
                    "href": trees[index].children[j].href
                });
            }

        }
    }
    return menus;
}


export class CommonRes {
    constructor() {
        if (CommonRes.instance) {
            return CommonRes.instance;
        }
        CommonRes.instance = this;
        this.logoImg = null
        this.girlImg = null
        this.line1Img = null
        this.mainCss = null
        this.fontsCss = null
    }

    static getInstance() {
        if (!CommonRes.instance) {
            CommonRes.instance = new CommonRes();
        }
        return CommonRes.instance;
    }

    async gmFetchCoverImageBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', headers: {
                    Referer: "https://www.uaa.com/",
                }, onload: res => {
                    if (res.status === 200) {
                        resolve(res.response);
                    } else {
                        reject(new Error('HTTP CODE ' + res.status));
                    }
                }, onerror: err => reject(err),
            });
        });
    }

    async gmFetchImageBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', onload: res => {
                    if (res.status === 200) {
                        resolve(res.response);
                    } else {
                        reject(new Error('HTTP CODE ' + res.status));
                    }
                }, onerror: err => reject(err),
            });
        });
    }

    async gmFetchText(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url,
                responseType: 'arraybuffer',
                onload: res => {
                    if (res.status !== 200) {
                        reject(new Error(`HTTP CODE ${res.status}`));
                    } else {
                        //const decoder = new TextDecoder('utf-8');
                        //const text = decoder.decode(res.response);
                        resolve(res.response);
                    }
                },
                onerror: err => reject(err),
            });
        });
    }

    async getLogoImg() {
        if (this.logoImg === null) {
            this.logoImg = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp');
        }
        return this.logoImg;
    }

    async getGirlImg() {
        if (this.girlImg === null) {
            this.girlImg = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg');
        }
        return this.girlImg;
    }

    async getLine1Img() {
        if (this.line1Img === null) {
            this.line1Img = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/line1.webp');
        }
        return this.line1Img;
    }

    async getMainCss() {
        if (this.mainCss === null) {
            this.mainCss = await this.gmFetchText('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/main.css');
        }
        return this.mainCss;
    }

    async getFontsCss() {
        if (this.fontsCss === null) {
            this.fontsCss = await this.gmFetchText('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/fonts.css');
        }
        return this.fontsCss;
    }
}

export function saveContentToLocal(el = document) {
    try {
        const title = getChapterTitleText(el);
        const bookName = getBookName(el);
        const authorInfo = "作者：" + getAuthorInfo(el);
        const texts = getTexts(el).map((s) => `　　${s}`).join('\n');
        const htmlLines = getLines(el).join('\n');
        const separator = "\n\n=============================================\n";
        const content = [
            "book name:\n" + bookName,
            "author:\n" + authorInfo,
            "title:\n" + title,
            "text:\n" + texts,
            "html:\n" + htmlLines
        ].join(separator);
        try {
            !!new Blob;
            saveAs(
                new Blob([content], { type: "text/plain;charset=utf-8" }),
                [bookName, authorInfo, title].join(' ') + ".txt"
            );
        } catch (e) {
            console.log(e);
        }
    } catch (e) {
        console.error("保存失败", e);
        return false;
    }
    return true;
}

export function getChapterTitleText(el = document) {
    const titleBox = el.getElementsByClassName("reader-content")[0];
    const level = titleBox.getElementsByClassName('reader-vol')[0] !== undefined
        ? titleBox.getElementsByClassName('reader-vol')[0].innerText + " "
        : "";
    const title = titleBox.getElementsByTagName("h1")[0] !== undefined
        ? titleBox.getElementsByTagName("h1")[0].innerText
        : "";
    return cleanText(level + title);
}


function getChapterLines(el = document) {
    const contentBox = el.getElementsByClassName("reader-content")[0];
    if (!contentBox) {
        return [];
    }
    const contentBody = contentBox.getElementsByClassName("reader-body")[0];
    if (!contentBody) {
        return [];
    }
    let lines = contentBody.getElementsByTagName("p");
    return Array.from(lines);
}

export function getTexts(el = document) {
    const lines = getChapterLines(el);
    let texts = [];
    for (let i = 0; i < lines.length; i++) {
        let elements = lines[i].getElementsByTagName('button');
        if (elements.length > 0) {
            for (let j = elements.length - 1; j >= 0; j--) {
                // console.log(spanElement[j])
                elements[j].parentNode.removeChild(elements[j]);
            }
        }
        let imgElement = lines[i].getElementsByTagName('img');
        if (imgElement.length > 0) {
            for (let j = 0; j < imgElement.length; j++) {
                texts.push(`【image_src】: ${imgElement[j].src},${getFileNameFromPath(imgElement[j].src)}`);
            }
        }
        if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
            continue;
        }
        let t = cleanText(lines[i].innerText.trim());
        if (t.length === 0) {
            continue;
        }

        texts.push(t);
    }

    return texts;
}

export function getLines(el = document) {
    let lines = getChapterLines(el);
    let htmlLines = [];
    for (let i = 0; i < lines.length; i++) {
        let elements = lines[i].getElementsByTagName('button');
        if (elements.length > 0) {
            for (let j = elements.length - 1; j >= 0; j--) {
                // console.log(spanElement[j])
                elements[j].parentNode.removeChild(elements[j]);
            }
        }
        let imgElement = lines[i].getElementsByTagName('img');
        if (imgElement.length > 0) {
            for (let j = 0; j < imgElement.length; j++) {
                htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>`);
            }
        }

        if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
            continue;
        }
        let t = cleanText(lines[i].innerText.trim());
        if (t.length === 0) {
            continue;
        }
        htmlLines.push(`<p>${t}</p>`);

    }
    return htmlLines;
}

export function getBookName(el = document) {
    return cleanText(el.getElementById('readerBook')?.innerText.trim())
}

export function getAuthorInfo(el = document) {
    const metaBox = el.getElementsByClassName("reader-meta")[0];
    if (!metaBox) {
        return "";
    }
    const meta = metaBox.innerHTML.trim();
    // tttjjj_200 著 · 8448字
    const authorMatch = meta.match(/(.*?) 著 ·/);
    if (authorMatch && authorMatch[1]) {
        return cleanText(authorMatch[1].trim());
    }
    return '';
}