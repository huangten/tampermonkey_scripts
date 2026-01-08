// ==UserScript==
// @name       UAA 书籍章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-08 19:42:31
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @match      https://*.uaa.com/novel/chapter*
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
  init().then(() => {
    run();
  }).catch((e) => {
    console.log(e);
  });
  function run() {
    let level = document.getElementsByClassName("title_box")[0].getElementsByTagName("p")[0] !== void 0 ? document.getElementsByClassName("title_box")[0].getElementsByTagName("p")[0].innerText + " " : "";
    const titleBox = cleanText(level + document.getElementsByClassName("title_box")[0].getElementsByTagName("h2")[0].innerText);
    const texts = getTexts(document);
    const htmlLines = getLines(document);
    document.querySelector("body div.title_box");
    const fixbarStyle = "background-color: #ff5555;font-size: 14px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;";
    layui.use(function() {
      const util = layui.util;
      util.fixbar({
        bars: [
          {
            type: "titleText",
            content: "获取标题文本",
            style: fixbarStyle
          },
          {
            type: "titleHtml",
            content: "获取标题HTML",
            style: fixbarStyle
          },
          {
            type: "contentText",
            content: "获取内容文本",
            style: fixbarStyle
          },
          {
            type: "contentHtml",
            content: "获取内容HTML",
            style: fixbarStyle
          },
          {
            type: "titleAndContentText",
            content: "获取标题和内容文本",
            style: fixbarStyle
          },
          {
            type: "titleAndContentHtml",
            content: "获取标题和内容HTML",
            style: fixbarStyle
          },
          {
            type: "saveContentToLocal",
            content: "保存内容到本地",
            style: fixbarStyle
          },
          {
            type: "prev",
            content: "上一章",
            style: fixbarStyle
          },
          {
            type: "self",
            content: "本书",
            style: fixbarStyle
          },
          {
            type: "next",
            content: "下一章",
            style: fixbarStyle
          }
        ],
        default: false,
        css: { bottom: "15%" },
        margin: 0,
click: function(type) {
          console.log(this, type);
          if (type === "titleText") {
            titleText();
            return;
          }
          if (type === "titleHtml") {
            titleHtml();
            return;
          }
          if (type === "contentText") {
            contentText();
            return;
          }
          if (type === "contentHtml") {
            contentHtml();
            return;
          }
          if (type === "titleAndContentText") {
            titleAndContentText();
            return;
          }
          if (type === "titleAndContentHtml") {
            titleAndContentHtml();
            return;
          }
          if (type === "saveContentToLocal") {
            saveContentToLocal(document);
            return;
          }
          if (type === "prev") {
            let prev = document.getElementsByClassName("bottom_box")[0].firstElementChild;
            if (prev.nodeName.indexOf("A") > -1) {
              prev.click();
              return;
            }
            return;
          }
          if (type === "self") {
            let s = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling;
            s.click();
            return;
          }
          if (type === "next") {
            let next = document.getElementsByClassName("bottom_box")[0].firstElementChild.nextElementSibling.nextElementSibling;
            if (next.nodeName.indexOf("A") > -1) {
              next.click();
            }
          }
        }
      });
    });
    function titleText() {
      copyContext(titleBox).then();
    }
    function titleHtml() {
      copyContext("<h2>" + titleBox + "</h2>").then();
    }
    function contentText() {
      copyContext(texts.map((s) => `　　${s}`).join("\n")).then();
    }
    function contentHtml() {
      copyContext(htmlLines.join("\n")).then();
    }
    function titleAndContentText() {
      copyContext(titleBox + "\n\n" + texts.map((s) => `　　${s}`).join("\n")).then();
    }
    function titleAndContentHtml() {
      copyContext("<h2>" + titleBox + "</h2>\n\n" + htmlLines.join("\n")).then();
    }
  }

})(saveAs);