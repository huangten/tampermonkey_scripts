// ==UserScript==
// @name       sehuatang 列表页 增强 V2
// @namespace  https://tampermonkey.net/
// @version    2026-01-14.10:52:21
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
// @match      https://*.sehuatang.org/forum*
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
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function waitForElement(doc, selector, timeout = 1e4) {
    return new Promise((resolve) => {
      const interval = 100;
      let elapsed = 0;
      const checker = setInterval(() => {
        if (doc.querySelector(selector) || elapsed >= timeout) {
          clearInterval(checker);
          resolve();
        }
        elapsed += interval;
      }, interval);
    });
  }
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  async function destroyIframeElementAsync(iframe) {
    if (iframe && iframe instanceof HTMLIFrameElement) {
      try {
        iframe.onload = null;
        iframe.onerror = null;
        iframe.contentDocument.write("");
        iframe.contentDocument.close();
        iframe.src = "about:blank";
        await sleep(50);
        iframe.remove();
        iframe = null;
        await sleep(50);
      } catch (e) {
        console.error("清空 iframe 失败", e);
      }
      console.log("✅ iframe 已完全清理并销毁");
    }
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
  class Downloader {
    constructor() {
      this.queue = [];
      this.running = false;
      this.downloaded = [];
      this.failed = [];
      this.pendingSet = new Set();
      this.doneSet = new Set();
      this.failedSet = new Set();
      this.config = {
        interval: 2e3,
onTaskBefore: () => {
        },
onTaskComplete: () => {
        },
onFinish: () => {
        },
onCatch: (err) => {
        },
        downloadHandler: null,

retryFailed: false,
uniqueKey: (task) => task?.href
};
    }




setConfig(options = {}) {
      this.config = { ...this.config, ...options };
    }
add(task) {
      const key = this.config.uniqueKey(task);
      if (!key) return false;
      if (this.pendingSet.has(key)) return false;
      if (this.doneSet.has(key)) return false;
      if (this.failedSet.has(key) && !this.config.retryFailed) return false;
      task.startTime = new Date();
      this.queue.push(task);
      this.pendingSet.add(key);
      return true;
    }
clear() {
      this.queue = [];
      this.pendingSet.clear();
    }
async start() {
      if (this.running) return;
      if (typeof this.config.downloadHandler !== "function") {
        throw new Error("请先通过 setConfig 设置 downloadHandler 回调");
      }
      this.running = true;
      while (this.failed.length > 0) {
        this.queue.unshift(this.failed.shift());
      }
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        const key = this.config.uniqueKey(task);
        try {
          this.config.onTaskBefore(task);
          const success = await this.config.downloadHandler(task);
          task.endTime = new Date();
          this.pendingSet.delete(key);
          if (success) {
            this.downloaded.push(task);
            this.doneSet.add(key);
          } else {
            this.failed.push(task);
            this.failedSet.add(key);
          }
          this.config.onTaskComplete(task, success);
        } catch (err) {
          task.endTime = new Date();
          this.pendingSet.delete(key);
          this.failed.push(task);
          this.failedSet.add(key);
          this.config.onTaskComplete(task, false);
          this.running = false;
          this.config.onCatch(err);
          return;
        }
        if (this.queue.length > 0) await sleep(this.config.interval);
      }
      this.running = false;
      this.config.onFinish(this.downloaded, this.failed);
    }
  }
  const downloader = new Downloader();
  let downloadWindowId = 0;
  const divId = "downloadWindowDivId";
  downloader.setConfig({
    interval: 500,
    downloadHandler: downloadV1,
    onTaskComplete: (task, success) => {
      let percent = ((downloader.doneSet.size + downloader.failedSet.size) / (downloader.doneSet.size + downloader.failedSet.size + downloader.pendingSet.size) * 100).toFixed(2) + "%";
      layui.element.progress("demo-filter-progress", percent);
      console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: (downloaded, failed) => {
      console.log("下载结束 ✅");
      console.log("已下载:", downloaded.map((t) => t));
      console.log("未下载:", failed.map((t) => t));
      layui.layer.close(downloadWindowId);
      downloadWindowId = 0;
      layui.layer.alert("下载完毕", { icon: 1, shadeClose: true });
    },
    onCatch: (err) => {
      layui.layer.alert("出现错误：" + err.message, { icon: 5, shadeClose: true });
    }
  });
  async function createDownloadWindow(divId2) {
    return new Promise((resolve, reject) => {
      layui.layer.open({
        type: 1,
        title: "下载窗口",
        shadeClose: false,
        shade: 0,
        offset: "l",
        skin: "layui-layer-win10",
maxmin: true,
area: ["70%", "90%"],
        content: `<fieldset class="layui-elem-field">
  <legend>进度条</legend>
  <div class="layui-field-box">
<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="demo-filter-progress"> <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div></div>  </div></fieldset><div id="${divId2}" style="width: 100%;height: 100%;"></div>`,
        success: function(layero, index, that) {
          layui.element.render("progress", "demo-filter-progress");
          layui.element.progress("demo-filter-progress", "0%");
          resolve(index);
        }
      });
    });
  }
  async function ensureDownloadWindow(divId2 = "downloadWindowDivId") {
    if (downloadWindowId !== 0) {
      return downloadWindowId;
    }
    downloadWindowId = await createDownloadWindow(divId2);
    return downloadWindowId;
  }
  async function downloadV1(task) {
    const winId = await ensureDownloadWindow(divId);
    layui.layer.title(task.title, winId);
    const iframe = document.createElement("iframe");
    iframe.id = "_iframe__" + crypto.randomUUID();
    iframe.src = task.href;
    iframe.style.display = "block";
    iframe.style.border = "none";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    document.getElementById(divId).appendChild(iframe);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1e3 * 30 * 60);
      iframe.onload = async () => {
        try {
          await waitForElement(iframe.contentDocument, ".plhin", 1e3 * 25 * 60);
          clearTimeout(timeout);
          resolve();
        } catch (err) {
          clearTimeout(timeout);
          reject(new Error("正文元素未找到"));
        }
      };
    });
    getInfo(iframe.contentDocument);
    await sleep(100);
    await destroyIframeElementAsync(iframe);
    return true;
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
    if (document.location.href === "https://sehuatang.org/forum.php") {
      return;
    }
    const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:100px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;";
    layui.use(function() {
      const util = layui.util;
      util.fixbar({
        bars: [{
          type: "downloadAll",
          content: "下载全部",
          style: fixbarStyle
        }, {
          type: "clearDownloadList",
          content: "清除待下载",
          style: fixbarStyle
        }, {
          type: "menuList",
          content: "章节列表",
          style: fixbarStyle
        }],
        default: false,
        css: { bottom: "18%", right: 10 },
        margin: 0,
click: function(type) {
          if (type === "downloadAll") {
            downloadAll();
          }
          if (type === "clearDownloadList") {
            downloader.clear();
          }
          if (type === "menuList") {
            openMenuPage();
          }
        }
      });
    });
  }
  function downloadAll() {
    getMenuArray(getTree()).forEach((d) => downloader.add(d));
    downloader.start().then();
  }
  function openMenuPage() {
    layui.layer.open({
      type: 1,
      title: "章节列表",
      shadeClose: false,
      offset: "r",
      shade: 0,
      anim: "slideLeft",
area: ["20%", "90%"],
      skin: "layui-layer-win10",
maxmin: true,
content: `<div id='openPage'></div>`,
      success: function(layero, index, that) {
        console.log(layero, index, that);
        const util = layui.util;
        const tree = layui.tree;
        util.fixbar({
          bars: [
            {
              type: "getCheckedNodeData",
              content: "选"
            },
            {
              type: "clear",
              icon: "layui-icon-refresh"
            }
          ],
          default: true,
css: { bottom: "10%", right: 10 },
          target: layero,
bgcolor: "#ba350f",
          click: function(type) {
            if (type === "getCheckedNodeData") {
              treeCheckedDownload();
            }
            if (type === "clear") {
              reloadTree();
            }
          }
        });
        tree.render({
          elem: "#openPage",
          data: getTree(),
          showCheckbox: true,
          onlyIconControl: true,
id: "titleList",
          isJump: false,
click: function(obj) {
            const data = obj.data;
            getMenuArray([data]).forEach((d) => downloader.add(d));
            downloader.start().then();
          }
        });
        function treeCheckedDownload() {
          let checkedData = tree.getChecked("titleList");
          console.log(checkedData[0]);
          if (checkedData.length === 0) {
            return;
          }
          getMenuArray(checkedData).forEach((d) => downloader.add(d));
          downloader.start().then();
        }
        function reloadTree() {
          tree.reload("titleList", {
data: getTree()
          });
          downloader.clear();
        }
      }
    });
  }
  function getTree() {
    let indexMap = new Map();
    let index = 0;
    let tree = [];
    let allLines = getAllLines();
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
        };
      }
      indexMap[allLines[i].date].children.push({
        "id": allLines[i].id,
        "sehuatang_type": allLines[index].sehuatang_type,
        "title": allLines[i].title,
        "href": allLines[i].href,
        "date": allLines[i].date,
        "children": [],
        "checked": true,
        "spread": false,
        "field": ""
      });
    }
    for (let key in indexMap) {
      tree.push(indexMap[key]);
    }
    return tree;
  }
  function getAllLines() {
    let lines = [];
    let nav = document.getElementById("pt").getElementsByTagName("a");
    let sehuatang_type = nav[nav.length - 1].innerText;
    let tbodys = document.getElementsByTagName("tbody");
    for (let index = 0; index < tbodys.length; index++) {
      if (tbodys[index].getAttribute("id") !== null && tbodys[index].getAttribute("id").indexOf("normalthread") > -1) {
        let id = tbodys[index].getAttribute("id").split("_")[1];
        console.log(id);
        let eldate = tbodys[index].getElementsByTagName("td")[1].getElementsByTagName("span");
        let date = eldate[1] === void 0 ? eldate[0].innerText : eldate[1].getAttribute("title");
        console.log(date);
        console.log(sehuatang_type);
        let titleBox = tbodys[index].getElementsByTagName("th")[0].getElementsByTagName("a");
        let href = "";
        let title = "";
        for (let i = 0; i < titleBox.length; i++) {
          if (titleBox[i].getAttribute("class") !== null && titleBox[i].getAttribute("class") === "s xst") {
            href = titleBox[i].href;
            title = titleBox[i].innerText;
            break;
          }
        }
        console.log(title);
        console.log(href);
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
  function getMenuArray(trees) {
    let menus = [];
    for (let index = 0; index < trees.length; index++) {
      if (trees[index].children.length === 0) {
        menus.push({
          "id": trees[index].id,
          "sehuatang_type": trees[index].sehuatang_type,
          "title": trees[index].title,
          "href": trees[index].href,
          "date": trees[index].date
        });
      } else {
        for (let j = 0; j < trees[index].children.length; j++) {
          menus.push({
            "id": trees[index].children[j].id,
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

})(saveAs);