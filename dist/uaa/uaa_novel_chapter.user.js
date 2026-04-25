// ==UserScript==
// @name       UAA 书籍章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-04-25.22:04:12
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @match      https://*.uaa.com/novel/chapter*
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant      GM_addStyle
// @grant      GM_addValueChangeListener
// @grant      GM_deleteValues
// @grant      GM_download
// @grant      GM_getResourceText
// @grant      GM_getTab
// @grant      GM_getTabs
// @grant      GM_getValue
// @grant      GM_getValues
// @grant      GM_notification
// @grant      GM_openInTab
// @grant      GM_removeValueChangeListener
// @grant      GM_saveTab
// @grant      GM_setValue
// @grant      GM_setValues
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
  class ChapterPageModel {
    constructor(doc = document) {
      this.doc = doc;
      this.titleText = "";
      this.texts = [];
      this.htmlLines = [];
    }
    load() {
      this.titleText = this.parseTitleText();
      this.texts = getTexts(this.doc);
      this.htmlLines = getLines(this.doc);
    }
    getTitleText() {
      return this.titleText;
    }
    getTitleHtml() {
      return "<h2>" + this.titleText + "</h2>";
    }
    getContentText() {
      return this.texts.map((s) => `　　${s}`).join("\n");
    }
    getContentHtml() {
      return this.htmlLines.join("\n");
    }
    getTitleAndContentText() {
      return this.getTitleText() + "\n\n" + this.getContentText();
    }
    getTitleAndContentHtml() {
      return this.getTitleHtml() + "\n\n" + this.getContentHtml();
    }
    saveToLocal() {
      return saveContentToLocal(this.doc);
    }
    getPrevChapterElement() {
      return this.getBottomBoxElement(0);
    }
    getBookElement() {
      return this.getBottomBoxElement(1);
    }
    getNextChapterElement() {
      return this.getBottomBoxElement(2);
    }
    parseTitleText() {
      const titleBox = this.doc.getElementsByClassName("title_box")[0];
      const level = titleBox.getElementsByTagName("p")[0] !== void 0 ? titleBox.getElementsByTagName("p")[0].innerText + " " : "";
      return cleanText(level + titleBox.getElementsByTagName("h2")[0].innerText);
    }
    getBottomBoxElement(index) {
      const bottomBox = this.doc.getElementsByClassName("bottom_box")[0];
      if (!bottomBox) {
        return null;
      }
      let el = bottomBox.firstElementChild;
      for (let i = 0; i < index && el; i++) {
        el = el.nextElementSibling;
      }
      return el;
    }
  }
  class ChapterFixbarView {
    renderFixbar({ onAction }) {
      layui.use(() => {
        layui.util.fixbar({
          bars: [
            {
              type: "获取标题文本",
              icon: "layui-icon-fonts-strong"
            },
            {
              type: "获取标题HTML",
              icon: "layui-icon-fonts-code"
            },
            {
              type: "获取内容文本",
              icon: "layui-icon-tabs"
            },
            {
              type: "获取内容HTML",
              icon: "layui-icon-fonts-html"
            },
            {
              type: "获取标题和内容文本",
              icon: "layui-icon-align-center"
            },
            {
              type: "获取标题和内容HTML",
              icon: "layui-icon-code-circle"
            },
            {
              type: "保存内容到本地",
              icon: "layui-icon-download-circle"
            },
            {
              type: "上一章",
              icon: "layui-icon-prev"
            },
            {
              type: "本书",
              icon: "layui-icon-link"
            },
            {
              type: "下一章",
              icon: "layui-icon-next"
            }
          ],
          default: false,
          css: { bottom: "15%" },
          margin: 0,
          on: {
            mouseenter: function(type) {
              layui.layer.tips(type, this, {
                tips: 4,
                fixed: true
              });
            },
            mouseleave: function() {
              layui.layer.closeAll("tips");
            }
          },
          click: function(type) {
            onAction(type);
          }
        });
      });
    }
  }
  class ChapterController {
    constructor({
      model = new ChapterPageModel(),
      view = new ChapterFixbarView()
    } = {}) {
      this.model = model;
      this.view = view;
    }
    init() {
      this.model.load();
      this.view.renderFixbar({
        onAction: (type) => this.handleAction(type)
      });
    }
    handleAction(type) {
      console.log(type);
      switch (type) {
        case "获取标题文本":
          this.copy(this.model.getTitleText());
          break;
        case "获取标题HTML":
          this.copy(this.model.getTitleHtml());
          break;
        case "获取内容文本":
          this.copy(this.model.getContentText());
          break;
        case "获取内容HTML":
          this.copy(this.model.getContentHtml());
          break;
        case "获取标题和内容文本":
          this.copy(this.model.getTitleAndContentText());
          break;
        case "获取标题和内容HTML":
          this.copy(this.model.getTitleAndContentHtml());
          break;
        case "保存内容到本地":
          this.model.saveToLocal();
          break;
        case "上一章":
          this.clickIfLink(this.model.getPrevChapterElement());
          break;
        case "本书":
          this.clickIfLink(this.model.getBookElement());
          break;
        case "下一章":
          this.clickIfLink(this.model.getNextChapterElement());
          break;
      }
    }
    copy(content) {
      copyContext(content).then();
    }
    clickIfLink(el) {
      if (el && el.nodeName.indexOf("A") > -1) {
        el.click();
      }
    }
  }
  init().then(() => {
    new ChapterController().init();
  }).catch((e) => {
    console.log(e);
  });

})(saveAs);