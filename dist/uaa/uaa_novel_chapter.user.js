// ==UserScript==
// @name       UAA 书籍章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-08-19.19:06:32
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
  class ChapterPageModel {
    constructor(doc = document) {
      this.doc = doc;
      this.titleText = "";
      this.texts = [];
      this.htmlLines = [];
    }
    load() {
      this.titleText = this.getChapterTitleText();
      this.texts = this.getTexts();
      this.htmlLines = this.getLines();
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
      return this.saveContentToLocal(this.doc);
    }
    getPrevChapterElement() {
      return this.getBottomBoxElement("prev");
    }
    getBookElement() {
      const topBox = this.doc.getElementsByClassName("reader-top")[0];
      if (!topBox) {
        return null;
      }
      this.doc.getElementById("readerBook")?.click();
    }
    getNextChapterElement() {
      return this.getBottomBoxElement("next");
    }
    getBottomBoxElement(index) {
      const bottomBox = this.doc.getElementsByClassName("reader-bottom")[0];
      if (!bottomBox) {
        return null;
      }
      const buttons = bottomBox.getElementsByTagName("button");
      for (const button of buttons) {
        const attribute = button.getAttribute("data-reader-action");
        if (attribute === index) {
          return button?.click();
        }
      }
      return null;
    }
    saveContentToLocal() {
      try {
        const title = this.getChapterTitleText();
        const bookName = this.getBookName();
        const authorInfo = "作者：" + this.getAuthorInfo();
        const texts = this.getTexts().map((s) => `　　${s}`).join("\n");
        const htmlLines = this.getLines().join("\n");
        const separator = "\n\n=============================================\n";
        const content = [
          "book name:\n" + bookName,
          "author:\n" + authorInfo,
          "title:\n" + title,
          "text:\n" + texts,
          "html:\n" + htmlLines
        ].join(separator);
        try {
          !!new Blob();
          fileSaver.saveAs(
            new Blob([content], { type: "text/plain;charset=utf-8" }),
            [bookName, authorInfo, title].join(" ") + ".txt"
          );
        } catch (e) {
          console.log(e);
        }
      } catch (e) {
        console.error("保存失败", e);
        return false;
      }
      return true;
    }
    getChapterTitleText() {
      const titleBox = this.doc.getElementsByClassName("reader-content")[0];
      const level = titleBox.getElementsByClassName("reader-vol")[0] !== void 0 ? titleBox.getElementsByClassName("reader-vol")[0].innerText + " " : "";
      const title = titleBox.getElementsByTagName("h1")[0] !== void 0 ? titleBox.getElementsByTagName("h1")[0].innerText : "";
      return cleanText(level + title);
    }
    getChapterLines() {
      const contentBox = this.doc.getElementsByClassName("reader-content")[0];
      if (!contentBox) {
        return [];
      }
      const contentBody = contentBox.getElementsByClassName("reader-body")[0];
      if (!contentBody) {
        return [];
      }
      let lines = contentBody.getElementsByTagName("p");
      return Array.from(lines);
    }
    getTexts() {
      const lines = this.getChapterLines();
      let texts = [];
      for (let i = 0; i < lines.length; i++) {
        let elements = lines[i].getElementsByTagName("button");
        if (elements.length > 0) {
          for (let j = elements.length - 1; j >= 0; j--) {
            elements[j].parentNode.removeChild(elements[j]);
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
    getLines() {
      let lines = this.getChapterLines();
      let htmlLines = [];
      for (let i = 0; i < lines.length; i++) {
        let elements = lines[i].getElementsByTagName("button");
        if (elements.length > 0) {
          for (let j = elements.length - 1; j >= 0; j--) {
            elements[j].parentNode.removeChild(elements[j]);
          }
        }
        let imgElement = lines[i].getElementsByTagName("img");
        if (imgElement.length > 0) {
          for (let j = 0; j < imgElement.length; j++) {
            htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>`);
          }
        }
        if (lines[i].innerText.indexOf("UAA地址发布页") > -1) {
          continue;
        }
        let t = cleanText(lines[i].innerText.trim());
        if (t.length === 0) {
          continue;
        }
        htmlLines.push(`<p>${t}</p>`);
      }
      return htmlLines;
    }
    getBookName() {
      return cleanText(this.doc.getElementById("readerBook")?.innerText.trim());
    }
    getAuthorInfo() {
      const metaBox = this.doc.getElementsByClassName("reader-meta")[0];
      if (!metaBox) {
        return "";
      }
      const meta = metaBox.innerHTML.trim();
      const authorMatch = meta.match(/(.*?) 著 ·/);
      if (authorMatch && authorMatch[1]) {
        return cleanText(authorMatch[1].trim());
      }
      return "";
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
          this.model.getPrevChapterElement();
          break;
        case "本书":
          this.model.getBookElement();
          break;
        case "下一章":
          this.model.getNextChapterElement();
          break;
      }
    }
    copy(content) {
      copyContext(content).then();
    }
  }
  init().then(() => {
    new ChapterController().init();
  }).catch((e) => {
    console.log(e);
  });

})(saveAs);