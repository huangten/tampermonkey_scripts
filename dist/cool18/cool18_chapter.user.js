// ==UserScript==
// @name       cool18 章节页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-18.13:44:45
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=cool18.com
// @match      *://www.cool18.com/bbs4/index.php?app=forum&act=threadview&tid=*
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant      GM_addStyle
// @grant      GM_download
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
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var FileSaver_min$1 = { exports: {} };
  var FileSaver_min = FileSaver_min$1.exports;
  var hasRequiredFileSaver_min;
  function requireFileSaver_min() {
    if (hasRequiredFileSaver_min) return FileSaver_min$1.exports;
    hasRequiredFileSaver_min = 1;
    (function(module, exports$1) {
      (function(a, b) {
        b();
      })(FileSaver_min, function() {
        function b(a2, b2) {
          return "undefined" == typeof b2 ? b2 = { autoBom: false } : "object" != typeof b2 && (console.warn("Deprecated: Expected third argument to be a object"), b2 = { autoBom: !b2 }), b2.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a2.type) ? new Blob(["\uFEFF", a2], { type: a2.type }) : a2;
        }
        function c(a2, b2, c2) {
          var d2 = new XMLHttpRequest();
          d2.open("GET", a2), d2.responseType = "blob", d2.onload = function() {
            g(d2.response, b2, c2);
          }, d2.onerror = function() {
            console.error("could not download file");
          }, d2.send();
        }
        function d(a2) {
          var b2 = new XMLHttpRequest();
          b2.open("HEAD", a2, false);
          try {
            b2.send();
          } catch (a3) {
          }
          return 200 <= b2.status && 299 >= b2.status;
        }
        function e(a2) {
          try {
            a2.dispatchEvent(new MouseEvent("click"));
          } catch (c2) {
            var b2 = document.createEvent("MouseEvents");
            b2.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null), a2.dispatchEvent(b2);
          }
        }
        var f = "object" == typeof window && window.window === window ? window : "object" == typeof self && self.self === self ? self : "object" == typeof commonjsGlobal && commonjsGlobal.global === commonjsGlobal ? commonjsGlobal : void 0, a = f.navigator && /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent), g = f.saveAs || ("object" != typeof window || window !== f ? function() {
        } : "download" in HTMLAnchorElement.prototype && !a ? function(b2, g2, h) {
          var i = f.URL || f.webkitURL, j = document.createElement("a");
          g2 = g2 || b2.name || "download", j.download = g2, j.rel = "noopener", "string" == typeof b2 ? (j.href = b2, j.origin === location.origin ? e(j) : d(j.href) ? c(b2, g2, h) : e(j, j.target = "_blank")) : (j.href = i.createObjectURL(b2), setTimeout(function() {
            i.revokeObjectURL(j.href);
          }, 4e4), setTimeout(function() {
            e(j);
          }, 0));
        } : "msSaveOrOpenBlob" in navigator ? function(f2, g2, h) {
          if (g2 = g2 || f2.name || "download", "string" != typeof f2) navigator.msSaveOrOpenBlob(b(f2, h), g2);
          else if (d(f2)) c(f2, g2, h);
          else {
            var i = document.createElement("a");
            i.href = f2, i.target = "_blank", setTimeout(function() {
              e(i);
            });
          }
        } : function(b2, d2, e2, g2) {
          if (g2 = g2 || open("", "_blank"), g2 && (g2.document.title = g2.document.body.innerText = "downloading..."), "string" == typeof b2) return c(b2, d2, e2);
          var h = "application/octet-stream" === b2.type, i = /constructor/i.test(f.HTMLElement) || f.safari, j = /CriOS\/[\d]+/.test(navigator.userAgent);
          if ((j || h && i || a) && "undefined" != typeof FileReader) {
            var k = new FileReader();
            k.onloadend = function() {
              var a2 = k.result;
              a2 = j ? a2 : a2.replace(/^data:[^;]*;/, "data:attachment/file;"), g2 ? g2.location.href = a2 : location = a2, g2 = null;
            }, k.readAsDataURL(b2);
          } else {
            var l = f.URL || f.webkitURL, m = l.createObjectURL(b2);
            g2 ? g2.location = m : location.href = m, g2 = null, setTimeout(function() {
              l.revokeObjectURL(m);
            }, 4e4);
          }
        });
        f.saveAs = g.saveAs = g, module.exports = g;
      });
    })(FileSaver_min$1);
    return FileSaver_min$1.exports;
  }
  var FileSaver_minExports = requireFileSaver_min();
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
            icon: "layui-icon-success"
          },
          {
            type: "下载内容",
            icon: "layui-icon-download-circle"
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
            type: "下载内容（第二版）",
            icon: "layui-icon-download-circle"
          },
          {
            type: "复制内容HTML（第二版）",
            icon: "layui-icon-code-circle"
          }
        ],
        default: false,
        css: { bottom: "21%" },
        bgcolor: "#0000ff",
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
          if (type === "下载内容") {
            downloadChapterContent();
          }
          if (type === "复制内容HTML") {
            getPreTagContentHtml();
          }
          if (type === "复制内容（第二版）") {
            copyChapterContent();
          }
          if (type === "下载内容（第二版）") {
            downloadChapterContentV2();
          }
          if (type === "复制内容HTML（第二版）") {
            copyChapterHtml();
          }
        }
      });
    });
  }
  function getPreElement() {
    return document.getElementsByTagName("pre")[0];
  }
  function getPreTagContent() {
    copyContext(getPreElement().innerText).then();
  }
  function downloadChapterContent() {
    const titleElements = document.getElementsByClassName("main-title");
    const titleContent = titleElements[0].innerText.trim();
    const title = titleContent.replace(/^【(.*?)】/, "$1");
    const contents = getPreElement().innerText.split("\n").filter(Boolean).map((c) => `${c.trimEnd()}`);
    const content = title + "\n\n\n\n" + contents.join("\n") + "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n";
    saveContentToLocationTxtFile(title, content);
  }
  function getPreTagContentHtml() {
    copyContext(getPreElement().innerHTML).then();
  }
  function getPreElementV2() {
    const preElement = document.getElementsByTagName("pre")[0];
    const brs = preElement.getElementsByTagName("br");
    if (brs) {
      for (let i = brs.length - 1; i >= 0; i--) {
        brs[i].remove();
      }
    }
    return preElement;
  }
  function copyChapterContent() {
    copyContext(getPreElementV2().innerText.split("\n").filter(Boolean).join("\n")).then();
  }
  function downloadChapterContentV2() {
    const titleElements = document.getElementsByClassName("main-title");
    const titleContent = titleElements[0].innerText.trim();
    const title = titleContent.replace(/^【(.*?)】/, "$1");
    const contents = getPreElementV2().innerText.split("\n").filter(Boolean).map((c) => `${c.trimEnd()}`);
    const content = title + "\n\n\n\n" + contents.join("\n") + "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n";
    saveContentToLocationTxtFile(title, content);
  }
  function copyChapterHtml() {
    copyContext(getPreElementV2().innerHTML).then();
  }
  function saveContentToLocationTxtFile(filename, content) {
    try {
      const isFileSaverSupported = !!new Blob();
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      FileSaver_minExports.saveAs(blob, filename + ".txt");
    } catch (e) {
      console.log(e);
      return false;
    }
    return true;
  }

})();