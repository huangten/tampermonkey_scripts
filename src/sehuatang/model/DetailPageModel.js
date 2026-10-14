import {saveAs} from "file-saver";
import {copyContext} from "../../common/common.js";
import bencode from "bencode";


export class DetailPageModel {
    constructor(doc = document) {
        this.doc = doc;
    }

    async getInfo(options = {
        SaveImage: false
    }) {
        const type = this.getType();
        const imageLinks = this.getImages();
        console.log(imageLinks);
        const imgs = [];

        for (let index = 0; index < imageLinks.length; index++) {
            let paths = imageLinks[index].split('/')
            let file = paths[paths.length - 1].split('.');
            let ext = file[file.length - 1];
            let name = this.getSelfFilename() + "_" + index + "." + ext
            if (Object.hasOwn(options, 'SaveImage') && options.SaveImage === true) {
                await this.saveImage(imageLinks[index], name);
            }

            imgs.push(
                {
                    'isExist': false,
                    "hasDownload": false,
                    "filename": name,
                    "href": imageLinks[index]
                }
            );
        }

        const magnets = this.getMagnets();
        const btNames = this.getBtNames();

        const time = this.getTime();

        const selfFilename = this.getFileName(this.getSelfFilename(), 'txt');
        const sehuatangTexts = this.getsehuatangTexts();
        let info = {
            "title": this.getTitleText(),
            "avNumber": this.getAvNumber(),
            "selfFilename": selfFilename,
            "year": time.split(' ')[0].split('-')[0],
            "month": time.split(' ')[0].split('-')[1],
            'day': time.split(' ')[0].split('-')[2],
            "date": time.split(' ')[0],
            "time": time,
            "sehuatangInfo": {
                "type": type,
                "link": this.getPageLink(),
                "infos": sehuatangTexts,
                "imgs": imgs,
                "magnets": magnets,
                "bts": btNames
            }
        }

        await this.doBtDownload();
        // await sleep(500);

        const blob = new Blob([JSON.stringify(info, null, 4)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, selfFilename);
    }

    async saveImage(imageLink, name) {
        const blob = await this.gmFetchImageBlob(imageLink);
        if (blob) {
            saveAs(blob, name);
        }
    }

    async gmFetchImageBlob(url) {
        if (!url) {
            return null;
        }
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', headers: {
                    Referer: "https://www.sehuatang.org/",
                }, onload: res => {
                    if (res.status === 200) {
                        resolve(res.response);
                    } else {
                        console.error('HTTP CODE ' + res.status);
                        resolve(null);
                    }
                }, onerror: err => {
                    console.error(err);
                    resolve(null); // 网络错误也不 reject，返回 null
                },
            });
        });
    }

    getAvNumber() {
        const sehuatangTexts = this.getsehuatangTexts();
        let avNumber = '';
        for (let index = 0; index < sehuatangTexts.length; index++) {
            const element = sehuatangTexts[index];
            if (element.indexOf("品番：") > -1) {
                avNumber = element.replace("品番：", "").trim();
                return avNumber
            }
        }
        const title = this.getTitleText();
        const type = this.getType();
        if (type.localeCompare("高清中文字幕") === 0 || type.localeCompare('4K原版') === 0) {
            return title.split(' ')[0];
        }
        return title;
    }

    getTime() {
        let time = '';
        try {
            time = this.doc.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].getElementsByTagName('span')[0].getAttribute("title")
        } catch (e) {
            time = this.doc.getElementsByClassName("authi")[1].getElementsByTagName('em')[0].innerText.replace("发表于", '').trim()
        }
        return time
    }

    getType() {
        return this.doc.getElementsByClassName("bm cl")[0].getElementsByTagName("a")[3].innerText.trim();
    }

    getImages() {
        const imgs = this.doc.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('img');
        let res = [];
        for (let index = 0; index < imgs.length; index++) {
            const element = imgs[index];
            if (element.getAttribute("id") !== null && element.getAttribute("id").indexOf('aimg') > -1) {
                res.push(element.getAttribute("file"));
            }
        }
        return res;
    }

    getsehuatangTexts() {
        let sehuatangTextArray = this.doc.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].innerText.split("\n").filter((item) => {
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

    getSelfFilename() {
        let title = this.getTitleText();
        let replaceList = '/?*:|\\<>"'.split('');
        let equalList = ["con", "aux", "nul", "prn", "com0", "com1", "com2", "com3", "com4", "com5", "com6", "com7",
            "com8", "com9", "lpt0", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"];

        for (let i = 0; i < replaceList.length; i++) {
            title = title.replaceAll(replaceList[i], "_");
        }
        return title;
    }

    getFileName(name, ext) {
        return name + '.' + ext;
    }

    getDownloadBtTags() {
        let attnms = this.doc.getElementsByClassName("attnm");
        let aTags = [];
        if (attnms !== null && attnms.length === 0) {
            aTags = this.doc.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName('tr')[0].getElementsByTagName('a')
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

    getBtNames() {
        let attnms = this.getDownloadBtTags();
        let btNames = [];
        for (let index = 0; index < attnms.length; index++) {
            btNames.push(attnms[index].innerText.trim());
        }
        return btNames;
    }

    async doBtDownload() {
        let attnms = this.getDownloadBtTags();
        for (let index = 0; index < attnms.length; index++) {
            await this.downloadBTFile(attnms[index].href, attnms[index].innerText.trim())
        }
    }

    async downloadBTFile(url, filename) {
        const blob = await this.gmFetchImageBlob(url);
        if (blob) {
            try {
                const list = await this.parseTorrentFilesFromBlob(blob);
                console.log(list);
                saveAs(blob, filename);
            } catch (e) {
                console.error(`解析错误信息：${e} `);
                console.error(`${filename} 下载失败，请手动处理。`);
            }
        }
    }


    /**
     * 从种子文件的 Blob 中解析文件列表
     * @param {Blob} blob - 种子的 Blob 或 File 对象
     * @returns {Promise<Array<{path: string, length: number}>>} 文件列表
     */
    async parseTorrentFilesFromBlob(blob) {
        // 1. 将 Blob 转换为 ArrayBuffer (Uint8Array)
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // 2. 使用 bencode 解码
        // 注意：如果通过上面 CDN 引入，全局变量通常是 bencode
        const torrentData = bencode.decode(uint8Array);

        if (!torrentData || !torrentData.info) {
            throw new Error('无效的 BT 种子文件');
        }

        const info = torrentData.info;
        const filesList = [];

        // 辅助函数：将 Bencode 的 Buffer 转换为 UTF-8 字符串
        const bufferToString = (buf) => {
            if (!buf) return '';
            return new TextDecoder('utf-8').decode(buf);
        };

        // 3. 判断是单文件种子还是多文件种子
        if (info.files && Array.isArray(info.files)) {
            // 多文件种子
            info.files.forEach(file => {
                // file.path 是一个数组，代表多级目录，例如 ['Season 1', 'Ep01.mp4']
                const pathSegments = file.path.map(seg => bufferToString(seg));
                const fullPath = pathSegments.join('/');

                filesList.push({
                    path: fullPath,
                    length: file.length // 文件大小 (Bytes)
                });
            });
        } else if (info.length) {
            // 单文件种子
            filesList.push({
                path: bufferToString(info.name),
                length: info.length // 文件大小 (Bytes)
            });
        }

        return filesList;
    }


    async copyTitleAndDownload() {
        await copyContext(this.getTitleText() + "\n");
        await this.doBtDownload();
        // console.log('copyTitleAndDownload')
    }


    getMagnets() {
        const magnets = [];
        const blockcode = this.doc.getElementsByClassName("blockcode");
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

    async copyTitleAndBlockcode() {
        let info = this.getTitleText() + "\n";
        info += this.getPageLink() + "\n";
        const blockcode = this.getMagnets();
        for (let index = 0; index < blockcode.length; index++) {
            info += blockcode[index] + "\n";
        }
        await copyContext(info);
    }

    getTitle() {
        if (this.doc.getElementById !== undefined) {
            return this.doc.getElementById("thread_subject")
        }

        return this.doc.querySelector("#thread_subject");
    }

    getTitleText() {
        return this.getTitle().innerText;
    }

    getPageLink() {
        return this.doc.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
    }


}