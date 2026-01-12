import {cleanText, getFileNameFromPath} from "../common/common.js";
import {saveAs} from "file-saver";

export function getMenuTree(doc = document) {
    let menus = [];
    let lis = doc.querySelectorAll(".catalog_ul > li");
    for (let index = 0; index < lis.length; index++) {
        let preName = "";
        if (lis[index].className.indexOf("menu") > -1) {
            let alist = lis[index].getElementsByTagName("a");
            for (let j = 0; j < alist.length; j++) {
                menus.push({
                    'id': (index + 1) * 100000000 + j,
                    "title": cleanText(preName + alist[j].innerText.replace("new", "").trim()),
                    "href": alist[j].href,
                    "children": [],
                    "spread": true,
                    "field": "",
                    "checked": alist[j].innerText.indexOf("new") > 0,
                });
            }
        }
        if (lis[index].className.indexOf("volume") > -1) {
            preName = cleanText(lis[index].querySelector("span").innerText);
            let children = [];
            let alist = lis[index].getElementsByTagName("a");
            for (let j = 0; j < alist.length; j++) {
                children.push({
                    'id': (index + 1) * 100000000 + j + 1,
                    "title": cleanText(alist[j].innerText.replace("new", "").trim()),
                    "href": alist[j].href,
                    "children": [],
                    "spread": true,
                    "field": "",
                    "checked": alist[j].innerText.indexOf("new") > 0,
                });
            }
            menus.push({
                'id': (index + 1) * 100000000,
                "title": cleanText(preName),
                "href": "",
                "children": children,
                "spread": true,
                "field": "",
            });
        }
    }
    return menus;
}

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
        let title = getTitle(el);
        let separator = "\n\n=============================================\n";
        let content = "book name:\n" + getBookName2(el)
            + separator +
            "author:\n" + getAuthorInfo(el)
            + separator +
            "title:\n" + getTitle(el)
            + separator +
            "text:\n" + getTexts(el).map((s) => `　　${s}`).join('\n')
            + separator +
            "html:\n" + getLines(el).join('');
        try {
            const isFileSaverSupported = !!new Blob;
            const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
            saveAs(blob, getBookName2(el) + " " + getAuthorInfo(el) + " " + title + ".txt");
        } catch (e) {
            console.log(e);
        }
        return true;

    } catch (e) {
        console.error("保存失败", e);
        return false;
    }
}

export function getTitle(el = document) {
    let level = el.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0] !== undefined ?
        el.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0].innerText + " " : "";
    return cleanText(level + el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText);
}

export function getTexts(el = document) {
    let lines = el.getElementsByClassName("line");
    let texts = [];
    for (let i = 0; i < lines.length; i++) {
        let spanElement = lines[i].getElementsByTagName('span');
        if (spanElement.length > 0) {
            for (let j = 0; j < spanElement.length; j++) {
                console.log(spanElement[j])
                spanElement[j].parentNode.removeChild(spanElement[j]);
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
    let lines = el.getElementsByClassName("line");
    let htmlLines = [];
    for (let i = 0; i < lines.length; i++) {
        let spanElement = lines[i].getElementsByTagName('span');
        if (spanElement.length > 0) {
            for (let j = 0; j < spanElement.length; j++) {
                console.log(spanElement[j])
                spanElement[j].parentNode.removeChild(spanElement[j]);
            }
        }
        let imgElement = lines[i].getElementsByTagName('img');
        if (imgElement.length > 0) {
            for (let j = 0; j < imgElement.length; j++) {
                htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>\n`);
            }
        }

        if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
            continue;
        }
        let t = cleanText(lines[i].innerText.trim());
        if (t.length === 0) {
            continue;
        }
        htmlLines.push(`<p>${t}</p>\n`);

    }
    return htmlLines;
}


export function getBookName2(el = document) {
    return cleanText(el.getElementsByClassName('chapter_box')[0]
        .getElementsByClassName("title_box")[0]
        .getElementsByTagName('a')[0].innerText.trim())
}

export function getBookName(el = document) {
    let htmlTitle = el.getElementsByTagName("title")[0].innerText;
    let bookName = htmlTitle.split(" | ")[0].split(" - ").pop();
    bookName = bookName.replaceAll("/", "_");
    return bookName;
}

export function getAuthorInfo(el = document) {
    return cleanText(el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].nextElementSibling.getElementsByTagName("span")[0].innerText);
}