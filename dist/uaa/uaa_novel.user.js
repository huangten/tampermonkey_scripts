// ==UserScript==
// @name       UAA 小说 增强
// @namespace  https://tampermonkey.net/
// @version    2026-09-15.12:26:23
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @match      https://*.uaa.com/novel/*
// @require    https://unpkg.com/dexie/dist/dexie.js
// @require    https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @connect    githubusercontent.com
// @connect    uameta.ai
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

(function(file_saver, jszip) {
	"use strict";
	var __create$1 = Object.create;
	var __defProp$1 = Object.defineProperty;
	var __getOwnPropDesc$1 = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames$1 = Object.getOwnPropertyNames;
	var __getProtoOf$1 = Object.getPrototypeOf;
	var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
	var __copyProps$1 = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames$1(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp$1.call(to, key) && key !== except) __defProp$1(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc$1(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM$1 = (mod, isNodeMode, target) => (target = mod != null ? __create$1(__getProtoOf$1(mod)) : {}, __copyProps$1(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp$1.call(mod, "default") ? __defProp$1(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	jszip = __toESM$1(jszip);
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
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
	var INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g;
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
	function sleep(ms) {
		let done = false;
		let t;
		return new Promise((resolve) => {
			t = setTimeout(() => {
				if (done) return;
				done = true;
				resolve();
			}, ms);
		}).finally(() => {
			if (!done) {
				clearTimeout(t);
				done = true;
			}
		});
	}
	function waitForElement(doc, selector, timeout = 1e4) {
		return new Promise((resolve) => {
			const interval = 100;
			let elapsed = 0;
			const checker = setInterval(() => {
				if (doc.querySelector(selector) || elapsed >= timeout) {
					clearInterval(checker);
					resolve();
				}
				elapsed += interval;
			}, interval);
		});
	}
	function init() {
		return Promise.all([addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"), addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")]);
	}
	async function destroyIframeElementAsync(iframe) {
		if (iframe && iframe instanceof HTMLIFrameElement) {
			try {
				iframe.onload = null;
				iframe.onerror = null;
				iframe.contentDocument.write("");
				iframe.contentDocument.close();
				iframe.src = "about:blank";
				await sleep(50);
				iframe.remove();
				iframe = null;
				await sleep(50);
			} catch (e) {
				iframe = null;
				console.error("清空 iframe 失败", e);
			}
			console.log("✅ iframe 已完全清理并销毁");
		}
	}
	function HackTimer() {
		var worker, fakeIdToCallback = {}, lastFakeId = 0, maxFakeId = 2147483647, logPrefix = "HackTimer.js by turuslan: ";
		if (typeof Worker !== "undefined") {
			function getFakeId() {
				do
					if (lastFakeId == maxFakeId) lastFakeId = 0;
					else lastFakeId++;
				while (fakeIdToCallback.hasOwnProperty(lastFakeId));
				return lastFakeId;
			}
			try {
				const blob = new Blob([`
var fakeIdToId = {};
onmessage = function (event) {
	var data = event.data,
		name = data.name,
		fakeId = data.fakeId,
		time;
	if(data.hasOwnProperty('time')) {
		time = data.time;
	}
	switch (name) {
		case 'setInterval':
			fakeIdToId[fakeId] = setInterval(function () {
				postMessage({fakeId: fakeId});
			}, time);
			break;
		case 'clearInterval':
			if (fakeIdToId.hasOwnProperty (fakeId)) {
				clearInterval(fakeIdToId[fakeId]);
				delete fakeIdToId[fakeId];
			}
			break;
		case 'setTimeout':
			fakeIdToId[fakeId] = setTimeout(function () {
				postMessage({fakeId: fakeId});
				if (fakeIdToId.hasOwnProperty (fakeId)) {
					delete fakeIdToId[fakeId];
				}
			}, time);
			break;
		case 'clearTimeout':
			if (fakeIdToId.hasOwnProperty (fakeId)) {
				clearTimeout(fakeIdToId[fakeId]);
				delete fakeIdToId[fakeId];
			}
			break;
	}
}`], { type: "application/javascript" });
				worker = new Worker(URL.createObjectURL(blob));
				window.setInterval = function(callback, time) {
					var fakeId = getFakeId();
					fakeIdToCallback[fakeId] = {
						callback,
						parameters: Array.prototype.slice.call(arguments, 2)
					};
					worker.postMessage({
						name: "setInterval",
						fakeId,
						time
					});
					return fakeId;
				};
				window.clearInterval = function(fakeId) {
					if (fakeIdToCallback.hasOwnProperty(fakeId)) {
						delete fakeIdToCallback[fakeId];
						worker.postMessage({
							name: "clearInterval",
							fakeId
						});
					}
				};
				window.setTimeout = function(callback, time) {
					var fakeId = getFakeId();
					fakeIdToCallback[fakeId] = {
						callback,
						parameters: Array.prototype.slice.call(arguments, 2),
						isTimeout: true
					};
					worker.postMessage({
						name: "setTimeout",
						fakeId,
						time
					});
					return fakeId;
				};
				window.clearTimeout = function(fakeId) {
					if (fakeIdToCallback.hasOwnProperty(fakeId)) {
						delete fakeIdToCallback[fakeId];
						worker.postMessage({
							name: "clearTimeout",
							fakeId
						});
					}
				};
				worker.onmessage = function(event) {
					var fakeId = event.data.fakeId, request, parameters, callback;
					if (fakeIdToCallback.hasOwnProperty(fakeId)) {
						request = fakeIdToCallback[fakeId];
						callback = request.callback;
						parameters = request.parameters;
						if (request.hasOwnProperty("isTimeout") && request.isTimeout) delete fakeIdToCallback[fakeId];
					}
					if (typeof callback === "string") try {
						callback = new Function(callback);
					} catch (error) {
						console.log(logPrefix + "Error parsing callback code string: ", error);
					}
					if (typeof callback === "function") callback.apply(window, parameters);
				};
				worker.onerror = function(event) {
					console.log(event);
				};
			} catch (error) {
				console.log(logPrefix + "Initialisation failed");
				console.error(error);
			}
		} else console.log(logPrefix + "Initialisation failed - HTML5 Web Worker is not supported");
	}
	var ChapterPageModel = class {
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
			if (!this.doc.getElementsByClassName("reader-top")[0]) return null;
			this.doc.getElementById("readerBook")?.click();
		}
		getNextChapterElement() {
			return this.getBottomBoxElement("next");
		}
		getBottomBoxElement(index) {
			const bottomBox = this.doc.getElementsByClassName("reader-bottom")[0];
			if (!bottomBox) return null;
			const buttons = bottomBox.getElementsByTagName("button");
			for (const button of buttons) if (button.getAttribute("data-reader-action") === index) return button?.click();
			return null;
		}
		saveContentToLocal() {
			try {
				const title = this.getChapterTitleText();
				const bookName = this.getBookName();
				const authorInfo = "作者：" + this.getAuthorInfo();
				const texts = this.getTexts().map((s) => `　　${s}`).join("\n");
				const htmlLines = this.getLines().join("\n");
				const content = [
					"book name:\n" + bookName,
					"author:\n" + authorInfo,
					"title:\n" + title,
					"text:\n" + texts,
					"html:\n" + htmlLines
				].join("\n\n=============================================\n");
				try {
					new Blob();
					(0, file_saver.saveAs)(new Blob([content], { type: "text/plain;charset=utf-8" }), [
						bookName,
						authorInfo,
						title
					].join(" ") + ".txt");
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
			return cleanText((titleBox.getElementsByClassName("reader-vol")[0] !== void 0 ? titleBox.getElementsByClassName("reader-vol")[0].innerText + " " : "") + (titleBox.getElementsByTagName("h1")[0] !== void 0 ? titleBox.getElementsByTagName("h1")[0].innerText : ""));
		}
		getChapterLines() {
			const contentBox = this.doc.getElementsByClassName("reader-content")[0];
			if (!contentBox) return [];
			const contentBody = contentBox.getElementsByClassName("reader-body")[0];
			if (!contentBody) return [];
			let lines = contentBody.getElementsByTagName("p");
			return Array.from(lines);
		}
		getTexts() {
			const lines = this.getChapterLines();
			let texts = [];
			for (let i = 0; i < lines.length; i++) {
				let elements = lines[i].getElementsByTagName("button");
				if (elements.length > 0) for (let j = elements.length - 1; j >= 0; j--) elements[j].parentNode.removeChild(elements[j]);
				let imgElement = lines[i].getElementsByTagName("img");
				if (imgElement.length > 0) for (let j = 0; j < imgElement.length; j++) texts.push(`【image_src】: ${imgElement[j].src},${getFileNameFromPath(imgElement[j].src)}`);
				if (lines[i].innerText.indexOf("UAA地址发布页") > -1) continue;
				let t = cleanText(lines[i].innerText.trim());
				if (t.length === 0) continue;
				texts.push(t);
			}
			return texts;
		}
		getLines() {
			let lines = this.getChapterLines();
			let htmlLines = [];
			for (let i = 0; i < lines.length; i++) {
				let elements = lines[i].getElementsByTagName("button");
				if (elements.length > 0) for (let j = elements.length - 1; j >= 0; j--) elements[j].parentNode.removeChild(elements[j]);
				let imgElement = lines[i].getElementsByTagName("img");
				if (imgElement.length > 0) for (let j = 0; j < imgElement.length; j++) htmlLines.push(`<img alt="${imgElement[j].src}" src="../Images/${getFileNameFromPath(imgElement[j].src)}"/>`);
				if (lines[i].innerText.indexOf("UAA地址发布页") > -1) continue;
				let t = cleanText(lines[i].innerText.trim());
				if (t.length === 0) continue;
				htmlLines.push(`<p>${t}</p>`);
			}
			return htmlLines;
		}
		getBookName() {
			return cleanText(this.doc.getElementById("readerBook")?.innerText.trim());
		}
		getAuthorInfo() {
			const metaBox = this.doc.getElementsByClassName("reader-meta")[0];
			if (!metaBox) return "";
			const authorMatch = metaBox.innerHTML.trim().match(/(.*?) 著 ·/);
			if (authorMatch && authorMatch[1]) return cleanText(authorMatch[1].trim());
			return "";
		}
	};
	var ChapterFixbarView = class {
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
	};
	var ChapterController = class {
		constructor({ model = new ChapterPageModel(), view = new ChapterFixbarView() } = {}) {
			this.model = model;
			this.view = view;
		}
		init() {
			this.model.load();
			this.view.renderFixbar({ onAction: (type) => this.handleAction(type) });
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
				case "下一章": this.model.getNextChapterElement();
			}
		}
		copy(content) {
			copyContext(content).then();
		}
	};
	var Downloader = class {
		constructor() {
			this.queue = [];
			this.running = false;
			this.downloaded = [];
			this.failed = [];
			this.pendingSet = new Set();
			this.doneSet = new Set();
			this.failedSet = new Set();
			this.config = {
				interval: 2e3,
				onTaskBefore: () => {},
				onTaskComplete: () => {},
				onFinish: () => {},
				onCatch: (err) => {},
				downloadHandler: null,
				retryFailed: false,
				uniqueKey: (task) => task?.href
			};
		}
		setConfig(options = {}) {
			this.config = {
				...this.config,
				...options
			};
		}
		add(task) {
			const key = this.config.uniqueKey(task);
			if (!key) return false;
			if (this.pendingSet.has(key)) return false;
			if (this.doneSet.has(key)) return false;
			if (this.failedSet.has(key) && !this.config.retryFailed) return false;
			task.startTime = new Date();
			this.queue.push(task);
			this.pendingSet.add(key);
			return true;
		}
		clear() {
			this.queue = [];
			this.pendingSet.clear();
		}
		async start() {
			if (this.running) return;
			if (typeof this.config.downloadHandler !== "function") throw new Error("请先通过 setConfig 设置 downloadHandler 回调");
			this.running = true;
			while (this.failed.length > 0) this.queue.unshift(this.failed.shift());
			while (this.queue.length > 0) {
				const task = this.queue.shift();
				const key = this.config.uniqueKey(task);
				try {
					this.config.onTaskBefore(task);
					const success = await this.config.downloadHandler(task);
					task.endTime = new Date();
					this.pendingSet.delete(key);
					if (success) {
						this.downloaded.push(task);
						this.doneSet.add(key);
					} else {
						this.failed.push(task);
						this.failedSet.add(key);
					}
					this.config.onTaskComplete(task, success);
				} catch (err) {
					task.endTime = new Date();
					this.pendingSet.delete(key);
					this.failed.push(task);
					this.failedSet.add(key);
					this.config.onTaskComplete(task, false);
					this.running = false;
					this.config.onCatch(err);
					return;
				}
				if (this.queue.length > 0) await sleep(this.config.interval);
			}
			this.running = false;
			this.config.onFinish(this.downloaded, this.failed);
		}
	};
	var _GM_openInTab = (() => typeof GM_openInTab != "undefined" ? GM_openInTab : void 0)();
	var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
	var CommonRes = class CommonRes {
		constructor() {
			if (CommonRes.instance) return CommonRes.instance;
			CommonRes.instance = this;
			this.logoImg = null;
			this.girlImg = null;
			this.line1Img = null;
			this.mainCss = null;
			this.fontsCss = null;
		}
		static getInstance() {
			if (!CommonRes.instance) CommonRes.instance = new CommonRes();
			return CommonRes.instance;
		}
		async gmFetchCoverImageBlob(url) {
			return new Promise((resolve, reject) => {
				_GM_xmlhttpRequest({
					method: "GET",
					url,
					responseType: "blob",
					headers: { Referer: "https://www.uaa.com/" },
					onload: (res) => {
						if (res.status === 200) resolve(res.response);
						else reject(new Error("HTTP CODE " + res.status));
					},
					onerror: (err) => reject(err)
				});
			});
		}
		async gmFetchImageBlob(url) {
			return new Promise((resolve, reject) => {
				_GM_xmlhttpRequest({
					method: "GET",
					url,
					responseType: "blob",
					onload: (res) => {
						if (res.status === 200) resolve(res.response);
						else reject(new Error("HTTP CODE " + res.status));
					},
					onerror: (err) => reject(err)
				});
			});
		}
		async gmFetchText(url) {
			return new Promise((resolve, reject) => {
				_GM_xmlhttpRequest({
					method: "GET",
					url,
					responseType: "arraybuffer",
					onload: (res) => {
						if (res.status !== 200) reject(new Error(`HTTP CODE ${res.status}`));
						else resolve(res.response);
					},
					onerror: (err) => reject(err)
				});
			});
		}
		async getLogoImg() {
			if (this.logoImg === null) this.logoImg = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp");
			return this.logoImg;
		}
		async getGirlImg() {
			if (this.girlImg === null) this.girlImg = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg");
			return this.girlImg;
		}
		async getLine1Img() {
			if (this.line1Img === null) this.line1Img = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/line1.webp");
			return this.line1Img;
		}
		async getMainCss() {
			if (this.mainCss === null) this.mainCss = await this.gmFetchText("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/main.css");
			return this.mainCss;
		}
		async getFontsCss() {
			if (this.fontsCss === null) this.fontsCss = await this.gmFetchText("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/fonts.css");
			return this.fontsCss;
		}
	};
	var ChapterCatalogModel = class {
		constructor(doc = document, location = document.location) {
			this.doc = doc;
			this.location = location;
		}
		getBookName() {
			const bookName = this.doc.getElementsByTagName("h1")[0]?.cloneNode(true);
			const spans = bookName?.getElementsByTagName("span");
			if (spans) for (const span of spans) span.remove();
			return cleanText(bookName?.innerText.trim() ?? "");
		}
		getBookId() {
			return new URL(this.location.href).searchParams.get("id") ?? "";
		}
		getAuthor() {
			return this.doc.getElementsByClassName("nd-author")[0]?.getElementsByTagName("a")[0]?.innerText.trim() ?? "";
		}
		getLatestChapter() {
			return this.doc.getElementsByClassName("nd-latest")[0]?.getElementsByTagName("b")[0]?.innerText.trim() ?? "";
		}
		getScore() {
			return this.doc.getElementsByClassName("nd-score")[0]?.getElementsByTagName("b")[0]?.innerText.trim() ?? "";
		}
		getType() {
			return "";
		}
		getRou() {
			return "";
		}
		getTags() {
			const tagsBox = this.doc.getElementById("ndTags").cloneNode(true);
			const tags = [];
			if (tagsBox) {
				const tagElements = tagsBox.getElementsByTagName("a");
				for (const tagElement of tagElements) {
					tagElement.getElementsByTagName("em")[0]?.remove();
					tags.push(tagElement.innerText.trim());
				}
			}
			return tags.join(", ");
		}
		getIntro() {
			return this.doc.getElementsByClassName("nd-synopsis")[0]?.innerText.replaceAll("小说简介：", "").replaceAll("\n", "").trim() ?? "";
		}
		getCover() {
			return (this.doc.getElementsByClassName("nd-cover")[0]?.getElementsByTagName("img")[0])?.src ?? "";
		}
		getChapterListTree() {
			return this.getMenuTree(this.doc, this.getBookName(), this.getBookId());
		}
		getMenuTree(doc, bookName, bookId) {
			let menus = [];
			const lis = doc.querySelectorAll("#ndcBody > *");
			for (let index = 0; index < lis.length; index++) {
				if (lis[index].nodeName.indexOf("A") > -1) {
					let id = (index + 1) * 1e8;
					let chapterName = cleanText(lis[index].getAttribute("title").trim());
					let chapterHref = lis[index].href;
					menus.push({
						"id": id,
						"title": chapterName,
						"href": chapterHref,
						"children": [],
						"spread": true,
						"field": "",
						"checked": chapterName.indexOf("new") > 0,
						bookName,
						bookId,
						volumeName: ""
					});
				}
				if (lis[index].nodeName.indexOf("DIV") > -1) {
					let vol = lis[index].getElementsByTagName("button")[0];
					if (!vol) continue;
					let volTitle = vol.getElementsByClassName("ndc-vol__t")[0];
					if (!volTitle) continue;
					let volName = cleanText(volTitle.innerText.trim());
					let volBody = lis[index].getElementsByClassName("ndc-vol__body")[0];
					if (!volBody) continue;
					let volList = volBody.getElementsByClassName("ndc-list")[0];
					if (!volList) continue;
					let menulist = volList.getElementsByTagName("a");
					let children = [];
					for (let j = 0; j < menulist.length; j++) {
						let id = (index + 1) * 1e8 + j + 1;
						let chapterName = cleanText(menulist[j].getAttribute("title").trim());
						let chapterHref = menulist[j].href;
						children.push({
							"id": id,
							"title": chapterName,
							"href": chapterHref,
							"children": [],
							"spread": true,
							"field": "",
							"checked": menulist[j].innerText.indexOf("new") > 0,
							bookName,
							bookId,
							volumeName: volName
						});
					}
					menus.push({
						"id": (index + 1) * 1e8,
						"title": volName,
						"href": "",
						"children": children,
						"spread": true,
						"field": "",
						bookName,
						bookId,
						volumeName: volName
					});
				}
			}
			return menus;
		}
		toChapterList(trees) {
			const menus = [];
			for (let index = 0; index < trees.length; index++) if (trees[index].children.length === 0) menus.push({
				chapterId: trees[index].id,
				chapterName: trees[index].title,
				href: trees[index].href,
				bookName: trees[index].bookName,
				bookId: trees[index].bookId,
				volumeName: trees[index].volumeName ?? ""
			});
			else for (let j = 0; j < trees[index].children.length; j++) {
				const preName = trees[index].title + " ";
				menus.push({
					chapterId: trees[index].children[j].id,
					chapterName: preName + trees[index].children[j].title,
					href: trees[index].children[j].href,
					bookName: trees[index].children[j].bookName,
					bookId: trees[index].children[j].bookId,
					volumeName: trees[index].title
				});
			}
			return menus;
		}
	};
	function fetchBookIntro(url) {
		return fetch(url).then((response) => {
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			return response.text();
		}).then((htmlString) => {
			return new DOMParser().parseFromString(htmlString, "text/html");
		});
	}
	async function buildEpub(url, options = {}) {
		const zip = new jszip.default();
		let doc = null;
		if (typeof url === "string") doc = await fetchBookIntro(url).catch((e) => {
			throw new Error(e);
		});
		else if (url?.nodeType === Node.DOCUMENT_NODE) doc = url;
		const chapterCatalogModel = new ChapterCatalogModel(doc);
		let bookName = escapeHtml(cleanText(chapterCatalogModel.getBookName()));
		let author = chapterCatalogModel.getAuthor();
		author = escapeHtml(cleanText(author));
		author = author.replace(/\s+/g, " ");
		let type = chapterCatalogModel.getType();
		let tags = chapterCatalogModel.getTags();
		let rou = chapterCatalogModel.getRou();
		let score = chapterCatalogModel.getScore();
		let lastUpdateTime = chapterCatalogModel.getLatestChapter();
		let intro = chapterCatalogModel.getIntro();
		let chapters = chapterCatalogModel.getChapterListTree();
		if (typeof options.onIntroParsed === "function") await options.onIntroParsed({
			url,
			doc,
			chapters
		});
		zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
		zip.folder("META-INF").file("container.xml", createContainer());
		const o = zip.folder("OEBPS");
		const cssFolder = o.folder("Styles");
		const imgFolder = o.folder("Images");
		let coverUrl = chapterCatalogModel.getCover();
		const coverImagePromise = CommonRes.getInstance().gmFetchCoverImageBlob(coverUrl);
		await Promise.all([
			CommonRes.getInstance().getMainCss().then((css) => cssFolder.file("main.css", css)),
			CommonRes.getInstance().getFontsCss().then((css) => cssFolder.file("fonts.css", css)),
			coverImagePromise.then((img) => imgFolder.file("cover.jpg", img)),
			CommonRes.getInstance().getLogoImg().then((img) => imgFolder.file("logo.webp", img)),
			CommonRes.getInstance().getLine1Img().then((img) => imgFolder.file("line1.webp", img)),
			CommonRes.getInstance().getGirlImg().then((img) => imgFolder.file("girl.jpg", img))
		]);
		if (Object.hasOwn(options, "SaveCover") && options.SaveCover === true) {
			const coverImage = await coverImagePromise;
			console.log("coverImage.type:", coverImage.type);
			if (coverImage.type === "application/octet-stream") {
				const coverFileName = decodeURIComponent(new URL(coverUrl).pathname.split("/").pop());
				(0, file_saver.saveAs)(coverImage, coverFileName);
			}
		}
		const manifest = [], spine = [], ncxNav = [];
		const textFolder = o.folder("Text");
		textFolder.file(`cover.xhtml`, genCoverHtmlPageV2());
		manifest.push(`<item id="cover.xhtml" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>`);
		spine.push(`<itemref idref="cover.xhtml"  properties="duokan-page-fullscreen"/>`);
		ncxNav.push(`<navPoint id="cover.xhtml" playOrder="10000">
    <navLabel><text>封面</text></navLabel>
    <content src="Text/cover.xhtml"/>
</navPoint>`);
		textFolder.file(`fy.xhtml`, genFyHtmlPage({
			name: bookName,
			author
		}));
		manifest.push(`<item id="fy.xhtml" href="Text/fy.xhtml" media-type="application/xhtml+xml"/>`);
		spine.push(`<itemref idref="fy.xhtml"/>`);
		ncxNav.push(`<navPoint id="fy.xhtml" playOrder="10001">
    <navLabel><text>扉页</text></navLabel>
    <content src="Text/fy.xhtml"/>
</navPoint>`);
		textFolder.file(`intro.xhtml`, genIntroHtmlPage({
			bookName,
			author,
			type,
			tags,
			rou,
			score,
			lastUpdateTime,
			intro
		}));
		manifest.push(`<item id="intro.xhtml" href="Text/intro.xhtml" media-type="application/xhtml+xml"/>`);
		spine.push(`<itemref idref="intro.xhtml"/>`);
		ncxNav.push(`<navPoint id="intro.xhtml" playOrder="10002">
    <navLabel><text>内容简介</text></navLabel>
    <content src="Text/intro.xhtml"/>
</navPoint>`);
		chapters.forEach((c, i) => {
			let volumeIndex = 0;
			const id = `vol_${String(i + 1).padStart(4, "0")}`;
			manifest.push(`<item id="${id}" href="Text/${id}.xhtml" media-type="application/xhtml+xml"/>`);
			spine.push(`<itemref idref="${id}"/>`);
			if (c.children.length === 0) {
				textFolder.file(`${id}.xhtml`, genHtmlPage(c.title));
				ncxNav.push(`<navPoint id="${id}" playOrder="${i + 1}">
    <navLabel><text>${escapeHtml(cleanText(c.title))}</text></navLabel>
    <content src="Text/${id}.xhtml"/>
</navPoint>`);
			} else {
				++volumeIndex;
				textFolder.file(`${id}.xhtml`, genVolumeHtmlPage(c.title, volumeIndex));
				let volumeNcxNav = `<navPoint id="${id}" playOrder="${i + 1}">
    <navLabel><text>${c.title}</text></navLabel>
    <content src="Text/${id}.xhtml"/>`;
				c.children.forEach((d, j) => {
					const did = `vol_${String(i + 1).padStart(4, "0")}_${String(j + 1).padStart(4, "0")}`;
					manifest.push(`<item id="${did}" href="Text/${did}.xhtml" media-type="application/xhtml+xml"/>`);
					spine.push(`<itemref idref="${did}"/>`);
					textFolder.file(`${did}.xhtml`, genHtmlPage(escapeHtml(cleanText(d.title))));
					let ncxNav = `
 <navPoint id="${did}" playOrder="${i + 1}">
    <navLabel><text>${escapeHtml(cleanText(d.title))}</text></navLabel>
    <content src="Text/${did}.xhtml"/>
</navPoint>
                        `;
					volumeNcxNav += `\n${ncxNav}`;
				});
				volumeNcxNav += `</navPoint>`;
				ncxNav.push(volumeNcxNav);
			}
		});
		let contentOpfStr = `<?xml version="1.0"?>
<package version="2.0" unique-identifier="duokan-book-id" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <metadata xmlns:opf="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:identifier id="duokan-book-id" opf:scheme="UUID" xmlns:opf="http://www.idpf.org/2007/opf">${crypto.randomUUID()}</dc:identifier>
      <dc:title>${bookName}</dc:title>
      <dc:language>zh-CN</dc:language>
      <dc:creator opf:role="aut" opf:file-as="${author}, " xmlns:opf="http://www.idpf.org/2007/opf">${author}</dc:creator>
      <dc:date opf:event="creation" xmlns:opf="http://www.idpf.org/2007/opf">${new Date()}</dc:date>
      <meta name="cover" content="cover" />
  </metadata>
  <manifest>
        ${manifest.join("\n        ")}
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="main.css" href="Styles/main.css" media-type="text/css"/>
        <item id="fonts.css" href="Styles/fonts.css" media-type="text/css"/>
        <item id="cover" href="Images/cover.jpg" media-type="image/jpeg"/>
        <item id="logo.webp" href="Images/logo.webp" media-type="image/webp"/>
        <item id="line1.webp" href="Images/line1.webp" media-type="image/webp"/>
        <item id="girl.jpg" href="Images/girl.jpg" media-type="image/jpeg"/>
    </manifest>
    <spine toc="ncx">
        ${spine.join("\n        ")}
    </spine>
</package>`;
		o.file("content.opf", formatXML(contentOpfStr));
		let tocNcxStr = `<?xml version="1.0"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
<head>
    <meta name="dtb:uid" content="${crypto.randomUUID()}"/>
    <meta name="dtb:depth" content="2" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
</head>
<docTitle>
    <text>${bookName}</text>
</docTitle>
<docAuthor>
   <text>${author}, </text>
</docAuthor>
<navMap>
${ncxNav.join("\n")}
</navMap>
</ncx>`;
		o.file("toc.ncx", formatXML(tocNcxStr));
		const blob = await zip.generateAsync({ type: "blob" });
		(0, file_saver.saveAs)(blob, `${bookName} 作者：${author}.epub`);
		console.log(bookName + " 下载完毕！");
	}
	function escapeHtml(unsafe) {
		return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
	}
	function formatXML(xmlStr) {
		const xml = new DOMParser().parseFromString(xmlStr, "application/xml");
		return new XMLSerializer().serializeToString(xml);
	}
	function serializeXML(doc) {
		return "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" + formatXML(new XMLSerializer().serializeToString(doc));
	}
	function createContainer() {
		const doc = document.implementation.createDocument(null, "container", null);
		const container = doc.documentElement;
		container.setAttribute("version", "1.0");
		container.setAttribute("xmlns", "urn:oasis:names:tc:opendocument:xmlns:container");
		const rootfiles = doc.createElement("rootfiles");
		const rootfile = doc.createElement("rootfile");
		rootfile.setAttribute("full-path", "OEBPS/content.opf");
		rootfile.setAttribute("media-type", "application/oebps-package+xml");
		rootfiles.appendChild(rootfile);
		container.appendChild(rootfiles);
		return serializeXML(doc);
	}
	function genCoverHtmlPageV2() {
		return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Cover</title>
</head>

<body>
  <div style="text-align: center;padding: 0pt;margin: 0pt;">
    <img width="100%" src="../Images/cover.jpg" />
  </div>
</body>
</html>
`;
	}
	function genFyHtmlPage(book = {
		name: "书名",
		author: "作者名"
	}) {
		return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>扉页</title>
    <style type="text/css">
\t\t.pic {
\t\t\tmargin: 0% 0% 0 0%;
\t\t\tpadding: 2px 2px;
\t\t\tborder: 1px solid #f5f5dc;
\t\t\tbackground-color: rgba(250,250,250, 0);
\t\t\tborder-radius: 1px;
\t\t}
    </style>
</head>
<body style="text-align: center;">
<div class="pic"><img src="../Images/cover.jpg" style="width: 100%; height: auto;"/></div>
<h1 style="margin-top: 5%; font-size: 110%;">${book.name}</h1>
<div class="author" style="margin-top: 0;"><b>${book.author}</b> <span style="font-size: smaller;">/ 著</span></div>
</body>
</html>`;
	}
	function genIntroHtmlPage(intro = {
		bookName: "书名",
		author: "作者名",
		type: "分类",
		tags: "标签",
		rou: "肉量",
		score: "评分",
		lastUpdateTime: "最后更新时间",
		intro: "简介"
	}) {
		return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN">
<head>
    <title>Intro</title>
    <link href="../Styles/fonts.css" type="text/css" rel="stylesheet" />
    <link href="../Styles/main.css" type="text/css" rel="stylesheet" />
</head>
<body class="speci">
<div class="oval">
<h2 class="ovaltitle" style="margin-bottom:2em;">内容简介</h2>
    <p>📖 书名：${intro.bookName}</p>
    <p>👤 作者：${intro.author}</p>
    <p>🗂 分类：${intro.type}</p>
    <p>🔖 标签：${intro.tags}</p>
    <p>🗿 肉量：${intro.rou}</p>
    <p>✏ 评分：${intro.score}</p>
    <p>🕰 上次更新：${intro.lastUpdateTime}</p>
    <p>🏷 简介：${intro.intro}</p>
</div>
</body>
</html>
`;
	}
	function genHtmlPage(title) {
		const titleArray = title.split(" ").map((str) => str.trim()).filter((str) => str.length > 0);
		let t1 = titleArray[0];
		let t2 = "";
		if (titleArray.length > 1) t2 = titleArray.slice(1).join(" ");
		return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${titleArray.join(" ")}</title>
    <link href="../Styles/fonts.css" rel="stylesheet" type="text/css"/>
    <link href="../Styles/main.css" rel="stylesheet" type="text/css"/>
  </head>
  <body>
     <div class="chapter-head"><img alt="logo" class="chapter-head" src="../Images/logo.webp"/></div>
     <h2 class="chapter-title"><span>${t1}</span><br/>${t2}</h2>
     
     <p>null</p>
  </body>
</html>`;
	}
	function genVolumeHtmlPage(title, i = 0) {
		const titleArray = title.split(" ").map((str) => str.trim()).filter((str) => str.length > 0);
		return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>${titleArray.join(" ")}</title>
    <link href="../Styles/fonts.css" type="text/css" rel="stylesheet"/>
    <link href="../Styles/main.css" type="text/css" rel="stylesheet"/>
</head>

<body class="bg_${String(i + 1).padStart(2, "0")}">
<h1>${titleArray.join("<br />")}</h1>

</body>
</html>`;
	}
	var import_dexie_min = __toESM(__commonJSMin(((exports, module) => {
		((e, t) => {
			"object" == typeof exports && "undefined" != typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define(t) : (e = "undefined" != typeof globalThis ? globalThis : e || self).Dexie = t();
		})(exports, function() {
			var B = function(e, t) {
				return (B = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? function(e, t) {
					e.__proto__ = t;
				} : function(e, t) {
					for (var n in t) Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
				}))(e, t);
			};
			var _ = function() {
				return (_ = Object.assign || function(e) {
					for (var t, n = 1, r = arguments.length; n < r; n++) for (var i in t = arguments[n]) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
					return e;
				}).apply(this, arguments);
			};
			function R(e, t, n) {
				if (n || 2 === arguments.length) for (var r, i = 0, o = t.length; i < o; i++) !r && i in t || ((r = r || Array.prototype.slice.call(t, 0, i))[i] = t[i]);
				return e.concat(r || Array.prototype.slice.call(t));
			}
			var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : global, O = Object.keys, x = Array.isArray;
			function a(t, n) {
				return "object" == typeof n && O(n).forEach(function(e) {
					t[e] = n[e];
				}), t;
			}
			"undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
			var F = Object.getPrototypeOf, N = {}.hasOwnProperty;
			function m(e, t) {
				return N.call(e, t);
			}
			function M(t, n) {
				"function" == typeof n && (n = n(F(t))), ("undefined" == typeof Reflect ? O : Reflect.ownKeys)(n).forEach(function(e) {
					u(t, e, n[e]);
				});
			}
			var L = Object.defineProperty;
			function u(e, t, n, r) {
				L(e, t, a(n && m(n, "get") && "function" == typeof n.get ? {
					get: n.get,
					set: n.set,
					configurable: !0
				} : {
					value: n,
					configurable: !0,
					writable: !0
				}, r));
			}
			function U(t) {
				return { from: function(e) {
					return t.prototype = Object.create(e.prototype), u(t.prototype, "constructor", t), { extend: M.bind(null, t.prototype) };
				} };
			}
			var z = Object.getOwnPropertyDescriptor;
			var V = [].slice;
			function W(e, t, n) {
				return V.call(e, t, n);
			}
			function Y(e, t) {
				return t(e);
			}
			function $(e) {
				if (!e) throw new Error("Assertion Failed");
			}
			function Q(e) {
				f.setImmediate ? setImmediate(e) : setTimeout(e, 0);
			}
			function c(e, t) {
				if ("string" == typeof t && m(e, t)) return e[t];
				if (!t) return e;
				if ("string" != typeof t) {
					for (var n = [], r = 0, i = t.length; r < i; ++r) {
						var o = c(e, t[r]);
						n.push(o);
					}
					return n;
				}
				var a, u = t.indexOf(".");
				return -1 === u || null == (a = e[t.substr(0, u)]) ? void 0 : c(a, t.substr(u + 1));
			}
			function b(e, t, n) {
				if (e && void 0 !== t && !("isFrozen" in Object && Object.isFrozen(e))) if ("string" != typeof t && "length" in t) {
					$("string" != typeof n && "length" in n);
					for (var r = 0, i = t.length; r < i; ++r) b(e, t[r], n[r]);
				} else {
					var o = t.indexOf(".");
					if (-1 !== o) {
						var a = t.substr(0, o), o = t.substr(o + 1);
						if ("" === o) void 0 === n ? x(e) && !isNaN(parseInt(a)) ? e.splice(a, 1) : delete e[a] : e[a] = n;
						else {
							var u = e[a];
							if (!u || !m(e, a)) {
								if (void 0 === n) return;
								u = e[a] = {};
							}
							b(u, o, n);
						}
					} else void 0 === n ? x(e) && !isNaN(parseInt(t)) ? e.splice(t, 1) : delete e[t] : e[t] = n;
				}
			}
			function G(e) {
				var t, n = {};
				for (t in e) m(e, t) && (n[t] = e[t]);
				return n;
			}
			var X = [].concat;
			function H(e) {
				return X.apply([], e);
			}
			var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(H([
				8,
				16,
				32,
				64
			].map(function(t) {
				return [
					"Int",
					"Uint",
					"Float"
				].map(function(e) {
					return e + t + "Array";
				});
			}))).filter(function(e) {
				return f[e];
			}), J = new Set(e.map(function(e) {
				return f[e];
			}));
			var Z = null;
			function ee(e) {
				Z = new WeakMap();
				e = function e(t) {
					if (!t || "object" != typeof t) return t;
					var n = Z.get(t);
					if (n) return n;
					if (x(t)) {
						n = [], Z.set(t, n);
						for (var r = 0, i = t.length; r < i; ++r) n.push(e(t[r]));
					} else if (J.has(t.constructor)) n = t;
					else {
						var o, a = F(t);
						for (o in n = a === Object.prototype ? {} : Object.create(a), Z.set(t, n), t) m(t, o) && (n[o] = e(t[o]));
					}
					return n;
				}(e);
				return Z = null, e;
			}
			var te = {}.toString;
			function ne(e) {
				return te.call(e).slice(8, -1);
			}
			var re = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", ie = "symbol" == typeof re ? function(e) {
				var t;
				return null != e && (t = e[re]) && t.apply(e);
			} : function() {
				return null;
			};
			function oe(e, t) {
				t = e.indexOf(t);
				0 <= t && e.splice(t, 1);
			}
			var ae = {};
			function n(e) {
				var t, n, r, i;
				if (1 === arguments.length) {
					if (x(e)) return e.slice();
					if (this === ae && "string" == typeof e) return [e];
					if (i = ie(e)) for (n = []; !(r = i.next()).done;) n.push(r.value);
					else {
						if (null == e) return [e];
						if ("number" != typeof (t = e.length)) return [e];
						for (n = new Array(t); t--;) n[t] = e[t];
					}
				} else for (t = arguments.length, n = new Array(t); t--;) n[t] = arguments[t];
				return n;
			}
			var ue = "undefined" != typeof Symbol ? function(e) {
				return "AsyncFunction" === e[Symbol.toStringTag];
			} : function() {
				return !1;
			}, e = [
				"Unknown",
				"Constraint",
				"Data",
				"TransactionInactive",
				"ReadOnly",
				"Version",
				"NotFound",
				"InvalidState",
				"InvalidAccess",
				"Abort",
				"Timeout",
				"QuotaExceeded",
				"Syntax",
				"DataClone"
			], t = [
				"Modify",
				"Bulk",
				"OpenFailed",
				"VersionChange",
				"Schema",
				"Upgrade",
				"InvalidTable",
				"MissingAPI",
				"NoSuchDatabase",
				"InvalidArgument",
				"SubTransaction",
				"Unsupported",
				"Internal",
				"DatabaseClosed",
				"PrematureCommit",
				"ForeignAwait"
			].concat(e), se = {
				VersionChanged: "Database version changed by other database connection",
				DatabaseClosed: "Database has been closed",
				Abort: "Transaction aborted",
				TransactionInactive: "Transaction has already completed or failed",
				MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb"
			};
			function ce(e, t) {
				this.name = e, this.message = t;
			}
			function le(e, t) {
				return e + ". Errors: " + Object.keys(t).map(function(e) {
					return t[e].toString();
				}).filter(function(e, t, n) {
					return n.indexOf(e) === t;
				}).join("\n");
			}
			function fe(e, t, n, r) {
				this.failures = t, this.failedKeys = r, this.successCount = n, this.message = le(e, t);
			}
			function he(e, t) {
				this.name = "BulkError", this.failures = Object.keys(t).map(function(e) {
					return t[e];
				}), this.failuresByPos = t, this.message = le(e, this.failures);
			}
			U(ce).from(Error).extend({ toString: function() {
				return this.name + ": " + this.message;
			} }), U(fe).from(ce), U(he).from(ce);
			var de = t.reduce(function(e, t) {
				return e[t] = t + "Error", e;
			}, {}), pe = ce, k = t.reduce(function(e, n) {
				var r = n + "Error";
				function t(e, t) {
					this.name = r, e ? "string" == typeof e ? (this.message = "".concat(e).concat(t ? "\n " + t : ""), this.inner = t || null) : "object" == typeof e && (this.message = "".concat(e.name, " ").concat(e.message), this.inner = e) : (this.message = se[n] || r, this.inner = null);
				}
				return U(t).from(pe), e[n] = t, e;
			}, {}), ye = (k.Syntax = SyntaxError, k.Type = TypeError, k.Range = RangeError, e.reduce(function(e, t) {
				return e[t + "Error"] = k[t], e;
			}, {}));
			e = t.reduce(function(e, t) {
				return -1 === [
					"Syntax",
					"Type",
					"Range"
				].indexOf(t) && (e[t + "Error"] = k[t]), e;
			}, {});
			function g() {}
			function ve(e) {
				return e;
			}
			function me(t, n) {
				return null == t || t === ve ? n : function(e) {
					return n(t(e));
				};
			}
			function be(e, t) {
				return function() {
					e.apply(this, arguments), t.apply(this, arguments);
				};
			}
			function ge(i, o) {
				return i === g ? o : function() {
					var e = i.apply(this, arguments), t = (void 0 !== e && (arguments[0] = e), this.onsuccess), n = this.onerror, r = (this.onsuccess = null, this.onerror = null, o.apply(this, arguments));
					return t && (this.onsuccess = this.onsuccess ? be(t, this.onsuccess) : t), n && (this.onerror = this.onerror ? be(n, this.onerror) : n), void 0 !== r ? r : e;
				};
			}
			function we(n, r) {
				return n === g ? r : function() {
					n.apply(this, arguments);
					var e = this.onsuccess, t = this.onerror;
					this.onsuccess = this.onerror = null, r.apply(this, arguments), e && (this.onsuccess = this.onsuccess ? be(e, this.onsuccess) : e), t && (this.onerror = this.onerror ? be(t, this.onerror) : t);
				};
			}
			function _e(i, o) {
				return i === g ? o : function() {
					var e = i.apply(this, arguments), t = (a(arguments[0], e), this.onsuccess), n = this.onerror, r = (this.onsuccess = null, this.onerror = null, o.apply(this, arguments));
					return t && (this.onsuccess = this.onsuccess ? be(t, this.onsuccess) : t), n && (this.onerror = this.onerror ? be(n, this.onerror) : n), void 0 === e ? void 0 === r ? void 0 : r : a(e, r);
				};
			}
			function xe(e, t) {
				return e === g ? t : function() {
					return !1 !== t.apply(this, arguments) && e.apply(this, arguments);
				};
			}
			function ke(i, o) {
				return i === g ? o : function() {
					var e = i.apply(this, arguments);
					if (e && "function" == typeof e.then) {
						for (var t = this, n = arguments.length, r = new Array(n); n--;) r[n] = arguments[n];
						return e.then(function() {
							return o.apply(t, r);
						});
					}
					return o.apply(this, arguments);
				};
			}
			e.ModifyError = fe, e.DexieError = ce, e.BulkError = he;
			var l = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
			function Oe(e) {
				l = e;
			}
			var Pe = {}, Ke = 100, Ee = "undefined" == typeof Promise ? [] : (t = Promise.resolve(), "undefined" != typeof crypto && crypto.subtle ? [
				Ee = crypto.subtle.digest("SHA-512", new Uint8Array([0])),
				F(Ee),
				t
			] : [
				t,
				F(t),
				t
			]), t = Ee[0], Se = Ee[1], Se = Se && Se.then, Ae = t && t.constructor, je = !!Ee[2];
			var Ce = function(e, t) {
				Re.push([e, t]), Ie && (queueMicrotask(Ye), Ie = !1);
			}, Te = !0, Ie = !0, qe = [], De = [], Be = ve, s = {
				id: "global",
				global: !0,
				ref: 0,
				unhandleds: [],
				onunhandled: g,
				pgp: !1,
				env: {},
				finalize: g
			}, P = s, Re = [], Fe = 0, Ne = [];
			function K(e) {
				if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
				this._listeners = [], this._lib = !1;
				var t = this._PSD = P;
				if ("function" != typeof e) {
					if (e !== Pe) throw new TypeError("Not a function");
					this._state = arguments[1], this._value = arguments[2], !1 === this._state && Ue(this, this._value);
				} else this._state = null, this._value = null, ++t.ref, function t(r, e) {
					try {
						e(function(n) {
							if (null === r._state) {
								if (n === r) throw new TypeError("A promise cannot be resolved with itself.");
								var e = r._lib && $e();
								n && "function" == typeof n.then ? t(r, function(e, t) {
									n instanceof K ? n._then(e, t) : n.then(e, t);
								}) : (r._state = !0, r._value = n, ze(r)), e && Qe();
							}
						}, Ue.bind(null, r));
					} catch (e) {
						Ue(r, e);
					}
				}(this, e);
			}
			var Me = {
				get: function() {
					var u = P, t = et;
					function e(n, r) {
						var i = this, o = !u.global && (u !== P || t !== et), a = o && !w(), e = new K(function(e, t) {
							Ve(i, new Le(ut(n, u, o, a), ut(r, u, o, a), e, t, u));
						});
						return this._consoleTask && (e._consoleTask = this._consoleTask), e;
					}
					return e.prototype = Pe, e;
				},
				set: function(e) {
					u(this, "then", e && e.prototype === Pe ? Me : {
						get: function() {
							return e;
						},
						set: Me.set
					});
				}
			};
			function Le(e, t, n, r, i) {
				this.onFulfilled = "function" == typeof e ? e : null, this.onRejected = "function" == typeof t ? t : null, this.resolve = n, this.reject = r, this.psd = i;
			}
			function Ue(e, t) {
				var n, r;
				De.push(t), null === e._state && (n = e._lib && $e(), t = Be(t), e._state = !1, e._value = t, r = e, qe.some(function(e) {
					return e._value === r._value;
				}) || qe.push(r), ze(e), n) && Qe();
			}
			function ze(e) {
				var t = e._listeners;
				e._listeners = [];
				for (var n = 0, r = t.length; n < r; ++n) Ve(e, t[n]);
				var i = e._PSD;
				--i.ref || i.finalize(), 0 === Fe && (++Fe, Ce(function() {
					0 == --Fe && Ge();
				}, []));
			}
			function Ve(e, t) {
				if (null === e._state) e._listeners.push(t);
				else {
					var n = e._state ? t.onFulfilled : t.onRejected;
					if (null === n) return (e._state ? t.resolve : t.reject)(e._value);
					++t.psd.ref, ++Fe, Ce(We, [
						n,
						e,
						t
					]);
				}
			}
			function We(e, t, n) {
				try {
					var r, i = t._value;
					!t._state && De.length && (De = []), r = l && t._consoleTask ? t._consoleTask.run(function() {
						return e(i);
					}) : e(i), t._state || -1 !== De.indexOf(i) || ((e) => {
						for (var t = qe.length; t;) if (qe[--t]._value === e._value) return qe.splice(t, 1);
					})(t), n.resolve(r);
				} catch (e) {
					n.reject(e);
				} finally {
					0 == --Fe && Ge(), --n.psd.ref || n.psd.finalize();
				}
			}
			function Ye() {
				at(s, function() {
					$e() && Qe();
				});
			}
			function $e() {
				var e = Te;
				return Ie = Te = !1, e;
			}
			function Qe() {
				var e, t, n;
				do
					for (; 0 < Re.length;) for (e = Re, Re = [], n = e.length, t = 0; t < n; ++t) {
						var r = e[t];
						r[0].apply(null, r[1]);
					}
				while (0 < Re.length);
				Ie = Te = !0;
			}
			function Ge() {
				for (var e = qe, t = (qe = [], e.forEach(function(e) {
					e._PSD.onunhandled.call(null, e._value, e);
				}), Ne.slice(0)), n = t.length; n;) t[--n]();
			}
			function Xe(e) {
				return new K(Pe, !1, e);
			}
			function E(n, r) {
				var i = P;
				return function() {
					var e = $e(), t = P;
					try {
						return h(i, !0), n.apply(this, arguments);
					} catch (e) {
						r && r(e);
					} finally {
						h(t, !1), e && Qe();
					}
				};
			}
			M(K.prototype, {
				then: Me,
				_then: function(e, t) {
					Ve(this, new Le(null, null, e, t, P));
				},
				catch: function(e) {
					var t, n;
					return 1 === arguments.length ? this.then(null, e) : (t = e, n = arguments[1], "function" == typeof t ? this.then(null, function(e) {
						return (e instanceof t ? n : Xe)(e);
					}) : this.then(null, function(e) {
						return (e && e.name === t ? n : Xe)(e);
					}));
				},
				finally: function(t) {
					return this.then(function(e) {
						return K.resolve(t()).then(function() {
							return e;
						});
					}, function(e) {
						return K.resolve(t()).then(function() {
							return Xe(e);
						});
					});
				},
				timeout: function(r, i) {
					var o = this;
					return r < 1 / 0 ? new K(function(e, t) {
						var n = setTimeout(function() {
							return t(new k.Timeout(i));
						}, r);
						o.then(e, t).finally(clearTimeout.bind(null, n));
					}) : this;
				}
			}), "undefined" != typeof Symbol && Symbol.toStringTag && u(K.prototype, Symbol.toStringTag, "Dexie.Promise"), s.env = ot(), M(K, {
				all: function() {
					var o = n.apply(null, arguments).map(rt);
					return new K(function(n, r) {
						0 === o.length && n([]);
						var i = o.length;
						o.forEach(function(e, t) {
							return K.resolve(e).then(function(e) {
								o[t] = e, --i || n(o);
							}, r);
						});
					});
				},
				resolve: function(n) {
					return n instanceof K ? n : n && "function" == typeof n.then ? new K(function(e, t) {
						n.then(e, t);
					}) : new K(Pe, !0, n);
				},
				reject: Xe,
				race: function() {
					var e = n.apply(null, arguments).map(rt);
					return new K(function(t, n) {
						e.map(function(e) {
							return K.resolve(e).then(t, n);
						});
					});
				},
				PSD: {
					get: function() {
						return P;
					},
					set: function(e) {
						return P = e;
					}
				},
				totalEchoes: { get: function() {
					return et;
				} },
				newPSD: v,
				usePSD: at,
				scheduler: {
					get: function() {
						return Ce;
					},
					set: function(e) {
						Ce = e;
					}
				},
				rejectionMapper: {
					get: function() {
						return Be;
					},
					set: function(e) {
						Be = e;
					}
				},
				follow: function(i, n) {
					return new K(function(e, t) {
						return v(function(n, r) {
							var e = P;
							e.unhandleds = [], e.onunhandled = r, e.finalize = be(function() {
								var t, e = this;
								t = function() {
									0 === e.unhandleds.length ? n() : r(e.unhandleds[0]);
								}, Ne.push(function e() {
									t(), Ne.splice(Ne.indexOf(e), 1);
								}), ++Fe, Ce(function() {
									0 == --Fe && Ge();
								}, []);
							}, e.finalize), i();
						}, n, e, t);
					});
				}
			}), Ae && (Ae.allSettled && u(K, "allSettled", function() {
				var e = n.apply(null, arguments).map(rt);
				return new K(function(n) {
					0 === e.length && n([]);
					var r = e.length, i = new Array(r);
					e.forEach(function(e, t) {
						return K.resolve(e).then(function(e) {
							return i[t] = {
								status: "fulfilled",
								value: e
							};
						}, function(e) {
							return i[t] = {
								status: "rejected",
								reason: e
							};
						}).then(function() {
							return --r || n(i);
						});
					});
				});
			}), Ae.any && "undefined" != typeof AggregateError && u(K, "any", function() {
				var e = n.apply(null, arguments).map(rt);
				return new K(function(n, r) {
					0 === e.length && r(new AggregateError([]));
					var i = e.length, o = new Array(i);
					e.forEach(function(e, t) {
						return K.resolve(e).then(function(e) {
							return n(e);
						}, function(e) {
							o[t] = e, --i || r(new AggregateError(o));
						});
					});
				});
			}), Ae.withResolvers) && (K.withResolvers = Ae.withResolvers);
			var o = {
				awaits: 0,
				echoes: 0,
				id: 0
			}, He = 0, Je = [], Ze = 0, et = 0, tt = 0;
			function v(e, t, n, r) {
				var i = P, o = Object.create(i), t = (o.parent = i, o.ref = 0, o.global = !1, o.id = ++tt, s.env, o.env = je ? {
					Promise: K,
					PromiseProp: {
						value: K,
						configurable: !0,
						writable: !0
					},
					all: K.all,
					race: K.race,
					allSettled: K.allSettled,
					any: K.any,
					resolve: K.resolve,
					reject: K.reject
				} : {}, t && a(o, t), ++i.ref, o.finalize = function() {
					--this.parent.ref || this.parent.finalize();
				}, at(o, e, n, r));
				return 0 === o.ref && o.finalize(), t;
			}
			function nt() {
				return o.id || (o.id = ++He), ++o.awaits, o.echoes += Ke, o.id;
			}
			function w() {
				return !!o.awaits && (0 == --o.awaits && (o.id = 0), o.echoes = o.awaits * Ke, !0);
			}
			function rt(e) {
				return o.echoes && e && e.constructor === Ae ? (nt(), e.then(function(e) {
					return w(), e;
				}, function(e) {
					return w(), S(e);
				})) : e;
			}
			function it() {
				var e = Je[Je.length - 1];
				Je.pop(), h(e, !1);
			}
			function h(e, t) {
				var n, r, i = P;
				(t ? !o.echoes || Ze++ && e === P : !Ze || --Ze && e === P) || queueMicrotask(t ? function(e) {
					++et, o.echoes && 0 != --o.echoes || (o.echoes = o.awaits = o.id = 0), Je.push(P), h(e, !0);
				}.bind(null, e) : it), e !== P && (P = e, i === s && (s.env = ot()), je) && (n = s.env.Promise, r = e.env, i.global || e.global) && (Object.defineProperty(f, "Promise", r.PromiseProp), n.all = r.all, n.race = r.race, n.resolve = r.resolve, n.reject = r.reject, r.allSettled && (n.allSettled = r.allSettled), r.any) && (n.any = r.any);
			}
			function ot() {
				var e = f.Promise;
				return je ? {
					Promise: e,
					PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"),
					all: e.all,
					race: e.race,
					allSettled: e.allSettled,
					any: e.any,
					resolve: e.resolve,
					reject: e.reject
				} : {};
			}
			function at(e, t, n, r, i) {
				var o = P;
				try {
					return h(e, !0), t(n, r, i);
				} finally {
					h(o, !1);
				}
			}
			function ut(t, n, r, i) {
				return "function" != typeof t ? t : function() {
					var e = P;
					r && nt(), h(n, !0);
					try {
						return t.apply(this, arguments);
					} finally {
						h(e, !1), i && queueMicrotask(w);
					}
				};
			}
			function st(e) {
				Promise === Ae && 0 === o.echoes ? 0 === Ze ? e() : enqueueNativeMicroTask(e) : setTimeout(e, 0);
			}
			-1 === ("" + Se).indexOf("[native code]") && (nt = w = g);
			var S = K.reject;
			var ct = String.fromCharCode(65535), A = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", lt = "String expected.", ft = "__dbnames", ht = "readonly", dt = "readwrite";
			function pt(e, t) {
				return e ? t ? function() {
					return e.apply(this, arguments) && t.apply(this, arguments);
				} : e : t;
			}
			var yt = {
				type: 3,
				lower: -1 / 0,
				lowerOpen: !1,
				upper: [[]],
				upperOpen: !1
			};
			function vt(t) {
				return "string" != typeof t || /\./.test(t) ? function(e) {
					return e;
				} : function(e) {
					return void 0 === e[t] && t in e && delete (e = ee(e))[t], e;
				};
			}
			function mt() {
				throw k.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
			}
			function j(e, t) {
				try {
					var n = bt(e), r = bt(t);
					if (n !== r) return "Array" === n ? 1 : "Array" === r ? -1 : "binary" === n ? 1 : "binary" === r ? -1 : "string" === n ? 1 : "string" === r ? -1 : "Date" === n ? 1 : "Date" !== r ? NaN : -1;
					switch (n) {
						case "number":
						case "Date":
						case "string": return t < e ? 1 : e < t ? -1 : 0;
						case "binary":
							for (var i = gt(e), o = gt(t), a = i.length, u = o.length, s = a < u ? a : u, c = 0; c < s; ++c) if (i[c] !== o[c]) return i[c] < o[c] ? -1 : 1;
							return a === u ? 0 : a < u ? -1 : 1;
						case "Array":
							for (var l = e, f = t, h = l.length, d = f.length, p = h < d ? h : d, y = 0; y < p; ++y) {
								var v = j(l[y], f[y]);
								if (0 !== v) return v;
							}
							return h === d ? 0 : h < d ? -1 : 1;
					}
				} catch (e) {}
				return NaN;
			}
			function bt(e) {
				var t = typeof e;
				return "object" == t && (ArrayBuffer.isView(e) || "ArrayBuffer" === (t = ne(e))) ? "binary" : t;
			}
			function gt(e) {
				return e instanceof Uint8Array ? e : ArrayBuffer.isView(e) ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength) : new Uint8Array(e);
			}
			function wt(t, n, r) {
				var e = t.schema.yProps;
				return e ? (n && 0 < r.numFailures && (n = n.filter(function(e, t) {
					return !r.failures[t];
				})), Promise.all(e.map(function(e) {
					e = e.updatesTable;
					return n ? t.db.table(e).where("k").anyOf(n).delete() : t.db.table(e).clear();
				})).then(function() {
					return r;
				})) : r;
			}
			xt.prototype.execute = function(e) {
				var t = this["@@propmod"];
				if (void 0 !== t.add) {
					var n = t.add;
					if (x(n)) return R(R([], x(e) ? e : [], !0), n, !0).sort();
					if ("number" == typeof n) return (Number(e) || 0) + n;
					if ("bigint" == typeof n) try {
						return BigInt(e) + n;
					} catch (e) {
						return BigInt(0) + n;
					}
					throw new TypeError("Invalid term ".concat(n));
				}
				if (void 0 !== t.remove) {
					var r = t.remove;
					if (x(r)) return x(e) ? e.filter(function(e) {
						return !r.includes(e);
					}).sort() : [];
					if ("number" == typeof r) return Number(e) - r;
					if ("bigint" == typeof r) try {
						return BigInt(e) - r;
					} catch (e) {
						return BigInt(0) - r;
					}
					throw new TypeError("Invalid subtrahend ".concat(r));
				}
				n = null == (n = t.replacePrefix) ? void 0 : n[0];
				return n && "string" == typeof e && e.startsWith(n) ? t.replacePrefix[1] + e.substring(n.length) : e;
			};
			var _t = xt;
			function xt(e) {
				this["@@propmod"] = e;
			}
			function kt(e, t) {
				for (var n = O(t), r = n.length, i = !1, o = 0; o < r; ++o) {
					var a = n[o], u = t[a], s = c(e, a);
					u instanceof _t ? (b(e, a, u.execute(s)), i = !0) : s !== u && (b(e, a, u), i = !0);
				}
				return i;
			}
			r.prototype._trans = function(e, r, t) {
				var n = this._tx || P.trans, i = this.name, o = l && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e ? "read" : "write", " ").concat(this.name));
				function a(e, t, n) {
					if (n.schema[i]) return r(n.idbtrans, n);
					throw new k.NotFound("Table " + i + " not part of transaction");
				}
				var u = $e();
				try {
					var s = n && n.db._novip === this.db._novip ? n === P.trans ? n._promise(e, a, t) : v(function() {
						return n._promise(e, a, t);
					}, {
						trans: n,
						transless: P.transless || P
					}) : function t(n, r, i, o) {
						if (n.idbdb && (n._state.openComplete || P.letThrough || n._vip)) {
							var a = n._createTransaction(r, i, n._dbSchema);
							try {
								a.create(), n._state.PR1398_maxLoop = 3;
							} catch (e) {
								return e.name === de.InvalidState && n.isOpen() && 0 < --n._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n.close({ disableAutoOpen: !1 }), n.open().then(function() {
									return t(n, r, i, o);
								})) : S(e);
							}
							return a._promise(r, function(e, t) {
								return v(function() {
									return P.trans = a, o(e, t, a);
								});
							}).then(function(e) {
								if ("readwrite" === r) try {
									a.idbtrans.commit();
								} catch (e) {}
								return "readonly" === r ? e : a._completion.then(function() {
									return e;
								});
							});
						}
						if (n._state.openComplete) return S(new k.DatabaseClosed(n._state.dbOpenError));
						if (!n._state.isBeingOpened) {
							if (!n._state.autoOpen) return S(new k.DatabaseClosed());
							n.open().catch(g);
						}
						return n._state.dbReadyPromise.then(function() {
							return t(n, r, i, o);
						});
					}(this.db, e, [this.name], a);
					return o && (s._consoleTask = o, s = s.catch(function(e) {
						return console.trace(e), S(e);
					})), s;
				} finally {
					u && Qe();
				}
			}, r.prototype.get = function(t, e) {
				var n = this;
				return t && t.constructor === Object ? this.where(t).first(e) : null == t ? S(new k.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e) {
					return n.core.get({
						trans: e,
						key: t
					}).then(function(e) {
						return n.hook.reading.fire(e);
					});
				}).then(e);
			}, r.prototype.where = function(o) {
				if ("string" == typeof o) return new this.db.WhereClause(this, o);
				if (x(o)) return new this.db.WhereClause(this, "[".concat(o.join("+"), "]"));
				var n = O(o);
				if (1 === n.length) return this.where(n[0]).equals(o[n[0]]);
				var e = this.schema.indexes.concat(this.schema.primKey).filter(function(t) {
					if (t.compound && n.every(function(e) {
						return 0 <= t.keyPath.indexOf(e);
					})) {
						for (var e = 0; e < n.length; ++e) if (-1 === n.indexOf(t.keyPath[e])) return !1;
						return !0;
					}
					return !1;
				}).sort(function(e, t) {
					return e.keyPath.length - t.keyPath.length;
				})[0];
				if (e && this.db._maxKey !== ct) return t = e.keyPath.slice(0, n.length), this.where(t).equals(t.map(function(e) {
					return o[e];
				}));
				!e && l && console.warn("The query ".concat(JSON.stringify(o), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n.join("+"), "]"));
				var a = this.schema.idxByName;
				function u(e, t) {
					return 0 === j(e, t);
				}
				var t = n.reduce(function(e, t) {
					var n = e[0], e = e[1], r = a[t], i = o[t];
					return [n || r, n || !r ? pt(e, r && r.multi ? function(e) {
						e = c(e, t);
						return x(e) && e.some(function(e) {
							return u(i, e);
						});
					} : function(e) {
						return u(i, c(e, t));
					}) : e];
				}, [null, null]), r = t[0], t = t[1];
				return r ? this.where(r.name).equals(o[r.keyPath]).filter(t) : e ? this.filter(t) : this.where(n).equals("");
			}, r.prototype.filter = function(e) {
				return this.toCollection().and(e);
			}, r.prototype.count = function(e) {
				return this.toCollection().count(e);
			}, r.prototype.offset = function(e) {
				return this.toCollection().offset(e);
			}, r.prototype.limit = function(e) {
				return this.toCollection().limit(e);
			}, r.prototype.each = function(e) {
				return this.toCollection().each(e);
			}, r.prototype.toArray = function(e) {
				return this.toCollection().toArray(e);
			}, r.prototype.toCollection = function() {
				return new this.db.Collection(new this.db.WhereClause(this));
			}, r.prototype.orderBy = function(e) {
				return new this.db.Collection(new this.db.WhereClause(this, x(e) ? "[".concat(e.join("+"), "]") : e));
			}, r.prototype.reverse = function() {
				return this.toCollection().reverse();
			}, r.prototype.mapToClass = function(r) {
				for (var o = this.db, a = this.name, i = ((this.schema.mappedClass = r).prototype instanceof mt && (r = ((e) => {
					var t = i, n = e;
					if ("function" != typeof n && null !== n) throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
					function r() {
						this.constructor = t;
					}
					function i() {
						return null !== e && e.apply(this, arguments) || this;
					}
					return B(t, n), t.prototype = null === n ? Object.create(n) : (r.prototype = n.prototype, new r()), Object.defineProperty(i.prototype, "db", {
						get: function() {
							return o;
						},
						enumerable: !1,
						configurable: !0
					}), i.prototype.table = function() {
						return a;
					}, i;
				})(r)), new Set()), e = r.prototype; e; e = F(e)) Object.getOwnPropertyNames(e).forEach(function(e) {
					return i.add(e);
				});
				function t(e) {
					if (!e) return e;
					var t, n = Object.create(r.prototype);
					for (t in e) if (!i.has(t)) try {
						n[t] = e[t];
					} catch (e) {}
					return n;
				}
				return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = t, this.hook("reading", t), r;
			}, r.prototype.defineClass = function() {
				return this.mapToClass(function(e) {
					a(this, e);
				});
			}, r.prototype.add = function(t, n) {
				var r = this, e = this.schema.primKey, i = e.auto, o = e.keyPath, a = t;
				return o && i && (a = vt(o)(t)), this._trans("readwrite", function(e) {
					return r.core.mutate({
						trans: e,
						type: "add",
						keys: null != n ? [n] : null,
						values: [a]
					});
				}).then(function(e) {
					return e.numFailures ? K.reject(e.failures[0]) : e.lastResult;
				}).then(function(e) {
					if (o) try {
						b(t, o, e);
					} catch (e) {}
					return e;
				});
			}, r.prototype.upsert = function(r, i) {
				var o = this, a = this.schema.primKey.keyPath;
				return this._trans("readwrite", function(n) {
					return o.core.get({
						trans: n,
						key: r
					}).then(function(t) {
						var e = null != t ? t : {};
						return kt(e, i), a && b(e, a, r), o.core.mutate({
							trans: n,
							type: "put",
							values: [e],
							keys: [r],
							upsert: !0,
							updates: {
								keys: [r],
								changeSpecs: [i]
							}
						}).then(function(e) {
							return e.numFailures ? K.reject(e.failures[0]) : !!t;
						});
					});
				});
			}, r.prototype.update = function(e, t) {
				return "object" != typeof e || x(e) ? this.where(":id").equals(e).modify(t) : void 0 === (e = c(e, this.schema.primKey.keyPath)) ? S(new k.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e).modify(t);
			}, r.prototype.put = function(t, n) {
				var r = this, e = this.schema.primKey, i = e.auto, o = e.keyPath, a = t;
				return o && i && (a = vt(o)(t)), this._trans("readwrite", function(e) {
					return r.core.mutate({
						trans: e,
						type: "put",
						values: [a],
						keys: null != n ? [n] : null
					});
				}).then(function(e) {
					return e.numFailures ? K.reject(e.failures[0]) : e.lastResult;
				}).then(function(e) {
					if (o) try {
						b(t, o, e);
					} catch (e) {}
					return e;
				});
			}, r.prototype.delete = function(t) {
				var n = this;
				return this._trans("readwrite", function(e) {
					return n.core.mutate({
						trans: e,
						type: "delete",
						keys: [t]
					}).then(function(e) {
						return wt(n, [t], e);
					}).then(function(e) {
						return e.numFailures ? K.reject(e.failures[0]) : void 0;
					});
				});
			}, r.prototype.clear = function() {
				var t = this;
				return this._trans("readwrite", function(e) {
					return t.core.mutate({
						trans: e,
						type: "deleteRange",
						range: yt
					}).then(function(e) {
						return wt(t, null, e);
					});
				}).then(function(e) {
					return e.numFailures ? K.reject(e.failures[0]) : void 0;
				});
			}, r.prototype.bulkGet = function(t) {
				var n = this;
				return this._trans("readonly", function(e) {
					return n.core.getMany({
						keys: t,
						trans: e
					}).then(function(e) {
						return e.map(function(e) {
							return n.hook.reading.fire(e);
						});
					});
				});
			}, r.prototype.bulkAdd = function(i, e, t) {
				var o = this, a = Array.isArray(e) ? e : void 0, u = (t = t || (a ? void 0 : e)) ? t.allKeys : void 0;
				return this._trans("readwrite", function(e) {
					var t = o.schema.primKey, n = t.auto, t = t.keyPath;
					if (t && a) throw new k.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
					if (a && a.length !== i.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
					var r = i.length, n = t && n ? i.map(vt(t)) : i;
					return o.core.mutate({
						trans: e,
						type: "add",
						keys: a,
						values: n,
						wantResults: u
					}).then(function(e) {
						var t = e.numFailures, n = e.failures;
						if (0 === t) return u ? e.results : e.lastResult;
						throw new he("".concat(o.name, ".bulkAdd(): ").concat(t, " of ").concat(r, " operations failed"), n);
					});
				});
			}, r.prototype.bulkPut = function(i, e, t) {
				var o = this, a = Array.isArray(e) ? e : void 0, u = (t = t || (a ? void 0 : e)) ? t.allKeys : void 0;
				return this._trans("readwrite", function(e) {
					var t = o.schema.primKey, n = t.auto, t = t.keyPath;
					if (t && a) throw new k.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
					if (a && a.length !== i.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
					var r = i.length, n = t && n ? i.map(vt(t)) : i;
					return o.core.mutate({
						trans: e,
						type: "put",
						keys: a,
						values: n,
						wantResults: u
					}).then(function(e) {
						var t = e.numFailures, n = e.failures;
						if (0 === t) return u ? e.results : e.lastResult;
						throw new he("".concat(o.name, ".bulkPut(): ").concat(t, " of ").concat(r, " operations failed"), n);
					});
				});
			}, r.prototype.bulkUpdate = function(t) {
				var h = this, n = this.core, r = t.map(function(e) {
					return e.key;
				}), i = t.map(function(e) {
					return e.changes;
				}), d = [];
				return this._trans("readwrite", function(e) {
					return n.getMany({
						trans: e,
						keys: r,
						cache: "clone"
					}).then(function(c) {
						var l = [], f = [], s = (t.forEach(function(e, t) {
							var n = e.key, r = e.changes, i = c[t];
							if (i) {
								for (var o = 0, a = Object.keys(r); o < a.length; o++) {
									var u = a[o], s = r[u];
									if (u === h.schema.primKey.keyPath) {
										if (0 !== j(s, n)) throw new k.Constraint("Cannot update primary key in bulkUpdate()");
									} else b(i, u, s);
								}
								d.push(t), l.push(n), f.push(i);
							}
						}), l.length);
						return n.mutate({
							trans: e,
							type: "put",
							keys: l,
							values: f,
							updates: {
								keys: r,
								changeSpecs: i
							}
						}).then(function(e) {
							var t = e.numFailures, n = e.failures;
							if (0 === t) return s;
							for (var r = 0, i = Object.keys(n); r < i.length; r++) {
								var o, a = i[r], u = d[Number(a)];
								null != u && (o = n[a], delete n[a], n[u] = o);
							}
							throw new he("".concat(h.name, ".bulkUpdate(): ").concat(t, " of ").concat(s, " operations failed"), n);
						});
					});
				});
			}, r.prototype.bulkDelete = function(t) {
				var r = this, i = t.length;
				return this._trans("readwrite", function(e) {
					return r.core.mutate({
						trans: e,
						type: "delete",
						keys: t
					}).then(function(e) {
						return wt(r, t, e);
					});
				}).then(function(e) {
					var t = e.numFailures, n = e.failures;
					if (0 === t) return e.lastResult;
					throw new he("".concat(r.name, ".bulkDelete(): ").concat(t, " of ").concat(i, " operations failed"), n);
				});
			};
			var Ot = r;
			function r() {}
			function Pt(i) {
				function t(e, t) {
					if (t) {
						for (var n = arguments.length, r = new Array(n - 1); --n;) r[n - 1] = arguments[n];
						return a[e].subscribe.apply(null, r), i;
					}
					if ("string" == typeof e) return a[e];
				}
				var a = {};
				t.addEventType = u;
				for (var e = 1, n = arguments.length; e < n; ++e) u(arguments[e]);
				return t;
				function u(e, n, r) {
					var i, o;
					if ("object" != typeof e) return n = n || xe, o = {
						subscribers: [],
						fire: r = r || g,
						subscribe: function(e) {
							-1 === o.subscribers.indexOf(e) && (o.subscribers.push(e), o.fire = n(o.fire, e));
						},
						unsubscribe: function(t) {
							o.subscribers = o.subscribers.filter(function(e) {
								return e !== t;
							}), o.fire = o.subscribers.reduce(n, r);
						}
					}, a[e] = t[e] = o;
					O(i = e).forEach(function(e) {
						var t = i[e];
						if (x(t)) u(e, i[e][0], i[e][1]);
						else {
							if ("asap" !== t) throw new k.InvalidArgument("Invalid event config");
							var n = u(e, ve, function() {
								for (var e = arguments.length, t = new Array(e); e--;) t[e] = arguments[e];
								n.subscribers.forEach(function(e) {
									Q(function() {
										e.apply(null, t);
									});
								});
							});
						}
					});
				}
			}
			function Kt(e, t) {
				return U(t).from({ prototype: e }), t;
			}
			function Et(e, t) {
				return !(e.filter || e.algorithm || e.or) && (t ? e.justLimit : !e.replayFilter);
			}
			function St(e, t) {
				e.filter = pt(e.filter, t);
			}
			function At(e, t, n) {
				var r = e.replayFilter;
				e.replayFilter = r ? function() {
					return pt(r(), t());
				} : t, e.justLimit = n && !r;
			}
			function jt(e, t) {
				if (e.isPrimKey) return t.primaryKey;
				var n = t.getIndexByKeyPath(e.index);
				if (n) return n;
				throw new k.Schema("KeyPath " + e.index + " on object store " + t.name + " is not indexed");
			}
			function Ct(e, t, n) {
				var r = jt(e, t.schema);
				return t.openCursor({
					trans: n,
					values: !e.keysOnly,
					reverse: "prev" === e.dir,
					unique: !!e.unique,
					query: {
						index: r,
						range: e.range
					}
				});
			}
			function Tt(e, o, t, n) {
				var a, r, u = e.replayFilter ? pt(e.filter, e.replayFilter()) : e.filter;
				return e.or ? (a = {}, r = function(e, t, n) {
					var r, i;
					u && !u(t, n, function(e) {
						return t.stop(e);
					}, function(e) {
						return t.fail(e);
					}) || ("[object ArrayBuffer]" === (i = "" + (r = t.primaryKey)) && (i = "" + new Uint8Array(r)), m(a, i)) || (a[i] = !0, o(e, t, n));
				}, Promise.all([e.or._iterate(r, t), It(Ct(e, n, t), e.algorithm, r, !e.keysOnly && e.valueMapper)])) : It(Ct(e, n, t), pt(e.algorithm, u), o, !e.keysOnly && e.valueMapper);
			}
			function It(e, r, i, o) {
				var a = E(o ? function(e, t, n) {
					return i(o(e), t, n);
				} : i);
				return e.then(function(n) {
					if (n) return n.start(function() {
						var t = function() {
							return n.continue();
						};
						r && !r(n, function(e) {
							return t = e;
						}, function(e) {
							n.stop(e), t = g;
						}, function(e) {
							n.fail(e), t = g;
						}) || a(n.value, n, function(e) {
							return t = e;
						}), t();
					});
				});
			}
			i.prototype._read = function(e, t) {
				var n = this._ctx;
				return n.error ? n.table._trans(null, S.bind(null, n.error)) : n.table._trans("readonly", e).then(t);
			}, i.prototype._write = function(e) {
				var t = this._ctx;
				return t.error ? t.table._trans(null, S.bind(null, t.error)) : t.table._trans("readwrite", e, "locked");
			}, i.prototype._addAlgorithm = function(e) {
				var t = this._ctx;
				t.algorithm = pt(t.algorithm, e);
			}, i.prototype._iterate = function(e, t) {
				return Tt(this._ctx, e, t, this._ctx.table.core);
			}, i.prototype.clone = function(e) {
				var t = Object.create(this.constructor.prototype), n = Object.create(this._ctx);
				return e && a(n, e), t._ctx = n, t;
			}, i.prototype.raw = function() {
				return this._ctx.valueMapper = null, this;
			}, i.prototype.each = function(t) {
				var n = this._ctx;
				return this._read(function(e) {
					return Tt(n, t, e, n.table.core);
				});
			}, i.prototype.count = function(e) {
				var i = this;
				return this._read(function(e) {
					var t, n = i._ctx, r = n.table.core;
					return Et(n, !0) ? r.count({
						trans: e,
						query: {
							index: jt(n, r.schema),
							range: n.range
						}
					}).then(function(e) {
						return Math.min(e, n.limit);
					}) : (t = 0, Tt(n, function() {
						return ++t, !1;
					}, e, r).then(function() {
						return t;
					}));
				}).then(e);
			}, i.prototype.sortBy = function(e, t) {
				var n = e.split(".").reverse(), r = n[0], i = n.length - 1;
				function o(e, t) {
					return t ? o(e[n[t]], t - 1) : e[r];
				}
				var a = "next" === this._ctx.dir ? 1 : -1;
				function u(e, t) {
					return j(o(e, i), o(t, i)) * a;
				}
				return this.toArray(function(e) {
					return e.slice().sort(u);
				}).then(t);
			}, i.prototype.toArray = function(e) {
				var o = this;
				return this._read(function(e) {
					var t, n, r, i = o._ctx;
					return Et(i, !0) && 0 < i.limit ? (t = i.valueMapper, n = jt(i, i.table.core.schema), i.table.core.query({
						trans: e,
						limit: i.limit,
						values: !0,
						direction: "prev" === i.dir ? "prev" : void 0,
						query: {
							index: n,
							range: i.range
						}
					}).then(function(e) {
						e = e.result;
						return t ? e.map(t) : e;
					})) : (r = [], Tt(i, function(e) {
						return r.push(e);
					}, e, i.table.core).then(function() {
						return r;
					}));
				}, e);
			}, i.prototype.offset = function(t) {
				var e = this._ctx;
				return t <= 0 || (e.offset += t, Et(e) ? At(e, function() {
					var n = t;
					return function(e, t) {
						return 0 === n || (1 === n ? --n : t(function() {
							e.advance(n), n = 0;
						}), !1);
					};
				}) : At(e, function() {
					var e = t;
					return function() {
						return --e < 0;
					};
				})), this;
			}, i.prototype.limit = function(e) {
				return this._ctx.limit = Math.min(this._ctx.limit, e), At(this._ctx, function() {
					var r = e;
					return function(e, t, n) {
						return --r <= 0 && t(n), 0 <= r;
					};
				}, !0), this;
			}, i.prototype.until = function(r, i) {
				return St(this._ctx, function(e, t, n) {
					return !r(e.value) || (t(n), i);
				}), this;
			}, i.prototype.first = function(e) {
				return this.limit(1).toArray(function(e) {
					return e[0];
				}).then(e);
			}, i.prototype.last = function(e) {
				return this.reverse().first(e);
			}, i.prototype.filter = function(t) {
				var e;
				return St(this._ctx, function(e) {
					return t(e.value);
				}), (e = this._ctx).isMatch = pt(e.isMatch, t), this;
			}, i.prototype.and = function(e) {
				return this.filter(e);
			}, i.prototype.or = function(e) {
				return new this.db.WhereClause(this._ctx.table, e, this);
			}, i.prototype.reverse = function() {
				return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
			}, i.prototype.desc = function() {
				return this.reverse();
			}, i.prototype.eachKey = function(n) {
				var e = this._ctx;
				return e.keysOnly = !e.isMatch, this.each(function(e, t) {
					n(t.key, t);
				});
			}, i.prototype.eachUniqueKey = function(e) {
				return this._ctx.unique = "unique", this.eachKey(e);
			}, i.prototype.eachPrimaryKey = function(n) {
				var e = this._ctx;
				return e.keysOnly = !e.isMatch, this.each(function(e, t) {
					n(t.primaryKey, t);
				});
			}, i.prototype.keys = function(e) {
				var t = this._ctx, n = (t.keysOnly = !t.isMatch, []);
				return this.each(function(e, t) {
					n.push(t.key);
				}).then(function() {
					return n;
				}).then(e);
			}, i.prototype.primaryKeys = function(e) {
				var n = this._ctx;
				if (Et(n, !0) && 0 < n.limit) return this._read(function(e) {
					var t = jt(n, n.table.core.schema);
					return n.table.core.query({
						trans: e,
						values: !1,
						limit: n.limit,
						direction: "prev" === n.dir ? "prev" : void 0,
						query: {
							index: t,
							range: n.range
						}
					});
				}).then(function(e) {
					return e.result;
				}).then(e);
				n.keysOnly = !n.isMatch;
				var r = [];
				return this.each(function(e, t) {
					r.push(t.primaryKey);
				}).then(function() {
					return r;
				}).then(e);
			}, i.prototype.uniqueKeys = function(e) {
				return this._ctx.unique = "unique", this.keys(e);
			}, i.prototype.firstKey = function(e) {
				return this.limit(1).keys(function(e) {
					return e[0];
				}).then(e);
			}, i.prototype.lastKey = function(e) {
				return this.reverse().firstKey(e);
			}, i.prototype.distinct = function() {
				var n, e = this._ctx, e = e.index && e.table.schema.idxByName[e.index];
				return e && e.multi && (n = {}, St(this._ctx, function(e) {
					var e = e.primaryKey.toString(), t = m(n, e);
					return n[e] = !0, !t;
				})), this;
			}, i.prototype.modify = function(x) {
				var n = this, k = this._ctx;
				return this._write(function(p) {
					function y(e, t) {
						var n = t.failures;
						u += e - t.numFailures;
						for (var r = 0, i = O(n); r < i.length; r++) {
							var o = i[r];
							a.push(n[o]);
						}
					}
					var v = "function" == typeof x ? x : function(e) {
						return kt(e, x);
					}, m = k.table.core, e = m.schema.primaryKey, b = e.outbound, g = e.extractKey, w = 200, e = n.db._options.modifyChunkSize, a = (e && (w = "object" == typeof e ? e[m.name] || e["*"] || 200 : e), []), u = 0, t = [], _ = x === Dt;
					return n.clone().primaryKeys().then(function(f) {
						function h(s) {
							var c = Math.min(w, f.length - s), l = f.slice(s, s + c);
							return (_ ? Promise.resolve([]) : m.getMany({
								trans: p,
								keys: l,
								cache: "immutable"
							})).then(function(e) {
								var n = [], t = [], r = b ? [] : null, i = _ ? l : [];
								if (!_) for (var o = 0; o < c; ++o) {
									var a = e[o], u = {
										value: ee(a),
										primKey: f[s + o]
									};
									!1 !== v.call(u, u.value, u) && (null == u.value ? i.push(f[s + o]) : b || 0 === j(g(a), g(u.value)) ? (t.push(u.value), b && r.push(f[s + o])) : (i.push(f[s + o]), n.push(u.value)));
								}
								return Promise.resolve(0 < n.length && m.mutate({
									trans: p,
									type: "add",
									values: n
								}).then(function(e) {
									for (var t in e.failures) i.splice(parseInt(t), 1);
									y(n.length, e);
								})).then(function() {
									return (0 < t.length || d && "object" == typeof x) && m.mutate({
										trans: p,
										type: "put",
										keys: r,
										values: t,
										criteria: d,
										changeSpec: "function" != typeof x && x,
										isAdditionalChunk: 0 < s
									}).then(function(e) {
										return y(t.length, e);
									});
								}).then(function() {
									return (0 < i.length || d && _) && m.mutate({
										trans: p,
										type: "delete",
										keys: i,
										criteria: d,
										isAdditionalChunk: 0 < s
									}).then(function(e) {
										return wt(k.table, i, e);
									}).then(function(e) {
										return y(i.length, e);
									});
								}).then(function() {
									return f.length > s + c && h(s + w);
								});
							});
						}
						var d = Et(k) && k.limit === 1 / 0 && ("function" != typeof x || _) && {
							index: k.index,
							range: k.range
						};
						return h(0).then(function() {
							if (0 < a.length) throw new fe("Error modifying one or more objects", a, u, t);
							return f.length;
						});
					});
				});
			}, i.prototype.delete = function() {
				var i = this._ctx, n = i.range;
				return !Et(i) || i.table.schema.yProps || !i.isPrimKey && 3 !== n.type ? this.modify(Dt) : this._write(function(e) {
					var t = i.table.core.schema.primaryKey, r = n;
					return i.table.core.count({
						trans: e,
						query: {
							index: t,
							range: r
						}
					}).then(function(n) {
						return i.table.core.mutate({
							trans: e,
							type: "deleteRange",
							range: r
						}).then(function(e) {
							var t = e.failures, e = e.numFailures;
							if (e) throw new fe("Could not delete some values", Object.keys(t).map(function(e) {
								return t[e];
							}), n - e);
							return n - e;
						});
					});
				});
			};
			var qt = i;
			function i() {}
			var Dt = function(e, t) {
				return t.value = null;
			};
			function Bt(e, t) {
				return e < t ? -1 : e === t ? 0 : 1;
			}
			function Rt(e, t) {
				return t < e ? -1 : e === t ? 0 : 1;
			}
			function C(e, t, n) {
				e = e instanceof Lt ? new e.Collection(e) : e;
				return e._ctx.error = new (n || TypeError)(t), e;
			}
			function Ft(e) {
				return new e.Collection(e, function() {
					return Mt("");
				}).limit(0);
			}
			function Nt(e, s, n, r) {
				var i, c, l, f, h, d, p, y = n.length;
				if (!n.every(function(e) {
					return "string" == typeof e;
				})) return C(e, lt);
				function t(e) {
					i = "next" === e ? function(e) {
						return e.toUpperCase();
					} : function(e) {
						return e.toLowerCase();
					}, c = "next" === e ? function(e) {
						return e.toLowerCase();
					} : function(e) {
						return e.toUpperCase();
					}, l = "next" === e ? Bt : Rt;
					var t = n.map(function(e) {
						return {
							lower: c(e),
							upper: i(e)
						};
					}).sort(function(e, t) {
						return l(e.lower, t.lower);
					});
					f = t.map(function(e) {
						return e.upper;
					}), h = t.map(function(e) {
						return e.lower;
					}), p = "next" === (d = e) ? "" : r;
				}
				t("next");
				var e = new e.Collection(e, function() {
					return T(f[0], h[y - 1] + r);
				}), v = (e._ondirectionchange = function(e) {
					t(e);
				}, 0);
				return e._addAlgorithm(function(e, t, n) {
					var r = e.key;
					if ("string" == typeof r) {
						var i = c(r);
						if (s(i, h, v)) return !0;
						for (var o = null, a = v; a < y; ++a) {
							var u = ((e, t, n, r, i, o) => {
								for (var a = Math.min(e.length, r.length), u = -1, s = 0; s < a; ++s) {
									var c = t[s];
									if (c !== r[s]) return i(e[s], n[s]) < 0 ? e.substr(0, s) + n[s] + n.substr(s + 1) : i(e[s], r[s]) < 0 ? e.substr(0, s) + r[s] + n.substr(s + 1) : 0 <= u ? e.substr(0, u) + t[u] + n.substr(u + 1) : null;
									i(e[s], c) < 0 && (u = s);
								}
								return a < r.length && "next" === o ? e + n.substr(e.length) : a < e.length && "prev" === o ? e.substr(0, n.length) : u < 0 ? null : e.substr(0, u) + r[u] + n.substr(u + 1);
							})(r, i, f[a], h[a], l, d);
							null === u && null === o ? v = a + 1 : (null === o || 0 < l(o, u)) && (o = u);
						}
						t(null !== o ? function() {
							e.continue(o + p);
						} : n);
					}
					return !1;
				}), e;
			}
			function T(e, t, n, r) {
				return {
					type: 2,
					lower: e,
					upper: t,
					lowerOpen: n,
					upperOpen: r
				};
			}
			function Mt(e) {
				return {
					type: 1,
					lower: e,
					upper: e
				};
			}
			Object.defineProperty(d.prototype, "Collection", {
				get: function() {
					return this._ctx.table.db.Collection;
				},
				enumerable: !1,
				configurable: !0
			}), d.prototype.between = function(e, t, n, r) {
				n = !1 !== n, r = !0 === r;
				try {
					return 0 < this._cmp(e, t) || 0 === this._cmp(e, t) && (n || r) && (!n || !r) ? Ft(this) : new this.Collection(this, function() {
						return T(e, t, !n, !r);
					});
				} catch (e) {
					return C(this, A);
				}
			}, d.prototype.equals = function(e) {
				return null == e ? C(this, A) : new this.Collection(this, function() {
					return Mt(e);
				});
			}, d.prototype.above = function(e) {
				return null == e ? C(this, A) : new this.Collection(this, function() {
					return T(e, void 0, !0);
				});
			}, d.prototype.aboveOrEqual = function(e) {
				return null == e ? C(this, A) : new this.Collection(this, function() {
					return T(e, void 0, !1);
				});
			}, d.prototype.below = function(e) {
				return null == e ? C(this, A) : new this.Collection(this, function() {
					return T(void 0, e, !1, !0);
				});
			}, d.prototype.belowOrEqual = function(e) {
				return null == e ? C(this, A) : new this.Collection(this, function() {
					return T(void 0, e);
				});
			}, d.prototype.startsWith = function(e) {
				return "string" != typeof e ? C(this, lt) : this.between(e, e + ct, !0, !0);
			}, d.prototype.startsWithIgnoreCase = function(e) {
				return "" === e ? this.startsWith(e) : Nt(this, function(e, t) {
					return 0 === e.indexOf(t[0]);
				}, [e], ct);
			}, d.prototype.equalsIgnoreCase = function(e) {
				return Nt(this, function(e, t) {
					return e === t[0];
				}, [e], "");
			}, d.prototype.anyOfIgnoreCase = function() {
				var e = n.apply(ae, arguments);
				return 0 === e.length ? Ft(this) : Nt(this, function(e, t) {
					return -1 !== t.indexOf(e);
				}, e, "");
			}, d.prototype.startsWithAnyOfIgnoreCase = function() {
				var e = n.apply(ae, arguments);
				return 0 === e.length ? Ft(this) : Nt(this, function(t, e) {
					return e.some(function(e) {
						return 0 === t.indexOf(e);
					});
				}, e, ct);
			}, d.prototype.anyOf = function() {
				var e, i, t = this, o = n.apply(ae, arguments), a = this._cmp;
				try {
					o.sort(a);
				} catch (e) {
					return C(this, A);
				}
				return 0 === o.length ? Ft(this) : ((e = new this.Collection(this, function() {
					return T(o[0], o[o.length - 1]);
				}))._ondirectionchange = function(e) {
					a = "next" === e ? t._ascending : t._descending, o.sort(a);
				}, i = 0, e._addAlgorithm(function(e, t, n) {
					for (var r = e.key; 0 < a(r, o[i]);) if (++i === o.length) return t(n), !1;
					return 0 === a(r, o[i]) || (t(function() {
						e.continue(o[i]);
					}), !1);
				}), e);
			}, d.prototype.notEqual = function(e) {
				return this.inAnyRange([[-1 / 0, e], [e, this.db._maxKey]], {
					includeLowers: !1,
					includeUppers: !1
				});
			}, d.prototype.noneOf = function() {
				var e = n.apply(ae, arguments);
				if (0 === e.length) return new this.Collection(this);
				try {
					e.sort(this._ascending);
				} catch (e) {
					return C(this, A);
				}
				var t = e.reduce(function(e, t) {
					return e ? e.concat([[e[e.length - 1][1], t]]) : [[-1 / 0, t]];
				}, null);
				return t.push([e[e.length - 1], this.db._maxKey]), this.inAnyRange(t, {
					includeLowers: !1,
					includeUppers: !1
				});
			}, d.prototype.inAnyRange = function(e, t) {
				var o = this, a = this._cmp, u = this._ascending, n = this._descending, s = this._min, c = this._max;
				if (0 === e.length) return Ft(this);
				if (!e.every(function(e) {
					return void 0 !== e[0] && void 0 !== e[1] && u(e[0], e[1]) <= 0;
				})) return C(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", k.InvalidArgument);
				var r = !t || !1 !== t.includeLowers, i = t && !0 === t.includeUppers;
				var l, f = u;
				function h(e, t) {
					return f(e[0], t[0]);
				}
				try {
					(l = e.reduce(function(e, t) {
						for (var n = 0, r = e.length; n < r; ++n) {
							var i = e[n];
							if (a(t[0], i[1]) < 0 && 0 < a(t[1], i[0])) {
								i[0] = s(i[0], t[0]), i[1] = c(i[1], t[1]);
								break;
							}
						}
						return n === r && e.push(t), e;
					}, [])).sort(h);
				} catch (e) {
					return C(this, A);
				}
				var d = 0, p = i ? function(e) {
					return 0 < u(e, l[d][1]);
				} : function(e) {
					return 0 <= u(e, l[d][1]);
				}, y = r ? function(e) {
					return 0 < n(e, l[d][0]);
				} : function(e) {
					return 0 <= n(e, l[d][0]);
				};
				var v = p, t = new this.Collection(this, function() {
					return T(l[0][0], l[l.length - 1][1], !r, !i);
				});
				return t._ondirectionchange = function(e) {
					f = "next" === e ? (v = p, u) : (v = y, n), l.sort(h);
				}, t._addAlgorithm(function(e, t, n) {
					for (var r, i = e.key; v(i);) if (++d === l.length) return t(n), !1;
					return !p(r = i) && !y(r) || (0 === o._cmp(i, l[d][1]) || 0 === o._cmp(i, l[d][0]) || t(function() {
						f === u ? e.continue(l[d][0]) : e.continue(l[d][1]);
					}), !1);
				}), t;
			}, d.prototype.startsWithAnyOf = function() {
				var e = n.apply(ae, arguments);
				return e.every(function(e) {
					return "string" == typeof e;
				}) ? 0 === e.length ? Ft(this) : this.inAnyRange(e.map(function(e) {
					return [e, e + ct];
				})) : C(this, "startsWithAnyOf() only works with strings");
			};
			var Lt = d;
			function d() {}
			function I(t) {
				return E(function(e) {
					return Ut(e), t(e.target.error), !1;
				});
			}
			function Ut(e) {
				e.stopPropagation && e.stopPropagation(), e.preventDefault && e.preventDefault();
			}
			var zt = "storagemutated", Vt = "x-storagemutated-1", Wt = Pt(null, zt), Yt = (p.prototype._lock = function() {
				return $(!P.global), ++this._reculock, 1 !== this._reculock || P.global || (P.lockOwnerFor = this), this;
			}, p.prototype._unlock = function() {
				if ($(!P.global), 0 == --this._reculock) for (P.global || (P.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked();) {
					var e = this._blockedFuncs.shift();
					try {
						at(e[1], e[0]);
					} catch (e) {}
				}
				return this;
			}, p.prototype._locked = function() {
				return this._reculock && P.lockOwnerFor !== this;
			}, p.prototype.create = function(t) {
				var n = this;
				if (this.mode) {
					var e = this.db.idbdb, r = this.db._state.dbOpenError;
					if ($(!this.idbtrans), !t && !e) switch (r && r.name) {
						case "DatabaseClosedError": throw new k.DatabaseClosed(r);
						case "MissingAPIError": throw new k.MissingAPI(r.message, r);
						default: throw new k.OpenFailed(r);
					}
					if (!this.active) throw new k.TransactionInactive();
					$(null === this._completion._state), (t = this.idbtrans = t || (this.db.core || e).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = E(function(e) {
						Ut(e), n._reject(t.error);
					}), t.onabort = E(function(e) {
						Ut(e), n.active && n._reject(new k.Abort(t.error)), n.active = !1, n.on("abort").fire(e);
					}), t.oncomplete = E(function() {
						n.active = !1, n._resolve(), "mutatedParts" in t && Wt.storagemutated.fire(t.mutatedParts);
					});
				}
				return this;
			}, p.prototype._promise = function(n, r, i) {
				var e, o = this;
				return "readwrite" === n && "readwrite" !== this.mode ? S(new k.ReadOnly("Transaction is readonly")) : this.active ? this._locked() ? new K(function(e, t) {
					o._blockedFuncs.push([function() {
						o._promise(n, r, i).then(e, t);
					}, P]);
				}) : i ? v(function() {
					var e = new K(function(e, t) {
						o._lock();
						var n = r(e, t, o);
						n && n.then && n.then(e, t);
					});
					return e.finally(function() {
						return o._unlock();
					}), e._lib = !0, e;
				}) : ((e = new K(function(e, t) {
					var n = r(e, t, o);
					n && n.then && n.then(e, t);
				}))._lib = !0, e) : S(new k.TransactionInactive());
			}, p.prototype._root = function() {
				return this.parent ? this.parent._root() : this;
			}, p.prototype.waitFor = function(e) {
				var t, r = this._root(), i = K.resolve(e), o = (r._waitingFor ? r._waitingFor = r._waitingFor.then(function() {
					return i;
				}) : (r._waitingFor = i, r._waitingQueue = [], t = r.idbtrans.objectStore(r.storeNames[0]), function e() {
					for (++r._spinCount; r._waitingQueue.length;) r._waitingQueue.shift()();
					r._waitingFor && (t.get(-1 / 0).onsuccess = e);
				}()), r._waitingFor);
				return new K(function(t, n) {
					i.then(function(e) {
						return r._waitingQueue.push(E(t.bind(null, e)));
					}, function(e) {
						return r._waitingQueue.push(E(n.bind(null, e)));
					}).finally(function() {
						r._waitingFor === o && (r._waitingFor = null);
					});
				});
			}, p.prototype.abort = function() {
				this.active && (this.active = !1, this.idbtrans && this.idbtrans.abort(), this._reject(new k.Abort()));
			}, p.prototype.table = function(e) {
				var t = this._memoizedTables || (this._memoizedTables = {});
				if (m(t, e)) return t[e];
				var n = this.schema[e];
				if (n) return (n = new this.db.Table(e, n, this)).core = this.db.core.table(e), t[e] = n;
				throw new k.NotFound("Table " + e + " not part of transaction");
			}, p);
			function p() {}
			function $t(e, t, n, r, i, o, a, u) {
				return {
					name: e,
					keyPath: t,
					unique: n,
					multi: r,
					auto: i,
					compound: o,
					src: (n && !a ? "&" : "") + (r ? "*" : "") + (i ? "++" : "") + Qt(t),
					type: u
				};
			}
			function Qt(e) {
				return "string" == typeof e ? e : e ? "[" + [].join.call(e, "+") + "]" : "";
			}
			function Gt(e, t, n) {
				return {
					name: e,
					primKey: t,
					indexes: n,
					mappedClass: null,
					idxByName: (r = function(e) {
						return [e.name, e];
					}, n.reduce(function(e, t, n) {
						t = r(t, n);
						return t && (e[t[0]] = t[1]), e;
					}, {}))
				};
				var r;
			}
			var Xt = function(e) {
				try {
					return e.only([[]]), Xt = function() {
						return [[]];
					}, [[]];
				} catch (e) {
					return Xt = function() {
						return ct;
					}, ct;
				}
			};
			function Ht(t) {
				return null == t ? function() {} : "string" == typeof t ? 1 === (n = t).split(".").length ? function(e) {
					return e[n];
				} : function(e) {
					return c(e, n);
				} : function(e) {
					return c(e, t);
				};
				var n;
			}
			function Jt(e) {
				return [].slice.call(e);
			}
			var Zt = 0;
			function en(e) {
				return null == e ? ":id" : "string" == typeof e ? e : "[".concat(e.join("+"), "]");
			}
			function tn(e, i, t) {
				function _(e) {
					if (3 === e.type) return null;
					if (4 === e.type) throw new Error("Cannot convert never type to IDBKeyRange");
					var t = e.lower, n = e.upper, r = e.lowerOpen, e = e.upperOpen;
					return void 0 === t ? void 0 === n ? null : i.upperBound(n, !!e) : void 0 === n ? i.lowerBound(t, !!r) : i.bound(t, n, !!r, !!e);
				}
				function n(e) {
					var p, y, w = e.name;
					return {
						name: w,
						schema: e,
						mutate: function(e) {
							var y = e.trans, v = e.type, m = e.keys, b = e.values, g = e.range;
							return new Promise(function(t, e) {
								t = E(t);
								var n = y.objectStore(w), r = null == n.keyPath, i = "put" === v || "add" === v;
								if (!i && "delete" !== v && "deleteRange" !== v) throw new Error("Invalid operation type: " + v);
								var o, a = (m || b || { length: 1 }).length;
								if (m && b && m.length !== b.length) throw new Error("Given keys array must have same length as given values array.");
								if (0 === a) return t({
									numFailures: 0,
									failures: {},
									results: [],
									lastResult: void 0
								});
								function u(e) {
									++l, Ut(e);
								}
								var s = [], c = [], l = 0;
								if ("deleteRange" === v) {
									if (4 === g.type) return t({
										numFailures: l,
										failures: c,
										results: [],
										lastResult: void 0
									});
									3 === g.type ? s.push(o = n.clear()) : s.push(o = n.delete(_(g)));
								} else {
									var r = i ? r ? [b, m] : [b, null] : [m, null], f = r[0], h = r[1];
									if (i) for (var d = 0; d < a; ++d) s.push(o = h && void 0 !== h[d] ? n[v](f[d], h[d]) : n[v](f[d])), o.onerror = u;
									else for (d = 0; d < a; ++d) s.push(o = n[v](f[d])), o.onerror = u;
								}
								function p(e) {
									e = e.target.result, s.forEach(function(e, t) {
										return null != e.error && (c[t] = e.error);
									}), t({
										numFailures: l,
										failures: c,
										results: "delete" === v ? m : s.map(function(e) {
											return e.result;
										}),
										lastResult: e
									});
								}
								o.onerror = function(e) {
									u(e), p(e);
								}, o.onsuccess = p;
							});
						},
						getMany: function(e) {
							var f = e.trans, h = e.keys;
							return new Promise(function(t, e) {
								t = E(t);
								for (var n, r = f.objectStore(w), i = h.length, o = new Array(i), a = 0, u = 0, s = function(e) {
									e = e.target;
									o[e._pos] = e.result, ++u === a && t(o);
								}, c = I(e), l = 0; l < i; ++l) null != h[l] && ((n = r.get(h[l]))._pos = l, n.onsuccess = s, n.onerror = c, ++a);
								0 === a && t(o);
							});
						},
						get: function(e) {
							var r = e.trans, i = e.key;
							return new Promise(function(t, e) {
								t = E(t);
								var n = r.objectStore(w).get(i);
								n.onsuccess = function(e) {
									return t(e.target.result);
								}, n.onerror = I(e);
							});
						},
						query: (p = a, y = u, function(d) {
							return new Promise(function(t, e) {
								t = E(t);
								var n, r, i, o, a = d.trans, u = d.values, s = d.limit, c = d.query, l = null != (l = d.direction) ? l : "next", f = s === 1 / 0 ? void 0 : s, h = c.index, c = c.range, a = a.objectStore(w), a = h.isPrimaryKey ? a : a.index(h.name), h = _(c);
								if (0 === s) return t({ result: [] });
								y ? (c = {
									query: h,
									count: f,
									direction: l
								}, (n = u ? a.getAll(c) : a.getAllKeys(c)).onsuccess = function(e) {
									return t({ result: e.target.result });
								}, n.onerror = I(e)) : p && "next" === l ? ((n = u ? a.getAll(h, f) : a.getAllKeys(h, f)).onsuccess = function(e) {
									return t({ result: e.target.result });
								}, n.onerror = I(e)) : (r = 0, i = !u && "openKeyCursor" in a ? a.openKeyCursor(h, l) : a.openCursor(h, l), o = [], i.onsuccess = function() {
									var e = i.result;
									return !e || (o.push(u ? e.value : e.primaryKey), ++r === s) ? t({ result: o }) : void e.continue();
								}, i.onerror = I(e));
							});
						}),
						openCursor: function(e) {
							var c = e.trans, o = e.values, a = e.query, u = e.reverse, l = e.unique;
							return new Promise(function(t, n) {
								t = E(t);
								var e = a.index, r = a.range, i = c.objectStore(w), i = e.isPrimaryKey ? i : i.index(e.name), e = u ? l ? "prevunique" : "prev" : l ? "nextunique" : "next", s = !o && "openKeyCursor" in i ? i.openKeyCursor(_(r), e) : i.openCursor(_(r), e);
								s.onerror = I(n), s.onsuccess = E(function(e) {
									var r, i, o, a, u = s.result;
									u ? (u.___id = ++Zt, u.done = !1, r = u.continue.bind(u), i = (i = u.continuePrimaryKey) && i.bind(u), o = u.advance.bind(u), a = function() {
										throw new Error("Cursor not stopped");
									}, u.trans = c, u.stop = u.continue = u.continuePrimaryKey = u.advance = function() {
										throw new Error("Cursor not started");
									}, u.fail = E(n), u.next = function() {
										var e = this, t = 1;
										return this.start(function() {
											return t-- ? e.continue() : e.stop();
										}).then(function() {
											return e;
										});
									}, u.start = function(e) {
										function t() {
											if (s.result) try {
												e();
											} catch (e) {
												u.fail(e);
											}
											else u.done = !0, u.start = function() {
												throw new Error("Cursor behind last entry");
											}, u.stop();
										}
										var n = new Promise(function(t, e) {
											t = E(t), s.onerror = I(e), u.fail = e, u.stop = function(e) {
												u.stop = u.continue = u.continuePrimaryKey = u.advance = a, t(e);
											};
										});
										return s.onsuccess = E(function(e) {
											s.onsuccess = t, t();
										}), u.continue = r, u.continuePrimaryKey = i, u.advance = o, t(), n;
									}, t(u)) : t(null);
								}, n);
							});
						},
						count: function(e) {
							var t = e.query, i = e.trans, o = t.index, a = t.range;
							return new Promise(function(t, e) {
								var n = i.objectStore(w), n = o.isPrimaryKey ? n : n.index(o.name), r = _(a), r = r ? n.count(r) : n.count();
								r.onsuccess = E(function(e) {
									return t(e.target.result);
								}), r.onerror = I(e);
							});
						}
					};
				}
				r = t, o = Jt((t = e).objectStoreNames), s = 0 < o.length ? r.objectStore(o[0]) : {};
				var r, t = {
					schema: {
						name: t.name,
						tables: o.map(function(e) {
							return r.objectStore(e);
						}).map(function(t) {
							var e = t.keyPath, n = t.autoIncrement, r = x(e), i = {}, r = {
								name: t.name,
								primaryKey: {
									name: null,
									isPrimaryKey: !0,
									outbound: null == e,
									compound: r,
									keyPath: e,
									autoIncrement: n,
									unique: !0,
									extractKey: Ht(e)
								},
								indexes: Jt(t.indexNames).map(function(e) {
									return t.index(e);
								}).map(function(e) {
									var t = e.name, n = e.unique, r = e.multiEntry, e = e.keyPath, t = {
										name: t,
										compound: x(e),
										keyPath: e,
										unique: n,
										multiEntry: r,
										extractKey: Ht(e)
									};
									return i[en(e)] = t;
								}),
								getIndexByKeyPath: function(e) {
									return i[en(e)];
								}
							};
							return i[":id"] = r.primaryKey, null != e && (i[en(e)] = r.primaryKey), r;
						})
					},
					hasGetAll: 0 < o.length && "getAll" in s && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604),
					hasIdb3Features: "getAllRecords" in s
				}, o = t.schema, a = t.hasGetAll, u = t.hasIdb3Features, s = o.tables.map(n), c = {};
				return s.forEach(function(e) {
					return c[e.name] = e;
				}), {
					stack: "dbcore",
					transaction: e.transaction.bind(e),
					table: function(e) {
						if (c[e]) return c[e];
						throw new Error("Table '".concat(e, "' not found"));
					},
					MIN_KEY: -1 / 0,
					MAX_KEY: Xt(i),
					schema: o
				};
			}
			function nn(e, t, n, r) {
				n = n.IDBKeyRange;
				return t = tn(t, n, r), { dbcore: e.dbcore.reduce(function(e, t) {
					t = t.create;
					return _(_({}, e), t(e));
				}, t) };
			}
			function rn(n, e) {
				var t = e.db, t = nn(n._middlewares, t, n._deps, e);
				n.core = t.dbcore, n.tables.forEach(function(e) {
					var t = e.name;
					n.core.schema.tables.some(function(e) {
						return e.name === t;
					}) && (e.core = n.core.table(t), n[t] instanceof n.Table) && (n[t].core = e.core);
				});
			}
			function on(i, e, t, o) {
				t.forEach(function(n) {
					var r = o[n];
					e.forEach(function(e) {
						var t = function e(t, n) {
							return z(t, n) || (t = F(t)) && e(t, n);
						}(e, n);
						(!t || "value" in t && void 0 === t.value) && (e === i.Transaction.prototype || e instanceof i.Transaction ? u(e, n, {
							get: function() {
								return this.table(n);
							},
							set: function(e) {
								L(this, n, {
									value: e,
									writable: !0,
									configurable: !0,
									enumerable: !0
								});
							}
						}) : e[n] = new i.Table(n, r));
					});
				});
			}
			function an(n, e) {
				e.forEach(function(e) {
					for (var t in e) e[t] instanceof n.Table && delete e[t];
				});
			}
			function un(e, t) {
				return e._cfg.version - t._cfg.version;
			}
			function sn(n, r, i, e) {
				var o = n._dbSchema, a = (i.objectStoreNames.contains("$meta") && !o.$meta && (o.$meta = Gt("$meta", vn("")[0], []), n._storeNames.push("$meta")), n._createTransaction("readwrite", n._storeNames, o)), u = (a.create(i), a._completion.catch(e), a._reject.bind(a)), s = P.transless || P;
				v(function() {
					if (P.trans = a, P.transless = s, 0 !== r) return rn(n, i), t = r, ((e = a).storeNames.includes("$meta") ? e.table("$meta").get("version").then(function(e) {
						return null != e ? e : t;
					}) : K.resolve(t)).then(function(e) {
						var s = n, c = e, l = a, f = i, t = [], e = s._versions, h = s._dbSchema = pn(0, s.idbdb, f);
						return 0 === (e = e.filter(function(e) {
							return e._cfg.version >= c;
						})).length ? K.resolve() : (e.forEach(function(u) {
							t.push(function() {
								var t, n, r, i = h, e = u._cfg.dbschema, o = (yn(s, i, f), yn(s, e, f), h = s._dbSchema = e, ln(i, e)), a = (o.add.forEach(function(e) {
									fn(f, e[0], e[1].primKey, e[1].indexes);
								}), o.change.forEach(function(e) {
									if (e.recreate) throw new k.Upgrade("Not yet support for changing primary key");
									var t = f.objectStore(e.name);
									e.add.forEach(function(e) {
										return dn(t, e);
									}), e.change.forEach(function(e) {
										t.deleteIndex(e.name), dn(t, e);
									}), e.del.forEach(function(e) {
										return t.deleteIndex(e);
									});
								}), u._cfg.contentUpgrade);
								if (a && u._cfg.version > c) return rn(s, f), l._memoizedTables = {}, t = G(e), o.del.forEach(function(e) {
									t[e] = i[e];
								}), an(s, [s.Transaction.prototype]), on(s, [s.Transaction.prototype], O(t), t), l.schema = t, (n = ue(a)) && nt(), e = K.follow(function() {
									var e;
									(r = a(l)) && n && (e = w.bind(null, null), r.then(e, e));
								}), r && "function" == typeof r.then ? K.resolve(r) : e.then(function() {
									return r;
								});
							}), t.push(function(e) {
								var t = u._cfg.dbschema, n = e;
								[].slice.call(n.db.objectStoreNames).forEach(function(e) {
									return null == t[e] && n.db.deleteObjectStore(e);
								}), an(s, [s.Transaction.prototype]), on(s, [s.Transaction.prototype], s._storeNames, s._dbSchema), l.schema = s._dbSchema;
							}), t.push(function(e) {
								s.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s.idbdb.version / 10) === u._cfg.version ? (s.idbdb.deleteObjectStore("$meta"), delete s._dbSchema.$meta, s._storeNames = s._storeNames.filter(function(e) {
									return "$meta" !== e;
								})) : e.objectStore("$meta").put(u._cfg.version, "version"));
							});
						}), function e() {
							return t.length ? K.resolve(t.shift()(l.idbtrans)).then(e) : K.resolve();
						}().then(function() {
							hn(h, f);
						}));
					}).catch(u);
					var e, t;
					O(o).forEach(function(e) {
						fn(i, e, o[e].primKey, o[e].indexes);
					}), rn(n, i), K.follow(function() {
						return n.on.populate.fire(a);
					}).catch(u);
				});
			}
			function cn(e, r) {
				hn(e._dbSchema, r), r.db.version % 10 != 0 || r.objectStoreNames.contains("$meta") || r.db.createObjectStore("$meta").add(Math.ceil(r.db.version / 10 - 1), "version");
				var t = pn(0, e.idbdb, r);
				yn(e, e._dbSchema, r);
				for (var n = 0, i = ln(t, e._dbSchema).change; n < i.length; n++) {
					var o = ((t) => {
						if (t.change.length || t.recreate) return console.warn("Unable to patch indexes of table ".concat(t.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
						var n = r.objectStore(t.name);
						t.add.forEach(function(e) {
							l && console.debug("Dexie upgrade patch: Creating missing index ".concat(t.name, ".").concat(e.src)), dn(n, e);
						});
					})(i[n]);
					if ("object" == typeof o) return o.value;
				}
			}
			function ln(e, t) {
				var n, r = {
					del: [],
					add: [],
					change: []
				};
				for (n in e) t[n] || r.del.push(n);
				for (n in t) {
					var i = e[n], o = t[n];
					if (i) {
						var a = {
							name: n,
							def: o,
							recreate: !1,
							del: [],
							add: [],
							change: []
						};
						if ("" + (i.primKey.keyPath || "") != "" + (o.primKey.keyPath || "") || i.primKey.auto !== o.primKey.auto) a.recreate = !0, r.change.push(a);
						else {
							var u = i.idxByName, s = o.idxByName, c = void 0;
							for (c in u) s[c] || a.del.push(c);
							for (c in s) {
								var l = u[c], f = s[c];
								l ? l.src !== f.src && a.change.push(f) : a.add.push(f);
							}
							(0 < a.del.length || 0 < a.add.length || 0 < a.change.length) && r.change.push(a);
						}
					} else r.add.push([n, o]);
				}
				return r;
			}
			function fn(e, t, n, r) {
				var i = e.db.createObjectStore(t, n.keyPath ? {
					keyPath: n.keyPath,
					autoIncrement: n.auto
				} : { autoIncrement: n.auto });
				r.forEach(function(e) {
					return dn(i, e);
				});
			}
			function hn(t, n) {
				O(t).forEach(function(e) {
					n.db.objectStoreNames.contains(e) || (l && console.debug("Dexie: Creating missing table", e), fn(n, e, t[e].primKey, t[e].indexes));
				});
			}
			function dn(e, t) {
				e.createIndex(t.name, t.keyPath, {
					unique: t.unique,
					multiEntry: t.multi
				});
			}
			function pn(e, t, u) {
				var s = {};
				return W(t.objectStoreNames, 0).forEach(function(e) {
					for (var t = u.objectStore(e), n = $t(Qt(a = t.keyPath), a || "", !0, !1, !!t.autoIncrement, a && "string" != typeof a, !0), r = [], i = 0; i < t.indexNames.length; ++i) {
						var o = t.index(t.indexNames[i]), a = o.keyPath, o = $t(o.name, a, !!o.unique, !!o.multiEntry, !1, a && "string" != typeof a, !1);
						r.push(o);
					}
					s[e] = Gt(e, n, r);
				}), s;
			}
			function yn(e, t, n) {
				for (var r = n.db.objectStoreNames, i = 0; i < r.length; ++i) {
					var o = r[i], a = n.objectStore(o);
					e._hasGetAll = "getAll" in a;
					for (var u = 0; u < a.indexNames.length; ++u) {
						var s, c = a.indexNames[u], l = a.index(c).keyPath, l = "string" == typeof l ? l : "[" + W(l).join("+") + "]";
						t[o] && (s = t[o].idxByName[l]) && (s.name = c, delete t[o].idxByName[l], t[o].idxByName[c] = s);
					}
				}
				"undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e._hasGetAll = !1);
			}
			function vn(e) {
				return e.split(",").map(function(e, t) {
					var n = e.split(":"), r = null == (r = n[1]) ? void 0 : r.trim(), n = (e = n[0].trim()).replace(/([&*]|\+\+)/g, ""), i = /^\[/.test(n) ? n.match(/^\[(.*)\]$/)[1].split("+") : n;
					return $t(n, i || null, /\&/.test(e), /\*/.test(e), /\+\+/.test(e), x(i), 0 === t, r);
				});
			}
			bn.prototype._createTableSchema = Gt, bn.prototype._parseIndexSyntax = vn, bn.prototype._parseStoresSpec = function(r, i) {
				var o = this;
				O(r).forEach(function(e) {
					if (null !== r[e]) {
						var t = o._parseIndexSyntax(r[e]), n = t.shift();
						if (!n) throw new k.Schema("Invalid schema for table " + e + ": " + r[e]);
						if (n.unique = !0, n.multi) throw new k.Schema("Primary key cannot be multiEntry*");
						t.forEach(function(e) {
							if (e.auto) throw new k.Schema("Only primary key can be marked as autoIncrement (++)");
							if (!e.keyPath) throw new k.Schema("Index must have a name and cannot be an empty string");
						});
						n = o._createTableSchema(e, n, t);
						i[e] = n;
					}
				});
			}, bn.prototype.stores = function(e) {
				var t = this.db, e = (this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e) : e, t._versions), n = {}, r = {};
				return e.forEach(function(e) {
					a(n, e._cfg.storesSource), r = e._cfg.dbschema = {}, e._parseStoresSpec(n, r);
				}), t._dbSchema = r, an(t, [
					t._allTables,
					t,
					t.Transaction.prototype
				]), on(t, [
					t._allTables,
					t,
					t.Transaction.prototype,
					this._cfg.tables
				], O(r), r), t._storeNames = O(r), this;
			}, bn.prototype.upgrade = function(e) {
				return this._cfg.contentUpgrade = ke(this._cfg.contentUpgrade || g, e), this;
			};
			var mn = bn;
			function bn() {}
			var gn = (() => {
				var i, o, t;
				return "undefined" != typeof FinalizationRegistry && "undefined" != typeof WeakRef ? (i = new Set(), o = new FinalizationRegistry(function(e) {
					i.delete(e);
				}), {
					toArray: function() {
						return Array.from(i).map(function(e) {
							return e.deref();
						}).filter(function(e) {
							return void 0 !== e;
						});
					},
					add: function(e) {
						var t = new WeakRef(e._novip);
						i.add(t), o.register(e._novip, t, t), i.size > e._options.maxConnections && (t = i.values().next().value, i.delete(t), o.unregister(t));
					},
					remove: function(e) {
						if (e) for (var t = i.values(), n = t.next(); !n.done;) {
							var r = n.value;
							if (r.deref() === e._novip) return i.delete(r), void o.unregister(r);
							n = t.next();
						}
					}
				}) : (t = [], {
					toArray: function() {
						return t;
					},
					add: function(e) {
						t.push(e._novip);
					},
					remove: function(e) {
						e && -1 !== (e = t.indexOf(e._novip)) && t.splice(e, 1);
					}
				});
			})();
			function wn(e, t) {
				var n = e._dbNamesDB;
				return n || (n = e._dbNamesDB = new y(ft, {
					addons: [],
					indexedDB: e,
					IDBKeyRange: t
				})).version(1).stores({ dbnames: "name" }), n.table("dbnames");
			}
			function _n(e) {
				return e && "function" == typeof e.databases;
			}
			function xn(e) {
				return v(function() {
					return P.letThrough = !0, e();
				});
			}
			function kn(e) {
				return !("from" in e);
			}
			var q = function(e, t) {
				var n;
				if (!this) return n = new q(), e && "d" in e && a(n, e), n;
				a(this, arguments.length ? {
					d: 1,
					from: e,
					to: 1 < arguments.length ? t : e
				} : { d: 0 });
			};
			function On(e, t, n) {
				var r = j(t, n);
				if (!isNaN(r)) {
					if (0 < r) throw RangeError();
					if (kn(e)) return a(e, {
						from: t,
						to: n,
						d: 1
					});
					var r = e.l, i = e.r;
					if (j(n, e.from) < 0) return r ? On(r, t, n) : e.l = {
						from: t,
						to: n,
						d: 1,
						l: null,
						r: null
					}, Sn(e);
					if (0 < j(t, e.to)) return i ? On(i, t, n) : e.r = {
						from: t,
						to: n,
						d: 1,
						l: null,
						r: null
					}, Sn(e);
					j(t, e.from) < 0 && (e.from = t, e.l = null, e.d = i ? i.d + 1 : 1), 0 < j(n, e.to) && (e.to = n, e.r = null, e.d = e.l ? e.l.d + 1 : 1);
					t = !e.r;
					r && !e.l && Pn(e, r), i && t && Pn(e, i);
				}
			}
			function Pn(e, t) {
				kn(t) || function e(t, n) {
					var r = n.from, i = n.l, o = n.r;
					On(t, r, n.to), i && e(t, i), o && e(t, o);
				}(e, t);
			}
			function Kn(e, t) {
				var n = En(t), r = n.next();
				if (!r.done) for (var i = r.value, o = En(e), a = o.next(i.from), u = a.value; !r.done && !a.done;) {
					if (j(u.from, i.to) <= 0 && 0 <= j(u.to, i.from)) return !0;
					j(i.from, u.from) < 0 ? i = (r = n.next(u.from)).value : u = (a = o.next(i.from)).value;
				}
				return !1;
			}
			function En(e) {
				var n = kn(e) ? null : {
					s: 0,
					n: e
				};
				return { next: function(e) {
					for (var t = 0 < arguments.length; n;) switch (n.s) {
						case 0: if (n.s = 1, t) for (; n.n.l && j(e, n.n.from) < 0;) n = {
							up: n,
							n: n.n.l,
							s: 1
						};
						else for (; n.n.l;) n = {
							up: n,
							n: n.n.l,
							s: 1
						};
						case 1: if (n.s = 2, !t || j(e, n.n.to) <= 0) return {
							value: n.n,
							done: !1
						};
						case 2: if (n.n.r) {
							n.s = 3, n = {
								up: n,
								n: n.n.r,
								s: 0
							};
							continue;
						}
						case 3: n = n.up;
					}
					return { done: !0 };
				} };
			}
			function Sn(e) {
				var t, n, r, i = ((null == (i = e.r) ? void 0 : i.d) || 0) - ((null == (i = e.l) ? void 0 : i.d) || 0), i = 1 < i ? "r" : i < -1 ? "l" : "";
				i && (t = "r" == i ? "l" : "r", n = _({}, e), r = e[i], e.from = r.from, e.to = r.to, e[i] = r[i], n[i] = r[t], (e[t] = n).d = An(n)), e.d = An(e);
			}
			function An(e) {
				var t = e.r, e = e.l;
				return (t ? e ? Math.max(t.d, e.d) : t.d : e ? e.d : 0) + 1;
			}
			function jn(t, n) {
				return O(n).forEach(function(e) {
					t[e] ? Pn(t[e], n[e]) : t[e] = function e(t) {
						var n, r, i = {};
						for (n in t) m(t, n) && (r = t[n], i[n] = !r || "object" != typeof r || J.has(r.constructor) ? r : e(r));
						return i;
					}(n[e]);
				}), t;
			}
			function Cn(t, n) {
				return t.all || n.all || Object.keys(t).some(function(e) {
					return n[e] && Kn(n[e], t[e]);
				});
			}
			M(q.prototype, ((t = {
				add: function(e) {
					return Pn(this, e), this;
				},
				addKey: function(e) {
					return On(this, e, e), this;
				},
				addKeys: function(e) {
					var t = this;
					return e.forEach(function(e) {
						return On(t, e, e);
					}), this;
				},
				hasKey: function(e) {
					var t = En(this).next(e).value;
					return t && j(t.from, e) <= 0 && 0 <= j(t.to, e);
				}
			})[re] = function() {
				return En(this);
			}, t));
			var Tn = {}, In = {}, qn = !1;
			function Dn(e) {
				jn(In, e), qn || (qn = !0, setTimeout(function() {
					qn = !1, Bn(In, !(In = {}));
				}, 0));
			}
			function Bn(e, t) {
				void 0 === t && (t = !1);
				var n = new Set();
				if (e.all) for (var r = 0, i = Object.values(Tn); r < i.length; r++) Rn(u = i[r], e, n, t);
				else for (var o in e) {
					var a, u, o = /^idb\:\/\/(.*)\/(.*)\//.exec(o);
					o && (a = o[1], o = o[2], u = Tn["idb://".concat(a, "/").concat(o)]) && Rn(u, e, n, t);
				}
				n.forEach(function(e) {
					return e();
				});
			}
			function Rn(e, t, n, r) {
				for (var i = [], o = 0, a = Object.entries(e.queries.query); o < a.length; o++) {
					for (var u = a[o], s = u[0], c = [], l = 0, f = u[1]; l < f.length; l++) {
						var h = f[l];
						Cn(t, h.obsSet) ? h.subscribers.forEach(function(e) {
							return n.add(e);
						}) : r && c.push(h);
					}
					r && i.push([s, c]);
				}
				if (r) for (var d = 0, p = i; d < p.length; d++) {
					var y = p[d], s = y[0], c = y[1];
					e.queries.query[s] = c;
				}
			}
			function Fn(h) {
				var d = h._state, r = h._deps.indexedDB;
				if (d.isBeingOpened || h.idbdb) return d.dbReadyPromise.then(function() {
					return d.dbOpenError ? S(d.dbOpenError) : h;
				});
				d.isBeingOpened = !0, d.dbOpenError = null, d.openComplete = !1;
				var t = d.openCanceller, p = Math.round(10 * h.verno), y = !1;
				function e() {
					if (d.openCanceller !== t) throw new k.DatabaseClosed("db.open() was cancelled");
				}
				function v() {
					return new K(function(c, n) {
						if (e(), !r) throw new k.MissingAPI();
						var l = h.name, f = d.autoSchema || !p ? r.open(l) : r.open(l, p);
						if (!f) throw new k.MissingAPI();
						f.onerror = I(n), f.onblocked = E(h._fireOnBlocked), f.onupgradeneeded = E(function(e) {
							var t;
							m = f.transaction, d.autoSchema && !h._options.allowEmptyDB ? (f.onerror = Ut, m.abort(), f.result.close(), (t = r.deleteDatabase(l)).onsuccess = t.onerror = E(function() {
								n(new k.NoSuchDatabase("Database ".concat(l, " doesnt exist")));
							})) : (m.onerror = I(n), t = e.oldVersion > Math.pow(2, 62) ? 0 : e.oldVersion, b = t < 1, h.idbdb = f.result, y && cn(h, m), sn(h, t / 10, m, n));
						}, n), f.onsuccess = E(function() {
							m = null;
							var e, t, n, r, i, o, a = h.idbdb = f.result, u = W(a.objectStoreNames);
							if (0 < u.length) try {
								var s = a.transaction(1 === (i = u).length ? i[0] : i, "readonly");
								if (d.autoSchema) o = a, r = s, (n = h).verno = o.version / 10, r = n._dbSchema = pn(0, o, r), n._storeNames = W(o.objectStoreNames, 0), on(n, [n._allTables], O(r), r);
								else if (yn(h, h._dbSchema, s), t = s, ((t = ln(pn(0, (e = h).idbdb, t), e._dbSchema)).add.length || t.change.some(function(e) {
									return e.add.length || e.change.length;
								})) && !y) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), a.close(), p = a.version + 1, y = !0, c(v());
								rn(h, s);
							} catch (e) {}
							gn.add(h), a.onversionchange = E(function(e) {
								d.vcFired = !0, h.on("versionchange").fire(e);
							}), a.onclose = E(function() {
								h.close({ disableAutoOpen: !1 });
							}), b && (u = h._deps, i = l, _n(o = u.indexedDB) || i === ft || wn(o, u.IDBKeyRange).put({ name: i }).catch(g)), c();
						}, n);
					}).catch(function(e) {
						switch (null == e ? void 0 : e.name) {
							case "UnknownError":
								if (0 < d.PR1398_maxLoop) return d.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), v();
								break;
							case "VersionError": if (0 < p) return p = 0, v();
						}
						return K.reject(e);
					});
				}
				var n, i = d.dbReadyResolve, m = null, b = !1;
				return K.race([t, ("undefined" == typeof navigator ? K.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e) {
					function t() {
						return indexedDB.databases().finally(e);
					}
					n = setInterval(t, 100), t();
				}).finally(function() {
					return clearInterval(n);
				}) : Promise.resolve()).then(v)]).then(function() {
					return e(), d.onReadyBeingFired = [], K.resolve(xn(function() {
						return h.on.ready.fire(h.vip);
					})).then(function e() {
						var t;
						if (0 < d.onReadyBeingFired.length) return t = d.onReadyBeingFired.reduce(ke, g), d.onReadyBeingFired = [], K.resolve(xn(function() {
							return t(h.vip);
						})).then(e);
					});
				}).finally(function() {
					d.openCanceller === t && (d.onReadyBeingFired = null, d.isBeingOpened = !1);
				}).catch(function(e) {
					d.dbOpenError = e;
					try {
						m && m.abort();
					} catch (e) {}
					return t === d.openCanceller && h._close(), S(e);
				}).finally(function() {
					d.openComplete = !0, i();
				}).then(function() {
					var n;
					return b && (n = {}, h.tables.forEach(function(t) {
						t.schema.indexes.forEach(function(e) {
							e.name && (n["idb://".concat(h.name, "/").concat(t.name, "/").concat(e.name)] = new q(-1 / 0, [[[]]]));
						}), n["idb://".concat(h.name, "/").concat(t.name, "/")] = n["idb://".concat(h.name, "/").concat(t.name, "/:dels")] = new q(-1 / 0, [[[]]]);
					}), Wt(zt).fire(n), Bn(n, !0)), h;
				});
			}
			function Nn(t) {
				function e(e) {
					return t.next(e);
				}
				var r = n(e), i = n(function(e) {
					return t.throw(e);
				});
				function n(n) {
					return function(e) {
						var e = n(e), t = e.value;
						return e.done ? t : t && "function" == typeof t.then ? t.then(r, i) : x(t) ? Promise.all(t).then(r, i) : r(t);
					};
				}
				return n(e)();
			}
			function Mn(e, t, n) {
				for (var r = x(e) ? e.slice() : [e], i = 0; i < n; ++i) r.push(t);
				return r;
			}
			var Ln = {
				stack: "dbcore",
				name: "VirtualIndexMiddleware",
				level: 1,
				create: function(l) {
					return _(_({}, l), { table: function(e) {
						var o = l.table(e), e = o.schema, u = Object.create(null), s = [];
						function c(e, t, n) {
							var r = en(e), i = u[r] = u[r] || [], o = null == e ? 0 : "string" == typeof e ? 1 : e.length, a = 0 < t, r = _(_({}, n), {
								name: a ? "".concat(r, "(virtual-from:").concat(n.name, ")") : n.name,
								lowLevelIndex: n,
								isVirtual: a,
								keyTail: t,
								keyLength: o,
								extractKey: Ht(e),
								unique: !a && n.unique
							});
							return i.push(r), r.isPrimaryKey || s.push(r), 1 < o && c(2 === o ? e[0] : e.slice(0, o - 1), t + 1, n), i.sort(function(e, t) {
								return e.keyTail - t.keyTail;
							}), r;
						}
						var t = c(e.primaryKey.keyPath, 0, e.primaryKey);
						u[":id"] = [t];
						for (var n = 0, r = e.indexes; n < r.length; n++) {
							var i = r[n];
							c(i.keyPath, 0, i);
						}
						function a(e) {
							var t, n = e.query.index;
							return n.isVirtual ? _(_({}, e), { query: {
								index: n.lowLevelIndex,
								range: (t = e.query.range, n = n.keyTail, {
									type: 1 === t.type ? 2 : t.type,
									lower: Mn(t.lower, t.lowerOpen ? l.MAX_KEY : l.MIN_KEY, n),
									lowerOpen: !0,
									upper: Mn(t.upper, t.upperOpen ? l.MIN_KEY : l.MAX_KEY, n),
									upperOpen: !0
								})
							} }) : e;
						}
						return _(_({}, o), {
							schema: _(_({}, e), {
								primaryKey: t,
								indexes: s,
								getIndexByKeyPath: function(e) {
									return (e = u[en(e)]) && e[0];
								}
							}),
							count: function(e) {
								return o.count(a(e));
							},
							query: function(e) {
								return o.query(a(e));
							},
							openCursor: function(t) {
								var e = t.query.index, r = e.keyTail, i = e.keyLength;
								return e.isVirtual ? o.openCursor(a(t)).then(function(e) {
									return e && n(e);
								}) : o.openCursor(t);
								function n(n) {
									return Object.create(n, {
										continue: { value: function(e) {
											null != e ? n.continue(Mn(e, t.reverse ? l.MAX_KEY : l.MIN_KEY, r)) : t.unique ? n.continue(n.key.slice(0, i).concat(t.reverse ? l.MIN_KEY : l.MAX_KEY, r)) : n.continue();
										} },
										continuePrimaryKey: { value: function(e, t) {
											n.continuePrimaryKey(Mn(e, l.MAX_KEY, r), t);
										} },
										primaryKey: { get: function() {
											return n.primaryKey;
										} },
										key: { get: function() {
											var e = n.key;
											return 1 === i ? e[0] : e.slice(0, i);
										} },
										value: { get: function() {
											return n.value;
										} }
									});
								}
							}
						});
					} });
				}
			};
			function Un(i, o, a, u) {
				return a = a || {}, u = u || "", O(i).forEach(function(e) {
					var t, n, r;
					m(o, e) ? (t = i[e], n = o[e], "object" == typeof t && "object" == typeof n && t && n ? (r = ne(t)) !== ne(n) ? a[u + e] = o[e] : "Object" === r ? Un(t, n, a, u + e + ".") : t !== n && (a[u + e] = o[e]) : t !== n && (a[u + e] = o[e])) : a[u + e] = void 0;
				}), O(o).forEach(function(e) {
					m(i, e) || (a[u + e] = o[e]);
				}), a;
			}
			function zn(e, t) {
				return "delete" === t.type ? t.keys : t.keys || t.values.map(e.extractKey);
			}
			var Vn = {
				stack: "dbcore",
				name: "HooksMiddleware",
				level: 2,
				create: function(e) {
					return _(_({}, e), { table: function(r) {
						var y = e.table(r), v = y.schema.primaryKey;
						return _(_({}, y), { mutate: function(e) {
							var t = P.trans, n = t.table(r).hook, h = n.deleting, d = n.creating, p = n.updating;
							switch (e.type) {
								case "add":
									if (d.fire === g) break;
									return t._promise("readwrite", function() {
										return a(e);
									}, !0);
								case "put":
									if (d.fire === g && p.fire === g) break;
									return t._promise("readwrite", function() {
										return a(e);
									}, !0);
								case "delete":
									if (h.fire === g) break;
									return t._promise("readwrite", function() {
										return a(e);
									}, !0);
								case "deleteRange":
									if (h.fire === g) break;
									return t._promise("readwrite", function() {
										return function n(r, i, o) {
											return y.query({
												trans: r,
												values: !1,
												query: {
													index: v,
													range: i
												},
												limit: o
											}).then(function(e) {
												var t = e.result;
												return a({
													type: "delete",
													keys: t,
													trans: r
												}).then(function(e) {
													return 0 < e.numFailures ? Promise.reject(e.failures[0]) : t.length < o ? {
														failures: [],
														numFailures: 0,
														lastResult: void 0
													} : n(r, _(_({}, i), {
														lower: t[t.length - 1],
														lowerOpen: !0
													}), o);
												});
											});
										}(e.trans, e.range, 1e4);
									}, !0);
							}
							return y.mutate(e);
							function a(c) {
								var e, t, n, l = P.trans, f = c.keys || zn(v, c);
								if (f) return "delete" !== (c = "add" === c.type || "put" === c.type ? _(_({}, c), { keys: f }) : _({}, c)).type && (c.values = R([], c.values, !0)), c.keys && (c.keys = R([], c.keys, !0)), e = y, n = f, ("add" === (t = c).type ? Promise.resolve([]) : e.getMany({
									trans: t.trans,
									keys: n,
									cache: "immutable"
								})).then(function(u) {
									var s = f.map(function(e, t) {
										var n, r, i, o = u[t], a = {
											onerror: null,
											onsuccess: null
										};
										return "delete" === c.type ? h.fire.call(a, e, o, l) : "add" === c.type || void 0 === o ? (n = d.fire.call(a, e, c.values[t], l), null == e && null != n && (c.keys[t] = e = n, v.outbound || b(c.values[t], v.keyPath, e))) : (n = Un(o, c.values[t]), (r = p.fire.call(a, n, e, o, l)) && (i = c.values[t], Object.keys(r).forEach(function(e) {
											m(i, e) ? i[e] = r[e] : b(i, e, r[e]);
										}))), a;
									});
									return y.mutate(c).then(function(e) {
										for (var t = e.failures, n = e.results, r = e.numFailures, e = e.lastResult, i = 0; i < f.length; ++i) {
											var o = (n || f)[i], a = s[i];
											null == o ? a.onerror && a.onerror(t[i]) : a.onsuccess && a.onsuccess("put" === c.type && u[i] ? c.values[i] : o);
										}
										return {
											failures: t,
											results: n,
											numFailures: r,
											lastResult: e
										};
									}).catch(function(t) {
										return s.forEach(function(e) {
											return e.onerror && e.onerror(t);
										}), Promise.reject(t);
									});
								});
								throw new Error("Keys missing");
							}
						} });
					} });
				}
			};
			function Wn(e, t, n) {
				try {
					if (!t) return null;
					if (t.keys.length < e.length) return null;
					for (var r = [], i = 0, o = 0; i < t.keys.length && o < e.length; ++i) 0 === j(t.keys[i], e[o]) && (r.push(n ? ee(t.values[i]) : t.values[i]), ++o);
					return r.length === e.length ? r : null;
				} catch (e) {
					return null;
				}
			}
			var Yn = {
				stack: "dbcore",
				level: -1,
				create: function(t) {
					return { table: function(e) {
						var n = t.table(e);
						return _(_({}, n), {
							getMany: function(t) {
								var e;
								return t.cache ? (e = Wn(t.keys, t.trans._cache, "clone" === t.cache)) ? K.resolve(e) : n.getMany(t).then(function(e) {
									return t.trans._cache = {
										keys: t.keys,
										values: "clone" === t.cache ? ee(e) : e
									}, e;
								}) : n.getMany(t);
							},
							mutate: function(e) {
								return "add" !== e.type && (e.trans._cache = null), n.mutate(e);
							}
						});
					} };
				}
			};
			function $n(e, t) {
				return "readonly" === e.trans.mode && !!e.subscr && !e.trans.explicit && "disabled" !== e.trans.db._options.cache && !t.schema.primaryKey.outbound;
			}
			function Qn(e, t) {
				switch (e) {
					case "query": return t.values && !t.unique;
					case "get":
					case "getMany":
					case "count":
					case "openCursor": return !1;
				}
			}
			var Gn = {
				stack: "dbcore",
				level: 0,
				name: "Observability",
				create: function(b) {
					var g = b.schema.name, w = new q(b.MIN_KEY, b.MAX_KEY);
					return _(_({}, b), {
						transaction: function(e, t, n) {
							if (P.subscr && "readonly" !== t) throw new k.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(P.querier));
							return b.transaction(e, t, n);
						},
						table: function(d) {
							function e(e) {
								var t, e = e.query;
								return [t = e.index, new q(null != (t = (e = e.range).lower) ? t : b.MIN_KEY, null != (t = e.upper) ? t : b.MAX_KEY)];
							}
							var p = b.table(d), y = p.schema, v = y.primaryKey, t = y.indexes, c = v.extractKey, l = v.outbound, m = v.autoIncrement && t.filter(function(e) {
								return e.compound && e.keyPath.includes(v.keyPath);
							}), n = _(_({}, p), { mutate: function(a) {
								function u(e) {
									return e = "idb://".concat(g, "/").concat(d, "/").concat(e), n[e] || (n[e] = new q());
								}
								var e, o, s, t = a.trans, n = a.mutatedParts || (a.mutatedParts = {}), r = u(""), i = u(":dels"), c = a.type, l = "deleteRange" === a.type ? [a.range] : "delete" === a.type ? [a.keys] : a.values.length < 50 ? [zn(v, a).filter(function(e) {
									return e;
								}), a.values] : [], f = l[0], l = l[1], h = a.trans._cache;
								return x(f) ? (r.addKeys(f), (c = "delete" === c || f.length === l.length ? Wn(f, h) : null) || i.addKeys(f), (c || l) && (e = u, o = c, s = l, y.indexes.forEach(function(t) {
									var n = e(t.name || "");
									function r(e) {
										return null != e ? t.extractKey(e) : null;
									}
									function i(e) {
										t.multiEntry && x(e) ? e.forEach(function(e) {
											return n.addKey(e);
										}) : n.addKey(e);
									}
									(o || s).forEach(function(e, t) {
										var n = o && r(o[t]), t = s && r(s[t]);
										0 !== j(n, t) && (null != n && i(n), null != t) && i(t);
									});
								}))) : f ? (l = {
									from: null != (h = f.lower) ? h : b.MIN_KEY,
									to: null != (c = f.upper) ? c : b.MAX_KEY
								}, i.add(l), r.add(l)) : (r.add(w), i.add(w), y.indexes.forEach(function(e) {
									return u(e.name).add(w);
								})), p.mutate(a).then(function(o) {
									return !f || "add" !== a.type && "put" !== a.type || (r.addKeys(o.results), m && m.forEach(function(t) {
										for (var e = a.values.map(function(e) {
											return t.extractKey(e);
										}), n = t.keyPath.findIndex(function(e) {
											return e === v.keyPath;
										}), r = 0, i = o.results.length; r < i; ++r) e[r][n] = o.results[r];
										u(t.name).addKeys(e);
									})), t.mutatedParts = jn(t.mutatedParts || {}, n), o;
								});
							} }), f = {
								get: function(e) {
									return [v, new q(e.key)];
								},
								getMany: function(e) {
									return [v, new q().addKeys(e.keys)];
								},
								count: e,
								query: e,
								openCursor: e
							};
							return O(f).forEach(function(s) {
								n[s] = function(i) {
									var e = P.subscr, t = !!e, n = $n(P, p) && Qn(s, i) ? i.obsSet = {} : e;
									if (t) {
										var o, e = function(e) {
											e = "idb://".concat(g, "/").concat(d, "/").concat(e);
											return n[e] || (n[e] = new q());
										}, a = e(""), u = e(":dels"), t = f[s](i), r = t[0], t = t[1];
										if (("query" === s && r.isPrimaryKey && !i.values ? u : e(r.name || "")).add(t), !r.isPrimaryKey) {
											if ("count" !== s) return o = "query" === s && l && i.values && p.query(_(_({}, i), { values: !1 })), p[s].apply(this, arguments).then(function(t) {
												if ("query" === s) {
													if (l && i.values) return o.then(function(e) {
														e = e.result;
														return a.addKeys(e), t;
													});
													var e = i.values ? t.result.map(c) : t.result;
													(i.values ? a : u).addKeys(e);
												} else {
													var n, r;
													if ("openCursor" === s) return r = i.values, (n = t) && Object.create(n, {
														key: { get: function() {
															return u.addKey(n.primaryKey), n.key;
														} },
														primaryKey: { get: function() {
															var e = n.primaryKey;
															return u.addKey(e), e;
														} },
														value: { get: function() {
															return r && a.addKey(n.primaryKey), n.value;
														} }
													});
												}
												return t;
											});
											u.add(w);
										}
									}
									return p[s].apply(this, arguments);
								};
							}), n;
						}
					});
				}
			};
			function Xn(e, t, n) {
				var r;
				return 0 === n.numFailures ? t : "deleteRange" === t.type || (r = t.keys ? t.keys.length : "values" in t && t.values ? t.values.length : 1, n.numFailures === r) ? null : (r = _({}, t), x(r.keys) && (r.keys = r.keys.filter(function(e, t) {
					return !(t in n.failures);
				})), "values" in r && x(r.values) && (r.values = r.values.filter(function(e, t) {
					return !(t in n.failures);
				})), r);
			}
			function Hn(e, t) {
				return n = e, (void 0 === (r = t).lower || (r.lowerOpen ? 0 < j(n, r.lower) : 0 <= j(n, r.lower))) && (n = e, void 0 === (r = t).upper || (r.upperOpen ? j(n, r.upper) < 0 : j(n, r.upper) <= 0));
				var n, r;
			}
			function Jn(e, d, t, n, r, i) {
				var o, p, y, v, m, a, u;
				return !t || 0 === t.length || (o = d.query.index, p = o.multiEntry, y = d.query.range, v = n.schema.primaryKey.extractKey, m = o.extractKey, a = (o.lowLevelIndex || o).extractKey, (n = t.reduce(function(e, t) {
					var n = e, r = [];
					if ("add" === t.type || "put" === t.type) for (var i = new q(), o = t.values.length - 1; 0 <= o; --o) {
						var a, u = t.values[o], s = v(u);
						!i.hasKey(s) && (a = m(u), p && x(a) ? a.some(function(e) {
							return Hn(e, y);
						}) : Hn(a, y)) && (i.addKey(s), r.push(u));
					}
					switch (t.type) {
						case "add":
							var c = new q().addKeys(d.values ? e.map(function(e) {
								return v(e);
							}) : e), n = e.concat(d.values ? r.filter(function(e) {
								e = v(e);
								return !c.hasKey(e) && (c.addKey(e), !0);
							}) : r.map(function(e) {
								return v(e);
							}).filter(function(e) {
								return !c.hasKey(e) && (c.addKey(e), !0);
							}));
							break;
						case "put":
							var l = new q().addKeys(t.values.map(function(e) {
								return v(e);
							}));
							n = e.filter(function(e) {
								return !l.hasKey(d.values ? v(e) : e);
							}).concat(d.values ? r : r.map(function(e) {
								return v(e);
							}));
							break;
						case "delete":
							var f = new q().addKeys(t.keys);
							n = e.filter(function(e) {
								return !f.hasKey(d.values ? v(e) : e);
							});
							break;
						case "deleteRange":
							var h = t.range;
							n = e.filter(function(e) {
								return !Hn(v(e), h);
							});
					}
					return n;
				}, e)) === e) ? e : (u = function(e, t) {
					return j(a(e), a(t)) || j(v(e), v(t));
				}, n.sort("prev" === d.direction || "prevunique" === d.direction ? function(e, t) {
					return u(t, e);
				} : u), d.limit && d.limit < 1 / 0 && (n.length > d.limit ? n.length = d.limit : e.length === d.limit && n.length < d.limit && (r.dirty = !0)), i ? Object.freeze(n) : n);
			}
			function Zn(e, t) {
				return 0 === j(e.lower, t.lower) && 0 === j(e.upper, t.upper) && !!e.lowerOpen == !!t.lowerOpen && !!e.upperOpen == !!t.upperOpen;
			}
			function er(e, t) {
				return ((e, t, n, r) => {
					if (void 0 === e) return void 0 !== t ? -1 : 0;
					if (void 0 === t) return 1;
					if (0 === (e = j(e, t))) {
						if (n && r) return 0;
						if (n) return 1;
						if (r) return -1;
					}
					return e;
				})(e.lower, t.lower, e.lowerOpen, t.lowerOpen) <= 0 && 0 <= ((e, t, n, r) => {
					if (void 0 === e) return void 0 !== t ? 1 : 0;
					if (void 0 === t) return -1;
					if (0 === (e = j(e, t))) {
						if (n && r) return 0;
						if (n) return -1;
						if (r) return 1;
					}
					return e;
				})(e.upper, t.upper, e.upperOpen, t.upperOpen);
			}
			function tr(n, r, i, e) {
				n.subscribers.add(i), e.addEventListener("abort", function() {
					var e, t;
					n.subscribers.delete(i), 0 === n.subscribers.size && (e = n, t = r, setTimeout(function() {
						0 === e.subscribers.size && oe(t, e);
					}, 3e3));
				});
			}
			var nr = {
				stack: "dbcore",
				level: 0,
				name: "Cache",
				create: function(k) {
					var O = k.schema.name;
					return _(_({}, k), {
						transaction: function(g, w, e) {
							var _, t, x = k.transaction(g, w, e);
							return "readwrite" === w && (e = (_ = new AbortController()).signal, x.addEventListener("abort", (t = function(b) {
								return function() {
									if (_.abort(), "readwrite" === w) {
										for (var t = new Set(), e = 0, n = g; e < n.length; e++) {
											var r = n[e], i = Tn["idb://".concat(O, "/").concat(r)];
											if (i) {
												var o = k.table(r), a = i.optimisticOps.filter(function(e) {
													return e.trans === x;
												});
												if (x._explicit && b && x.mutatedParts) for (var u = 0, s = Object.values(i.queries.query); u < s.length; u++) for (var c = 0, l = (d = s[u]).slice(); c < l.length; c++) Cn((p = l[c]).obsSet, x.mutatedParts) && (oe(d, p), p.subscribers.forEach(function(e) {
													return t.add(e);
												}));
												else if (0 < a.length) {
													i.optimisticOps = i.optimisticOps.filter(function(e) {
														return e.trans !== x;
													});
													for (var f = 0, h = Object.values(i.queries.query); f < h.length; f++) for (var d, p, y, v = 0, m = (d = h[f]).slice(); v < m.length; v++) null != (p = m[v]).res && x.mutatedParts && (b && !p.dirty ? (y = Object.isFrozen(p.res), y = Jn(p.res, p.req, a, o, p, y), p.dirty ? (oe(d, p), p.subscribers.forEach(function(e) {
														return t.add(e);
													})) : y !== p.res && (p.res = y, p.promise = K.resolve({ result: y }))) : (p.dirty && oe(d, p), p.subscribers.forEach(function(e) {
														return t.add(e);
													})));
												}
											}
										}
										t.forEach(function(e) {
											return e();
										});
									}
								};
							})(!1), { signal: e }), x.addEventListener("error", t(!1), { signal: e }), x.addEventListener("complete", t(!0), { signal: e })), x;
						},
						table: function(s) {
							var c = k.table(s), i = c.schema.primaryKey;
							return _(_({}, c), {
								mutate: function(t) {
									var n, e = P.trans;
									return !i.outbound && "disabled" !== e.db._options.cache && !e.explicit && "readwrite" === e.idbtrans.mode && (n = Tn["idb://".concat(O, "/").concat(s)]) ? (e = c.mutate(t), "add" !== t.type && "put" !== t.type || !(50 <= t.values.length || zn(i, t).some(function(e) {
										return null == e;
									})) ? (n.optimisticOps.push(t), t.mutatedParts && Dn(t.mutatedParts), e.then(function(e) {
										0 < e.numFailures && (oe(n.optimisticOps, t), (e = Xn(0, t, e)) && n.optimisticOps.push(e), t.mutatedParts) && Dn(t.mutatedParts);
									}), e.catch(function() {
										oe(n.optimisticOps, t), t.mutatedParts && Dn(t.mutatedParts);
									})) : e.then(function(r) {
										var e = Xn(0, _(_({}, t), { values: t.values.map(function(e, t) {
											var n;
											return r.failures[t] ? e : (b(n = null != (n = i.keyPath) && n.includes(".") ? ee(e) : _({}, e), i.keyPath, r.results[t]), n);
										}) }), r);
										n.optimisticOps.push(e), queueMicrotask(function() {
											return t.mutatedParts && Dn(t.mutatedParts);
										});
									}), e) : c.mutate(t);
								},
								query: function(t) {
									var i, e, n, r, o, a, u;
									return $n(P, c) && Qn("query", t) ? (i = "immutable" === (null == (n = P.trans) ? void 0 : n.db._options.cache), e = (n = P).requery, n = n.signal, a = ((e, t, n, r) => {
										var i = Tn["idb://".concat(e, "/").concat(t)];
										if (!i) return [];
										if (!(e = i.queries[n])) return [
											null,
											!1,
											i,
											null
										];
										var o = e[(r.query ? r.query.index.name : null) || ""];
										if (!o) return [
											null,
											!1,
											i,
											null
										];
										switch (n) {
											case "query":
												var a = null != (u = r.direction) ? u : "next", u = o.find(function(e) {
													var t;
													return e.req.limit === r.limit && e.req.values === r.values && (null != (t = e.req.direction) ? t : "next") === a && Zn(e.req.query.range, r.query.range);
												});
												return u ? [
													u,
													!0,
													i,
													o
												] : [
													o.find(function(e) {
														var t;
														return ("limit" in e.req ? e.req.limit : 1 / 0) >= r.limit && (null != (t = e.req.direction) ? t : "next") === a && (!r.values || e.req.values) && er(e.req.query.range, r.query.range);
													}),
													!1,
													i,
													o
												];
											case "count":
												u = o.find(function(e) {
													return Zn(e.req.query.range, r.query.range);
												});
												return [
													u,
													!!u,
													i,
													o
												];
										}
									})(O, s, "query", t), u = a[0], r = a[2], o = a[3], u && a[1] ? u.obsSet = t.obsSet : (a = c.query(t).then(function(e) {
										var t = e.result;
										if (u && (u.res = t), i) {
											for (var n = 0, r = t.length; n < r; ++n) Object.freeze(t[n]);
											Object.freeze(t);
										}
										return e;
									}).catch(function(e) {
										return o && u && oe(o, u), Promise.reject(e);
									}), u = {
										obsSet: t.obsSet,
										promise: a,
										subscribers: new Set(),
										type: "query",
										req: t,
										dirty: !1
									}, o ? o.push(u) : (o = [u], (r = r || (Tn["idb://".concat(O, "/").concat(s)] = {
										queries: {
											query: {},
											count: {}
										},
										objs: new Map(),
										optimisticOps: [],
										unsignaledParts: {}
									})).queries.query[t.query.index.name || ""] = o)), tr(u, o, e, n), u.promise.then(function(e) {
										e = Jn(e.result, t, null == r ? void 0 : r.optimisticOps, c, u, i);
										return { result: i ? e : ee(e) };
									})) : c.query(t);
								}
							});
						}
					});
				}
			};
			function rr(e, r) {
				return new Proxy(e, { get: function(e, t, n) {
					return "db" === t ? r : Reflect.get(e, t, n);
				} });
			}
			D.prototype.version = function(t) {
				if (isNaN(t) || t < .1) throw new k.Type("Given version is not a positive number");
				if (t = Math.round(10 * t) / 10, this.idbdb || this._state.isBeingOpened) throw new k.Schema("Cannot add version when database is open");
				this.verno = Math.max(this.verno, t);
				var e = this._versions, n = e.filter(function(e) {
					return e._cfg.version === t;
				})[0];
				return n || (n = new this.Version(t), e.push(n), e.sort(un), n.stores({}), this._state.autoSchema = !1), n;
			}, D.prototype._whenReady = function(e) {
				var n = this;
				return this.idbdb && (this._state.openComplete || P.letThrough || this._vip) ? e() : new K(function(e, t) {
					if (n._state.openComplete) return t(new k.DatabaseClosed(n._state.dbOpenError));
					if (!n._state.isBeingOpened) {
						if (!n._state.autoOpen) return void t(new k.DatabaseClosed());
						n.open().catch(g);
					}
					n._state.dbReadyPromise.then(e, t);
				}).then(e);
			}, D.prototype.use = function(e) {
				var t = e.stack, n = e.create, r = e.level, e = e.name, i = (e && this.unuse({
					stack: t,
					name: e
				}), this._middlewares[t] || (this._middlewares[t] = []));
				return i.push({
					stack: t,
					create: n,
					level: null == r ? 10 : r,
					name: e
				}), i.sort(function(e, t) {
					return e.level - t.level;
				}), this;
			}, D.prototype.unuse = function(e) {
				var t = e.stack, n = e.name, r = e.create;
				return t && this._middlewares[t] && (this._middlewares[t] = this._middlewares[t].filter(function(e) {
					return r ? e.create !== r : !!n && e.name !== n;
				})), this;
			}, D.prototype.open = function() {
				var e = this;
				return at(s, function() {
					return Fn(e);
				});
			}, D.prototype._close = function() {
				this.on.close.fire(new CustomEvent("close"));
				var n = this._state;
				if (gn.remove(this), this.idbdb) {
					try {
						this.idbdb.close();
					} catch (e) {}
					this.idbdb = null;
				}
				n.isBeingOpened || (n.dbReadyPromise = new K(function(e) {
					n.dbReadyResolve = e;
				}), n.openCanceller = new K(function(e, t) {
					n.cancelOpen = t;
				}));
			}, D.prototype.close = function(e) {
				var e = (void 0 === e ? { disableAutoOpen: !0 } : e).disableAutoOpen, t = this._state;
				e ? (t.isBeingOpened && t.cancelOpen(new k.DatabaseClosed()), this._close(), t.autoOpen = !1, t.dbOpenError = new k.DatabaseClosed()) : (this._close(), t.autoOpen = this._options.autoOpen || t.isBeingOpened, t.openComplete = !1, t.dbOpenError = null);
			}, D.prototype.delete = function(n) {
				var i = this, o = (void 0 === n && (n = { disableAutoOpen: !0 }), 0 < arguments.length && "object" != typeof arguments[0]), a = this._state;
				return new K(function(r, t) {
					function e() {
						i.close(n);
						var e = i._deps.indexedDB.deleteDatabase(i.name);
						e.onsuccess = E(function() {
							var e = i._deps, t = i.name, n;
							_n(n = e.indexedDB) || t === ft || wn(n, e.IDBKeyRange).delete(t).catch(g), r();
						}), e.onerror = I(t), e.onblocked = i._fireOnBlocked;
					}
					if (o) throw new k.InvalidArgument("Invalid closeOptions argument to db.delete()");
					a.isBeingOpened ? a.dbReadyPromise.then(e) : e();
				});
			}, D.prototype.backendDB = function() {
				return this.idbdb;
			}, D.prototype.isOpen = function() {
				return null !== this.idbdb;
			}, D.prototype.hasBeenClosed = function() {
				var e = this._state.dbOpenError;
				return e && "DatabaseClosed" === e.name;
			}, D.prototype.hasFailed = function() {
				return null !== this._state.dbOpenError;
			}, D.prototype.dynamicallyOpened = function() {
				return this._state.autoSchema;
			}, Object.defineProperty(D.prototype, "tables", {
				get: function() {
					var t = this;
					return O(this._allTables).map(function(e) {
						return t._allTables[e];
					});
				},
				enumerable: !1,
				configurable: !0
			}), D.prototype.transaction = function() {
				var e = function(e, t, n) {
					var r = arguments.length;
					if (r < 2) throw new k.InvalidArgument("Too few arguments");
					for (var i = new Array(r - 1); --r;) i[r - 1] = arguments[r];
					return n = i.pop(), [
						e,
						H(i),
						n
					];
				}.apply(this, arguments);
				return this._transaction.apply(this, e);
			}, D.prototype._transaction = function(e, t, n) {
				var r, i, o = this, a = P.trans, u = (a && a.db === this && -1 === e.indexOf("!") || (a = null), -1 !== e.indexOf("?"));
				e = e.replace("!", "").replace("?", "");
				try {
					if (i = t.map(function(e) {
						e = e instanceof o.Table ? e.name : e;
						if ("string" != typeof e) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
						return e;
					}), "r" == e || e === ht) r = ht;
					else {
						if ("rw" != e && e != dt) throw new k.InvalidArgument("Invalid transaction mode: " + e);
						r = dt;
					}
					if (a) {
						if (a.mode === ht && r === dt) {
							if (!u) throw new k.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
							a = null;
						}
						a && i.forEach(function(e) {
							if (a && -1 === a.storeNames.indexOf(e)) {
								if (!u) throw new k.SubTransaction("Table " + e + " not included in parent transaction.");
								a = null;
							}
						}), u && a && !a.active && (a = null);
					}
				} catch (n) {
					return a ? a._promise(null, function(e, t) {
						t(n);
					}) : S(n);
				}
				var s = function i(o, a, u, s, c) {
					return K.resolve().then(function() {
						var e = P.transless || P, t = o._createTransaction(a, u, o._dbSchema, s), e = (t.explicit = !0, {
							trans: t,
							transless: e
						});
						if (s) t.idbtrans = s.idbtrans;
						else try {
							t.create(), t.idbtrans._explicit = !0, o._state.PR1398_maxLoop = 3;
						} catch (e) {
							return e.name === de.InvalidState && o.isOpen() && 0 < --o._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), o.close({ disableAutoOpen: !1 }), o.open().then(function() {
								return i(o, a, u, null, c);
							})) : S(e);
						}
						var n, r = ue(c), e = (r && nt(), K.follow(function() {
							var e;
							(n = c.call(t, t)) && (r ? (e = w.bind(null, null), n.then(e, e)) : "function" == typeof n.next && "function" == typeof n.throw && (n = Nn(n)));
						}, e));
						return (n && "function" == typeof n.then ? K.resolve(n).then(function(e) {
							return t.active ? e : S(new k.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
						}) : e.then(function() {
							return n;
						})).then(function(e) {
							return s && t._resolve(), t._completion.then(function() {
								return e;
							});
						}).catch(function(e) {
							return t._reject(e), S(e);
						});
					});
				}.bind(null, this, r, i, a, n);
				return a ? a._promise(r, s, "lock") : P.trans ? at(P.transless, function() {
					return o._whenReady(s);
				}) : this._whenReady(s);
			}, D.prototype.table = function(e) {
				if (m(this._allTables, e)) return this._allTables[e];
				throw new k.InvalidTable("Table ".concat(e, " does not exist"));
			};
			var y = D;
			function D(e, t) {
				var o, r, a, n, i, u = this, s = (this._middlewares = {}, this.verno = 0, D.dependencies), s = (this._options = t = _({
					addons: D.addons,
					autoOpen: !0,
					indexedDB: s.indexedDB,
					IDBKeyRange: s.IDBKeyRange,
					cache: "cloned",
					maxConnections: 1e3
				}, t), this._deps = {
					indexedDB: t.indexedDB,
					IDBKeyRange: t.IDBKeyRange
				}, t.addons), c = (this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this, {
					dbOpenError: null,
					isBeingOpened: !1,
					onReadyBeingFired: null,
					openComplete: !1,
					dbReadyResolve: g,
					dbReadyPromise: null,
					cancelOpen: g,
					openCanceller: null,
					autoSchema: !0,
					PR1398_maxLoop: 3,
					autoOpen: t.autoOpen
				}), l = (c.dbReadyPromise = new K(function(e) {
					c.dbReadyResolve = e;
				}), c.openCanceller = new K(function(e, t) {
					c.cancelOpen = t;
				}), this._state = c, this.name = e, this.on = Pt(this, "populate", "blocked", "versionchange", "close", { ready: [ke, g] }), this.once = function(n, r) {
					var i = function() {
						for (var e = [], t = 0; t < arguments.length; t++) e[t] = arguments[t];
						u.on(n).unsubscribe(i), r.apply(u, e);
					};
					return u.on(n, i);
				}, this.on.ready.subscribe = Y(this.on.ready.subscribe, function(i) {
					return function(n, r) {
						D.vip(function() {
							var t, e = u._state;
							e.openComplete ? (e.dbOpenError || K.resolve().then(n), r && i(n)) : e.onReadyBeingFired ? (e.onReadyBeingFired.push(n), r && i(n)) : (i(n), t = u, r || i(function e() {
								t.on.ready.unsubscribe(n), t.on.ready.unsubscribe(e);
							}));
						});
					};
				}), this.Collection = (o = this, Kt(qt.prototype, function(e, t) {
					this.db = o;
					var n = yt, r = null;
					if (t) try {
						n = t();
					} catch (e) {
						r = e;
					}
					var t = e._ctx, e = t.table, i = e.hook.reading.fire;
					this._ctx = {
						table: e,
						index: t.index,
						isPrimKey: !t.index || e.schema.primKey.keyPath && t.index === e.schema.primKey.name,
						range: n,
						keysOnly: !1,
						dir: "next",
						unique: "",
						algorithm: null,
						filter: null,
						replayFilter: null,
						justLimit: !0,
						isMatch: null,
						offset: 0,
						limit: 1 / 0,
						error: r,
						or: t.or,
						valueMapper: i !== ve ? i : null
					};
				})), this.Table = (r = this, Kt(Ot.prototype, function(e, t, n) {
					this.db = r, this._tx = n, this.name = e, this.schema = t, this.hook = r._allTables[e] ? r._allTables[e].hook : Pt(null, {
						creating: [ge, g],
						reading: [me, ve],
						updating: [_e, g],
						deleting: [we, g]
					});
				})), this.Transaction = (a = this, Kt(Yt.prototype, function(e, t, n, r, i) {
					var o = this;
					"readonly" !== e && t.forEach(function(e) {
						e = null == (e = n[e]) ? void 0 : e.yProps;
						e && (t = t.concat(e.map(function(e) {
							return e.updatesTable;
						})));
					}), this.db = a, this.mode = e, this.storeNames = t, this.schema = n, this.chromeTransactionDurability = r, this.idbtrans = null, this.on = Pt(this, "complete", "error", "abort"), this.parent = i || null, this.active = !0, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new K(function(e, t) {
						o._resolve = e, o._reject = t;
					}), this._completion.then(function() {
						o.active = !1, o.on.complete.fire();
					}, function(e) {
						var t = o.active;
						return o.active = !1, o.on.error.fire(e), o.parent ? o.parent._reject(e) : t && o.idbtrans && o.idbtrans.abort(), S(e);
					});
				})), this.Version = (n = this, Kt(mn.prototype, function(e) {
					this.db = n, this._cfg = {
						version: e,
						storesSource: null,
						dbschema: {},
						tables: {},
						contentUpgrade: null
					};
				})), this.WhereClause = (i = this, Kt(Lt.prototype, function(e, t, n) {
					if (this.db = i, this._ctx = {
						table: e,
						index: ":id" === t ? null : t,
						or: n
					}, this._cmp = this._ascending = j, this._descending = function(e, t) {
						return j(t, e);
					}, this._max = function(e, t) {
						return 0 < j(e, t) ? e : t;
					}, this._min = function(e, t) {
						return j(e, t) < 0 ? e : t;
					}, this._IDBKeyRange = i._deps.IDBKeyRange, !this._IDBKeyRange) throw new k.MissingAPI();
				})), this.on("versionchange", function(e) {
					0 < e.newVersion ? console.warn("Another connection wants to upgrade database '".concat(u.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(u.name, "'. Closing db now to resume the delete request.")), u.close({ disableAutoOpen: !1 });
				}), this.on("blocked", function(e) {
					!e.newVersion || e.newVersion < e.oldVersion ? console.warn("Dexie.delete('".concat(u.name, "') was blocked")) : console.warn("Upgrade '".concat(u.name, "' blocked by other connection holding version ").concat(e.oldVersion / 10));
				}), this._maxKey = Xt(t.IDBKeyRange), this._createTransaction = function(e, t, n, r) {
					return new u.Transaction(e, t, n, u._options.chromeTransactionDurability, r);
				}, this._fireOnBlocked = function(t) {
					u.on("blocked").fire(t), gn.toArray().filter(function(e) {
						return e.name === u.name && e !== u && !e._state.vcFired;
					}).map(function(e) {
						return e.on("versionchange").fire(t);
					});
				}, this.use(Yn), this.use(nr), this.use(Gn), this.use(Ln), this.use(Vn), new Proxy(this, { get: function(e, t, n) {
					var r;
					return "_vip" === t || ("table" === t ? function(e) {
						return rr(u.table(e), l);
					} : (r = Reflect.get(e, t, n)) instanceof Ot ? rr(r, l) : "tables" === t ? r.map(function(e) {
						return rr(e, l);
					}) : "_createTransaction" === t ? function() {
						return rr(r.apply(this, arguments), l);
					} : r);
				} }));
				this.vip = l, s.forEach(function(e) {
					return e(u);
				});
			}
			var ir, Se = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", or = (ar.prototype.subscribe = function(e, t, n) {
				return this._subscribe(e && "function" != typeof e ? e : {
					next: e,
					error: t,
					complete: n
				});
			}, ar.prototype[Se] = function() {
				return this;
			}, ar);
			function ar(e) {
				this._subscribe = e;
			}
			try {
				ir = {
					indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB,
					IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange
				};
			} catch (e) {
				ir = {
					indexedDB: null,
					IDBKeyRange: null
				};
			}
			function ur(d) {
				var p, y = !1, e = new or(function(r) {
					var i = ue(d);
					var o, a = !1, u = {}, s = {}, e = {
						get closed() {
							return a;
						},
						unsubscribe: function() {
							a || (a = !0, o && o.abort(), c && Wt.storagemutated.unsubscribe(h));
						}
					}, c = (r.start && r.start(e), !1), l = function() {
						return st(t);
					};
					function f() {
						return Cn(s, u);
					}
					var h = function(e) {
						jn(u, e), f() && l();
					}, t = function() {
						var t, n, e;
						!a && ir.indexedDB && (u = {}, t = {}, o && o.abort(), o = new AbortController(), e = ((e) => {
							var t = $e();
							try {
								i && nt();
								var n = v(d, e);
								return n = i ? n.finally(w) : n;
							} finally {
								t && Qe();
							}
						})(n = {
							subscr: t,
							signal: o.signal,
							requery: l,
							querier: d,
							trans: null
						}), c || (Wt.storagemutated.subscribe(h), c = !0), Promise.resolve(e).then(function(e) {
							y = !0, p = e, a || n.signal.aborted || (f() || (s = t, f()) ? l() : (u = {}, st(function() {
								return !a && r.next && r.next(e);
							})));
						}, function(e) {
							y = !1, ["DatabaseClosedError", "AbortError"].includes(null == e ? void 0 : e.name) || a || st(function() {
								a || r.error && r.error(e);
							});
						}));
					};
					return setTimeout(l, 0), e;
				});
				return e.hasValue = function() {
					return y;
				}, e.getValue = function() {
					return p;
				}, e;
			}
			var sr = y;
			function cr(e) {
				var t = fr;
				try {
					fr = !0, Wt.storagemutated.fire(e), Bn(e, !0);
				} finally {
					fr = t;
				}
			}
			M(sr, _(_({}, e), {
				delete: function(e) {
					return new sr(e, { addons: [] }).delete();
				},
				exists: function(e) {
					return new sr(e, { addons: [] }).open().then(function(e) {
						return e.close(), !0;
					}).catch("NoSuchDatabaseError", function() {
						return !1;
					});
				},
				getDatabaseNames: function(e) {
					try {
						return t = sr.dependencies, n = t.indexedDB, t = t.IDBKeyRange, (_n(n) ? Promise.resolve(n.databases()).then(function(e) {
							return e.map(function(e) {
								return e.name;
							}).filter(function(e) {
								return e !== ft;
							});
						}) : wn(n, t).toCollection().primaryKeys()).then(e);
					} catch (e) {
						return S(new k.MissingAPI());
					}
					var t, n;
				},
				defineClass: function() {
					return function(e) {
						a(this, e);
					};
				},
				ignoreTransaction: function(e) {
					return P.trans ? at(P.transless || s, e) : e();
				},
				vip: xn,
				async: function(t) {
					return function() {
						try {
							var e = Nn(t.apply(this, arguments));
							return e && "function" == typeof e.then ? e : K.resolve(e);
						} catch (e) {
							return S(e);
						}
					};
				},
				spawn: function(e, t, n) {
					try {
						var r = Nn(e.apply(n, t || []));
						return r && "function" == typeof r.then ? r : K.resolve(r);
					} catch (e) {
						return S(e);
					}
				},
				currentTransaction: { get: function() {
					return P.trans || null;
				} },
				waitFor: function(e, t) {
					e = K.resolve("function" == typeof e ? sr.ignoreTransaction(e) : e).timeout(t || 6e4);
					return P.trans ? P.trans.waitFor(e) : e;
				},
				Promise: K,
				debug: {
					get: function() {
						return l;
					},
					set: function(e) {
						Oe(e);
					}
				},
				derive: U,
				extend: a,
				props: M,
				override: Y,
				Events: Pt,
				on: Wt,
				liveQuery: ur,
				extendObservabilitySet: jn,
				getByKeyPath: c,
				setByKeyPath: b,
				delByKeyPath: function(t, e) {
					"string" == typeof e ? b(t, e, void 0) : "length" in e && [].map.call(e, function(e) {
						b(t, e, void 0);
					});
				},
				shallowClone: G,
				deepClone: ee,
				getObjectDiff: Un,
				cmp: j,
				asap: Q,
				minKey: -1 / 0,
				addons: [],
				connections: { get: gn.toArray },
				errnames: de,
				dependencies: ir,
				cache: Tn,
				semVer: "4.4.6",
				version: "4.4.6".split(".").map(function(e) {
					return parseInt(e);
				}).reduce(function(e, t, n) {
					return e + t / Math.pow(10, 2 * n);
				})
			})), sr.maxKey = Xt(sr.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Wt(zt, function(e) {
				fr || (e = new CustomEvent(Vt, { detail: e }), fr = !0, dispatchEvent(e), fr = !1);
			}), addEventListener(Vt, function(e) {
				e = e.detail;
				fr || cr(e);
			}));
			var lr, fr = !1, hr = function() {};
			return "undefined" != typeof BroadcastChannel && ((hr = function() {
				(lr = new BroadcastChannel(Vt)).onmessage = function(e) {
					return e.data && cr(e.data);
				};
			})(), "function" == typeof lr.unref && lr.unref(), Wt(zt, function(e) {
				fr || lr.postMessage(e);
			})), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e) {
				if (!y.disableBfCache && e.persisted) {
					l && console.debug("Dexie: handling persisted pagehide"), lr?.close();
					for (var t = 0, n = gn.toArray(); t < n.length; t++) n[t].close({ disableAutoOpen: !1 });
				}
			}), addEventListener("pageshow", function(e) {
				!y.disableBfCache && e.persisted && (l && console.debug("Dexie: handling persisted pageshow"), hr(), cr({ all: new q(-1 / 0, [[]]) }));
			})), K.rejectionMapper = function(e, t) {
				return !e || e instanceof ce || e instanceof TypeError || e instanceof SyntaxError || !e.name || !ye[e.name] ? e : (t = new ye[e.name](t || e.message, e), "stack" in e && u(t, "stack", { get: function() {
					return this.inner.stack;
				} }), t);
			}, Oe(l), _(y, Object.freeze({
				__proto__: null,
				DEFAULT_MAX_CONNECTIONS: 1e3,
				Dexie: y,
				Entity: mt,
				PropModification: _t,
				RangeSet: q,
				add: function(e) {
					return new _t({ add: e });
				},
				cmp: j,
				default: y,
				liveQuery: ur,
				mergeRanges: Pn,
				rangesOverlap: Kn,
				remove: function(e) {
					return new _t({ remove: e });
				},
				replacePrefix: function(e, t) {
					return new _t({ replacePrefix: [e, t] });
				}
			}), { default: y }), y;
		});
	}))(), 1);
	var DexieSymbol = Symbol.for("Dexie");
	var Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = import_dexie_min.default);
	if (import_dexie_min.default.semVer !== Dexie.semVer) throw new Error(`Two different versions of Dexie loaded in the same app: ${import_dexie_min.default.semVer} and ${Dexie.semVer}`);
	var { liveQuery, mergeRanges, rangesOverlap, RangeSet, cmp, Entity, PropModification, replacePrefix, add, remove, DexieYProvider } = Dexie;
	var DatabaseService = class DatabaseService {
		static instance = null;
		db;
		consumerLeaseTtl = 15e3;
		constructor() {
			if (DatabaseService.instance) return DatabaseService.instance;
			this.db = new Dexie(this.getDBName());
			this.db.version(1).stores({
				chapters: "++id, chapterId, bookId, status, href, chapterName, bookName, volumeName, createTime, updateTime",
				system_infos: "++id, status, lastDownloadTime, consumerPageId, consumerPageLabel, consumerHeartbeat, consumerStartedAt, currentChapterId, currentChapterHref, currentBookName, updateTime"
			});
			DatabaseService.instance = this;
		}
		getDBName() {
			return "uaa_intro_db";
		}
		async getSystemInfo() {
			let systemInfo = await this.getFirst("system_infos");
			if (!systemInfo) await this.addOne("system_infos", {
				status: 0,
				lastDownloadTime: Date.now(),
				consumerPageId: "",
				consumerPageLabel: "",
				consumerHeartbeat: 0,
				consumerStartedAt: 0,
				currentChapterId: 0,
				currentChapterHref: "",
				currentBookName: "",
				updateTime: Date.now()
			});
			systemInfo = await this.getFirst("system_infos");
			if (systemInfo && typeof systemInfo.consumerPageLabel === "undefined") {
				await this.updateOne("system_infos", systemInfo.id, {
					consumerPageLabel: "",
					updateTime: Date.now()
				});
				systemInfo = await this.getFirst("system_infos");
			}
			return systemInfo;
		}
		async updateSystemInfoStatus(status) {
			let id = (await this.getSystemInfo()).id;
			await this.updateOne("system_infos", id, {
				status,
				updateTime: Date.now()
			});
		}
		async updateSystemInfoLastDownloadTime(lastDownloadTime) {
			let id = (await this.getSystemInfo()).id;
			await this.updateOne("system_infos", id, {
				lastDownloadTime,
				updateTime: Date.now()
			});
		}
		async resetSystemInfoStatus(pageId = "") {
			const systemInfo = await this.getSystemInfo();
			if (pageId && systemInfo.consumerPageId && systemInfo.consumerPageId !== pageId) return false;
			await this.updateOne("system_infos", systemInfo.id, {
				status: 0,
				currentChapterId: 0,
				currentChapterHref: "",
				currentBookName: "",
				updateTime: Date.now()
			});
			return true;
		}
		async setSystemInfoError(pageId = "") {
			const systemInfo = await this.getSystemInfo();
			if (pageId && systemInfo.consumerPageId && systemInfo.consumerPageId !== pageId) return false;
			await this.updateOne("system_infos", systemInfo.id, {
				status: 2,
				updateTime: Date.now()
			});
			return true;
		}
		canTakeConsumer(systemInfo, pageId, now = Date.now()) {
			return !systemInfo.consumerPageId || systemInfo.consumerPageId === pageId || now - (systemInfo.consumerHeartbeat ?? 0) > this.consumerLeaseTtl;
		}
		async tryBecomeConsumer(pageId, pageLabel = "") {
			await this.getSystemInfo();
			return await this.db.transaction("rw", this.db.table("system_infos"), async () => {
				const systemInfo = await this.db.table("system_infos").orderBy("id").first();
				const now = Date.now();
				if (!systemInfo) return {
					acquired: false,
					owner: ""
				};
				if (!this.canTakeConsumer(systemInfo, pageId, now)) return {
					acquired: false,
					owner: systemInfo.consumerPageId ?? ""
				};
				const ownerChanged = systemInfo.consumerPageId !== pageId;
				await this.db.table("system_infos").update(systemInfo.id, {
					consumerPageId: pageId,
					consumerPageLabel: pageLabel,
					consumerHeartbeat: now,
					consumerStartedAt: ownerChanged ? now : systemInfo.consumerStartedAt ?? now,
					updateTime: now
				});
				return {
					acquired: true,
					owner: pageId
				};
			});
		}
		async renewConsumerHeartbeat(pageId, pageLabel = "") {
			await this.getSystemInfo();
			return await this.db.transaction("rw", this.db.table("system_infos"), async () => {
				const systemInfo = await this.db.table("system_infos").orderBy("id").first();
				const now = Date.now();
				if (!systemInfo || !this.canTakeConsumer(systemInfo, pageId, now)) return false;
				await this.db.table("system_infos").update(systemInfo.id, {
					consumerPageId: pageId,
					consumerPageLabel: pageLabel || systemInfo.consumerPageLabel || "",
					consumerHeartbeat: now,
					consumerStartedAt: systemInfo.consumerPageId === pageId ? systemInfo.consumerStartedAt ?? now : now,
					updateTime: now
				});
				return true;
			});
		}
		async releaseConsumer(pageId) {
			const systemInfo = await this.getSystemInfo();
			if (systemInfo.consumerPageId !== pageId) return false;
			await this.updateOne("system_infos", systemInfo.id, {
				consumerPageId: "",
				consumerPageLabel: "",
				consumerHeartbeat: 0,
				consumerStartedAt: 0,
				updateTime: Date.now()
			});
			return true;
		}
		async recoverStaleSystemState() {
			const systemInfo = await this.getSystemInfo();
			const now = Date.now();
			if (!(!!systemInfo.consumerPageId && now - (systemInfo.consumerHeartbeat ?? 0) > this.consumerLeaseTtl)) return {
				recovered: false,
				reason: "active_consumer"
			};
			await this.updateOne("system_infos", systemInfo.id, {
				status: 0,
				consumerPageId: "",
				consumerPageLabel: "",
				consumerHeartbeat: 0,
				consumerStartedAt: 0,
				currentChapterId: 0,
				currentChapterHref: "",
				currentBookName: "",
				updateTime: now
			});
			return {
				recovered: true,
				reason: "stale_consumer_cleared"
			};
		}
		async addChapterIfAbsent(chapter) {
			if (!chapter?.href) return false;
			const now = Date.now();
			const exist = await this.db.table("chapters").where("href").equals(chapter.href).first();
			if (exist) {
				await this.updateOne("chapters", exist.id, {
					chapterId: chapter.chapterId ?? exist.chapterId,
					bookId: chapter.bookId ?? exist.bookId,
					chapterName: chapter.chapterName ?? exist.chapterName,
					bookName: chapter.bookName ?? exist.bookName,
					volumeName: chapter.volumeName ?? exist.volumeName,
					updateTime: now
				});
				return false;
			}
			await this.addOne("chapters", {
				chapterId: chapter.chapterId ?? chapter.id ?? "",
				bookId: chapter.bookId ?? "",
				status: 0,
				href: chapter.href,
				chapterName: chapter.chapterName ?? chapter.title ?? "",
				bookName: chapter.bookName ?? "",
				volumeName: chapter.volumeName ?? "",
				createTime: now,
				updateTime: now
			});
			return true;
		}
		async addChaptersIfAbsent(chapters) {
			let added = 0;
			let duplicated = 0;
			for (const chapter of chapters) if (await this.addChapterIfAbsent(chapter)) added++;
			else duplicated++;
			return {
				added,
				duplicated
			};
		}
		async importChapters(chapters) {
			const result = {
				added: 0,
				updated: 0,
				skipped: 0,
				invalid: 0
			};
			if (!Array.isArray(chapters)) return result;
			await this.db.transaction("rw", this.db.table("chapters"), async () => {
				for (const chapter of chapters) {
					const data = this.normalizeChapterForImport(chapter);
					if (!data) {
						result.invalid++;
						continue;
					}
					const exist = await this.db.table("chapters").where("href").equals(data.href).first();
					if (!exist) {
						data.status = typeof data.status === "undefined" ? 0 : data.status;
						await this.db.table("chapters").add(data);
						result.added++;
						continue;
					}
					if (typeof data.status !== "undefined" && exist.status !== data.status) {
						await this.db.table("chapters").update(exist.id, {
							status: data.status,
							updateTime: data.updateTime ?? Date.now()
						});
						result.updated++;
						continue;
					}
					result.skipped++;
				}
			});
			return result;
		}
		normalizeChapterForImport(chapter) {
			if (!chapter?.href) return null;
			const now = Date.now();
			const data = {
				chapterId: chapter.chapterId ?? "",
				bookId: chapter.bookId ?? "",
				status: this.normalizeChapterStatus(chapter.status),
				href: String(chapter.href).trim(),
				chapterName: chapter.chapterName ?? "",
				bookName: chapter.bookName ?? "",
				volumeName: chapter.volumeName ?? "",
				createTime: Number(chapter.createTime) || now,
				updateTime: Number(chapter.updateTime) || now
			};
			if (!data.href) return null;
			return data;
		}
		normalizeChapterStatus(status) {
			if (status === null || typeof status === "undefined") return;
			const numberStatus = Number(status);
			if (Number.isFinite(numberStatus)) return numberStatus;
		}
		async claimNextChapterForDownload(pageId) {
			await this.getSystemInfo();
			return await this.db.transaction("rw", this.db.table("system_infos"), this.db.table("chapters"), async () => {
				const systemInfo = await this.db.table("system_infos").orderBy("id").first();
				const now = Date.now();
				if (!systemInfo || systemInfo.status !== 0 || !this.canTakeConsumer(systemInfo, pageId, now) || systemInfo.consumerPageId !== pageId) return null;
				const chapter = await this.db.table("chapters").where("status").equals(0).first();
				if (!chapter) return null;
				await this.db.table("system_infos").update(systemInfo.id, {
					status: 1,
					consumerHeartbeat: now,
					currentChapterId: chapter.id,
					currentChapterHref: chapter.href,
					currentBookName: chapter.bookName ?? "",
					updateTime: now
				});
				return chapter;
			});
		}
		async markChapterDownloaded(id, pageId, lastDownloadTime = Date.now()) {
			await this.db.transaction("rw", this.db.table("system_infos"), this.db.table("chapters"), async () => {
				await this.db.table("chapters").update(id, {
					status: 1,
					updateTime: lastDownloadTime
				});
				const systemInfo = await this.db.table("system_infos").orderBy("id").first();
				if (systemInfo && systemInfo.consumerPageId === pageId) await this.db.table("system_infos").update(systemInfo.id, {
					status: 0,
					lastDownloadTime,
					consumerHeartbeat: lastDownloadTime,
					currentChapterId: 0,
					currentChapterHref: "",
					currentBookName: "",
					updateTime: lastDownloadTime
				});
			});
		}
		async markDownloadError(pageId = "") {
			return await this.setSystemInfoError(pageId);
		}
		async deletePendingChapters() {
			return await this.db.table("chapters").where("status").equals(0).delete();
		}
		async deletePendingChaptersByBookId(bookId) {
			const normalizedBookId = String(bookId ?? "").trim();
			if (!normalizedBookId) return 0;
			const bookIds = [normalizedBookId];
			const numberBookId = Number(normalizedBookId);
			if (Number.isFinite(numberBookId)) bookIds.push(numberBookId);
			return await this.db.table("chapters").where("bookId").anyOf(bookIds).and((chapter) => chapter.status === 0).delete();
		}
		async deleteChaptersByBookId(bookId) {
			const normalizedBookId = String(bookId ?? "").trim();
			if (!normalizedBookId) return 0;
			const bookIds = [normalizedBookId];
			const numberBookId = Number(normalizedBookId);
			if (Number.isFinite(numberBookId)) bookIds.push(numberBookId);
			return await this.db.table("chapters").where("bookId").anyOf(bookIds).delete();
		}
		async deleteDownloadedChapters() {
			return await this.db.table("chapters").where("status").equals(1).delete();
		}
		async getChapterStats() {
			const pending = await this.db.table("chapters").where("status").equals(0).count();
			const downloaded = await this.db.table("chapters").where("status").equals(1).count();
			return {
				pending,
				downloaded,
				total: pending + downloaded
			};
		}
		async getDebugRows(tableName, pageNum, pageSize) {
			if (!this.db.tables.map((table) => table.name).includes(tableName)) return [];
			const table = this.db.table(tableName);
			if (!pageNum || !pageSize) return await table.toArray();
			const normalizedPageNum = Math.max(Number(pageNum) || 1, 1);
			const normalizedPageSize = Math.max(Number(pageSize) || 10, 1);
			const offset = (normalizedPageNum - 1) * normalizedPageSize;
			return await table.orderBy("id").offset(offset).limit(normalizedPageSize).toArray();
		}
		async countDebugRows(tableName) {
			if (!this.db.tables.map((table) => table.name).includes(tableName)) return 0;
			return await this.db.table(tableName).count();
		}
		async deleteDebugRows(tableName, ids) {
			if (!Array.isArray(ids) || ids.length === 0) return 0;
			await this.db.table(tableName).bulkDelete(ids);
			return ids.length;
		}
		async addOne(tableName, data) {
			return await this.db.table(tableName).add(data);
		}
		async addBulk(tableName, dataArray) {
			return this.db.table(tableName).bulkAdd(dataArray);
		}
		async deleteOne(tableName, id) {
			return await this.db.table(tableName).delete(id);
		}
		async deleteBulk(tableName, idArray) {
			return this.db.table(tableName).bulkDelete(idArray);
		}
		async updateOne(tableName, id, changes) {
			return await this.db.table(tableName).update(id, changes);
		}
		async exists(tableName, id) {
			return !!await this.db.table(tableName).get(id);
		}
		async existsBulk(tableName, idArray) {
			return (await this.db.table(tableName).where(":id").anyOf(idArray).toArray()).map((item) => item.id);
		}
		async getFirst(tableName) {
			return this.db.table(tableName).orderBy("id").first();
		}
		async getOne(tableName, id) {
			return await this.db.table(tableName).get(id);
		}
		async getPaged(tableName, pageNum = 1, pageSize = 10) {
			const offset = (pageNum - 1) * pageSize;
			return await this.db.table(tableName).offset(offset).limit(pageSize).toArray();
		}
	};
	var BookListModel = class {
		constructor(doc = document, location = document.location) {
			this.doc = doc;
			this.location = location;
		}
		adjustUI() {
			const cheros = this.doc.getElementsByClassName("cn-chero");
			if (cheros) for (const chero of [...cheros]) chero.remove();
			this.doc.getElementById("cnEntries")?.style.setProperty("padding-top", "60px");
		}
		getBookTree() {
			const menus = [];
			const links = this.doc.getElementsByClassName("cn-lcard");
			if (!links || links.length === 0) {
				console.warn("No book links found in the document.");
				return menus;
			}
			for (let index = 0; index < links.length; index++) menus.push(this.createBookNode(links[index], index));
			return menus;
		}
		getBookTreeWithCheckedIds(checkedIds = []) {
			const checkedIdSet = new Set(checkedIds.map((id) => String(id)));
			return this.getBookTree().map((book) => ({
				...book,
				checked: checkedIdSet.has(String(book.id))
			}));
		}
		applySelection(type, checkedIds = []) {
			const all = this.getBookTreeWithCheckedIds(checkedIds);
			switch (type) {
				case "全选":
					all.forEach((book) => {
						book.checked = true;
					});
					break;
				case "1-12":
					this.toggleRange(all, 0, 12);
					break;
				case "13-24":
					this.toggleRange(all, 12, 24);
					break;
				case "25-36":
					this.toggleRange(all, 24, 36);
					break;
				case "37-49": this.toggleRange(all, 36, 49);
			}
			return all;
		}
		toggleBook(clickedBook, checkedIds = []) {
			return this.getBookTreeWithCheckedIds(checkedIds).map((book) => {
				if (String(book.id) !== String(clickedBook.id)) return book;
				return {
					...book,
					checked: !clickedBook.checked
				};
			});
		}
		createBookNode(link, index) {
			const coverImg = link.getElementsByTagName("img")[0];
			const title = link.getAttribute("data-title");
			return {
				id: this.getBookId(link.href, index),
				title,
				href: link.href,
				spread: true,
				field: "",
				checked: false,
				cover_href: coverImg?.src ?? ""
			};
		}
		getBookId(href, index) {
			try {
				return new URL(href, this.location.href).searchParams.get("id") ?? href ?? String(index);
			} catch (e) {
				return String(index);
			}
		}
		toggleRange(books, start, end) {
			for (let i = 0; i < books.length; i++) if (i >= start && i < end) books[i].checked = !books[i].checked;
		}
	};
	var BookListWindowView = class {
		constructor() {
			this.openBookListWindowIndex = 0;
			this.treeId = "bookListTree";
			this.treeElem = "#bookListWindowDiv";
			this.openProgressFilter = "openNewWindowProgress";
			this.progressFilter = "exportProgress";
		}
		renderFixbar({ onOpenBookList }) {
			layui.use(() => {
				layui.util.fixbar({
					bars: [{
						type: "本页书籍单",
						icon: "layui-icon-list"
					}],
					default: false,
					bgcolor: "#ff5722",
					css: {
						bottom: "15%",
						right: 0
					},
					margin: 0,
					click: (type) => {
						if (type === "本页书籍单") onOpenBookList();
					}
				});
			});
		}
		openBookListWindow(options) {
			if (options.openNewWindowScheduler.running || options.exportEpubScheduler.running) return layui.layer.msg("请等待当前任务完成后再打开书籍列表窗口", {
				icon: 0,
				time: 2e3
			});
			if (this.openBookListWindowIndex !== 0) {
				this.reloadBookTree(options.data);
				return this.openBookListWindowIndex;
			}
			this.openBookListWindowIndex = layui.layer.tab({
				type: 1,
				shadeClose: false,
				closeBtn: false,
				shade: 0,
				area: ["60%", "80%"],
				moveOut: true,
				maxmin: true,
				tab: [{
					title: "书籍列表",
					content: this.getBookListTabContent()
				}, {
					title: "导出和打开新窗口信息",
					content: this.getTaskInfoTabContent()
				}],
				btn: [
					"全选",
					"1-12",
					"13-24",
					"25-36",
					"37-49",
					"打开选中书籍",
					"导出EPUB",
					"导出EPUB+入库",
					"导出EPUB+入库+封面",
					"清除选中"
				],
				btn1: () => this.handleSelectRange(options, "全选"),
				btn2: () => this.handleSelectRange(options, "1-12"),
				btn3: () => this.handleSelectRange(options, "13-24"),
				btn4: () => this.handleSelectRange(options, "25-36"),
				btn5: () => this.handleSelectRange(options, "37-49"),
				btn6: () => {
					options.onOpenSelected();
					return false;
				},
				btn7: () => {
					options.onExportSelected();
					return false;
				},
				btn8: () => {
					options.onExportAndAddChapters();
					return false;
				},
				btn9: () => {
					options.onExportAndAddChapterAndCover();
					return false;
				},
				btn10: () => {
					options.onClearSelected();
					return false;
				},
				success: () => {
					layui.form.render("checkbox", "form-demo-skin");
					this.resetOpenProgress();
					this.resetExportProgress();
					this.renderBookTree(options.data, options.onBookClick);
				}
			});
			return this.openBookListWindowIndex;
		}
		renderBookTree(data, onBookClick) {
			layui.tree.render({
				elem: this.treeElem,
				data,
				showCheckbox: true,
				onlyIconControl: true,
				id: this.treeId,
				isJump: false,
				click: (obj) => {
					onBookClick(obj.data);
				}
			});
		}
		reloadBookTree(data) {
			layui.tree.reload(this.treeId, { data });
		}
		getCheckedBooks() {
			return layui.tree.getChecked(this.treeId);
		}
		getCheckedBookIds() {
			return this.getCheckedBooks().map((book) => book.id);
		}
		setOpenInfo(text, href = "") {
			this.setAnchorText("openNewWindowInfo", text, href);
		}
		setOpenProgress(percent) {
			layui.element.progress(this.openProgressFilter, percent);
		}
		resetOpenProgress() {
			layui.element.render("progress", this.openProgressFilter);
			this.setOpenProgress("0%");
		}
		setExportInfo(text, href = "") {
			this.setAnchorText("exportInfoContentId", text, href);
		}
		setChapterDbInfo(text, href = "") {
			this.setAnchorText("chapterDbInfoContentId", text, href);
		}
		resetChapterDbHistory(text = "暂无入库") {
			this.setChapterDbInfo(text);
			const body = document.getElementById("chapterDbHistoryBodyId");
			if (body) body.innerHTML = "";
		}
		setChapterDbSummary({ processed = 0, totalBooks = 0, added = 0, duplicated = 0 } = {}) {
			const totalChapters = added + duplicated;
			this.setChapterDbInfo(`章节入库：${processed}/${totalBooks} 本，共计 ${totalChapters} 章，新增 ${added} 章，重复 ${duplicated} 章`, "javascript:void(0);");
		}
		appendChapterDbHistory({ index, title, href = "", added = 0, duplicated = 0 } = {}) {
			const body = document.getElementById("chapterDbHistoryBodyId");
			if (!body) return;
			const row = document.createElement("div");
			row.style.cssText = "display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:6px 0;border-bottom:1px solid #f2f2f2;";
			const link = document.createElement("a");
			link.href = href || "javascript:void(0);";
			link.textContent = `${index}. ${title}`;
			link.style.cssText = "flex:1;min-width:0;word-break:break-all;";
			const stats = document.createElement("span");
			stats.textContent = `新增 ${added} 章，重复 ${duplicated} 章，共 ${added + duplicated} 章`;
			stats.style.cssText = "white-space:nowrap;color:#666;";
			row.appendChild(link);
			row.appendChild(stats);
			body.appendChild(row);
			body.scrollTop = body.scrollHeight;
		}
		setExportProgress(percent) {
			layui.element.progress(this.progressFilter, percent);
		}
		resetExportProgress() {
			layui.element.render("progress", this.progressFilter);
			this.setExportProgress("0%");
		}
		minimizeBookListWindow() {
			if (this.openBookListWindowIndex !== 0) layui.layer.min(this.openBookListWindowIndex);
		}
		msg(content, options) {
			layui.layer.msg(content, options);
		}
		alert(content, options) {
			layui.layer.alert(content, options);
		}
		handleSelectRange(options, type) {
			options.onSelectRange(type);
			return false;
		}
		setAnchorText(id, text, href = "") {
			const el = document.getElementById(id);
			if (!el) return;
			el.innerText = text;
			el.href = href;
		}
		getBookListTabContent() {
			return "<div style=\"height: 100%;width: 99%;padding-top: 10px;\"><div id=\"bookListWindowDiv\"></div></div>";
		}
		getTaskInfoTabContent() {
			return "<div style=\"height: 100%;width: 99%;padding-top: 10px;\"><div id=\"exportAndOpenNewWindow\"><fieldset class=\"layui-elem-field\">  <legend style=\"color:red;\">打开新窗口的信息</legend>  <div class=\"layui-field-box\">      <a id=\"openNewWindowInfo\" href=\"\" style=\"color:blue;\">暂未打开新窗口</a>      <div style=\"margin-top: 12px;\" class=\"layui-progress layui-progress-big\" lay-showPercent=\"true\" lay-filter=\"openNewWindowProgress\">          <div class=\"layui-progress-bar layui-bg-blue\" lay-percent=\"0%\"></div>      </div>  </div></fieldset><fieldset class=\"layui-elem-field\">  <legend  style=\"color:red;\">当前导出</legend>  <div class=\"layui-field-box\">      <a id=\"exportInfoContentId\" href=\"\" style=\"color:blue;\">暂无导出</a>  </div></fieldset><fieldset class=\"layui-elem-field\">  <legend  style=\"color:red;\">导出进度条</legend>  <div class=\"layui-field-box\"><div class=\"layui-progress layui-progress-big\" lay-showPercent=\"true\" lay-filter=\"exportProgress\"> <div class=\"layui-progress-bar layui-bg-orange\" lay-percent=\"0%\"></div></div>  </div></fieldset><fieldset class=\"layui-elem-field\">  <legend style=\"color:red;\">章节入库</legend>  <div class=\"layui-field-box\">      <a id=\"chapterDbInfoContentId\" href=\"\" style=\"color:blue;\">暂无入库</a>      <div id=\"chapterDbHistoryBodyId\" style=\"margin-top: 10px;max-height: 220px;overflow-y: auto;color:blue;\"></div>  </div></fieldset></div></div>";
		}
	};
	var ListV2Controller = class {
		constructor({ model = new BookListModel(), view = new BookListWindowView(), db = new DatabaseService(), openNewWindowScheduler = new Downloader(), exportEpubScheduler = new Downloader() } = {}) {
			this.model = model;
			this.view = view;
			this.db = db;
			this.openNewWindowScheduler = openNewWindowScheduler;
			this.exportEpubScheduler = exportEpubScheduler;
			this.currentOpenRun = {
				total: 0,
				completed: 0
			};
			this.currentExportRun = {
				total: 0,
				completed: 0,
				added: 0,
				duplicated: 0,
				chapterDbProcessed: 0
			};
			this.configureOpenNewWindowScheduler();
			this.configureExportEpubScheduler();
		}
		init() {
			this.model.adjustUI();
			this.view.renderFixbar({ onOpenBookList: () => this.openBookListWindow() });
		}
		openBookListWindow() {
			return this.view.openBookListWindow({
				data: this.model.getBookTree(),
				onSelectRange: (type) => this.selectRange(type),
				onOpenSelected: () => this.openSelectedBooks(),
				onExportSelected: () => this.exportSelectedBooks(),
				onExportAndAddChapters: () => this.exportSelectedBooks({ addChaptersToDb: true }),
				onExportAndAddChapterAndCover: () => this.exportSelectedBooks({
					addChaptersToDb: true,
					SaveCover: true
				}),
				onClearSelected: () => this.clearSelected(),
				onBookClick: (book) => this.toggleBook(book),
				openNewWindowScheduler: this.openNewWindowScheduler,
				exportEpubScheduler: this.exportEpubScheduler
			});
		}
		selectRange(type) {
			const data = this.model.applySelection(type, this.view.getCheckedBookIds());
			this.view.reloadBookTree(data);
		}
		toggleBook(book) {
			const data = this.model.toggleBook(book, this.view.getCheckedBookIds());
			this.view.reloadBookTree(data);
		}
		async openSelectedBooks() {
			if (this.openNewWindowScheduler.running) {
				this.view.msg("正在打开中，请等待打开完后再继续");
				return;
			}
			const checkedBooks = this.view.getCheckedBooks();
			if (checkedBooks.length === 0) {
				this.view.msg("未选中任何书籍");
				return;
			}
			this.resetOpenScheduler(checkedBooks.length);
			this.view.resetOpenProgress();
			checkedBooks.forEach((book) => {
				this.openNewWindowScheduler.add(book);
			});
			await this.openNewWindowScheduler.start();
		}
		async exportSelectedBooks(options = {}) {
			if (this.exportEpubScheduler.running) {
				this.view.msg("正在导出中，请等待导出完后再继续");
				return;
			}
			const checkedBooks = this.view.getCheckedBooks();
			if (checkedBooks.length === 0) {
				this.view.msg("未选中任何书籍");
				return;
			}
			checkedBooks.reverse();
			this.resetExportScheduler(checkedBooks.length);
			this.view.resetExportProgress();
			if (options.addChaptersToDb) this.view.resetChapterDbHistory("等待章节入库");
			else this.view.setChapterDbInfo("本次未启用章节入库");
			checkedBooks.forEach((book) => {
				this.exportEpubScheduler.add({
					...book,
					addChaptersToDb: options.addChaptersToDb === true,
					SaveCover: Object.hasOwn(options, "SaveCover") ? options.SaveCover === true : false
				});
			});
			await this.exportEpubScheduler.start();
		}
		clearSelected() {
			this.view.reloadBookTree(this.model.getBookTree());
			this.view.resetOpenProgress();
			this.view.resetExportProgress();
			this.view.resetChapterDbHistory("暂无入库");
			this.openNewWindowScheduler.clear();
			this.exportEpubScheduler.clear();
		}
		configureOpenNewWindowScheduler() {
			this.openNewWindowScheduler.setConfig({
				interval: 2e3,
				downloadHandler: (task) => {
					_GM_openInTab(task.href, { active: false });
					return true;
				},
				onTaskBefore: (task) => {
					this.view.setOpenInfo("书籍: " + task.title + " 开始打开。。。", task.href);
				},
				onTaskComplete: (task, success) => {
					this.currentOpenRun.completed++;
					this.view.setOpenProgress(this.getOpenProgressPercent());
					this.view.setOpenInfo("书籍: " + task.title + (success ? " 打开完毕" : " 打开失败"), task.href);
					console.log(`${task.title} 打开 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
				},
				onFinish: async () => {
					console.log("打开结束 ✅");
					this.view.setOpenInfo("书籍打开完毕", "javascript:void(0);");
				},
				onCatch: async (err) => {
					this.view.alert("出现错误：" + err.message, {
						icon: 5,
						shadeClose: true
					});
				}
			});
		}
		resetOpenScheduler(total) {
			this.openNewWindowScheduler = new Downloader();
			this.currentOpenRun = {
				total,
				completed: 0
			};
			this.configureOpenNewWindowScheduler();
		}
		configureExportEpubScheduler() {
			this.exportEpubScheduler.setConfig({
				interval: 2e3,
				onTaskBefore: (task) => {
					const actionName = task.addChaptersToDb ? "开始导出并入库。。。" : "开始导出。。。";
					this.view.setExportInfo("书籍: " + task.title + " " + actionName, task.href);
				},
				downloadHandler: async (task) => {
					await buildEpub(task.href, {
						onIntroParsed: async ({ url, doc }) => {
							if (!task.addChaptersToDb) return;
							await this.addBookChaptersToDb(task, doc, url);
						},
						SaveCover: task.SaveCover
					});
					return true;
				},
				onTaskComplete: (task, success) => {
					this.currentExportRun.completed++;
					this.view.setExportProgress(this.getExportProgressPercent());
					this.view.setExportInfo("书籍: " + task.title + (success ? " 导出成功" : " 导出失败"), task.href);
					console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
				},
				onFinish: async () => {
					this.view.setExportInfo("书籍导出完毕", "javascript:void(0);");
					if (this.currentExportRun.added > 0 || this.currentExportRun.duplicated > 0) {
						const totalChapters = this.currentExportRun.added + this.currentExportRun.duplicated;
						this.view.setChapterDbInfo(`章节入库完毕：共计 ${totalChapters} 章，新增 ${this.currentExportRun.added} 章，共计重复 ${this.currentExportRun.duplicated} 章`, "javascript:void(0);");
					}
					console.log("打开结束 ✅");
					this.view.minimizeBookListWindow();
					this.view.msg("书籍导出完毕", {
						icon: 1,
						shadeClose: true
					});
				},
				onCatch: async (err) => {
					this.view.alert("导出失败：" + err.message, {
						icon: 5,
						shadeClose: true
					});
				}
			});
		}
		resetExportScheduler(total) {
			this.exportEpubScheduler = new Downloader();
			this.currentExportRun = {
				total,
				completed: 0,
				added: 0,
				duplicated: 0,
				chapterDbProcessed: 0
			};
			this.configureExportEpubScheduler();
		}
		async addBookChaptersToDb(task, doc, url) {
			const catalog = new ChapterCatalogModel(doc, { href: url });
			const chapters = catalog.toChapterList(catalog.getChapterListTree()).filter((chapter) => chapter.href && chapter.href.trim().length > 0);
			const result = await this.db.addChaptersIfAbsent(chapters);
			this.currentExportRun.added += result.added;
			this.currentExportRun.duplicated += result.duplicated;
			this.currentExportRun.chapterDbProcessed++;
			this.view.appendChapterDbHistory({
				index: this.currentExportRun.chapterDbProcessed,
				title: task.title,
				href: task.href,
				added: result.added,
				duplicated: result.duplicated
			});
			this.view.setChapterDbSummary({
				processed: this.currentExportRun.chapterDbProcessed,
				totalBooks: this.currentExportRun.total,
				added: this.currentExportRun.added,
				duplicated: this.currentExportRun.duplicated
			});
			console.log(`${task.title} 章节入库完成，新增 ${result.added} 章，重复 ${result.duplicated} 章，共 ${result.added + result.duplicated} 章`, task.href);
		}
		getExportProgressPercent() {
			if (this.currentExportRun.total === 0) return "0%";
			return (this.currentExportRun.completed / this.currentExportRun.total * 100).toFixed(2) + "%";
		}
		getOpenProgressPercent() {
			if (this.currentOpenRun.total === 0) return "0%";
			return (this.currentOpenRun.completed / this.currentOpenRun.total * 100).toFixed(2) + "%";
		}
	};
	var WorkerSingleton = class WorkerSingleton {
		static instance = null;
		handleCallBack() {}
		constructor() {
			if (WorkerSingleton.instance) return WorkerSingleton.instance;
			const blob = new Blob([`
  let timer = null;
  let interval = 2000;

  self.onmessage = function(e) {
    const { type, payload } = e.data;

    switch (type) {
      case 'START':
        if (timer === null) {
          timer = setInterval(() => {
            self.postMessage({ type: 'TICK', data: { timestamp: Date.now(), interval } });
          }, interval);
        }
        break;
      case 'STOP':
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
        }
        break;
      case 'SET_INTERVAL':
        interval = payload;
        if (timer !== null) {
          // 如果正在运行，重启定时器以应用新间隔
          clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage({ type: 'TICK', data: { timestamp: Date.now(), interval } });
          }, interval);
        }
        break;
      case 'QUERY_INTERVAL':
        self.postMessage({ type: 'INTERVAL_VAL', data: interval });
        break;
    }
  };
`], { type: "application/javascript" });
			this.worker = new Worker(URL.createObjectURL(blob));
			this.worker.onmessage = (e) => {
				this.handleMessage(e.data).then();
			};
			WorkerSingleton.instance = this;
		}
		async handleMessage(response) {
			const { type, data } = response;
			switch (type) {
				case "TICK":
					console.log(`[主线程接收] 心跳检测:`, data);
					await this.handleCallBack();
					break;
				case "INTERVAL_VAL": console.log(`[主线程接收] 当前间隔时间为: ${data}ms`);
			}
		}
		start() {
			this.worker.postMessage({ type: "START" });
		}
		stop() {
			this.worker.postMessage({ type: "STOP" });
		}
		updateInterval(ms) {
			this.worker.postMessage({
				type: "SET_INTERVAL",
				payload: ms
			});
		}
		queryInterval() {
			this.worker.postMessage({ type: "QUERY_INTERVAL" });
		}
		terminate() {
			this.worker.terminate();
			WorkerSingleton.instance = null;
		}
	};
	var DOWNLOAD_INFO_WINDOW_DIV_ID = "downloadInfoWindowDivId";
	var INFO_WINDOW_PROGRESS_FILTER = "infoWindowProgressFilter";
	var DEBUG_TABLE_ID = "uaaIntroDebugTable";
	var CHAPTER_TREE_ID = "titleList";
	var DOWNLOADER_INTERVAL = 4500;
	function getOrCreatePageId(storage = sessionStorage) {
		const storageKey = "__uaa_intro_v3_page_id__";
		let storedPageId = storage.getItem(storageKey);
		if (!storedPageId) {
			storedPageId = crypto.randomUUID();
			storage.setItem(storageKey, storedPageId);
		}
		return storedPageId;
	}
	function getPageLabel(pageId, doc = document) {
		const bookName = doc.getElementsByTagName("h1")[0]?.cloneNode(true);
		const spans = bookName?.getElementsByTagName("span");
		if (spans) for (const span of spans) span.remove();
		return `${bookName?.innerText.trim() || "未知书籍"} [${pageId.slice(0, 8)}]`;
	}
	var ChapterDownloadService = class {
		constructor({ downloadInfoWindow, infoWindow, downloaderInterval }) {
			this.downloadInfoWindow = downloadInfoWindow;
			this.infoWindow = infoWindow;
			this.downloaderInterval = downloaderInterval;
		}
		async download(chapter, lastDownloadTime) {
			this.downloadInfoWindow.setTitle(chapter.bookName + " : " + chapter.chapterName);
			this.infoWindow.setCurrentDownload(chapter.chapterName, chapter.href);
			const time = Date.now() - lastDownloadTime;
			if (time < this.downloaderInterval) await sleep(this.downloaderInterval - time);
			const container = this.downloadInfoWindow.getContainer();
			if (!container) throw new Error("下载面板容器不存在");
			const oldIframes = Array.from(container.getElementsByTagName("iframe"));
			for (const iframe of oldIframes) await destroyIframeElementAsync(iframe);
			const iframe = document.createElement("iframe");
			iframe.id = "__uaa_iframe__" + crypto.randomUUID();
			iframe.src = chapter.href;
			iframe.style.width = "100%";
			iframe.style.height = "100%";
			container.appendChild(iframe);
			await this.waitForChapterLoad(iframe, chapter);
			this.assertChapterDocumentHealth(iframe.contentDocument, chapter);
			let chapterPageModel = new ChapterPageModel(iframe.contentDocument);
			if (chapterPageModel.getTexts().some((s) => s.includes("以下正文内容已隐藏"))) throw new Error("章节内容不完整，结束下载");
			const success = chapterPageModel.saveToLocal();
			chapterPageModel = null;
			await sleep(300);
			await destroyIframeElementAsync(iframe);
			if (!success) throw new Error("章节保存失败");
		}
		async waitForChapterLoad(iframe, chapter) {
			await new Promise((resolve, reject) => {
				const timeout = setTimeout(() => reject(new Error("页面加载超时")), 18e5);
				iframe.onerror = () => {
					clearTimeout(timeout);
					reject(new Error("章节页面加载失败，可能是网络异常或浏览器页面崩溃"));
				};
				iframe.onload = async () => {
					try {
						this.assertChapterDocumentHealth(iframe.contentDocument, chapter);
						await waitForElement(iframe.contentDocument, ".reader-content", 15e5);
						clearTimeout(timeout);
						resolve();
					} catch (err) {
						clearTimeout(timeout);
						reject(err);
					}
				};
			});
		}
		assertChapterDocumentHealth(doc, chapter) {
			if (!doc || !doc.documentElement) throw new Error("章节页面文档不可用，可能是页面崩溃");
			const sampleText = `${(doc.title || "").trim()}\n${(doc.body?.innerText || "").trim()}`.slice(0, 4e3);
			if (this.looksLikeErrorPage(sampleText)) throw new Error(`章节页面异常：${chapter.chapterName} 可能返回了错误页`);
		}
		looksLikeErrorPage(text) {
			if (!text) return false;
			const normalized = text.toLowerCase();
			return [
				"502 bad gateway",
				"503 service unavailable",
				"504 gateway timeout",
				"500 internal server error",
				"bad gateway",
				"gateway timeout",
				"service unavailable",
				"internal server error",
				"this site can’t be reached",
				"this page isn’t working",
				"无法访问此网站",
				"网页无法正常运作",
				"连接已重置",
				"连接超时",
				"network error",
				"err_connection",
				"dns_probe"
			].some((keyword) => {
				if (normalized.includes(keyword)) {
					console.warn(`检测到错误页面关键词: ${keyword}`);
					return true;
				}
			});
		}
		looksLikeCfChallenge(input) {
			if (!input) return false;
			let text = "";
			let html = "";
			if (typeof input === "string") text = input;
			else if (input.documentElement) {
				text = `${input.title || ""}\n${input.body?.innerText || ""}`;
				html = input.documentElement.outerHTML || "";
			}
			const normalizedText = text.toLowerCase();
			const normalizedHtml = html.toLowerCase();
			return [
				"cloudflare",
				"attention required",
				"verify you are human",
				"checking your browser before accessing",
				"please enable javascript and cookies",
				"cf-chl",
				"cf_clearance",
				"turnstile",
				"challenge-platform",
				"just a moment"
			].some((keyword) => normalizedText.includes(keyword) || normalizedHtml.includes(keyword));
		}
	};
	function topLayerMsg(content, options = { zIndex: layui.layer.zIndex }, end) {
		if (typeof options === "function") {
			end = options;
			options = {};
		}
		const success = options.success;
		return layui.layer.msg(content, {
			...options,
			success(layero, index) {
				layui.layer.setTop(layero);
				success?.(layero, index);
			}
		}, end);
	}
	function topLayerConfirm(content, yes, cancel, options = { zIndex: layui.layer.zIndex }) {
		const success = options.success;
		return layui.layer.confirm(content, {
			icon: 3,
			title: "确认操作",
			...options,
			success(layero, index) {
				layui.layer.setTop(layero);
				success?.(layero, index);
			}
		}, yes, cancel);
	}
	var DebugTableView = class {
		constructor({ db, tableId, onRowsDeleted }) {
			this.db = db;
			this.tableId = tableId;
			this.tableMode = "chapters";
			this.onRowsDeleted = onRowsDeleted;
			this.pageLimits = [
				10,
				20,
				50,
				100
			];
			this.pageState = {
				curr: 1,
				limit: this.pageLimits[0]
			};
		}
		bindEvents() {
			const chaptersBtn = document.getElementById("debugLoadChaptersBtn");
			const refreshBtn = document.getElementById("debugRefreshBtn");
			const exportChaptersBtn = document.getElementById("debugExportChaptersBtn");
			const exportChaptersJsonBtn = document.getElementById("debugExportChaptersJsonBtn");
			const importChaptersJsonBtn = document.getElementById("debugImportChaptersJsonBtn");
			const deleteBtn = document.getElementById("debugDeleteRowsBtn");
			const deleteDownloadedBtn = document.getElementById("debugDeleteDownloadedChaptersBtn");
			const deletePendingByBookIdBtn = document.getElementById("debugDeletePendingByBookIdBtn");
			const deleteByBookIdBtn = document.getElementById("debugDeleteByBookIdBtn");
			if (chaptersBtn && !chaptersBtn.dataset.bound) {
				chaptersBtn.dataset.bound = "1";
				chaptersBtn.addEventListener("click", () => {
					this.tableMode = "chapters";
					this.render().then();
				});
			}
			if (refreshBtn && !refreshBtn.dataset.bound) {
				refreshBtn.dataset.bound = "1";
				refreshBtn.addEventListener("click", () => {
					this.render().then();
				});
			}
			if (exportChaptersBtn && !exportChaptersBtn.dataset.bound) {
				exportChaptersBtn.dataset.bound = "1";
				exportChaptersBtn.addEventListener("click", () => {
					this.exportChapters().then();
				});
			}
			if (exportChaptersJsonBtn && !exportChaptersJsonBtn.dataset.bound) {
				exportChaptersJsonBtn.dataset.bound = "1";
				exportChaptersJsonBtn.addEventListener("click", () => {
					this.exportChaptersJson().then();
				});
			}
			if (importChaptersJsonBtn && !importChaptersJsonBtn.dataset.bound) {
				importChaptersJsonBtn.dataset.bound = "1";
				importChaptersJsonBtn.addEventListener("click", () => {
					this.importChaptersJson().then();
				});
			}
			if (deleteBtn && !deleteBtn.dataset.bound) {
				deleteBtn.dataset.bound = "1";
				deleteBtn.addEventListener("click", () => {
					this.deleteSelectedRows().then();
				});
			}
			if (deleteDownloadedBtn && !deleteDownloadedBtn.dataset.bound) {
				deleteDownloadedBtn.dataset.bound = "1";
				deleteDownloadedBtn.addEventListener("click", () => {
					this.deleteDownloadedChapters().then();
				});
			}
			if (deletePendingByBookIdBtn && !deletePendingByBookIdBtn.dataset.bound) {
				deletePendingByBookIdBtn.dataset.bound = "1";
				deletePendingByBookIdBtn.addEventListener("click", () => {
					this.deletePendingChaptersByBookId().then();
				});
			}
			if (deleteByBookIdBtn && !deleteByBookIdBtn.dataset.bound) {
				deleteByBookIdBtn.dataset.bound = "1";
				deleteByBookIdBtn.addEventListener("click", () => {
					this.deleteChaptersByBookId().then();
				});
			}
		}
		async render() {
			if (!document.getElementById(this.tableId)) return;
			const total = await this.db.countDebugRows(this.tableMode);
			const pageConfig = this.getPageConfig(total);
			const rows = await this.db.getDebugRows(this.tableMode, pageConfig.curr, pageConfig.limit);
			layui.table.render({
				elem: "#" + this.tableId,
				id: this.tableId,
				data: rows,
				lineStyle: null,
				loading: true,
				skin: "row",
				page: false,
				limit: pageConfig.limit,
				even: true,
				cols: this.getChapterCols()
			});
			this.renderPager(pageConfig);
		}
		getPageConfig(total) {
			const pageLimit = Number(this.pageState.limit);
			const limit = this.pageLimits.includes(pageLimit) ? pageLimit : this.pageLimits[0];
			const pages = Math.max(1, Math.ceil(total / limit));
			const pageCurr = Math.max(Number(this.pageState.curr) || 1, 1);
			const curr = Math.min(pageCurr, pages);
			this.pageState.curr = curr;
			this.pageState.limit = limit;
			return {
				curr,
				limit,
				limits: this.pageLimits,
				count: total
			};
		}
		renderPager(pageConfig) {
			const pager = this.ensurePagerContainer();
			if (!pager) return;
			layui.laypage.render({
				elem: pager,
				count: pageConfig.count,
				curr: pageConfig.curr,
				limit: pageConfig.limit,
				limits: pageConfig.limits,
				layout: [
					"count",
					"prev",
					"page",
					"next",
					"limit",
					"skip"
				],
				jump: (obj, first) => {
					this.pageState.curr = obj.curr;
					this.pageState.limit = obj.limit;
					if (!first) this.render().then();
				}
			});
		}
		ensurePagerContainer() {
			const pagerId = `${this.tableId}Pager`;
			let pager = document.getElementById(pagerId);
			if (pager) return pager;
			const table = document.getElementById(this.tableId);
			if (!table?.parentElement) return null;
			pager = document.createElement("div");
			pager.id = pagerId;
			pager.style.marginTop = "8px";
			table.parentElement.appendChild(pager);
			return pager;
		}
		async deleteSelectedRows() {
			const checked = layui.table.checkStatus(this.tableId).data;
			if (!checked || checked.length === 0) {
				topLayerMsg("未选中任何数据");
				return;
			}
			const deleted = await this.db.deleteDebugRows(this.tableMode, checked.map((item) => item.id));
			await this.onRowsDeleted?.();
			await this.render();
			topLayerMsg(`已删除 ${deleted} 条 chapters 数据`);
		}
		async exportChapters() {
			const rows = await this.db.getDebugRows("chapters");
			if (!rows || rows.length === 0) {
				topLayerMsg("chapters 表暂无数据可导出");
				return;
			}
			try {
				const sql = this.buildChaptersInsertSql(rows);
				const blob = new Blob([sql], { type: "application/sql;charset=utf-8" });
				(0, file_saver.saveAs)(blob, this.getChaptersExportFileName());
				topLayerMsg(`已导出 ${rows.length} 条 chapters 数据`);
			} catch (e) {
				console.error("导出 chapters 数据失败", e);
				topLayerMsg("导出 chapters 数据失败");
			}
		}
		async exportChaptersJson() {
			const rows = await this.db.getDebugRows("chapters");
			if (!rows || rows.length === 0) {
				topLayerMsg("chapters 表暂无数据可导出");
				return;
			}
			try {
				const json = JSON.stringify(rows, null, 2);
				const blob = new Blob([json], { type: "application/json;charset=utf-8" });
				(0, file_saver.saveAs)(blob, this.getChaptersJsonExportFileName());
				topLayerMsg(`已导出 ${rows.length} 条 chapters JSON 数据`);
			} catch (e) {
				console.error("导出 chapters JSON 数据失败", e);
				topLayerMsg("导出 chapters JSON 数据失败");
			}
		}
		async importChaptersJson() {
			const file = await this.pickJsonFile();
			if (!file) return;
			try {
				const text = await this.readFileText(file);
				const rows = this.parseChaptersJson(text);
				if (!rows || rows.length === 0) {
					topLayerMsg("未读取到可导入的 chapters 数据");
					return;
				}
				if (!await this.confirm(`确定导入 ${rows.length} 条 chapters JSON 数据吗？导入时会忽略 id，已存在章节只按需更新状态。`)) return;
				const result = await this.db.importChapters(rows);
				this.tableMode = "chapters";
				await this.onRowsDeleted?.();
				await this.render();
				topLayerMsg(`导入完成：新增 ${result.added}，更新状态 ${result.updated}，跳过 ${result.skipped}，无效 ${result.invalid}`);
			} catch (e) {
				console.error("导入 chapters JSON 数据失败", e);
				topLayerMsg("导入 chapters JSON 数据失败：" + this.getErrorMessage(e));
			}
		}
		parseChaptersJson(text) {
			const json = JSON.parse(text);
			if (Array.isArray(json)) return json;
			if (Array.isArray(json?.chapters)) return json.chapters;
			return null;
		}
		pickJsonFile() {
			return new Promise((resolve) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".json,application/json";
				input.style.display = "none";
				let resolved = false;
				const finish = (file) => {
					if (resolved) return;
					resolved = true;
					window.removeEventListener("focus", onFocus);
					input.remove();
					resolve(file);
				};
				const onFocus = () => {
					setTimeout(() => {
						if (!input.files || input.files.length === 0) finish(null);
					}, 300);
				};
				input.addEventListener("change", () => {
					finish(input.files?.[0] ?? null);
				}, { once: true });
				window.addEventListener("focus", onFocus, { once: true });
				document.body.appendChild(input);
				input.click();
			});
		}
		readFileText(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result ?? ""));
				reader.onerror = () => reject(reader.error ?? new Error("读取文件失败"));
				reader.readAsText(file, "utf-8");
			});
		}
		buildChaptersInsertSql(rows) {
			const columns = [
				"id",
				"chapterId",
				"bookId",
				"status",
				"href",
				"chapterName",
				"bookName",
				"volumeName",
				"createTime",
				"updateTime"
			];
			const columnSql = columns.join(", ");
			return rows.map((row) => {
				const valueSql = columns.map((column) => this.toSqlValue(row[column])).join(", ");
				return `INSERT INTO chapters (${columnSql}) VALUES (${valueSql});`;
			}).join("\n") + "\n";
		}
		toSqlValue(value) {
			if (value === null || typeof value === "undefined") return "NULL";
			if (typeof value === "number" && Number.isFinite(value)) return String(value);
			if (typeof value === "boolean") return value ? "1" : "0";
			return `'${String(value).replace(/'/g, "''")}'`;
		}
		getChaptersExportFileName() {
			const now = new Date();
			const pad = (value) => String(value).padStart(2, "0");
			return `chapters_${[
				now.getFullYear(),
				pad(now.getMonth() + 1),
				pad(now.getDate())
			].join("")}_${[
				pad(now.getHours()),
				pad(now.getMinutes()),
				pad(now.getSeconds())
			].join("")}.sql`;
		}
		getChaptersJsonExportFileName() {
			const now = new Date();
			const pad = (value) => String(value).padStart(2, "0");
			return `chapters_${[
				now.getFullYear(),
				pad(now.getMonth() + 1),
				pad(now.getDate())
			].join("")}_${[
				pad(now.getHours()),
				pad(now.getMinutes()),
				pad(now.getSeconds())
			].join("")}.json`;
		}
		async deleteDownloadedChapters() {
			if (!await this.confirm("确定删除所有已下载章节记录吗？")) return;
			const deleted = await this.db.deleteDownloadedChapters();
			this.tableMode = "chapters";
			await this.onRowsDeleted?.();
			await this.render();
			topLayerMsg(`已删除 ${deleted} 条已下载章节记录`);
		}
		async deletePendingChaptersByBookId() {
			const bookId = await this.promptBookId();
			if (bookId === null) return;
			if (!bookId) {
				topLayerMsg("bookId 不能为空");
				return;
			}
			if (!await this.confirm(`确定删除 bookId=${bookId} 的未下载章节记录吗？`)) return;
			const deleted = await this.db.deletePendingChaptersByBookId(bookId);
			this.tableMode = "chapters";
			await this.onRowsDeleted?.();
			await this.render();
			topLayerMsg(`已删除 bookId=${bookId} 的 ${deleted} 条未下载章节记录`);
		}
		async deleteChaptersByBookId() {
			const bookId = await this.promptBookId();
			if (bookId === null) return;
			if (!bookId) {
				topLayerMsg("bookId 不能为空");
				return;
			}
			if (!await this.confirm(`确定删除 bookId=${bookId} 的所有章节记录吗？已下载章节也会删除。`)) return;
			const deleted = await this.db.deleteChaptersByBookId(bookId);
			this.tableMode = "chapters";
			await this.onRowsDeleted?.();
			await this.render();
			topLayerMsg(`已删除 bookId=${bookId} 的 ${deleted} 条章节记录`);
		}
		getChapterCols() {
			return [[
				{ type: "checkbox" },
				{
					field: "id",
					title: "ID",
					width: 70,
					sort: true
				},
				{
					field: "status",
					title: "状态",
					width: 80,
					templet: (d) => {
						if (d.status === 0) return "<span style=\"color: #FF5722;\">待下载</span>";
						else if (d.status === 1) return "<span style=\"color: #4CAF50;\">已下载</span>";
						else return d.status;
					}
				},
				{
					field: "bookName",
					title: "书名",
					minwidth: 80
				},
				{
					field: "volumeName",
					title: "卷名",
					minwidth: 70
				},
				{
					field: "chapterName",
					title: "章节名",
					minwidth: 70
				},
				{
					field: "href",
					title: "地址",
					minwidth: 70
				},
				{
					field: "chapterId",
					title: "章节ID",
					minwidth: 70
				},
				{
					field: "bookId",
					title: "书ID",
					minwidth: 70
				},
				{
					field: "createTime",
					title: "创建时间",
					minwidth: 70,
					templet: (d) => this.formatTime(d.createTime)
				},
				{
					field: "updateTime",
					title: "更新时间",
					minwidth: 70,
					templet: (d) => this.formatTime(d.updateTime)
				}
			]];
		}
		formatTime(timestamp) {
			if (!timestamp) return "";
			return new Date(timestamp).toLocaleString();
		}
		confirm(message) {
			return new Promise((resolve) => {
				topLayerConfirm(message, (index) => {
					layui.layer.close(index);
					resolve(true);
				}, (index) => {
					layui.layer.close(index);
					resolve(false);
				});
			});
		}
		promptBookId() {
			return new Promise((resolve) => {
				let resolved = false;
				const finish = (value) => {
					if (resolved) return;
					resolved = true;
					resolve(value);
				};
				layui.layer.prompt({
					title: "请输入 bookId",
					zIndex: layui.layer.zIndex,
					formType: 0,
					success(layero) {
						layui.layer.setTop(layero);
					},
					cancel(index) {
						layui.layer.close(index);
						finish(null);
					},
					end() {
						finish(null);
					}
				}, (value, index) => {
					layui.layer.close(index);
					finish(String(value ?? "").trim());
				});
			});
		}
		getErrorMessage(err) {
			if (err instanceof Error) return err.message;
			return String(err);
		}
	};
	var DownloadInfoWindowView = class {
		constructor(containerId) {
			this.index = 0;
			this.containerId = containerId;
		}
		ensure() {
			if (this.index !== 0) return this.index;
			this.index = layui.layer.open({
				type: 1,
				title: "下载面板",
				shadeClose: false,
				closeBtn: 0,
				shade: 0,
				moveOut: true,
				maxmin: true,
				area: ["70%", "80%"],
				content: `<div id="${this.containerId}" style="width: 100%;height: 99%;"></div>`,
				success: function(layero, index) {
					layui.layer.setTop(layero);
					layui.layer.min(index);
				}
			});
			return this.index;
		}
		setTitle(title) {
			layui.layer.title(title, this.ensure());
		}
		minimize() {
			layui.layer.min(this.ensure());
		}
		restore() {
			layui.layer.restore(this.ensure());
		}
		resetTitle() {
			this.setTitle("下载面板");
		}
		getContainer() {
			return document.getElementById(this.containerId);
		}
	};
	function renderIntroFixbar(handlers) {
		layui.use(function() {
			layui.util.fixbar({
				bars: [
					{
						type: "复制书名",
						icon: "layui-icon-success"
					},
					{
						type: "添加全部",
						icon: "layui-icon-addition"
					},
					{
						type: "删除本书",
						icon: "layui-icon-subtraction"
					},
					{
						type: "导出本书EPUB文件",
						icon: "layui-icon-release"
					},
					{
						type: "启动",
						icon: "layui-icon-play"
					},
					{
						type: "停止",
						icon: "layui-icon-pause"
					},
					{
						type: "恢复残留",
						icon: "layui-icon-refresh-3"
					},
					{
						type: "章节列表",
						icon: "layui-icon-list"
					}
				],
				default: false,
				bgcolor: "#ff5722",
				css: {
					bottom: "20%",
					right: 0
				},
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
					const handler = handlers[type];
					if (handler) Promise.resolve(handler()).catch(console.error);
				}
			});
		});
	}
	var InfoWindowView = class {
		constructor({ progressFilter, debugTableId, chapterTreeId, getChapterTreeData, onChapterClick, onDownloadChecked, onDownloadAll, onResume, onRecoverStale, onReady }) {
			this.index = 0;
			this.progressFilter = progressFilter;
			this.debugTableId = debugTableId;
			this.chapterTreeId = chapterTreeId;
			this.getChapterTreeData = getChapterTreeData;
			this.onChapterClick = onChapterClick;
			this.onDownloadChecked = onDownloadChecked;
			this.onDownloadAll = onDownloadAll;
			this.onResume = onResume;
			this.onRecoverStale = onRecoverStale;
			this.onReady = onReady;
		}
		ensure() {
			if (this.index !== 0) return this.index;
			this.index = layui.layer.tab({
				shadeClose: false,
				closeBtn: 0,
				shade: 0,
				maxmin: true,
				area: ["70%", "80%"],
				moveOut: true,
				tab: [
					{
						title: "章节列表",
						content: "<div style=\"height: 100%;width: 100%;padding-top: 10px;\"><div id=\"downloadWindowDivListTreeId\"></div></div>"
					},
					{
						title: "下载进度",
						content: "<div style=\"height: 100%;width: 100%;padding-top: 10px;\"><div id=\"downloadWindowDivInfoId\"><fieldset class=\"layui-elem-field\">\n  <legend style=\"color:red;\">当前下载</legend>\n  <div class=\"layui-field-box\">\n      <a id=\"downloadInfoContentId\" href=\"\" style=\"color:red;\">暂无下载</a>\n  </div>\n</fieldset><fieldset class=\"layui-elem-field\">\n  <legend style=\"color:red;\">下载信息</legend>\n  <div class=\"layui-field-box\">\n<div class=\"layui-progress layui-progress-big\" lay-showPercent=\"true\" lay-filter=\"" + this.progressFilter + "\"> <div class=\"layui-progress-bar layui-bg-orange\" lay-percent=\"0%\"></div></div>  </div><div class=\"layui-bg-gray\" style=\"padding: 16px;\">\n  <div class=\"layui-row layui-col-space15\">\n    <div class=\"layui-col-md4\">\n      <div class=\"layui-card\">\n        <div class=\"layui-card-header\">待下载数</div>\n        <div class=\"layui-card-body\" id=\"pendingDownloadCount\">0</div>\n      </div>\n    </div>\n    <div class=\"layui-col-md4\">\n      <div class=\"layui-card\">\n        <div class=\"layui-card-header\">已下载数</div>\n        <div class=\"layui-card-body\" id=\"downloadedCount\">0</div>\n      </div>\n    </div>\n    <div class=\"layui-col-md4\">\n      <div class=\"layui-card\">\n        <div class=\"layui-card-header\">总数（待下载数+已下载数）</div>\n        <div class=\"layui-card-body\" id=\"allCount\">0</div>\n      </div>\n    </div>  </div>\n</fieldset>" + this.getSystemInfoPanelHtml() + "</div></div>"
					},
					{
						title: "书籍章节信息",
						content: "<div id=\"chapterTabId\" style=\"height: 100%;width: 100%;padding: 10px;box-sizing: border-box;\"><div style=\"margin-bottom: 10px;display: flex;gap: 8px;flex-wrap: wrap;\">  <button id=\"debugRefreshBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-primary\">刷新</button>  <button id=\"debugExportChaptersBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-normal\">导出 chapters SQL</button>  <button id=\"debugExportChaptersJsonBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-normal\">导出 chapters JSON</button>  <button id=\"debugImportChaptersJsonBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-warm\">上传 chapters JSON</button>  <button id=\"debugDeleteRowsBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-danger\">删除选中</button>  <button id=\"debugDeletePendingByBookIdBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-danger\">按书ID删除未下载</button>  <button id=\"debugDeleteByBookIdBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-danger\">按书ID删除章节</button>  <button id=\"debugDeleteDownloadedChaptersBtn\" type=\"button\" class=\"layui-btn layui-btn-sm layui-btn-danger\">删除已下载章节</button></div><table id=\"" + this.debugTableId + "\" lay-filter=\"" + this.debugTableId + "\"></table></div>"
					}
				],
				btn: [
					"添加选中章节",
					"添加全部章节",
					"继续下载",
					"恢复残留"
				],
				btn1: () => {
					this.runAsync(this.onDownloadChecked);
					return false;
				},
				btn2: () => {
					this.runAsync(this.onDownloadAll);
					return false;
				},
				btn3: () => {
					this.runAsync(this.onResume);
					return false;
				},
				btn4: () => {
					this.runAsync(this.onRecoverStale);
					return false;
				},
				success: (layero) => {
					layui.layer.setTop(layero);
					layui.element.render("progress", this.progressFilter);
					layui.element.progress(this.progressFilter, "0%");
					this.runAsync(this.onReady);
					this.renderChapterTree();
				}
			});
			return this.index;
		}
		renderChapterTree() {
			layui.tree.render({
				elem: "#downloadWindowDivListTreeId",
				data: this.getChapterTreeData(),
				showCheckbox: true,
				onlyIconControl: true,
				id: this.chapterTreeId,
				isJump: false,
				click: (obj) => {
					this.runAsync(() => this.onChapterClick(obj.data));
				}
			});
		}
		reloadChapterTree() {
			if (document.getElementById("downloadWindowDivListTreeId")) layui.tree.reload(this.chapterTreeId, { data: this.getChapterTreeData() });
		}
		getCheckedChapters() {
			return layui.tree.getChecked(this.chapterTreeId);
		}
		setProgress(percent, stats) {
			if (document.querySelector(`[lay-filter="${this.progressFilter}"]`)) layui.element.progress(this.progressFilter, percent);
			const pendingDownloadCount = document.getElementById("pendingDownloadCount");
			if (pendingDownloadCount) pendingDownloadCount.innerText = stats.pending;
			const downloadedCount = document.getElementById("downloadedCount");
			if (downloadedCount) downloadedCount.innerText = stats.downloaded;
			const allCount = document.getElementById("allCount");
			if (allCount) allCount.innerText = stats.total;
		}
		setCurrentDownload(text, href = "") {
			const infoEl = document.getElementById("downloadInfoContentId");
			if (!infoEl) return;
			infoEl.innerText = text;
			infoEl.href = href;
		}
		setIdleDownload(stats) {
			if (stats.pending === 0) this.setCurrentDownload(stats.total === 0 ? "暂无下载" : "下载结束");
		}
		getSystemInfoPanelHtml() {
			return "<div class=\"layui-bg-gray\" style=\"padding: 16px;\">\n  <div class=\"layui-row layui-col-space15\" id=\"systemInfoPanelId\">" + this.getSystemInfoItemHtml("status", "状态") + this.getSystemInfoItemHtml("consumerHeartbeat", "心跳时间") + this.getSystemInfoItemHtml("consumerStartedAt", "消费开始") + this.getSystemInfoItemHtml("lastDownloadTime", "最后下载") + this.getSystemInfoItemHtml("updateTime", "系统更新时间") + this.getSystemInfoItemHtml("displayUpdatedAt", "系统刷新时间") + this.getSystemInfoItemHtml("consumerPageLabel", "消费页", 6) + this.getSystemInfoItemHtml("consumerPageId", "消费页ID", 6) + this.getSystemInfoItemHtml("currentChapterId", "当前章节ID", 6) + this.getSystemInfoItemHtml("currentChapterHref", "当前章节地址", 6) + this.getSystemInfoItemHtml("currentBookName", "当前书名", 12) + "  </div>\n</div>";
		}
		getSystemInfoItemHtml(field, label, size = 2) {
			return `<div class="layui-col-md${size}">
                  <div class="layui-card">
                    <div class="layui-card-header">${label}</div>
                    <div class="layui-card-body" id="systemInfoValue-${field}">-</div>
                  </div>
                </div>`;
		}
		setSystemInfo(systemInfo, displayUpdatedAt = Date.now()) {
			if (!document.getElementById("systemInfoPanelId")) return;
			const viewModel = {
				id: systemInfo?.id ?? "",
				status: this.formatStatus(systemInfo?.status),
				consumerPageLabel: systemInfo?.consumerPageLabel ?? "",
				consumerPageId: systemInfo?.consumerPageId ?? "",
				consumerHeartbeat: this.formatTime(systemInfo?.consumerHeartbeat),
				consumerStartedAt: this.formatTime(systemInfo?.consumerStartedAt),
				currentChapterId: systemInfo?.currentChapterId ?? "",
				currentChapterHref: systemInfo?.currentChapterHref ?? "",
				currentBookName: systemInfo?.currentBookName ?? "",
				lastDownloadTime: this.formatTime(systemInfo?.lastDownloadTime),
				updateTime: this.formatTime(systemInfo?.updateTime),
				displayUpdatedAt: this.formatTime(displayUpdatedAt)
			};
			Object.entries(viewModel).forEach(([field, value]) => {
				const el = document.getElementById("systemInfoValue-" + field);
				if (el) el.textContent = value || "-";
			});
		}
		formatStatus(status) {
			switch (status) {
				case 0: return "空闲";
				case 1: return "下载中";
				case 2: return "异常";
				default: return typeof status === "undefined" ? "" : String(status);
			}
		}
		formatTime(timestamp) {
			if (!timestamp) return "";
			return new Date(timestamp).toLocaleString();
		}
		minimize() {
			layui.layer.min(this.ensure());
		}
		runAsync(handler) {
			Promise.resolve(handler?.()).catch(console.error);
		}
	};
	var IntroV3Controller = class {
		constructor(doc = document) {
			this.doc = doc;
			this.db = new DatabaseService();
			this.worker = new WorkerSingleton();
			this.catalog = new ChapterCatalogModel();
			this.pageId = getOrCreatePageId();
			this.pageLabel = getPageLabel(this.pageId);
			this.handlingWorkerMessage = false;
			this.workerRunning = false;
			this.releaseAfterCurrentTask = false;
			this.downloadInfoWindow = new DownloadInfoWindowView(DOWNLOAD_INFO_WINDOW_DIV_ID);
			this.debugTable = new DebugTableView({
				db: this.db,
				tableId: DEBUG_TABLE_ID,
				onRowsDeleted: () => this.updateProgress()
			});
			this.infoWindow = new InfoWindowView({
				progressFilter: INFO_WINDOW_PROGRESS_FILTER,
				debugTableId: DEBUG_TABLE_ID,
				chapterTreeId: CHAPTER_TREE_ID,
				getChapterTreeData: () => this.catalog.getChapterListTree(),
				onChapterClick: (data) => this.addChaptersToDb(this.catalog.toChapterList([data])),
				onDownloadChecked: () => this.treeCheckedDownload(),
				onDownloadAll: () => this.downloadAll(),
				onResume: () => this.resumeDownload(),
				onRecoverStale: () => this.recoverStaleSystemState(),
				onReady: () => this.onInfoWindowReady()
			});
			this.downloadService = new ChapterDownloadService({
				downloadInfoWindow: this.downloadInfoWindow,
				infoWindow: this.infoWindow,
				downloaderInterval: DOWNLOADER_INTERVAL
			});
			this.worker.updateInterval(DOWNLOADER_INTERVAL);
			this.worker.handleCallBack = async () => {
				await this.consumeNextChapter();
			};
		}
		async init() {
			await this.db.getSystemInfo();
			this.bindPageLifecycle();
			this.renderFixbar();
		}
		renderFixbar() {
			renderIntroFixbar({
				"添加全部": () => {
					this.infoWindow.minimize();
					return this.downloadAll();
				},
				"删除本书": () => this.deleteBookById(),
				"复制书名": () => copyContext(this.catalog.getBookName()),
				"导出本书EPUB文件": () => buildEpub(this.doc),
				"启动": () => this.startWorker(),
				"停止": () => this.stopWorker(),
				"恢复残留": () => this.recoverStaleSystemState(),
				"章节列表": () => this.openBookChapterListPage()
			});
		}
		async onInfoWindowReady() {
			await this.updateProgress();
			await this.updateSystemInfoPanel();
			this.debugTable.bindEvents();
			await this.debugTable.render();
		}
		async consumeNextChapter() {
			if (this.handlingWorkerMessage || !this.workerRunning) return;
			this.handlingWorkerMessage = true;
			try {
				const hasLease = await this.db.renewConsumerHeartbeat(this.pageId, this.pageLabel);
				await this.updateSystemInfoPanel();
				if (!hasLease) {
					await this.stopWorker(false, false);
					topLayerMsg("当前页面已失去下载控制权");
					return;
				}
				const systemInfo = await this.db.getSystemInfo();
				if (systemInfo.status === 2) return;
				const chapter = await this.db.claimNextChapterForDownload(this.pageId);
				if (!chapter) {
					await this.updateProgress();
					return;
				}
				await this.updateSystemInfoPanel();
				await this.downloadService.download(chapter, systemInfo.lastDownloadTime);
				const lastDownloadTime = Date.now();
				await this.db.markChapterDownloaded(chapter.id, this.pageId, lastDownloadTime);
				await this.updateProgress();
				await this.updateSystemInfoPanel();
				if ((await this.db.getChapterStats()).pending === 0) {
					this.finishDownloadWindow();
					topLayerMsg("章节下载完毕", {
						icon: 1,
						shadeClose: true,
						zIndex: layui.layer.zIndex
					});
				}
			} catch (err) {
				await this.db.markDownloadError(this.pageId);
				await this.updateSystemInfoPanel();
				await this.stopWorker(false, false);
				this.infoWindow.minimize();
				this.downloadInfoWindow.restore();
				topLayerMsg("出现错误：" + this.getErrorMessage(err), {
					icon: 5,
					shadeClose: true,
					zIndex: layui.layer.zIndex
				});
			} finally {
				if (this.releaseAfterCurrentTask) {
					await this.db.releaseConsumer(this.pageId);
					this.releaseAfterCurrentTask = false;
					await this.updateSystemInfoPanel();
				}
				this.handlingWorkerMessage = false;
			}
		}
		async treeCheckedDownload() {
			const checkedData = this.infoWindow.getCheckedChapters();
			if (checkedData.length === 0) {
				topLayerMsg("未选中任何数据");
				return;
			}
			await this.addChaptersToDb(this.catalog.toChapterList(checkedData));
		}
		async confirm(message) {
			return new Promise((resolve) => {
				topLayerConfirm(message, (index) => {
					layui.layer.close(index);
					resolve(true);
				}, (index) => {
					layui.layer.close(index);
					resolve(false);
				});
			});
		}
		async deleteBookById() {
			const bookId = new URL(this.doc.URL).searchParams.get("id");
			if (!bookId) return;
			if (!await this.confirm(`确定删除 bookId=${bookId} 的所有章节记录吗？已下载章节也会删除。`)) return;
			topLayerMsg(`已删除 bookId=${bookId} 的 ${await this.db.deleteChaptersByBookId(bookId)} 条章节记录`);
		}
		async downloadAll() {
			await this.addChaptersToDb(this.catalog.toChapterList(this.catalog.getChapterListTree()));
		}
		async addChaptersToDb(chapters) {
			const validChapters = chapters.filter((data) => data.href && data.href.trim().length > 0);
			const result = await this.db.addChaptersIfAbsent(validChapters);
			await this.updateProgress();
			topLayerMsg(`已加入 ${result.added} 章，重复 ${result.duplicated} 章`);
		}
		async clearPendingChapters() {
			await this.db.deletePendingChapters();
			this.infoWindow.reloadChapterTree();
			await this.updateProgress();
			topLayerMsg("未下载章节已清除");
		}
		async stopWorker(releaseConsumer = true, showMessage = true) {
			this.worker.stop();
			this.workerRunning = false;
			if (releaseConsumer && this.handlingWorkerMessage) this.releaseAfterCurrentTask = true;
			else if (releaseConsumer) await this.db.releaseConsumer(this.pageId);
			if (showMessage) topLayerMsg(this.handlingWorkerMessage ? "当前章节完成后暂停" : "下载系统已暂停");
		}
		async startWorker() {
			if (!(await this.db.tryBecomeConsumer(this.pageId, this.pageLabel)).acquired) {
				topLayerMsg("已有其他页面正在下载，请在该页面继续");
				return false;
			}
			this.worker.start();
			this.workerRunning = true;
			this.releaseAfterCurrentTask = false;
			topLayerMsg("下载系统已启动");
			return true;
		}
		async resumeDownload() {
			if (!await this.startWorker()) return;
			await this.db.resetSystemInfoStatus(this.pageId);
			await this.updateProgress();
		}
		async recoverStaleSystemState() {
			const result = await this.db.recoverStaleSystemState();
			await this.updateProgress();
			await this.debugTable.render();
			if (result.recovered) {
				topLayerMsg("已清理过期的下载页残留");
				return;
			}
			if (result.reason === "active_consumer") topLayerMsg("当前没有可恢复的过期残留");
		}
		async updateProgress() {
			const stats = await this.db.getChapterStats();
			const percent = stats.total === 0 ? "0%" : (stats.downloaded / stats.total * 100).toFixed(2) + "%";
			this.infoWindow.setProgress(percent, stats);
			this.infoWindow.setIdleDownload(stats);
		}
		async updateSystemInfoPanel() {
			const systemInfo = await this.db.getSystemInfo();
			this.infoWindow.setSystemInfo(systemInfo);
		}
		finishDownloadWindow() {
			this.downloadInfoWindow.resetTitle();
			this.infoWindow.setCurrentDownload("下载结束");
			this.downloadInfoWindow.minimize();
		}
		async openBookChapterListPage() {
			this.infoWindow.ensure();
		}
		bindPageLifecycle() {
			window.addEventListener("beforeunload", () => {
				if (!this.workerRunning) return;
				this.worker.stop();
				this.workerRunning = false;
				this.db.releaseConsumer(this.pageId).catch(() => {});
			});
		}
		getErrorMessage(err) {
			if (err instanceof Error) return err.message;
			return String(err);
		}
	};
	(function main() {
		switch (new URL(document.URL).pathname) {
			case "/novel/intro":
				init().then(async () => {
					await new IntroV3Controller().init();
				}).catch((e) => {
					console.log(e);
				});
				break;
			case "/novel/list":
				init().then(() => {
					HackTimer();
					new ListV2Controller().init();
				}).catch((e) => {
					console.log(e);
				});
				break;
			case "/novel/chapter":
				init().then(() => {
					new ChapterController().init();
				}).catch((e) => {
					console.log(e);
				});
				break;
			default: console.log("pathname 匹配失败");
		}
	})();
})(saveAs, JSZip);
