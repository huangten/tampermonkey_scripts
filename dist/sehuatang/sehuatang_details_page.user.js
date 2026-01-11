// ==UserScript==
// @name       sehuatang 详情页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-11.16:02:26
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
// @match      https://*.sehuatang.org/thread*
// @match      https://*.sehuatang.org/forum.php?mod=viewthread&tid=*
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @connect    *
// @grant      GM_addStyle
// @grant      GM_download
// @grant      GM_getResourceText
// @grant      GM_notification
// @grant      GM_xmlhttpRequest
// @grant      unsafeWindow
// @noframes
// ==/UserScript==

(function (fileSaver) {
  'use strict';

  function addCss(id, src) {
    return new Promise((resolve, reject) => {
      if (!document.getElementById(id)) {
        const head = document.getElementsByTagName("head")[0];
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.type = "text/css";
        link.href = src;
        link.media = "all";
        link.onload = () => {
          resolve();
        };
        link.onerror = () => {
          reject();
        };
        head.appendChild(link);
      } else {
        return resolve();
      }
    });
  }
  function addScript(id, src) {
    return new Promise((resolve, reject) => {
      if (!document.getElementById(id)) {
        const script = document.createElement("script");
        script.src = src;
        script.id = id;
        script.onload = () => {
          resolve();
        };
        script.onerror = () => {
          reject();
        };
        document.body.appendChild(script);
      } else {
        return resolve();
      }
    });
  }
  function copyContext(str) {
    return new Promise((resolve, reject) => {
      navigator.clipboard.writeText(str).then(() => {
        console.log("Content copied to clipboard");
        return resolve;
      }, () => {
        console.error("Failed to copy");
        return reject;
      });
    });
  }
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  function check18R() {
    if (document.getElementsByTagName("head")[0].getElementsByTagName("title")[0].innerText.trim().indexOf("SEHUATANG.ORG") > -1) {
      const enterBts = document.getElementsByClassName("enter-btn");
      for (let index = 0; index < enterBts.length; index++) {
        if (enterBts[index].innerText.trim().indexOf("满18岁，请点此进入") > -1) {
          enterBts[index].click();
          break;
        }
      }
    }
  }
  function getInfo(el) {
    const type = getType(el);
    const imageLinks = getImages(el);
    console.log(imageLinks);
    const imgs = [];
    for (let index = 0; index < imageLinks.length; index++) {
      let paths = imageLinks[index].split("/");
      let file = paths[paths.length - 1].split(".");
      let ext = file[file.length - 1];
      let name = getSelfFilename(el) + "_" + index + "." + ext;
      imgs.push(
        {
          "isExist": false,
          "hasDownload": false,
          "filename": name,
          "href": imageLinks[index]
        }
      );
    }
    const magnets = getMagnets();
    const btNames = getBtNames(el);
    const time = getTime(el);
    const selfFilename = getFileName(getSelfFilename(el), "txt");
    const sehuatangTexts = getsehuatangTexts(el);
    let info = {
      "title": getTitleText(el),
      "avNumber": getAvNumber(el),
      "selfFilename": selfFilename,
      "year": time.split(" ")[0].split("-")[0],
      "month": time.split(" ")[0].split("-")[1],
      "day": time.split(" ")[0].split("-")[2],
      "date": time.split(" ")[0],
      "time": time,
      "sehuatangInfo": {
        "type": type,
        "link": getPageLink(el),
        "infos": sehuatangTexts,
        "imgs": imgs,
        "magnets": magnets,
        "bts": btNames
      }
    };
    try {
      const isFileSaverSupported = !!new Blob();
      const blob = new Blob([JSON.stringify(info, null, 4)], { type: "text/plain;charset=utf-8" });
      fileSaver.saveAs(blob, selfFilename);
    } catch (e) {
      console.log(e);
    }
    doBtDownload(el);
  }
  function getAvNumber(el) {
    const sehuatangTexts = getsehuatangTexts(el);
    let avNumber = "";
    for (let index = 0; index < sehuatangTexts.length; index++) {
      const element = sehuatangTexts[index];
      if (element.indexOf("品番：") > -1) {
        avNumber = element.replace("品番：", "").trim();
        return avNumber;
      }
    }
    const title = getTitleText(el);
    const type = getType(el);
    if (type.localeCompare("高清中文字幕") === 0 || type.localeCompare("4K原版") === 0) {
      return title.split(" ")[0];
    }
    return title;
  }
  function getTime(el) {
    let time = "";
    try {
      time = el.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].getElementsByTagName("span")[0].getAttribute("title");
    } catch (e) {
      time = el.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].innerText.replace("发表于", "").trim();
    }
    return time;
  }
  function getType(el) {
    return el.getElementsByClassName("bm cl")[0].getElementsByTagName("a")[3].innerText.trim();
  }
  function getImages(el) {
    const imgs = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName("tr")[0].getElementsByTagName("img");
    let res = [];
    for (let index = 0; index < imgs.length; index++) {
      const element = imgs[index];
      if (element.getAttribute("id") !== null && element.getAttribute("id").indexOf("aimg") > -1) {
        res.push(element.getAttribute("file"));
      }
    }
    return res;
  }
  function getsehuatangTexts(el) {
    let sehuatangTextArray = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName("tr")[0].innerText.split("\n").filter((item) => {
      return item !== null && typeof item !== "undefined" && item !== "";
    });
    let replaceArr = ["播放", "复制代码", "undefined", "立即免费观看"];
    for (let index = 0; index < sehuatangTextArray.length; index++) {
      for (let j = 0; j < replaceArr.length; j++) {
        sehuatangTextArray[index] = sehuatangTextArray[index].replace(replaceArr[j], "").trim();
      }
    }
    return sehuatangTextArray;
  }
  function getSelfFilename(el) {
    let title = getTitleText(el);
    let replaceList = '/?*:|\\<>"'.split("");
    for (let i = 0; i < replaceList.length; i++) {
      title = title.replaceAll(replaceList[i], "_");
    }
    return title;
  }
  function getFileName(name, ext) {
    return name + "." + ext;
  }
  function getDownloadBtTags(el) {
    let attnms = el.getElementsByClassName("attnm");
    let aTags = [];
    if (attnms !== null && attnms.length === 0) {
      aTags = el.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName("tr")[0].getElementsByTagName("a");
    } else {
      for (let index = 0; index < attnms.length; index++) {
        let as = attnms[index].getElementsByTagName("a");
        for (let j = 0; j < as.length; j++) {
          aTags.push(as[j]);
        }
      }
    }
    let res = [];
    for (let index = 0; index < aTags.length; index++) {
      if (aTags[index].innerText.trim().indexOf("torrent") > -1) {
        res.push(aTags[index]);
      }
    }
    return res;
  }
  function getBtNames(el) {
    let attnms = getDownloadBtTags(el);
    let btNames = [];
    for (let index = 0; index < attnms.length; index++) {
      btNames.push(attnms[index].innerText.trim());
    }
    return btNames;
  }
  function doBtDownload(el) {
    let attnms = getDownloadBtTags(el);
    for (let index = 0; index < attnms.length; index++) {
      downloadBTFile(attnms[index].href, attnms[index].innerText.trim());
    }
  }
  function downloadBTFile(url, filename) {
    let link = document.createElement("a");
    link.href = url;
    link.innerText = filename;
    link.click();
  }
  function copyTitleAndDownload(el) {
    copyContext(getTitleText(el) + "\n").then();
    doBtDownload(el);
  }
  function getMagnets(el) {
    const magnets = [];
    const blockcode = document.getElementsByClassName("blockcode");
    for (let index = 0; index < blockcode.length; index++) {
      magnets.push(blockcode[index].getElementsByTagName("li")[0].innerText);
    }
    let replaceArr = ["播放", "复制代码", "undefined", "立即免费观看"];
    for (let index = 0; index < magnets.length; index++) {
      for (let j = 0; j < replaceArr.length; j++) {
        magnets[index] = magnets[index].replace(replaceArr[j], "").trim();
      }
    }
    return magnets;
  }
  function copyTitleAndBlockcode(el) {
    let info = getTitleText(el) + "\n";
    info += getPageLink(el) + "\n";
    const blockcode = getMagnets();
    for (let index = 0; index < blockcode.length; index++) {
      info += blockcode[index] + "\n";
    }
    copyContext(info).then();
  }
  function getTitle(el) {
    if (el.getElementById !== void 0) {
      return el.getElementById("thread_subject");
    }
    return el.querySelector("#thread_subject");
  }
  function getTitleText(el) {
    return getTitle(el).innerText;
  }
  function getPageLink(el) {
    return el.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
  }
  init().then(() => {
    run();
  });
  function run() {
    document.onvisibilitychange = () => {
      if (document.visibilityState === "visible" && document.readyState === "complete") {
        check18R();
      }
    };
    setTimeout(() => {
      check18R();
    }, 500);
    layui.use(function() {
      const util = layui.util;
      const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;";
      util.fixbar({
        bars: [
          {
            type: "getInfo",
            content: "下载信息和种子",
            style: fixbarStyle
          },
          {
            type: "onlyCopyTitle",
            content: "仅复制标题",
            style: fixbarStyle
          },
          {
            type: "copyTitleAndDownload",
            content: "复制标题和下载种子",
            style: fixbarStyle
          },
          {
            type: "copyTitleAndBlockcode",
            content: "复制标题和磁力信息",
            style: fixbarStyle
          }
        ],
        default: false,
        css: { bottom: "21%" },
        margin: 0,
click: function(type) {
          console.log(this, type);
          if (type === "getInfo") {
            getInfo(document);
          }
          if (type === "onlyCopyTitle") {
            copyContext(getTitleText(document).trim()).then();
          }
          if (type === "copyTitleAndDownload") {
            copyTitleAndDownload(document);
          }
          if (type === "copyTitleAndBlockcode") {
            copyTitleAndBlockcode(document);
          }
        }
      });
    });
  }

})(saveAs);