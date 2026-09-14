// ==UserScript==
// @name       cool18 增强
// @namespace  https://tampermonkey.net/
// @version    2026-09-14.21:00:08
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=cool18.com
// @match      *://*.cool18.com/*
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant      GM_addStyle
// @grant      GM_download
// @grant      GM_getResourceText
// @grant      GM_notification
// @grant      unsafeWindow
// @noframes
// ==/UserScript==

(function() {
	"use strict";
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
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
			} else return resolve();
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
			} else return resolve();
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
		return Promise.all([addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"), addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")]);
	}
	var import_FileSaver_min = __commonJSMin(((exports, module) => {
		(function(a, b) {
			if ("function" == typeof define && define.amd) define([], b);
			else if ("undefined" != typeof exports) b();
			else b(), a.FileSaver = { exports: {} }.exports;
		})(exports, function() {
			"use strict";
			function b(a, b) {
				return "undefined" == typeof b ? b = { autoBom: !1 } : "object" != typeof b && (console.warn("Deprecated: Expected third argument to be a object"), b = { autoBom: !b }), b.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type) ? new Blob(["﻿", a], { type: a.type }) : a;
			}
			function c(a, b, c) {
				var d = new XMLHttpRequest();
				d.open("GET", a), d.responseType = "blob", d.onload = function() {
					g(d.response, b, c);
				}, d.onerror = function() {
					console.error("could not download file");
				}, d.send();
			}
			function d(a) {
				var b = new XMLHttpRequest();
				b.open("HEAD", a, !1);
				try {
					b.send();
				} catch (a) {}
				return 200 <= b.status && 299 >= b.status;
			}
			function e(a) {
				try {
					a.dispatchEvent(new MouseEvent("click"));
				} catch (c) {
					var b = document.createEvent("MouseEvents");
					b.initMouseEvent("click", !0, !0, window, 0, 0, 0, 80, 20, !1, !1, !1, !1, 0, null), a.dispatchEvent(b);
				}
			}
			var f = "object" == typeof window && window.window === window ? window : "object" == typeof self && self.self === self ? self : "object" == typeof global && global.global === global ? global : void 0, a = f.navigator && /Macintosh/.test(navigator.userAgent) && /AppleWebKit/.test(navigator.userAgent) && !/Safari/.test(navigator.userAgent), g = f.saveAs || ("object" != typeof window || window !== f ? function() {} : "download" in HTMLAnchorElement.prototype && !a ? function(b, g, h) {
				var i = f.URL || f.webkitURL, j = document.createElement("a");
				g = g || b.name || "download", j.download = g, j.rel = "noopener", "string" == typeof b ? (j.href = b, j.origin === location.origin ? e(j) : d(j.href) ? c(b, g, h) : e(j, j.target = "_blank")) : (j.href = i.createObjectURL(b), setTimeout(function() {
					i.revokeObjectURL(j.href);
				}, 4e4), setTimeout(function() {
					e(j);
				}, 0));
			} : "msSaveOrOpenBlob" in navigator ? function(f, g, h) {
				if (g = g || f.name || "download", "string" != typeof f) navigator.msSaveOrOpenBlob(b(f, h), g);
				else if (d(f)) c(f, g, h);
				else {
					var i = document.createElement("a");
					i.href = f, i.target = "_blank", setTimeout(function() {
						e(i);
					});
				}
			} : function(b, d, e, g) {
				if (g = g || open("", "_blank"), g && (g.document.title = g.document.body.innerText = "downloading..."), "string" == typeof b) return c(b, d, e);
				var h = "application/octet-stream" === b.type, i = /constructor/i.test(f.HTMLElement) || f.safari, j = /CriOS\/[\d]+/.test(navigator.userAgent);
				if ((j || h && i || a) && "undefined" != typeof FileReader) {
					var k = new FileReader();
					k.onloadend = function() {
						var a = k.result;
						a = j ? a : a.replace(/^data:[^;]*;/, "data:attachment/file;"), g ? g.location.href = a : location = a, g = null;
					}, k.readAsDataURL(b);
				} else {
					var l = f.URL || f.webkitURL, m = l.createObjectURL(b);
					g ? g.location = m : location.href = m, g = null, setTimeout(function() {
						l.revokeObjectURL(m);
					}, 4e4);
				}
			});
			f.saveAs = g.saveAs = g, "undefined" != typeof module && (module.exports = g);
		});
	}))();
	var ChapterController = class {
		constructor(doc = document) {
			this.doc = doc;
		}
		run() {
			const self = this;
			layui.use(function() {
				layui.util.fixbar({
					bars: [
						{
							type: "复制书名",
							icon: "layui-icon-auz"
						},
						{
							type: "复制内容",
							icon: "layui-icon-success"
						},
						{
							type: "原样下载",
							icon: "layui-icon-download-circle"
						},
						{
							type: "添加空白符下载",
							icon: "layui-icon-release"
						},
						{
							type: "复制内容HTML",
							icon: "layui-icon-fonts-code"
						},
						{
							type: "调整排版并复制",
							icon: "layui-icon-spread-left"
						}
					],
					default: false,
					css: { bottom: "21%" },
					bgcolor: "#ad2fec",
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
						if (type === "复制书名") self.getBookname();
						if (type === "复制内容") self.getPreTagContent();
						if (type === "原样下载") self.downloadChapterContent();
						if (type === "添加空白符下载") self.downloadChapterContent("blank");
						if (type === "复制内容HTML") self.getPreTagContentHtml();
						if (type === "调整排版并复制") self.copyChapterContent();
					}
				});
			});
		}
		getPreElement() {
			return this.doc.getElementsByTagName("pre")[0];
		}
		getPreTagContent() {
			copyContext(this.getPreElement().innerText).then();
		}
		getBookname() {
			const titleContent = this.doc.getElementsByClassName("main-title")[0].innerText.trim();
			let bookName = titleContent.match(/^【(.*?)】/);
			if (!bookName) bookName = titleContent;
			else bookName = bookName[1];
			copyContext(bookName).then();
			return bookName;
		}
		downloadChapterContent(tag) {
			let title = this.doc.getElementsByClassName("main-title")[0].innerText.trim().replace(/^【(.*?)】/, "$1");
			const prentTitleElements = this.doc.getElementsByClassName("reply-info");
			if (prentTitleElements.length > 0) try {
				const pTitle = prentTitleElements[0].getElementsByTagName("a")[0].innerText.trim().replace(/^【(.*?)】/, "$1");
				title = title + `

回复于：${pTitle}`;
			} catch (e) {
				console.log(e);
			}
			const content = title + "\n\n" + this.getChapterContent(tag) + "\n\n\n\n\n\n\n";
			this.saveContentToLocationTxtFile(title, content);
		}
		getChapterContent(tag = "") {
			return this.getPreElement().innerText.split("\n").filter(Boolean).map((c) => {
				c = c.trimEnd();
				if (tag === "blank") {
					c = c.replace(/^[ \t\r\n\f\v]+|[ \t\r\n\f\v]+$/g, "");
					c = `　　${c}`;
				}
				return c;
			}).join("\n");
		}
		getPreTagContentHtml() {
			copyContext(this.getPreElement().innerHTML).then();
		}
		getPreElementV2() {
			const preElement = this.getPreElement();
			const brs = preElement.getElementsByTagName("br");
			if (brs) for (let i = brs.length - 1; i >= 0; i--) brs[i].remove();
			return preElement;
		}
		copyChapterContent() {
			copyContext(this.getPreElementV2().innerText.split("\n").filter(Boolean).join("\n")).then();
		}
		saveContentToLocationTxtFile(filename, content) {
			try {
				new Blob();
				const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
				(0, import_FileSaver_min.saveAs)(blob, filename + ".txt");
			} catch (e) {
				console.log(e);
				return false;
			}
			return true;
		}
	};
	(function main() {
		const url = new URL(document.URL);
		console.log(url);
		if (url.searchParams.get("act") && url.pathname === "/bbs4/index.php" && url.searchParams.get("act") === "threadview") init().then(() => {
			new ChapterController(document).run();
		});
	})();
})();
