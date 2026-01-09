// ==UserScript==
// @name       UAA 书籍描述页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-09.19:34:01
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
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
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
  let downloadArray = [];
  let timer = 0;
  _unsafeWindow.onmessage = ListenMessage;
  init().then(() => {
    run();
  }).catch((e) => {
    console.log(e);
  });
  function run() {
    const fixbarStyle = "background-color: #ff5555;font-size: 16px;width:100px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;";
    layui.use(function() {
      const util = layui.util;
      util.fixbar({
        bars: [
          {
            type: "copyBookName",
            content: "复制书名",
            style: fixbarStyle
          },
          {
            type: "downloadAll",
            content: "下载全部",
            style: fixbarStyle
          },
          {
            type: "clearDownloadList",
            content: "清除待下载",
            style: fixbarStyle
          },
          {
            type: "menuList",
            content: "章节列表",
            style: fixbarStyle
          }
        ],
        default: false,
        css: { bottom: "10%", right: 0 },
        margin: 0,
click: function(type) {
          if (type === "downloadAll") {
            if (downloadArray.length !== 0) {
              layui.layer.tips("正在下载中，请等待下载完后再继续", this, {
                tips: 4,
                fixed: true
              });
            } else {
              downloadAll();
            }
            return;
          }
          if (type === "copyBookName") {
            let bookName = document.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText;
            copyContext(bookName).then();
            return;
          }
          if (type === "clearDownloadList") {
            downloadArray = [];
            return;
          }
          if (type === "menuList") {
            openChapterMenuPage();
          }
        }
      });
    });
  }
  function ListenMessage(e) {
    if (e.data.handle === "lhd_close") {
      layui.layer.closeAll("iframe", () => {
        let iframeDocument = layui.layer.getChildFrame("iframe", e.data.layer_index);
        iframeDocument.attr("src", "about:blank");
        iframeDocument.remove();
        iframeDocument.prevObject.attr("src", "about:blank");
        iframeDocument.prevObject.remove();
        iframeDocument = null;
        let iframes = document.getElementsByTagName("iframe");
        for (let index = 0; index < iframes.length; index++) {
          const el = iframes[index];
          el.src = "about:blank";
          if (el.contentWindow) {
            setTimeout((el2) => cycleClear(el2), 100);
          }
        }
      });
      if (timer !== 0) {
        clearTimeout(timer);
      }
      if (downloadArray.length === 0) {
        layui.layer.alert("下载完毕", { icon: 1, shadeClose: true }, function(index) {
          layui.layer.close(index);
        });
        return;
      }
      timer = setTimeout(() => {
        doDownload();
      }, 1e3 * 2);
    }
  }
  function cycleClear(el) {
    try {
      if (el) {
        el.contentDocument.write("");
        el.contentWindow.document.write("");
        el.contentWindow.close();
        el.parentNode.removeChild(el);
      }
    } catch (e) {
    }
  }
  function downloadAll() {
    downloadArray = getMenuArray(getMenuTree());
    doDownload();
  }
  function openChapterMenuPage() {
    layui.layer.open({
      type: 1,
      title: "章节列表",
      shadeClose: false,
      offset: "r",
      shade: 0,
      anim: "slideLeft",
area: ["20%", "80%"],
      skin: "layui-layer-win10",
maxmin: true,
content: `<div id='openPage'></div>`,
      success: function(layero, index, that) {
        const tree = layui.tree;
        const layer = layui.layer;
        const util = layui.util;
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
          default: false,
bgcolor: "#16baaa",
css: { bottom: "15%", right: 15 },
          target: layero,
click: function(type) {
            if (type === "getCheckedNodeData") {
              treeCheckedDownload();
            }
            if (type === "clear") {
              reloadTree();
            }
          }
        });
        function treeCheckedDownload() {
          let checkedData = tree.getChecked("title");
          if (checkedData.length === 0) {
            layer.msg("未选中任何数据");
            return;
          }
          if (downloadArray.length !== 0) {
            layer.msg("正在下载中，请等待下载完后再继续");
            return;
          }
          downloadArray = getMenuArray(checkedData);
          doDownload();
        }
        function reloadTree() {
          tree.reload("title", {
data: getMenuTree()
          });
          downloadArray = [];
        }
        tree.render({
          elem: "#openPage",
          data: getMenuTree(),
          showCheckbox: true,
          onlyIconControl: true,
id: "title",
          isJump: false,
click: function(obj) {
            const data = obj.data;
            if (downloadArray.length !== 0) {
              layui.layer.tips("正在下载中，请等待下载完后再继续", obj, {
                tips: 4,
                fixed: true
              });
              return;
            }
            downloadArray = getMenuArray([data]);
            doDownload();
          }
        });
      }
    });
  }
  function getMenuTree() {
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
  function getMenuArray(trees) {
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
  function doDownload() {
    if (downloadArray.length === 0) {
      clearTimeout(timer);
      return;
    }
    let menu = downloadArray.shift();
    layui.layer.open({
      type: 2,
      title: menu.title,
      shadeClose: false,
      shade: 0,
      offset: "l",
      anim: "slideRight",
      skin: "layui-layer-win10",
maxmin: true,
area: ["75%", "80%"],
      content: menu.href,
      success: function(layero, index, that) {
        let iframeDocument = layui.layer.getChildFrame("html", index);
        let iDocument = iframeDocument[0];
        saveContentToLocal(iDocument);
        let msg = {
          "handle": "lhd_close",
          "layer_index": index
        };
        _unsafeWindow.postMessage(msg);
      }
    });
  }

})(saveAs);