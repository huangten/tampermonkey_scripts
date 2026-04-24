import { cleanText } from "../../../../common/common.js";

export class ChapterCatalogModel {
    constructor(doc = document, location = document.location) {
        this.doc = doc;
        this.location = location;
    }

    getBookName() {
        return this.doc.getElementsByClassName('info_box')[0]
            .getElementsByTagName('h1')[0]
            .innerText
            .trim();
    }

    getBookId() {
        return new URL(this.location.href).searchParams.get('id') ?? '';
    }

    getChapterListTree() {
        const menus = [];
        const bookName = this.getBookName();
        const bookId = this.getBookId();
        const lis = this.doc.querySelectorAll(".catalog_ul > li");

        for (let index = 0; index < lis.length; index++) {
            let preName = "";
            if (lis[index].className.indexOf("menu") > -1) {
                const alist = lis[index].getElementsByTagName("a");
                for (let j = 0; j < alist.length; j++) {
                    menus.push({
                        id: (index + 1) * 100000000 + j,
                        title: cleanText(preName + alist[j].innerText.trim()),
                        href: alist[j].href,
                        children: [],
                        spread: true,
                        field: "",
                        checked: alist[j].innerText.indexOf("new") > 0,
                        bookName,
                        bookId,
                        volumeName: ""
                    });
                }
            }
            if (lis[index].className.indexOf("volume") > -1) {
                preName = cleanText(lis[index].querySelector("span").innerText);
                const children = [];
                const alist = lis[index].getElementsByTagName("a");
                for (let j = 0; j < alist.length; j++) {
                    children.push({
                        id: (index + 1) * 100000000 + j + 1,
                        title: cleanText(alist[j].innerText.trim()),
                        href: alist[j].href,
                        children: [],
                        spread: true,
                        field: "",
                        checked: alist[j].innerText.indexOf("new") > 0,
                        bookName,
                        bookId,
                        volumeName: preName
                    });
                }
                menus.push({
                    id: (index + 1) * 100000000,
                    title: cleanText(preName),
                    href: "",
                    children,
                    spread: true,
                    field: "",
                    bookName,
                    bookId,
                    volumeName: preName
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

