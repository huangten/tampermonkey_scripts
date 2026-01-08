// ==UserScript==
// @name       sehuatang 列表页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-08.23:08:01
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
      attnms[index].click();
    }
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
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  let downloadArray = [];
  let timer = 0;
  _unsafeWindow.onmessage = ListenMessage;
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
            if (downloadArray.length !== 0) {
              layui.layer.tips("正在下载中，请等待下载完后再继续", this, {
                tips: 4,
                fixed: true
              });
            } else {
              downloadAll();
            }
          }
          if (type === "clearDownloadList") {
            downloadArray = [];
          }
          if (type === "menuList") {
            openMenuPage();
          }
        }
      });
    });
  }
  function ListenMessage(e) {
    if (e.data.handle === "lhd_close") {
      layui.layer.closeAll("iframe");
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
      }, 200);
    }
  }
  function downloadAll() {
    downloadArray = getMenuArray(getTree());
    doDownload();
  }
  function doDownload() {
    console.log(downloadArray.length);
    if (downloadArray.length === 0) {
      clearTimeout(timer);
      return;
    }
    let menu = downloadArray.shift();
    layui.layer.open({
      type: 2,
      title: menu.sehuatang_type + " " + menu.title,
      shadeClose: false,
      shade: 0,
      offset: "l",
      anim: "slideRight",
      skin: "layui-layer-win10",
maxmin: true,
area: ["70%", "80%"],
      content: menu.href,
      success: function(layero, index, that) {
        let iframeDocument = layui.layer.getChildFrame("html", index);
        let documentElement = iframeDocument[0];
        getInfo(documentElement);
        setTimeout(() => {
          let msg = {
            "handle": "lhd_close",
            "layer_index": index
          };
          _unsafeWindow.postMessage(msg);
        }, 500);
      }
    });
  }
  function openMenuPage() {
    layui.layer.open({
      type: 1,
      title: "章节列表",
      shadeClose: false,
      offset: "r",
      shade: 0,
      anim: "slideLeft",
area: ["25%", "90%"],
      skin: "layui-layer-win10",
maxmin: true,
content: `<div id='openPage'></div>`,
      success: function(layero, index, that) {
        console.log(layero, index, that);
        const util = layui.util;
        const tree = layui.tree;
        const layer = layui.layer;
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
            if (downloadArray.length !== 0) {
              layer.msg("正在下载中，请等待下载完后再继续");
              return;
            }
            console.log([data]);
            downloadArray = getMenuArray([data]);
            doDownload();
          }
        });
        function treeCheckedDownload() {
          let checkedData = tree.getChecked("titleList");
          console.log(checkedData[0]);
          if (checkedData.length === 0) {
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
          tree.reload("titleList", {
data: getTree()
          });
          downloadArray = [];
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