// ==UserScript==
// @name       色花堂 增强
// @namespace  https://tampermonkey.net/
// @version    2026-10-04.20:28:22
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org
// @match      https://*.sehuatang.org/*
// @match      https://*.sehuatang.org
// @require    https://unpkg.com/hacktimer/HackTimer.js
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @connect    *
// @grant      GM_addStyle
// @grant      GM_download
// @grant      GM_getResourceText
// @grant      GM_notification
// @grant      GM_registerMenuCommand
// @grant      GM_unregisterMenuCommand
// @grant      GM_xmlhttpRequest
// @grant      unsafeWindow
// @run-at     document-idle
// @noframes
// ==/UserScript==

(async function(file_saver) {
	"use strict";
	var _GM_registerMenuCommand = (() => typeof GM_registerMenuCommand != "undefined" ? GM_registerMenuCommand : void 0)();
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
	function copyContext(str) {
		return new Promise((resolve, reject) => {
			navigator.clipboard.writeText(str).then(() => {
				console.log("Content copied to clipboard");
				return resolve();
			}, () => {
				console.error("Failed to copy");
				return reject();
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
	var DetailPageModel = class {
		constructor(doc = document) {
			this.doc = doc;
		}
		async getInfo(options = { SaveImage: false }) {
			const type = this.getType();
			const imageLinks = this.getImages();
			console.log(imageLinks);
			const imgs = [];
			for (let index = 0; index < imageLinks.length; index++) {
				let paths = imageLinks[index].split("/");
				let file = paths[paths.length - 1].split(".");
				let ext = file[file.length - 1];
				let name = this.getSelfFilename() + "_" + index + "." + ext;
				if (Object.hasOwn(options, "SaveImage") && options.SaveImage === true) await this.saveImage(imageLinks[index], name);
				imgs.push({
					"isExist": false,
					"hasDownload": false,
					"filename": name,
					"href": imageLinks[index]
				});
			}
			const magnets = this.getMagnets();
			const btNames = this.getBtNames();
			const time = this.getTime();
			const selfFilename = this.getFileName(this.getSelfFilename(), "txt");
			const sehuatangTexts = this.getsehuatangTexts();
			let info = {
				"title": this.getTitleText(),
				"avNumber": this.getAvNumber(),
				"selfFilename": selfFilename,
				"year": time.split(" ")[0].split("-")[0],
				"month": time.split(" ")[0].split("-")[1],
				"day": time.split(" ")[0].split("-")[2],
				"date": time.split(" ")[0],
				"time": time,
				"sehuatangInfo": {
					"type": type,
					"link": this.getPageLink(),
					"infos": sehuatangTexts,
					"imgs": imgs,
					"magnets": magnets,
					"bts": btNames
				}
			};
			await this.doBtDownload();
			const blob = new Blob([JSON.stringify(info, null, 4)], { type: "text/plain;charset=utf-8" });
			(0, file_saver.saveAs)(blob, selfFilename);
		}
		async saveImage(imageLink, name) {
			const blob = await this.gmFetchImageBlob(imageLink);
			if (blob) (0, file_saver.saveAs)(blob, name);
		}
		async gmFetchImageBlob(url) {
			if (!url) return null;
			return new Promise((resolve) => {
				_GM_xmlhttpRequest({
					method: "GET",
					url,
					responseType: "blob",
					headers: { Referer: "https://www.sehuatang.org/" },
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
		getAvNumber() {
			const sehuatangTexts = this.getsehuatangTexts();
			let avNumber = "";
			for (let index = 0; index < sehuatangTexts.length; index++) {
				const element = sehuatangTexts[index];
				if (element.indexOf("品番：") > -1) {
					avNumber = element.replace("品番：", "").trim();
					return avNumber;
				}
			}
			const title = this.getTitleText();
			const type = this.getType();
			if (type.localeCompare("高清中文字幕") === 0 || type.localeCompare("4K原版") === 0) return title.split(" ")[0];
			return title;
		}
		getTime() {
			let time = "";
			try {
				time = this.doc.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].getElementsByTagName("span")[0].getAttribute("title");
			} catch (e) {
				time = this.doc.getElementsByClassName("authi")[1].getElementsByTagName("em")[0].innerText.replace("发表于", "").trim();
			}
			return time;
		}
		getType() {
			return this.doc.getElementsByClassName("bm cl")[0].getElementsByTagName("a")[3].innerText.trim();
		}
		getImages() {
			const imgs = this.doc.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName("tr")[0].getElementsByTagName("img");
			let res = [];
			for (let index = 0; index < imgs.length; index++) {
				const element = imgs[index];
				if (element.getAttribute("id") !== null && element.getAttribute("id").indexOf("aimg") > -1) res.push(element.getAttribute("file"));
			}
			return res;
		}
		getsehuatangTexts() {
			let sehuatangTextArray = this.doc.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName("tr")[0].innerText.split("\n").filter((item) => {
				return item !== null && typeof item !== "undefined" && item !== "";
			});
			let replaceArr = [
				"播放",
				"复制代码",
				"undefined",
				"立即免费观看"
			];
			for (let index = 0; index < sehuatangTextArray.length; index++) for (let j = 0; j < replaceArr.length; j++) sehuatangTextArray[index] = sehuatangTextArray[index].replace(replaceArr[j], "").trim();
			return sehuatangTextArray;
		}
		getSelfFilename() {
			let title = this.getTitleText();
			let replaceList = "/?*:|\\<>\"".split("");
			for (let i = 0; i < replaceList.length; i++) title = title.replaceAll(replaceList[i], "_");
			return title;
		}
		getFileName(name, ext) {
			return name + "." + ext;
		}
		getDownloadBtTags() {
			let attnms = this.doc.getElementsByClassName("attnm");
			let aTags = [];
			if (attnms !== null && attnms.length === 0) aTags = this.doc.getElementsByClassName("t_fsz")[0].getElementsByTagName("table")[0].getElementsByTagName("tr")[0].getElementsByTagName("a");
			else for (let index = 0; index < attnms.length; index++) {
				let as = attnms[index].getElementsByTagName("a");
				for (let j = 0; j < as.length; j++) aTags.push(as[j]);
			}
			let res = [];
			for (let index = 0; index < aTags.length; index++) if (aTags[index].innerText.trim().indexOf("torrent") > -1) res.push(aTags[index]);
			return res;
		}
		getBtNames() {
			let attnms = this.getDownloadBtTags();
			let btNames = [];
			for (let index = 0; index < attnms.length; index++) btNames.push(attnms[index].innerText.trim());
			return btNames;
		}
		async doBtDownload() {
			let attnms = this.getDownloadBtTags();
			for (let index = 0; index < attnms.length; index++) await this.downloadBTFile(attnms[index].href, attnms[index].innerText.trim());
		}
		async downloadBTFile(url, filename) {
			const blob = await this.gmFetchImageBlob(url);
			if (blob) (0, file_saver.saveAs)(blob, filename);
		}
		async copyTitleAndDownload() {
			await copyContext(this.getTitleText() + "\n");
			await this.doBtDownload();
		}
		getMagnets() {
			const magnets = [];
			const blockcode = this.doc.getElementsByClassName("blockcode");
			for (let index = 0; index < blockcode.length; index++) magnets.push(blockcode[index].getElementsByTagName("li")[0].innerText);
			let replaceArr = [
				"播放",
				"复制代码",
				"undefined",
				"立即免费观看"
			];
			for (let index = 0; index < magnets.length; index++) for (let j = 0; j < replaceArr.length; j++) magnets[index] = magnets[index].replace(replaceArr[j], "").trim();
			return magnets;
		}
		async copyTitleAndBlockcode() {
			let info = this.getTitleText() + "\n";
			info += this.getPageLink() + "\n";
			const blockcode = this.getMagnets();
			for (let index = 0; index < blockcode.length; index++) info += blockcode[index] + "\n";
			await copyContext(info);
		}
		getTitle() {
			if (this.doc.getElementById !== void 0) return this.doc.getElementById("thread_subject");
			return this.doc.querySelector("#thread_subject");
		}
		getTitleText() {
			return this.getTitle().innerText;
		}
		getPageLink() {
			return this.doc.querySelector("h1.ts").nextElementSibling.querySelector("a").href;
		}
	};
	var DetailPageFixBarView = class {
		renderFixbar({ onAction }) {
			layui.use(() => {
				layui.util.fixbar({
					bars: [
						{
							type: "下载信息和种子",
							icon: "layui-icon-download-circle"
						},
						{
							type: "仅复制标题",
							icon: "layui-icon-vercode"
						},
						{
							type: "复制标题和下载种子",
							icon: "layui-icon-release"
						},
						{
							type: "复制标题和磁力信息",
							icon: "layui-icon-ok-circle"
						}
					],
					default: false,
					css: { bottom: "10%" },
					bgcolor: "#BA350F",
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
	function initCommand(doc = document) {
		_GM_registerMenuCommand("在 missav.ai 中打开", (event) => {
			const a = doc.createElement("a");
			a.href = "https://missav.ai/dm45/cn/" + doc.getSelection().toString().trim();
			a.target = "_blank";
			a.click();
		});
		_GM_registerMenuCommand("在 jable.tv 中打开", (event) => {
			const a = doc.createElement("a");
			a.href = `https://jable.tv/videos/${doc.getSelection().toString().trim()}/?lang=jp`;
			a.target = "_blank";
			a.click();
		});
	}
	var DetailPageController = class {
		constructor({ model = new DetailPageModel(document), view = new DetailPageFixBarView() } = {}) {
			this.model = model;
			this.view = view;
		}
		init() {
			initCommand(document);
			this.view.renderFixbar({ onAction: (type) => this.handleAction(type) });
		}
		async handleAction(type) {
			switch (type) {
				case "下载信息和种子":
					await this.model.getInfo();
					break;
				case "仅复制标题":
					await copyContext(this.model.getTitleText().trim());
					break;
				case "复制标题和下载种子":
					await this.model.copyTitleAndDownload();
					break;
				case "复制标题和磁力信息": await this.model.copyTitleAndBlockcode();
			}
		}
	};
	var ListPageModel = class {
		constructor(doc = document) {
			this.doc = doc;
		}
		getTree() {
			let indexMap = new Map();
			let index = 0;
			let tree = [];
			let allLines = this.getAllLines();
			for (let i = 0; i < allLines.length; i++) {
				if (!indexMap.hasOwnProperty(allLines[i].date)) indexMap[allLines[i].date] = {
					"id": i,
					"sehuatang_type": allLines[index].sehuatang_type,
					"title": allLines[i].date,
					"href": "",
					"children": [],
					"spread": false,
					"checked": true,
					"field": ""
				};
				indexMap[allLines[i].date].children.push({
					"id": allLines[i].id,
					"sehuatang_type": allLines[index].sehuatang_type,
					"title": allLines[i].title,
					"href": allLines[i].href,
					"date": allLines[i].date,
					"children": [],
					"checked": true,
					"spread": false,
					"field": ""
				});
			}
			for (let key in indexMap) tree.push(indexMap[key]);
			return tree;
		}
		getAllLines() {
			let lines = [];
			let nav = this.doc.getElementById("pt").getElementsByTagName("a");
			let sehuatang_type = nav[nav.length - 1].innerText;
			let tbodys = this.doc.getElementsByTagName("tbody");
			for (let index = 0; index < tbodys.length; index++) if (tbodys[index].getAttribute("id") !== null && tbodys[index].getAttribute("id").indexOf("normalthread") > -1) {
				let id = tbodys[index].getAttribute("id").split("_")[1];
				let eldate = tbodys[index].getElementsByTagName("td")[1].getElementsByTagName("span");
				let date = eldate[1] === void 0 ? eldate[0].innerText : eldate[1].getAttribute("title");
				let titleBox = tbodys[index].getElementsByTagName("th")[0].getElementsByTagName("a");
				let href = "";
				let title = "";
				for (let i = 0; i < titleBox.length; i++) if (titleBox[i].getAttribute("class") !== null && titleBox[i].getAttribute("class") === "s xst") {
					href = titleBox[i].href;
					title = titleBox[i].innerText;
					break;
				}
				lines.push({
					"id": id,
					"sehuatang_type": sehuatang_type,
					"title": title,
					"href": href,
					"date": date
				});
			}
			return lines;
		}
		getMenuArray(trees) {
			let menus = [];
			for (let index = 0; index < trees.length; index++) if (trees[index].children.length === 0) menus.push({
				"id": trees[index].id,
				"sehuatang_type": trees[index].sehuatang_type,
				"title": trees[index].title,
				"href": trees[index].href,
				"date": trees[index].date
			});
			else for (let j = 0; j < trees[index].children.length; j++) menus.push({
				"id": trees[index].children[j].id,
				"sehuatang_type": trees[index].sehuatang_type,
				"title": trees[index].children[j].title,
				"href": trees[index].children[j].href,
				"date": trees[index].date
			});
			return menus;
		}
	};
	var ListFixBarView = class {
		renderFixbar({ onAction }) {
			layui.use(() => {
				layui.util.fixbar({
					bars: [{
						type: "打开菜单面板",
						icon: "layui-icon-list"
					}],
					default: false,
					bgcolor: "#BA350F",
					css: {
						bottom: "20%",
						right: 10
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
						onAction(type);
					}
				});
			});
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
	var ListInfoWinView = class {
		constructor(doc = document) {
			this.doc = doc;
			this.openBookListWindowIndex = 0;
			this.downloadWindowDivIntroId = "downloadWindowDivIntroId";
			this.progressId = "demo-filter-progress";
			this.downloadInfoContentId = "downloadInfoContentId";
		}
		openInfoWin(options = {}) {
			if (options.downloadScheduler.running || options.downloadScheduler.running) return layui.layer.msg("请等待当前任务完成后再打开列表窗口", {
				icon: 0,
				time: 2e3
			});
			if (this.openBookListWindowIndex !== 0) {
				this.reloadTree(options);
				return this.openBookListWindowIndex;
			}
			const self = this;
			this.openBookListWindowIndex = layui.layer.open({
				type: 1,
				title: "增强面板",
				shadeClose: false,
				closeBtn: 0,
				shade: 0,
				area: ["80%", "80%"],
				skin: "layui-layer-win10",
				maxmin: true,
				content: "<div id=\"downloadWindowDivId\"></div>",
				moveOut: true,
				btn: [
					"下载全部",
					"下载选中的",
					"清除未下载的"
				],
				btn1: async (index, layero, that) => {
					options.downloadAll();
					return false;
				},
				btn2: function(index, layero, that) {
					self.treeCheckedDownload();
					return false;
				},
				btn3: function(index, layero, that) {
					self.reloadTree(options);
					return false;
				},
				success: function(layero, index, that) {
					const tabs = layui.tabs;
					tabs.render({
						elem: "#downloadWindowDivId",
						id: "downloadWindowDivTabsId",
						header: [{ title: "说明信息" }],
						body: [{ content: `<div></div>` }]
					});
					tabs.add("downloadWindowDivTabsId", {
						title: "下载详情",
						content: `<div id="${self.downloadWindowDivIntroId}" style="width: 100%;height: 100%;"></div>`,
						mode: "prepend",
						done: () => {
							const tabs = document.getElementsByClassName("layui-tabs-item");
							for (let i = 0; i < tabs.length; i++) tabs[i].style.height = window.innerHeight * .649 + "px";
						}
					});
					tabs.add("downloadWindowDivTabsId", {
						title: "下载进度",
						content: "<div id=\"downloadWindowDivInfoId\"><fieldset class=\"layui-elem-field\">\n  <legend>当前下载</legend>\n  <div class=\"layui-field-box\">\n      <a id=\"downloadInfoContentId\" href=\"\">暂无下载</a>\n  </div>\n</fieldset><fieldset class=\"layui-elem-field\">\n  <legend>进度条</legend>\n  <div class=\"layui-field-box\">\n<div class=\"layui-progress layui-progress-big\" lay-showPercent=\"true\" lay-filter=\"demo-filter-progress\"> <div class=\"layui-progress-bar layui-bg-orange\" lay-percent=\"0%\"></div></div>  </div></fieldset></div>",
						mode: "prepend",
						done: () => {
							layui.element.render("progress", "demo-filter-progress");
							layui.element.progress("demo-filter-progress", "0%");
						}
					});
					tabs.add("downloadWindowDivTabsId", {
						title: "番号列表",
						content: "<div id=\"downloadWindowDivListTreeId\"></div>",
						mode: "prepend",
						done: () => {
							layui.util;
							layui.tree.render({
								elem: "#downloadWindowDivListTreeId",
								data: options.data,
								showCheckbox: true,
								onlyIconControl: true,
								id: "titleList",
								isJump: false,
								click: function(obj) {
									const data = obj.data;
									options.downloadChecked([data]);
								}
							});
						}
					});
				}
			});
			return this.openBookListWindowIndex;
		}
		treeCheckedDownload(options) {
			let checkedData = layui.tree.getChecked("titleList");
			console.log(checkedData[0]);
			if (checkedData.length === 0) return;
			options.downloadChecked(checkedData);
		}
		reloadTree(options) {
			layui.tree.reload("titleList", { data: options.data });
			options.clearNotDownload();
		}
	};
	var ListController = class {
		constructor({ model = new ListPageModel(document), fixBarView = new ListFixBarView() } = {}) {
			this.doc = document;
			this.model = model;
			this.fixBarView = fixBarView;
			this.listInfoWinView = new ListInfoWinView();
			this.downloadScheduler = new Downloader();
			this.configureDownloadScheduler();
		}
		init() {
			this.fixBarView.renderFixbar({ onAction: (type) => this.handleAction(type) });
		}
		async handleAction(type) {
			switch (type) {
				case "打开菜单面板": this.openInfoWindow();
			}
		}
		openInfoWindow() {
			this.listInfoWinView.openInfoWin({
				data: this.model.getTree(),
				downloadAll: () => this.downloadAll(),
				downloadChecked: (data) => this.downloadChecked(data),
				clearNotDownload: () => this.clearNotDownload(),
				downloadScheduler: this.downloadScheduler
			});
		}
		configureDownloadScheduler() {
			this.downloadScheduler.setConfig({
				interval: 500,
				onTaskBefore: (task) => {
					layui.layer.title(task.title, this.listInfoWinView.openBookListWindowIndex);
					this.doc.getElementById(this.listInfoWinView.downloadInfoContentId).href = task.href;
					this.doc.getElementById(this.listInfoWinView.downloadInfoContentId).innerText = task.title;
				},
				downloadHandler: async (task) => {
					const oldIframes = this.doc.getElementById(this.listInfoWinView.downloadWindowDivIntroId).getElementsByTagName("iframe");
					for (let i = 0; i < oldIframes.length; i++) await destroyIframeElementAsync(oldIframes[i]);
					await sleep(500);
					const iframe = document.createElement("iframe");
					iframe.id = "_iframe_" + crypto.randomUUID();
					iframe.src = task.href;
					iframe.style.display = "block";
					iframe.style.border = "none";
					iframe.style.width = "100%";
					iframe.style.height = "100%";
					this.doc.getElementById(this.listInfoWinView.downloadWindowDivIntroId).appendChild(iframe);
					await new Promise((resolve, reject) => {
						const timeout = setTimeout(() => reject(new Error("页面加载超时")), 18e5);
						iframe.onload = async () => {
							try {
								await waitForElement(iframe.contentDocument, ".plhin", 15e5);
								clearTimeout(timeout);
								resolve();
							} catch (err) {
								clearTimeout(timeout);
								reject(new Error("正文元素未找到"));
							}
						};
					});
					await new DetailPageModel(iframe.contentDocument).getInfo();
					await destroyIframeElementAsync(iframe);
					return true;
				},
				onTaskComplete: (task, success) => {
					let percent = ((this.downloadScheduler.doneSet.size + this.downloadScheduler.failedSet.size) / (this.downloadScheduler.doneSet.size + this.downloadScheduler.failedSet.size + this.downloadScheduler.pendingSet.size) * 100).toFixed(2) + "%";
					layui.element.progress(this.listInfoWinView.progressId, percent);
					console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
				},
				onFinish: (downloaded, failed) => {
					console.log("下载结束 ✅");
					console.log("已下载:", downloaded.map((t) => t));
					console.log("未下载:", failed.map((t) => t));
					layui.layer.alert("下载完毕", {
						icon: 1,
						shadeClose: true
					});
				},
				onCatch: (err) => {
					layui.layer.alert("出现错误：" + err.message, {
						icon: 5,
						shadeClose: true
					});
				}
			});
		}
		async downloadAll() {
			this.model.getMenuArray(this.model.getTree()).forEach((d) => this.downloadScheduler.add(d));
			await this.downloadScheduler.start();
		}
		async downloadChecked(data) {
			this.model.getMenuArray(data).forEach((d) => this.downloadScheduler.add(d));
			await this.downloadScheduler.start();
		}
		clearNotDownload() {
			this.downloadScheduler.clear();
		}
	};
	async function router() {
		if (document.getElementsByTagName("head")[0].getElementsByTagName("title")[0].innerText.trim().indexOf("SEHUATANG.ORG") > -1) {
			const enterBts = document.getElementsByClassName("enter-btn");
			for (let index = 0; index < enterBts.length; index++) if (enterBts[index].innerText.trim().indexOf("满18岁，请点此进入") > -1) {
				enterBts[index].click();
				break;
			}
			return;
		}
		const url = document.URL;
		if (/forum-(\d+)-(\d+)\.html/.test(url)) {
			await init();
			new ListController().init();
			return;
		}
		if ([/thread-(\d+)-1-(\d+)\.html/, /forum\.php\?mod=viewthread&tid=(\d+)/].some((regex) => regex.test(url))) {
			await init();
			new DetailPageController().init();
		}
	}
	await(router());
})(saveAs);
