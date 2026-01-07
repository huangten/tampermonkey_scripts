// ==UserScript==
// @name       cool18 章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-1-7.02
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=cool18.com
// @match      *://www.cool18.com/bbs4/index.php?app=forum&act=threadview&tid=*
// @grant      GM_addStyle
// @grant      GM_getResourceText
// @grant      unsafeWindow
// @noframes
// ==/UserScript==

(function () {
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
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  Promise.all([
    addCss("layui_css", "https://cdn.jsdelivr.net/npm/layui@2.11.5/dist/css/layui.min.css"),
addScript("layui_id", "https://cdn.jsdelivr.net/npm/layui@2.11.5/dist/layui.min.js")
  ]).then(() => {
    run();
  });
  function run() {
    layui.use(function() {
      const util = layui.util;
      const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;";
      util.fixbar({
        bars: [
          {
            type: "CopyContent",
            content: "复制内容",
            style: fixbarStyle
          },
          {
            type: "CopyContentHtml",
            content: "复制内容HTML",
            style: fixbarStyle
          },
          {
            type: "CopyChapter",
            content: "复制章节",
            style: fixbarStyle
          },
          {
            type: "CopyChapterHtml",
            content: "复制章节HTML",
            style: fixbarStyle
          }
        ],
        default: false,
        css: { bottom: "21%" },
        margin: 0,
        click: function(type) {
          if (type === "CopyContent") {
            getPreTagContent();
          }
          if (type === "CopyContentHtml") {
            getPreTagContentHtml();
          }
          if (type === "CopyChapter") {
            copyChapterContent();
          }
          if (type === "CopyChapterHtml") {
            copyChapterHtml();
          }
        }
      });
    });
  }
  function getPreTagContent() {
    copyContext(_unsafeWindow.document.getElementsByTagName("pre")[0].innerText).then();
  }
  function getPreTagContentHtml() {
    copyContext(_unsafeWindow.document.getElementsByTagName("pre")[0].innerHTML).then();
  }
  function copyChapterContent() {
    const preElement = _unsafeWindow.document.getElementsByTagName("pre")[0];
    const brs = preElement.getElementsByTagName("br");
    for (let i = brs.length - 1; i >= 0; i--) {
      preElement.removeChild(brs[i]);
    }
    copyContext(preElement.innerText).then();
  }
  function copyChapterHtml() {
    const preElement = _unsafeWindow.document.getElementsByTagName("pre")[0];
    const brs = preElement.getElementsByTagName("br");
    for (let i = brs.length - 1; i >= 0; i--) {
      preElement.removeChild(brs[i]);
    }
    copyContext(preElement.innerHTML).then();
  }

})();