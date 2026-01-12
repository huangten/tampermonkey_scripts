// ==UserScript==
// @name       UAA 书籍描述页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-12.15:31:07
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @match      https://*.uaa.com/novel/intro*
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant      GM_addStyle
// @grant      GM_download
// @grant      GM_getResourceText
// @grant      GM_notification
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
  const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g;
  function cleanText(str) {
    return str.replace(/\u00A0/g, " ").replace(INVISIBLE_RE, "");
  }
  function getFileNameFromPath(filePath) {
    const parts = filePath.split(/[\\/]/);
    return parts[parts.length - 1];
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
  function saveContentToLocal(el = document) {
    try {
      let title = getTitle(el);
      let separator = "\n\n=============================================\n";
      let content = "book name:\n" + getBookName2(el) + separator + "author:\n" + getAuthorInfo(el) + separator + "title:\n" + getTitle(el) + separator + "text:\n" + getTexts(el).map((s) => `　　${s}`).join("\n") + separator + "html:\n" + getLines(el).join("");
      try {
        const isFileSaverSupported = !!new Blob();
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        fileSaver.saveAs(blob, getBookName2(el) + " " + getAuthorInfo(el) + " " + title + ".txt");
      } catch (e) {
        console.log(e);
      }
      return true;
    } catch (e) {
      console.error("保存失败", e);
      return false;
    }
  }
  function getTitle(el = document) {
    let level = el.getElementsByClassName("title_box")[0].getElementsByTagName("p")[0] !== void 0 ? el.getElementsByClassName("title_box")[0].getElementsByTagName("p")[0].innerText + " " : "";
    return cleanText(level + el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText);
  }
  function getTexts(el = document) {
    let lines = el.getElementsByClassName("line");
    let texts = [];
    for (let i = 0; i < lines.length; i++) {
      let spanElement = lines[i].getElementsByTagName("span");
      if (spanElement.length > 0) {
        for (let j = 0; j < spanElement.length; j++) {
          console.log(spanElement[j]);
          spanElement[j].parentNode.removeChild(spanElement[j]);
        }
      }
      let imgElement = lines[i].getElementsByTagName("img");
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
  function getLines(el = document) {
    let lines = el.getElementsByClassName("line");
    let htmlLines = [];
    for (let i = 0; i < lines.length; i++) {
      let spanElement = lines[i].getElementsByTagName("span");
      if (spanElement.length > 0) {
        for (let j = 0; j < spanElement.length; j++) {
          console.log(spanElement[j]);
          spanElement[j].parentNode.removeChild(spanElement[j]);
        }
      }
      let imgElement = lines[i].getElementsByTagName("img");
      if (imgElement.length > 0) {
        for (let j = 0; j < imgElement.length; j++) {
          htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>
`);
        }
      }
      if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
        continue;
      }
      let t = cleanText(lines[i].innerText.trim());
      if (t.length === 0) {
        continue;
      }
      htmlLines.push(`<p>${t}</p>
`);
    }
    return htmlLines;
  }
  function getBookName2(el = document) {
    return cleanText(el.getElementsByClassName("chapter_box")[0].getElementsByClassName("title_box")[0].getElementsByTagName("a")[0].innerText.trim());
  }
  function getAuthorInfo(el = document) {
    return cleanText(el.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].nextElementSibling.getElementsByTagName("span")[0].innerText);
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
  let infoWindowIndex = 0;
  let downloadInfoWindowIndex = 0;
  const downloader = new Downloader();
  const downloadInfoWindowDivId = "downloadInfoWindowDivId";
  const infoWindowProgressFilter = "infoWindowProgressFilter";
  downloader.setConfig({
    interval: 2500,
    onTaskBefore: (task) => {
      layui.layer.title(task.title, ensureDownloadInfoWindowIndex(downloadInfoWindowDivId));
      document.getElementById("downloadInfoContentId").innerText = task.title;
      document.getElementById("downloadInfoContentId").href = task.href;
    },
    downloadHandler: async function(task) {
      let iframe = document.createElement("iframe");
      iframe.id = "__uaa_iframe__" + crypto.randomUUID();
      iframe.src = task.href;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      document.getElementById(downloadInfoWindowDivId).appendChild(iframe);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("页面加载超时")), 1e3 * 30 * 60);
        iframe.onload = async () => {
          try {
            await waitForElement(iframe.contentDocument, ".line", 1e3 * 25 * 60);
            clearTimeout(timeout);
            resolve();
          } catch (err) {
            clearTimeout(timeout);
            reject(new Error("正文元素未找到"));
          }
        };
      });
      const el = iframe.contentDocument;
      if (getTexts(el).some((s) => s.includes("以下正文内容已隐藏")))
        throw new Error("章节内容不完整，结束下载");
      const success = saveContentToLocal(el);
      await sleep(300);
      try {
        await sleep(100);
        if (iframe) {
          iframe.onload = null;
          iframe.onerror = null;
          iframe.contentDocument.write("");
          iframe.contentDocument.close();
          iframe.src = "about:blank";
          await sleep(50);
          iframe.remove();
          iframe = null;
          await sleep(50);
        }
      } catch (e) {
        console.error("清空 iframe 失败", e);
      }
      console.log("✅ iframe 已完全清理并销毁");
      return success;
    },
    onTaskComplete: (task, success) => {
      let percent = ((downloader.doneSet.size + downloader.failedSet.size) / (downloader.doneSet.size + downloader.failedSet.size + downloader.pendingSet.size) * 100).toFixed(2) + "%";
      layui.element.progress(infoWindowProgressFilter, percent);
      console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
      console.log("下载结束 ✅");
      layui.layer.title("下载面板", ensureDownloadInfoWindowIndex(downloadInfoWindowDivId));
      console.log("已下载:", downloaded.map((t) => t));
      console.log("未下载:", failed.map((t) => t));
      document.getElementById("downloadInfoContentId").innerText = "下载结束";
      document.getElementById("downloadInfoContentId").href = "";
      layui.layer.min(ensureDownloadInfoWindowIndex(downloadInfoWindowDivId));
      layui.layer.alert("下载完毕", { icon: 1, shadeClose: true });
    },
    onCatch: async (err) => {
      layui.layer.min(ensureInfoWindowIndex());
      layui.layer.restore(ensureDownloadInfoWindowIndex(downloadInfoWindowDivId));
      layui.layer.alert("出现错误：" + err.message, { icon: 5, shadeClose: true });
    }
  });
  init().then(() => {
    run();
  }).catch((e) => {
    console.log(e);
  });
  function run() {
    layui.use(function() {
      const util = layui.util;
      util.fixbar({
        bars: [
          {
            type: "复制书名",
            icon: "layui-icon-success"
          },
          {
            type: "下载全部",
            icon: "layui-icon-download-circle"
          },
          {
            type: "清除未下载",
            icon: "layui-icon-refresh"
          },
          {
            type: "章节列表",
            icon: "layui-icon-list"
          }
        ],
        default: false,
        bgcolor: "#ff5722",
        css: { bottom: "20%", right: 0 },
        margin: 0,
        on: {
mouseenter: function(type) {
            layui.layer.tips(type, this, {
              tips: 4,
              fixed: true
            });
          },
          mouseleave: function(type) {
            layui.layer.closeAll("tips");
          }
        },
click: function(type) {
          if (type === "下载全部") {
            layui.layer.min(ensureInfoWindowIndex());
            downloadAll();
            return;
          }
          if (type === "复制书名") {
            let bookName = document.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText;
            copyContext(bookName).then();
            return;
          }
          if (type === "清除未下载") {
            downloader.clear();
            return;
          }
          if (type === "章节列表") {
            openBookChapterListPage().then();
          }
        }
      });
    });
  }
  function ensureInfoWindowIndex() {
    if (infoWindowIndex !== 0) {
      return infoWindowIndex;
    }
    infoWindowIndex = layui.layer.tab({
      shadeClose: false,
      closeBtn: 0,
      shade: 0,
      maxmin: true,
area: ["60%", "80%"],
      moveOut: true,
      tab: [
        {
          title: "章节列表",
          content: '<div style="height: 100%;width: 100%;padding-top: 10px;"><div id="downloadWindowDivListTreeId"></div></div>'
        },
        {
          title: "下载进度",
          content: '<div style="height: 100%;width: 100%;padding-top: 10px;"><div id="downloadWindowDivInfoId"><fieldset class="layui-elem-field">\n  <legend>当前下载</legend>\n  <div class="layui-field-box">\n      <a id="downloadInfoContentId" href="">暂无下载</a>\n  </div>\n</fieldset><fieldset class="layui-elem-field">\n  <legend>进度条</legend>\n  <div class="layui-field-box">\n<div class="layui-progress layui-progress-big" lay-showPercent="true" lay-filter="' + infoWindowProgressFilter + '"> <div class="layui-progress-bar layui-bg-orange" lay-percent="0%"></div></div>  </div></fieldset></div></div>'
        }
      ],
      btn: ["下载选中章节", "清除未下载", "下载全部章节"],
      btn1: function(index, layero, that) {
        treeCheckedDownload();
        return false;
      },
      btn2: function(index, layero, that) {
        reloadTree();
        return false;
      },
      btn3: function(index, layero, that) {
        downloadAll();
        return false;
      },
success: function(layero, index, that) {
        layui.element.render("progress", infoWindowProgressFilter);
        layui.element.progress(infoWindowProgressFilter, "0%");
        const tree = layui.tree;
        tree.render({
          elem: "#downloadWindowDivListTreeId",
          data: getChapterListTree(),
          showCheckbox: true,
          onlyIconControl: true,
id: "titleList",
          isJump: false,
click: function(obj) {
            const data = obj.data;
            doTreeToChapterList([data]).forEach((d) => downloader.add(d));
            downloader.start().then();
          }
        });
      }
    });
    return infoWindowIndex;
  }
  function treeCheckedDownload() {
    let checkedData = layui.tree.getChecked("titleList");
    if (checkedData.length === 0) {
      layui.layer.msg("未选中任何数据");
      return;
    }
    doTreeToChapterList(checkedData).forEach((data) => {
      downloader.add(data);
    });
    downloader.start().then();
  }
  function reloadTree() {
    layui.tree.reload("titleList", { data: getChapterListTree() });
    downloader.clear();
  }
  function ensureDownloadInfoWindowIndex(downloadInfoWindowDivId2) {
    if (downloadInfoWindowIndex !== 0) {
      return downloadInfoWindowIndex;
    }
    downloadInfoWindowIndex = layui.layer.open({
      type: 1,
      title: "下载面板",
      shadeClose: false,
      closeBtn: 0,
      shade: 0,
      moveOut: true,
maxmin: true,
area: ["70%", "80%"],
      content: `<div id="${downloadInfoWindowDivId2}" style="width: 100%;height: 99%;"></div>`,
      success: function(layero, index, that) {
        layui.layer.min(index);
      }
    });
    return downloadInfoWindowIndex;
  }
  async function openBookChapterListPage() {
    ensureInfoWindowIndex();
  }
  function downloadAll() {
    doTreeToChapterList(getChapterListTree()).forEach((data) => {
      downloader.add(data);
    });
    downloader.start().then();
  }
  function getChapterListTree() {
    let menus = [];
    let lis = document.querySelectorAll(".catalog_ul > li");
    for (let index = 0; index < lis.length; index++) {
      let preName = "";
      if (lis[index].className.indexOf("menu") > -1) {
        let alist = lis[index].getElementsByTagName("a");
        for (let j = 0; j < alist.length; j++) {
          menus.push({
            "id": (index + 1) * 1e8 + j,
            "title": cleanText(preName + alist[j].innerText.trim()),
            "href": alist[j].href,
            "children": [],
            "spread": true,
            "field": "",
            "checked": alist[j].innerText.indexOf("new") > 0
          });
        }
      }
      if (lis[index].className.indexOf("volume") > -1) {
        preName = cleanText(lis[index].querySelector("span").innerText);
        let children = [];
        let alist = lis[index].getElementsByTagName("a");
        for (let j = 0; j < alist.length; j++) {
          children.push({
            "id": (index + 1) * 1e8 + j + 1,
            "title": cleanText(alist[j].innerText.trim()),
            "href": alist[j].href,
            "children": [],
            "spread": true,
            "field": "",
            "checked": alist[j].innerText.indexOf("new") > 0
          });
        }
        menus.push({
          "id": (index + 1) * 1e8,
          "title": cleanText(preName),
          "href": "",
          "children": children,
          "spread": true,
          "field": ""
        });
      }
    }
    return menus;
  }
  function doTreeToChapterList(trees) {
    let menus = [];
    for (let index = 0; index < trees.length; index++) {
      if (trees[index].children.length === 0) {
        menus.push({
          "id": trees[index].id,
          "title": trees[index].title,
          "href": trees[index].href
        });
      } else {
        for (let j = 0; j < trees[index].children.length; j++) {
          let preName = trees[index].title + " ";
          menus.push({
            "id": trees[index].children[j].id,
            "title": preName + trees[index].children[j].title,
            "href": trees[index].children[j].href
          });
        }
      }
    }
    return menus;
  }

})(saveAs);