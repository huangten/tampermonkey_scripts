// ==UserScript==
// @name       UAA 小说 增强
// @namespace  https://tampermonkey.net/
// @version    2026-10-20.15:49:57
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

(async function(file_saver, jszip, dexie) {
	"use strict";
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
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
	jszip = __toESM(jszip);
	dexie = __toESM(dexie);
	var _GM_openInTab = (() => typeof GM_openInTab != "undefined" ? GM_openInTab : void 0)();
	var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
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
				return resolve();
			}, () => {
				console.error("Failed to copy");
				return reject();
			});
		});
	}
	function sleep(ms) {
		let done = false;
		let timer = 0;
		return new Promise((resolve) => {
			timer = setTimeout(() => {
				if (done) return;
				done = true;
				resolve();
			}, ms);
		}).finally(() => {
			if (!done && timer !== 0) {
				clearTimeout(timer);
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
		return Promise.all([addCss("layui_css", "https://cdn.jsdelivr.net/npm/layui@2.13.9/dist/css/layui.min.css"), addScript("layui_id", "https://cdn.jsdelivr.net/npm/layui@2.13.9/dist/layui.min.js")]);
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
		dispose() {
			this.doc = null;
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
			const book = this.doc.getElementById("readerBook");
			if (!book) return "";
			return cleanText(book.textContent.trim());
		}
		getAuthorInfo() {
			const metaBox = this.doc.getElementsByClassName("reader-meta")[0];
			if (!metaBox) return "";
			const authorMatch = metaBox.textContent.trim().match(/(.*?) 著 ·/);
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
		async handleAction(type) {
			switch (type) {
				case "获取标题文本":
					await copyContext(this.model.getTitleText());
					break;
				case "获取标题HTML":
					await copyContext(this.model.getTitleHtml());
					break;
				case "获取内容文本":
					await copyContext(this.model.getContentText());
					break;
				case "获取内容HTML":
					await copyContext(this.model.getContentHtml());
					break;
				case "获取标题和内容文本":
					await copyContext(this.model.getTitleAndContentText());
					break;
				case "获取标题和内容HTML":
					await copyContext(this.model.getTitleAndContentHtml());
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
			if (!url) return null;
			return new Promise((resolve) => {
				_GM_xmlhttpRequest({
					method: "GET",
					url,
					responseType: "blob",
					headers: { Referer: "https://www.uaa.com/" },
					onload: (res) => {
						if (res.status === 200) resolve(res.response);
						else {
							console.error("HTTP CODE " + res.status);
							resolve(null);
						}
					},
					onerror: (err) => {
						console.error(err);
						resolve(null);
					}
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
		dispose() {
			this.doc = null;
			this.location = null;
		}
		getBookName() {
			const bookName = this.doc.getElementsByTagName("h1")[0]?.cloneNode(true);
			const spans = bookName?.getElementsByTagName("span");
			if (spans) for (const span of spans) span.remove();
			if (!bookName) return "";
			return cleanText(bookName.textContent.trim());
		}
		getBookId() {
			return new URL(this.location.href).searchParams.get("id") ?? "";
		}
		getAuthor() {
			const author = this.doc.getElementsByClassName("nd-author")[0]?.getElementsByTagName("a")[0];
			if (!author) return "";
			return author.textContent.trim() ?? "";
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
					let chapterName = cleanText((lis[index].querySelectorAll(".ndc-name")[0].textContent ?? lis[index].getAttribute("title")).trim());
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
						let chapterName = cleanText((menulist[j].querySelectorAll(".ndc-name")[0].textContent ?? menulist[index].getAttribute("title")).trim());
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
	async function fetchBookIntro(url) {
		const response = await fetch(url);
		if (response.status !== 200) throw new Error("服务器错误，状态码：" + response.status);
		const text = await response.text();
		return new DOMParser().parseFromString(text, "text/html");
	}
	async function buildEpub(chapterCatalogModel, options = {}) {
		const zip = new jszip.default();
		const bn = chapterCatalogModel.getBookName();
		let bookName = escapeHtml(cleanText(bn));
		let author = chapterCatalogModel.getAuthor();
		const bookNameFile = cleanText(bn);
		const authorFile = cleanText(author).replace(/\s+/g, " ");
		author = escapeHtml(cleanText(author));
		author = author.replace(/\s+/g, " ");
		let type = chapterCatalogModel.getType();
		let tags = chapterCatalogModel.getTags();
		let rou = chapterCatalogModel.getRou();
		let score = chapterCatalogModel.getScore();
		let lastUpdateTime = chapterCatalogModel.getLatestChapter();
		let intro = chapterCatalogModel.getIntro();
		let chapters = chapterCatalogModel.getChapterListTree();
		zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
		zip.folder("META-INF").file("container.xml", createContainer());
		const o = zip.folder("OEBPS");
		const cssFolder = o.folder("Styles");
		const imgFolder = o.folder("Images");
		const comm = CommonRes.getInstance();
		let coverUrl = chapterCatalogModel.getCover();
		const coverImagePromise = await comm.gmFetchCoverImageBlob(coverUrl);
		if (coverImagePromise !== null) {
			imgFolder.file("cover.jpg", coverImagePromise);
			if (Object.hasOwn(options, "SaveCover") && options.SaveCover === true) {
				if (coverImagePromise.type === "application/octet-stream") {
					console.log("coverImage.type:", coverImagePromise.type);
					const coverFileName = decodeURIComponent(new URL(coverUrl).pathname.split("/").pop());
					(0, file_saver.saveAs)(coverImagePromise, coverFileName);
				}
			}
		}
		await Promise.all([
			comm.getMainCss().then((css) => cssFolder.file("main.css", css)),
			comm.getFontsCss().then((css) => cssFolder.file("fonts.css", css)),
			comm.getLogoImg().then((img) => imgFolder.file("logo.webp", img)),
			comm.getLine1Img().then((img) => imgFolder.file("line1.webp", img)),
			comm.getGirlImg().then((img) => imgFolder.file("girl.jpg", img))
		]);
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
				textFolder.file(`${id}.xhtml`, genVolumeHtmlPage(escapeHtml(cleanText(c.title)), volumeIndex));
				let volumeNcxNav = `<navPoint id="${id}" playOrder="${i + 1}">
    <navLabel><text>${escapeHtml(cleanText(c.title))}</text></navLabel>
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
		(0, file_saver.saveAs)(blob, `${bookNameFile} 作者：${authorFile}.epub`);
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
  <style>
  div {
    text-align: center;
    padding: 0pt;
    margin: 0pt;
  }
  
  img {
    width: 100%;
  }
  </style>
</head>

<body>
  <div><img alt="cover" src="../Images/cover.jpg" /></div>
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
  .pic {
    margin: 0% 0% 0 0%;
    padding: 2px 2px;
    border: 1px solid #f5f5dc;
    background-color: rgba(250,250,250, 0);
    border-radius: 1px;
  }
  </style>
</head>

<body style="text-align: center;">
  <div class="pic"><img src="../Images/cover.jpg" style="width: 100%;height: auto;"/></div>

  <h1 style="margin-top: 5%;font-size: 110%;">${book.name}</h1>

  <div class="author" style="margin-top: 0;"><b>${book.author}</b><span style="font-size: smaller;">/ 著</span></div>
</body>
</html>

`;
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
</html>

`;
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
</html>

`;
	}
	var DatabaseService = class DatabaseService {
		static instance = null;
		db;
		consumerLeaseTtl = 15e3;
		constructor() {
			if (DatabaseService.instance) return DatabaseService.instance;
			this.db = new dexie.default(this.getDBName());
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
			if (await this.getChapterByHrefAndChapterName(chapter)) return false;
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
		async getChapterByHrefAndChapterName(chapter) {
			const exists = await this.db.table("chapters").where("href").equals(chapter.href).toArray();
			for (const exist of exists) if (exist.href === chapter.href && exist.chapterName === chapter.chapterName && exist.bookName === chapter.bookName && exist.bookId === chapter.bookId) return exist;
			return null;
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
					const exist = await this.getChapterByHrefAndChapterName(data);
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
				btnAlign: "c",
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
					const catalog = new ChapterCatalogModel(await fetchBookIntro(task.href), { href: task.href });
					if (task.addChaptersToDb) await this.addBookChaptersToDb(task, catalog);
					await buildEpub(catalog, { SaveCover: task.SaveCover });
					catalog.dispose();
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
		async addBookChaptersToDb(task, catalog) {
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
  let interval = 1000;

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
			const downloadInfoText = chapter.bookName + " : " + chapter.chapterName;
			this.downloadInfoWindow.setTitle(downloadInfoText);
			this.infoWindow.setCurrentDownload(downloadInfoText, chapter.href);
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
			this.downloadInfoWindow.setTitle("下载成功：" + downloadInfoText);
			chapterPageModel.dispose();
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
						type: "导出本书",
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
						content: "<div style=\"height: 100%;width: 100%;padding-top: 10px;\"><div id=\"downloadWindowDivInfoId\"><fieldset class=\"layui-elem-field\">\n  <legend style=\"color:red;\">当前下载</legend>\n  <div class=\"layui-field-box\">\n      <a id=\"downloadInfoContentId\" href=\"\" style=\"color:red;\">暂无下载</a>\n  </div>\n</fieldset><fieldset class=\"layui-elem-field\">\n  <legend style=\"color:red;\">下载信息</legend>\n<div class=\"layui-bg-gray\" style=\"padding: 10px;\">\n  <div class=\"layui-row layui-col-space15\">\n    <div class=\"layui-col-md4\">\n      <div class=\"layui-card\">\n        <div class=\"layui-card-header\">待下载数</div>\n        <div class=\"layui-card-body\" id=\"pendingDownloadCount\">0</div>\n      </div>\n    </div>\n    <div class=\"layui-col-md4\">\n      <div class=\"layui-card\">\n        <div class=\"layui-card-header\">已下载数</div>\n        <div class=\"layui-card-body\" id=\"downloadedCount\">0</div>\n      </div>\n    </div>\n    <div class=\"layui-col-md4\">\n      <div class=\"layui-card\">\n        <div class=\"layui-card-header\">总数（待下载数+已下载数）</div>\n        <div class=\"layui-card-body\" id=\"allCount\">0</div>\n      </div>\n    </div>  </div></fieldset>" + this.getSystemInfoPanelHtml() + "</div></div>"
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
			return "<div class=\"layui-bg-gray\" style=\"padding: 10px;\">\n  <div class=\"layui-row layui-col-space15\" id=\"systemInfoPanelId\">" + this.getSystemInfoItemHtml("status", "状态") + this.getSystemInfoItemHtml("consumerHeartbeat", "心跳时间") + this.getSystemInfoItemHtml("consumerStartedAt", "消费开始") + this.getSystemInfoItemHtml("lastDownloadTime", "最后下载") + this.getSystemInfoItemHtml("updateTime", "系统更新时间") + this.getSystemInfoItemHtml("displayUpdatedAt", "系统刷新时间") + this.getSystemInfoItemHtml("consumerPageLabel", "消费页", 4) + this.getSystemInfoItemHtml("consumerPageId", "消费页ID", 4) + this.getSystemInfoItemHtml("currentChapterId", "当前章节ID", 4) + this.getSystemInfoItemHtml("currentBookName", "当前书名", 12) + "  </div>\n</div>";
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
				"导出本书": async () => await buildEpub(this.catalog),
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
	function listAdjustUI() {
		const cheros = document.getElementsByClassName("cn-chero");
		if (cheros) for (const chero of [...cheros]) chero.remove();
		document.getElementById("cnEntries")?.style.setProperty("padding-top", "60px");
	}
	async function router() {
		switch (new URL(document.URL).pathname) {
			case "/novel/intro":
				await init();
				await new IntroV3Controller().init();
				break;
			case "/novel/list":
				listAdjustUI();
				await init();
				HackTimer();
				new ListV2Controller().init();
				break;
			case "/novel/chapter":
				await init();
				new ChapterController().init();
				break;
			default: console.log("路由规则匹配失败");
		}
	}
	await(router());
})(saveAs, JSZip, Dexie);
