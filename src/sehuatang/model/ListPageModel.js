export class ListPageModel{
    constructor(doc = document) {
        this.doc = doc;
    }


getTree() {
    let indexMap = new Map();
    let index = 0;
    let tree = [];
    let allLines = this.getAllLines();
    for (let i = 0; i < allLines.length; i++) {
        if (!indexMap.hasOwnProperty(allLines[i].date)) {
            indexMap[allLines[i].date] = {
                "id": i,
                "sehuatang_type": allLines[index].sehuatang_type,
                "title": allLines[i].date,
                "href": "",
                "children": [],
                "spread": false,
                "checked": true,
                "field": ""
            }
        }
        indexMap[allLines[i].date].children.push({
            'id': allLines[i].id,
            "sehuatang_type": allLines[index].sehuatang_type,
            "title": allLines[i].title,
            "href": allLines[i].href,
            "date": allLines[i].date,
            "children": [],
            "checked": true,
            "spread": false,
            "field": "",
        });
    }
    for (let key in indexMap) {
        tree.push(indexMap[key]);
    }
    return tree;
}

getAllLines() {
    let lines = [];
    let nav = this.doc.getElementById("pt").getElementsByTagName("a")
    let sehuatang_type = nav[nav.length - 1].innerText;
    let tbodys = this.doc.getElementsByTagName("tbody");
    for (let index = 0; index < tbodys.length; index++) {
        // console.log(tbodys[index])
        if (tbodys[index].getAttribute("id") !== null && tbodys[index].getAttribute("id").indexOf("normalthread") > -1) {
            let id = tbodys[index].getAttribute("id").split('_')[1];
            // console.log(id)
            let eldate = tbodys[index].getElementsByTagName("td")[1].getElementsByTagName('span')
            let date = eldate[1] === undefined ? eldate[0].innerText : eldate[1].getAttribute("title")
            // console.log(date)
            // console.log(sehuatang_type)
            let titleBox = tbodys[index].getElementsByTagName("th")[0].getElementsByTagName("a")
            let href = '';
            let title = '';
            for (let i = 0; i < titleBox.length; i++) {
                if (titleBox[i].getAttribute("class") !== null && titleBox[i].getAttribute("class") === 's xst') {
                    href = titleBox[i].href
                    title = titleBox[i].innerText
                    break;
                }
            }

            // console.log(title)
            // console.log(href)
            lines.push({
                "id": id,
                "sehuatang_type": sehuatang_type,
                "title": title,
                "href": href,
                "date": date
            });

        }
    }
    return lines;
}

getMenuArray(trees) {
    let menus = [];
    for (let index = 0; index < trees.length; index++) {
        if (trees[index].children.length === 0) {
            menus.push({
                'id': trees[index].id,
                "sehuatang_type": trees[index].sehuatang_type,
                "title": trees[index].title,
                "href": trees[index].href,
                "date": trees[index].date
            });
        } else {
            for (let j = 0; j < trees[index].children.length; j++) {
                menus.push({
                    'id': trees[index].children[j].id,
                    "sehuatang_type": trees[index].sehuatang_type,
                    "title": trees[index].children[j].title,
                    "href": trees[index].children[j].href,
                    "date": trees[index].date
                });
            }

        }
    }
    return menus;
}


}