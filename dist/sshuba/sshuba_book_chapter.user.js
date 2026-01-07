// ==UserScript==
// @name       sshuba 章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-1-8.02
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=sshuba.com
// @match      *://sshuba.com/books/*
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
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  init().then(() => {
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
          }
        ],
        default: false,
        css: { bottom: "21%" },
        margin: 0,
        click: function(type) {
          if (type === "CopyContent") {
            copyPreTagContent();
          }
          if (type === "CopyContentHtml") {
            copyPreTagContentHtml();
          }
        }
      });
    });
  }
  function copyPreTagContent() {
    copyContext(_unsafeWindow.document.getElementsByClassName("page-content")[0].innerText).then();
  }
  function copyPreTagContentHtml() {
    copyContext(_unsafeWindow.document.getElementsByClassName("page-content")[0].innerHTML).then();
  }

})();