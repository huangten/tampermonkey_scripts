import {copyContext} from "../common/common.js";
import {saveAs} from "file-saver";
import {destroyIframe} from "./list/download.js";


export function check18R() {
    if (document.getElementsByTagName("head")[0].getElementsByTagName('title')[0].innerText.trim().indexOf("SEHUATANG.ORG") > -1) {
        const enterBts = document.getElementsByClassName("enter-btn")
        for (let index = 0; index < enterBts.length; index++) {
            if (enterBts[index].innerText.trim().indexOf("满18岁，请点此进入") > -1) {
                enterBts[index].click();
                break;
            }
        }
    }
}


export function getInfo(el) {

    const type = getType(el);

    const imageLinks = getImages(el);
    console.log(imageLinks);
    const imgs = [];

    for (let index = 0; index < imageLinks.length; index++) {
        let paths = imageLinks[index].split('/')
        let file = paths[paths.length - 1].split('.');
        let ext = file[file.length - 1];
        let name = getSelfFilename(el) + "_" + index + "." + ext
        imgs.push(
            {
                'isExist': false,
                "hasDownload": false,
                "filename": name,
                "href": imageLinks[index]
            }
        );
    }

    const magnets = getMagnets(el);
    const btNames = getBtNames(el);

    const time = getTime(el);

    const selfFilename = getFileName(getSelfFilename(el), 'txt');
    const sehuatangTexts = getsehuatangTexts(el);
    let info = {
        "title": getTitleText(el),
        "avNumber": getAvNumber(el),
        "selfFilename": selfFilename,
        "year": time.split(' ')[0].split('-')[0],
        "month": time.split(' ')[0].split('-')[1],
        'day': time.split(' ')[0].split('-')[2],
        "date": time.split(' ')[0],
        "time": time,
        "sehuatangInfo": {
            "type": type,
            "link": getPageLink(el),
            "infos": sehuatangTexts,
            "imgs": imgs,
            "magnets": magnets,
            "bts": btNames
        }
    }

    try {
        const isFileSaverSupported = !!new Blob;
        const blob = new Blob([JSON.stringify(info, null, 4)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, selfFilename);
    } catch (e) {
        console.log(e);
    }
    doBtDownload(el)
}

export function saveImage(imageLink, name) {
    let res = false;
    fetch(imageLink)
        // 获取 blob 对象
        .then(res => res.blob())
        .then(blob => {
            let blob1 = new Blob(blob, {type: "image/jpeg;"});
            saveAs(blob1, name);
        });
    try {

        res = true;
    } catch (e) {
        res = false;
    }
    return res;
}

export function getAvNumber(el) {
    const sehuatangTexts = getsehuatangTexts(el);
    let avNumber = '';
    for (let index = 0; index < sehuatangTexts.length; index++) {
        const element = sehuatangTexts[index];
        if (element.indexOf("品番：") > -1) {
            avNumber = element.replace("品番：", "").trim();
            return avNumber
        }
    }
    const title = getTitleText(el);
    const type = getType(el);
    if (type.localeCompare("高清中文字幕") === 0 || type.localeCompare('4K原版') === 0) {
        return title.split(' ')[0];
    }
    return title;
}

export function getTime(el) {
    let time = '';
    try {
        time = el.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].getElementsByTagName('span')[0].getAttribute("title")
    } catch (e) {
        time = el.getElementsByClassName("authi")[1].getElementsByTagName('em')[0].innerText.replace("发表于", '').trim()
    }
    return time
}

export function getType(el) {
    return el.getElementsByClassName("bm cl")[0].getElementsByTagName("a")[3].innerText.trim();
}

export function getImages(el) {
    const imgs = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('img');
    let res = [];
    for (let index = 0; index < imgs.length; index++) {
        const element = imgs[index];
        if (element.getAttribute("id") !== null && element.getAttribute("id").indexOf('aimg') > -1) {
            res.push(element.getAttribute("file"));
        }
    }
    return res;
}

export function getsehuatangTexts(el) {
    let sehuatangTextArray = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].innerText.split("\n").filter((item) => {
        return item !== null && typeof item !== "undefined" && item !== "";
    });
    let replaceArr = ["播放", "复制代码", 'undefined', "立即免费观看"];
    for (let index = 0; index < sehuatangTextArray.length; index++) {
        for (let j = 0; j < replaceArr.length; j++) {
            sehuatangTextArray[index] = sehuatangTextArray[index].replace(replaceArr[j], '').trim();
        }
    }
    return sehuatangTextArray;
}

export function getSelfFilename(el) {
    let title = getTitleText(el);
    let replaceList = '/?*:|\\<>"'.split('');
    let equalList = ["con", "aux", "nul", "prn", "com0", "com1", "com2", "com3", "com4", "com5", "com6", "com7",
        "com8", "com9", "lpt0", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"];

    for (let i = 0; i < replaceList.length; i++) {
        title = title.replaceAll(replaceList[i], "_");
    }
    return title;
}

export function getFileName(name, ext) {
    return name + '.' + ext;
}

export function getDownloadBtTags(el) {
    let attnms = el.getElementsByClassName("attnm");
    let aTags = [];
    if (attnms !== null && attnms.length === 0) {
        aTags = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('a')
    } else {
        for (let index = 0; index < attnms.length; index++) {
            let as = attnms[index].getElementsByTagName('a')
            for (let j = 0; j < as.length; j++) {
                aTags.push(as[j]);
            }
        }
    }
    let res = [];
    for (let index = 0; index < aTags.length; index++) {
        if (aTags[index].innerText.trim().indexOf('torrent') > -1) {
            res.push(aTags[index])
        }
    }
    return res
}

export function getBtNames(el) {
    let attnms = getDownloadBtTags(el);
    let btNames = [];
    for (let index = 0; index < attnms.length; index++) {
        btNames.push(attnms[index].innerText.trim());
    }
    return btNames;
}

export function doBtDownload(el) {
    let attnms = getDownloadBtTags(el);
    for (let index = 0; index < attnms.length; index++) {
        console.log(attnms[index])

        downloadFileByIframe(attnms[index].href, attnms[index].innerText.trim())

        //break
        //attnms[index].click();
    }
}


function downloadFileByIframe(url, filename) {
    // 1. 创建 iframe 元素
    let iframe = document.createElement('iframe');
    iframe.id = 'downloadFileByIframe'
    iframe.style.display = 'none'; // 隐藏 iframe
    document.body.appendChild(iframe); // 添加到 body

    // 2. 创建 a 标签
    let link = document.createElement('a');
    link.href = url;
    link.download = filename || url.substring(url.lastIndexOf('/') + 1); // 设置文件名

    // 3. 模拟点击 (通常在 iframe 内部或直接触发)
    // 可以在 iframe 的 onload事件中触发，但直接触发更简洁
    link.click();

    // 4. (可选) 下载完成清理
    // 也可以用 setTimeout 延迟移除，确保下载已开始
    setTimeout(() => {
        document.body.removeChild(iframe);
        destroyIframe('downloadFileByIframe')
    }, 100);
}

export function copyTitleAndDownload(el) {
    copyContext(getTitleText(el) + "\n").then()
    doBtDownload(el)
}


export function getMagnets(el) {
    const magnets = [];
    const blockcode = document.getElementsByClassName("blockcode");
    for (let index = 0; index < blockcode.length; index++) {
        magnets.push(blockcode[index].getElementsByTagName("li")[0].innerText);
    }
    let replaceArr = ["播放", "复制代码", 'undefined', "立即免费观看"];
    for (let index = 0; index < magnets.length; index++) {
        for (let j = 0; j < replaceArr.length; j++) {
            magnets[index] = magnets[index].replace(replaceArr[j], '').trim();
        }
    }
    return magnets;
}

export function copyTitleAndBlockcode(el) {
    let info = getTitleText(el) + "\n";
    info += getPageLink(el) + "\n";
    const blockcode = getMagnets(el);
    for (let index = 0; index < blockcode.length; index++) {
        info += blockcode[index] + "\n";
    }
    copyContext(info).then();
}

export function getTitle(el) {
    if (el.getElementById !== undefined) {
        return el.getElementById("thread_subject")
    }

    return el.querySelector("#thread_subject");
}

export function getTitleText(el) {
    return getTitle(el).innerText;
}

export function getPageLink(el) {
    return el.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
}