// ==UserScript==
// @name       cool18 章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-12.00:10:24
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=cool18.com
// @match      *://www.cool18.com/bbs4/index.php?app=forum&act=threadview&tid=*
// @grant      GM_addStyle
// @grant      GM_getResourceText
// @grant      GM_notification
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
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  init().then(() => {
    run();
  });
  function run() {
    layui.use(function() {
      const util = layui.util;
      util.fixbar({
        bars: [
          {
            type: "复制内容",
            icon: "layui-icon-auz"
          },
          {
            type: "复制内容HTML",
            icon: "layui-icon-fonts-code"
          },
          {
            type: "复制内容（第二版）",
            icon: "layui-icon-vercode"
          },
          {
            type: "复制内容HTML（第二版）",
            icon: "layui-icon-code-circle"
          }
        ],
        default: false,
        css: { bottom: "21%" },
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
          if (type === "复制内容") {
            getPreTagContent();
          }
          if (type === "复制内容HTML") {
            getPreTagContentHtml();
          }
          if (type === "复制内容（第二版）") {
            copyChapterContent();
          }
          if (type === "复制内容HTML（第二版）") {
            copyChapterHtml();
          }
        }
      });
    });
  }
  function getPreTagContent() {
    copyContext(document.getElementsByTagName("pre")[0].innerText).then();
  }
  function getPreTagContentHtml() {
    copyContext(document.getElementsByTagName("pre")[0].innerHTML).then();
  }
  function copyChapterContent() {
    const preElement = document.getElementsByTagName("pre")[0];
    const brs = preElement.getElementsByTagName("br");
    if (brs) {
      for (let i = brs.length - 1; i >= 0; i--) {
        brs[i].remove();
      }
    }
    console.log(preElement);
    copyContext(preElement.innerText).then();
  }
  function copyChapterHtml() {
    const preElement = document.getElementsByTagName("pre")[0];
    const brs = preElement.getElementsByTagName("br");
    if (brs) {
      for (let i = brs.length - 1; i >= 0; i--) {
        brs[i].remove();
      }
    }
    console.log(preElement);
    copyContext(preElement.innerHTML).then();
  }

})();