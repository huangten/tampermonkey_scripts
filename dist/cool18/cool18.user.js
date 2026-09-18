// ==UserScript==
// @name       cool18 增强
// @namespace  https://tampermonkey.net/
// @version    2026-09-18.15:51:58
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

(function(file_saver) {
	"use strict";
	var _unsafeWindow = (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
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
		return Promise.all([addCss("layui_css", "https://cdn.jsdelivr.net/npm/layui@2.13.9/dist/css/layui.min.css"), addScript("layui_id", "https://cdn.jsdelivr.net/npm/layui@2.13.9/dist/layui.min.js")]);
	}
	function initMonaca() {
		return Promise.all([addCss("Monaca_css", "https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/dev/vs/editor/editor.main.min.css"), loadMonaco()]);
	}
	function loadMonaco() {
		const MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs";
		return new Promise((resolve, reject) => {
			const script = document.createElement("script");
			script.src = `${MONACO_BASE}/loader.js`;
			script.onload = () => {
				let req = _unsafeWindow?.require;
				if (!req) req = window?.require;
				if (!req) {
					reject(new Error("Monaco AMD loader 未创建 require"));
					return;
				}
				req.config({ paths: { vs: MONACO_BASE } });
				req(["vs/editor/editor.main"], (monaco) => {
					resolve(monaco);
				}, reject);
			};
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}
	var ChapterView = class {
		renderFixbar({ onAction }) {
			layui.use(() => {
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
						},
						{
							type: "编辑文本",
							icon: "layui-icon-list"
						}
					],
					default: false,
					css: {
						bottom: "20%",
						right: 5
					},
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
					click: async function(type) {
						await onAction(type);
					}
				});
			});
		}
	};
	var ChapterEditorPageView = class {
		constructor(doc = document) {
			this.doc = doc;
			this.index = 0;
			this.containerId = "editorContainer";
			this.editor = null;
		}
		async ensure() {
			return new Promise((resolve, reject) => {
				if (this.index !== 0) return resolve();
				const self = this;
				this.index = layui.layer.open({
					type: 1,
					title: "编辑面板",
					shadeClose: false,
					closeBtn: 0,
					shade: 0,
					moveOut: true,
					maxmin: true,
					skin: "layui-layer-win10",
					area: ["90%", "95%"],
					content: `<div id="${this.containerId}" style="width: 100%;height: 100%;"></div>`,
					success: function(layero, index) {
						layui.layer.setTop(layero);
						self.createEditor(self.containerId);
						resolve();
					}
				});
			});
		}
		async createEditor(containerId) {
			const container = this.doc.getElementById(containerId);
			this.editor = monaco.editor.create(container, {
				model: null,
				automaticLayout: true,
				minimap: {
					enabled: true,
					side: "right",
					showSlider: "mouseover",
					renderCharacters: true,
					size: "fill",
					maxColumn: 120
				},
				unicodeHighlight: {
					ambiguousCharacters: false,
					invisibleCharacters: false,
					nonBasicASCII: false
				},
				wordWrap: "off",
				fontSize: 16,
				lineNumbers: "on",
				scrollBeyondLastLine: false,
				renderWhitespace: "all",
				theme: "vs"
			});
		}
		setEditorValue(value) {
			this.editor.setValue(value);
		}
		getEditorValue() {
			return this.editor.getValue();
		}
		getEditorModel() {
			return this.editor.getModel();
		}
		setEditorModel(text, language = "plaintext") {
			const model = monaco.editor.createModel(text, language);
			this.editor.setModel(model);
		}
		addRightClickMenu(id, label, contextMenuOrder, callback, contextMenuGroupId = "navigation") {
			this.editor.addAction({
				id,
				label,
				contextMenuGroupId,
				contextMenuOrder,
				run(editor) {
					callback?.(editor);
				}
			});
		}
	};
	var EditorModel = class {
		constructor(content) {
			this.lines = content.split("\n").filter(Boolean);
		}
		handleLine() {
			if (this.lines.length < 2) return "";
			const result = [];
			for (let index = 0; index < this.lines.length; index++) {
				let line = this.lines[index];
				let l = {
					isSpecialLine: false,
					showText: ""
				};
				if (index === 0) {
					l.isSpecialLine = true;
					l.showText = line.trim() + "\n";
					result.push(l);
					continue;
				}
				if (index === 1) {
					l.isSpecialLine = true;
					l.showText = line.trim() + "\n\n\n\n";
					result.push(l);
					continue;
				}
				if (/^\s*第[\d一二三四五六七八九十]+卷(.*?)$/.test(line)) {
					l.isSpecialLine = true;
					l.showText = `\n${line.trim()}\n`;
					result.push(l);
					continue;
				}
				if (/^\s*[（第][\d一二三四五六七八九十零百千万 　]+[章）话回集](.*?)$/.test(line)) {
					l.isSpecialLine = true;
					l.showText = `\n${line.trim()}\n`;
					result.push(l);
					continue;
				}
				if (/^[ 　]{2,}/.test(line)) {
					const lls = line.replaceAll("    ", "　　").split("　　").join(`\n　　`).trimStart();
					result.push({
						isSpecialLine: false,
						showText: `\n　　${lls}`
					});
				} else {
					const lls = line.replaceAll("    ", "　　").split("　　").join(`\n　　`).trimStart();
					result.push({
						isSpecialLine: false,
						showText: lls
					});
				}
			}
			const contents = [];
			for (let i = 0; i < result.length; i++) contents.push(result[i].showText);
			return contents.join("");
		}
		toString() {
			return this.lines.join("\n");
		}
	};
	var ChapterModel = class {
		constructor(doc = document) {
			this.doc = doc;
		}
		dispose() {
			this.doc = null;
		}
		getPreElement() {
			return this.doc.getElementsByTagName("pre")[0];
		}
		getPreTagContent() {
			copyContext(this.getPreElement().innerText.split("\n").filter(Boolean).join("\n")).then();
		}
		getBookname() {
			const titleContent = this.doc.getElementsByClassName("main-title")[0].innerText.trim();
			let bookName = titleContent.match(/^【(.*?)】/);
			if (!bookName) bookName = titleContent;
			else bookName = bookName[1];
			copyContext(bookName).then();
			return bookName;
		}
		getDownloadContent(tag) {
			let title = this.getDownloadFilename();
			const prentTitleElements = this.doc.getElementsByClassName("reply-info");
			if (prentTitleElements.length > 0) try {
				const pTitle = prentTitleElements[0].getElementsByTagName("a")[0].innerText.trim().replace(/^【(.*?)】/, "$1");
				title = title + `

回复于：${pTitle}`;
			} catch (e) {
				console.log(e);
			}
			return title + "\n\n\n\n" + this.getChapterContent(tag) + "\n\n\n\n\n\n\n\n\n";
		}
		getDownloadFilename() {
			return this.doc.getElementsByClassName("main-title")[0].innerText.trim().replace(/^【(.*?)】/, "$1");
		}
		downloadChapterContent(tag) {
			this.saveContentToLocationTxtFile(this.getDownloadFilename(), this.getDownloadContent(tag));
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
				(0, file_saver.saveAs)(blob, filename + ".txt");
			} catch (e) {
				console.log(e);
				return false;
			}
			return true;
		}
	};
	var ChapterController = class {
		constructor(doc = document) {
			this.doc = doc;
			this.chapterModel = new ChapterModel(this.doc);
			this.chapterView = new ChapterView();
			this.editorPageView = null;
			this.create();
		}
		create() {
			this.chapterView.renderFixbar({ onAction: (type) => this.handleAction(type) });
		}
		async handleAction(type) {
			switch (type) {
				case "复制书名":
					this.chapterModel.getBookname();
					break;
				case "复制内容":
					this.chapterModel.getPreTagContent();
					break;
				case "原样下载":
					this.chapterModel.downloadChapterContent();
					break;
				case "添加空白符下载":
					this.chapterModel.downloadChapterContent("blank");
					break;
				case "复制内容HTML":
					this.chapterModel.getPreTagContentHtml();
					break;
				case "调整排版并复制":
					this.chapterModel.copyChapterContent();
					break;
				case "编辑文本":
					await this.openEditorTextView();
					break;
				default: console.log(type);
			}
		}
		async openEditorTextView() {
			if (!this.editorPageView) {
				this.editorPageView = new ChapterEditorPageView(this.doc);
				await this.editorPageView.ensure();
				this.editorPageView.setEditorModel(this.chapterModel.getDownloadContent());
				this.handleEditorRightClickMenus();
			}
		}
		handleEditorRightClickMenus() {
			this.editorPageView.addRightClickMenu("去除每行开头空白符", "去除每行开头空白符", 1, () => {
				const newText = this.editorPageView.getEditorValue().split("\n").map((line) => line.replace(/^\s+/g, "")).join("\n");
				this.editorPageView.setEditorValue(newText);
			});
			this.editorPageView.addRightClickMenu("每行开头添加中文空白符", "每行开头添加中文空白符", 2, () => {
				const newText = this.editorPageView.getEditorValue().split("\n").map((line) => {
					if (line.length > 0) return `　　${line}`;
				}).join("\n");
				this.editorPageView.setEditorValue(newText);
			});
			this.editorPageView.addRightClickMenu("按照两个中文空格拆分段落", "按照两个中文空格拆分段落", 3, () => {
				const text = new EditorModel(this.editorPageView.getEditorValue());
				this.editorPageView.setEditorValue(text.handleLine());
			});
			this.editorPageView.addRightClickMenu("清洗英文单双引号", "清洗英文单双引号", 4, () => {
				const newText = this.editorPageView.getEditorValue().split("\n").map((line) => {
					return line.replaceAll(/"([^"]+)"/g, "“$1”").replaceAll(/'([^']+)'/g, "‘$1’");
				}).join("\n");
				this.editorPageView.setEditorValue(newText);
			});
			this.editorPageView.addRightClickMenu("重置文本", "重置文本", 4, () => {
				this.editorPageView.setEditorValue(this.chapterModel.getDownloadContent());
			});
			this.editorPageView.addRightClickMenu("下载文件", "下载文件", 4, () => {
				const texts = this.editorPageView.getEditorValue().split("\n");
				if (texts.length < 2) return;
				let filename = texts[0].trim();
				if (!filename.includes("作者")) filename += texts[1].trim();
				this.chapterModel.saveContentToLocationTxtFile(filename, texts.join("\n"));
			});
		}
	};
	(async function main() {
		const url = new URL(document.URL);
		if (url.searchParams.get("act") && url.pathname === "/bbs4/index.php" && url.searchParams.get("act") === "threadview") {
			await Promise.all([init(), initMonaca()]);
			new ChapterController(document);
		}
	})();
})(saveAs);
