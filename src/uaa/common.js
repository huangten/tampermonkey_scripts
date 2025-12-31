import {cleanText, getFileNameFromPath} from "../common/common.js";

export function getMenuTree() {
    let menus = [];
    let lis = document.querySelectorAll(".catalog_ul > li");
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



export function saveContentToLocal(el) {
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

export function getTitle(el) {
    let level = el.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0] !== undefined ?
        el.getElementsByClassName("title_box")[0].getElementsByTagName('p')[0].innerText + " " : "";
    return cleanText(level + el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText);
}

export function getTexts(el) {
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

export function getLines(el) {
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


export function getBookName2(el) {
    return cleanText(el.getElementsByClassName('chapter_box')[0]
        .getElementsByClassName("title_box")[0]
        .getElementsByTagName('a')[0].innerText.trim())
}

export function getAuthorInfo(el) {
    return cleanText(el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].nextElementSibling.getElementsByTagName("span")[0].innerText);
}