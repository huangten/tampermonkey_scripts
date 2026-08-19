import { cleanText } from "../../common/common.js";

export class ChapterCatalogModel {
    constructor(doc = document, location = document.location) {
        this.doc = doc;
        this.location = location;
    }

    getBookName() {
        const bookName = this.doc.getElementsByTagName('h1')[0]?.cloneNode(true);
        const spans = bookName?.getElementsByTagName('span');
        if (spans) {
            for (const span of spans) {
                span.remove();
            }
        }
        return cleanText(bookName?.innerText.trim() ?? '');
    }

    getBookId() {
        return new URL(this.location.href).searchParams.get('id') ?? '';
    }

    getAuthor() {
        return this.doc.getElementsByClassName('nd-author')[0]?.getElementsByTagName("a")[0]?.innerText.trim() ?? '';
    }
    getLatestChapter() {
        return this.doc.getElementsByClassName('nd-latest')[0]?.getElementsByTagName("b")[0]?.innerText.trim() ?? '';
    }
    getScore() {
        return this.doc.getElementsByClassName('nd-score')[0]?.getElementsByTagName("b")[0]?.innerText.trim() ?? '';
    }

    getType() {
        return '';
    }
    getRou() {
        return '';
    }
    getTags() {
        const tagsBox = this.doc.getElementById('ndTags').cloneNode(true);
        const tags = [];
        if (tagsBox) {
            const tagElements = tagsBox.getElementsByTagName('a');
            for (const tagElement of tagElements) {
                tagElement.getElementsByTagName('em')[0]?.remove();
                tags.push(tagElement.innerText.trim());
            }
        }
        return tags.join(', ');
    }
    getIntro() {
        return this.doc.getElementsByClassName('nd-synopsis')[0]?.innerText.replaceAll('小说简介：', "").replaceAll('\n', '').trim() ?? '';
    }

    getCover() {
        const coverElement = this.doc.getElementsByClassName('nd-cover')[0]?.getElementsByTagName("img")[0];
        return coverElement?.src ?? '';
    }

    getChapterListTree() {
        return this.getMenuTree(this.doc, this.getBookName(), this.getBookId());
    }

    getMenuTree(doc, bookName, bookId) {
        let menus = [];
        const lis = doc.querySelectorAll('#ndcBody > *');
        for (let index = 0; index < lis.length; index++) {
            if (lis[index].nodeName.indexOf("A") > -1) {
                let id = (index + 1) * 100000000;
                let title = lis[index].getAttribute("title");
                let chapterName = cleanText(title.trim());
                let chapterHref = lis[index].href;
                menus.push({
                    'id': id,
                    "title": chapterName,
                    "href": chapterHref,
                    "children": [],
                    "spread": true,
                    "field": "",
                    "checked": chapterName.indexOf("new") > 0,
                    bookName,
                    bookId,
                    volumeName: ''
                });
            }
            if (lis[index].nodeName.indexOf("DIV") > -1) {

                let vol = lis[index].getElementsByTagName("button")[0];
                if (!vol) {
                    continue;
                }
                let volTitle = vol.getElementsByClassName("ndc-vol__t")[0];
                if (!volTitle) {
                    continue;
                }
                let volName = cleanText(volTitle.innerText.trim());

                let volBody = lis[index].getElementsByClassName("ndc-vol__body")[0];
                if (!volBody) {
                    continue;
                }
                let volList = volBody.getElementsByClassName("ndc-list")[0];
                if (!volList) {
                    continue;
                }
                let menulist = volList.getElementsByTagName("a");
                let children = [];
                for (let j = 0; j < menulist.length; j++) {
                    let id = (index + 1) * 100000000 + j + 1;
                    let title = menulist[j].getAttribute("title");
                    let chapterName = cleanText(title.trim());
                    let chapterHref = menulist[j].href;
                    // console.log(id + "chapterName: " + chapterName + ", chapterHref: " + chapterHref);
                    children.push({
                        'id': id,
                        "title": chapterName,
                        "href": chapterHref,
                        "children": [],
                        "spread": true,
                        "field": "",
                        "checked": menulist[index].innerText.indexOf("new") > 0,
                        bookName,
                        bookId,
                        volumeName: volName
                    });
                }
                menus.push({
                    'id': (index + 1) * 100000000,
                    "title": volName,
                    "href": "",
                    "children": children,
                    "spread": true,
                    "field": "",
                    bookName,
                    bookId,
                    volumeName: volName
                });
            }
        }
        return menus;
    }

    toChapterList(trees) {
        const menus = [];
        for (let index = 0; index < trees.length; index++) {
            if (trees[index].children.length === 0) {
                menus.push({
                    chapterId: trees[index].id,
                    chapterName: trees[index].title,
                    href: trees[index].href,
                    bookName: trees[index].bookName,
                    bookId: trees[index].bookId,
                    volumeName: trees[index].volumeName ?? ""
                });
            } else {
                for (let j = 0; j < trees[index].children.length; j++) {
                    const preName = trees[index].title + " ";
                    menus.push({
                        chapterId: trees[index].children[j].id,
                        chapterName: preName + trees[index].children[j].title,
                        href: trees[index].children[j].href,
                        bookName: trees[index].children[j].bookName,
                        bookId: trees[index].children[j].bookId,
                        volumeName: trees[index].title
                    });
                }
            }
        }
        return menus;
    }
}

