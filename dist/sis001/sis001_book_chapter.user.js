// ==UserScript==
// @name       sis001 章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-12.00:10:40
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=sis001.com
// @match      *://*.sis001.com/forum/thread-*-1-1.html
// @match      *://*.sis001.com/bbs/viewthread.php?tid=*
// @match      *://*.sis001.com/bbs/thread-*-1-1.html
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
  var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
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
          }



],
        margin: 0,
        default: false,
        bgcolor: "#64822a",
        css: { bottom: "20%" },
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
            getContent();
          }
          if (type === "复制内容HTML") {
            getContentHtml();
          }
          if (type === "复制内容（第二版）") {
            getContentV2();
          }
          if (type === "复制内容HTML（第二版）") {
            getContentHtmlV2();
          }
        }
      });
    });
  }
  function getElement(uw) {
    let e = uw.document.getElementsByClassName("postcontent")[0].getElementsByClassName("postmessage")[0];
    let e1 = e.cloneNode(true);
    let fieldset = e1.getElementsByTagName("fieldset")[0];
    let table = e1.getElementsByTagName("table")[0];
    const allDescendants = e1.querySelectorAll("*");
    allDescendants.forEach((element) => {
      if (element === fieldset) {
        element.remove();
      }
      if (element === table) {
        element.remove();
      }
      if (element.tagName === "A") {
        element.remove();
      }
    });
    return e1;
  }
  function getContent(uw = _unsafeWindow) {
    copyContext(getElement(uw).innerText).then();
  }
  function getContentHtml(uw = _unsafeWindow) {
    copyContext(getElement(uw).innerHTML).then();
  }
  function getContentV2(uw = _unsafeWindow) {
    const text = getElement(uw).innerText.replaceAll("\n", "").replaceAll("	", "\n").replaceAll("　　", "\n　　").split("\n").filter(Boolean).join("\n");
    copyContext(text).then();
  }
  function getContentHtmlV2(uw = _unsafeWindow) {
    const html = getElement(uw).innerHTML;
    copyContext(html).then();
  }

})();