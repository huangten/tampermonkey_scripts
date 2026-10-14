// ==UserScript==
// @name       色花堂 增强
// @namespace  https://tampermonkey.net/
// @version    2026-10-14.09:54:49
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
	var decoder = new TextDecoder();
	var arr2text = (data, enc) => {
		if (!enc) return decoder.decode(data);
		return new TextDecoder(enc).decode(data);
	};
	function concat(chunks, size = 0) {
		const length = chunks.length;
		if (!size) for (let i = 0; i < length; i++) size += chunks[i].length;
		const b = new Uint8Array(size);
		let offset = 0;
		for (let i = 0; i < length; i++) {
			b.set(chunks[i], offset);
			offset += chunks[i].length;
		}
		return b;
	}
	var alphabet = "0123456789abcdef";
	var encodeLookup = [];
	var decodeLookup = new Uint8Array(128);
	for (let i = 0; i < 16; ++i) {
		const i16 = i * 16;
		for (let j = 0; j < 16; ++j) encodeLookup[i16 + j] = alphabet[i] + alphabet[j];
		if (i < 10) decodeLookup[48 + i] = i;
		else {
			decodeLookup[87 + i] = i;
			decodeLookup[55 + i] = i;
		}
	}
	var arr2hex = (data) => data.toHex();
	var encoder = new TextEncoder();
	var text2arr = (str) => encoder.encode(str);
	function digitCount(value) {
		const sign = value < 0 ? 1 : 0;
		value = Math.abs(Number(value || 1));
		return Math.floor(Math.log10(value)) + 1 + sign;
	}
	function getType(value) {
		if (ArrayBuffer.isView(value)) return "arraybufferview";
		if (Array.isArray(value)) return "array";
		if (value instanceof Number) return "number";
		if (value instanceof Boolean) return "boolean";
		if (value instanceof Set) return "set";
		if (value instanceof Map) return "map";
		if (value instanceof String) return "string";
		if (value instanceof ArrayBuffer) return "arraybuffer";
		return typeof value;
	}
	function encode(data, buffer, offset) {
		const buffers = [];
		let result = null;
		encode._encode(buffers, data);
		result = concat(buffers);
		encode.bytes = result.length;
		if (ArrayBuffer.isView(buffer)) {
			buffer.set(result, offset);
			return buffer;
		}
		return result;
	}
	encode.bytes = -1;
	encode._floatConversionDetected = false;
	encode._encode = function(buffers, data) {
		if (data == null) return;
		switch (getType(data)) {
			case "object":
				encode.dict(buffers, data);
				break;
			case "map":
				encode.dictMap(buffers, data);
				break;
			case "array":
				encode.list(buffers, data);
				break;
			case "set":
				encode.listSet(buffers, data);
				break;
			case "string":
				encode.string(buffers, data);
				break;
			case "number":
				encode.number(buffers, data);
				break;
			case "boolean":
				encode.number(buffers, data);
				break;
			case "arraybufferview":
				encode.buffer(buffers, new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
				break;
			case "arraybuffer": encode.buffer(buffers, new Uint8Array(data));
		}
	};
	var buffE = new Uint8Array([101]);
	var buffD = new Uint8Array([100]);
	var buffL = new Uint8Array([108]);
	encode.buffer = function(buffers, data) {
		buffers.push(text2arr(data.length + ":"), data);
	};
	encode.string = function(buffers, data) {
		buffers.push(text2arr(text2arr(data).byteLength + ":" + data));
	};
	encode.number = function(buffers, data) {
		if (Number.isInteger(data)) return buffers.push(text2arr("i" + BigInt(data) + "e"));
		const maxLo = 2147483648;
		const hi = data / maxLo << 0;
		const lo = data % maxLo << 0;
		const val = hi * maxLo + lo;
		buffers.push(text2arr("i" + val + "e"));
		if (val !== data && !encode._floatConversionDetected) {
			encode._floatConversionDetected = true;
			console.warn("WARNING: Possible data corruption detected with value \"" + data + "\":", "Bencoding only defines support for integers, value was converted to \"" + val + "\"");
			console.trace();
		}
	};
	encode.dict = function(buffers, data) {
		buffers.push(buffD);
		let j = 0;
		let k;
		const keys = Object.keys(data).sort();
		const kl = keys.length;
		for (; j < kl; j++) {
			k = keys[j];
			if (data[k] == null) continue;
			encode.string(buffers, k);
			encode._encode(buffers, data[k]);
		}
		buffers.push(buffE);
	};
	encode.dictMap = function(buffers, data) {
		buffers.push(buffD);
		const keys = Array.from(data.keys()).sort();
		for (const key of keys) {
			if (data.get(key) == null) continue;
			ArrayBuffer.isView(key) ? encode._encode(buffers, key) : encode.string(buffers, String(key));
			encode._encode(buffers, data.get(key));
		}
		buffers.push(buffE);
	};
	encode.list = function(buffers, data) {
		let i = 0;
		const c = data.length;
		buffers.push(buffL);
		for (; i < c; i++) {
			if (data[i] == null) continue;
			encode._encode(buffers, data[i]);
		}
		buffers.push(buffE);
	};
	encode.listSet = function(buffers, data) {
		buffers.push(buffL);
		for (const item of data) {
			if (item == null) continue;
			encode._encode(buffers, item);
		}
		buffers.push(buffE);
	};
	var INTEGER_START = 105;
	var STRING_DELIM = 58;
	var DICTIONARY_START = 100;
	var LIST_START = 108;
	var END_OF_TYPE = 101;
	function getIntFromBuffer(buffer, start, end) {
		let sum = 0;
		let sign = 1;
		for (let i = start; i < end; i++) {
			const num = buffer[i];
			if (num < 58 && num >= 48) {
				sum = sum * 10 + (num - 48);
				continue;
			}
			if (i === start && num === 43) continue;
			if (i === start && num === 45) {
				sign = -1;
				continue;
			}
			if (num === 46) break;
			throw new Error("not a number: buffer[" + i + "] = " + num);
		}
		return sum * sign;
	}
	function decode(data, start, end, encoding) {
		if (data == null || data.length === 0) return null;
		if (typeof start !== "number" && encoding == null) {
			encoding = start;
			start = void 0;
		}
		if (typeof end !== "number" && encoding == null) {
			encoding = end;
			end = void 0;
		}
		decode.position = 0;
		decode.encoding = encoding || null;
		decode.data = !ArrayBuffer.isView(data) ? text2arr(data) : new Uint8Array(data.slice(start, end));
		decode.bytes = decode.data.length;
		return decode.next();
	}
	decode.bytes = 0;
	decode.position = 0;
	decode.data = null;
	decode.encoding = null;
	decode.next = function() {
		switch (decode.data[decode.position]) {
			case DICTIONARY_START: return decode.dictionary();
			case LIST_START: return decode.list();
			case INTEGER_START: return decode.integer();
			default: return decode.buffer();
		}
	};
	decode.find = function(chr) {
		let i = decode.position;
		const c = decode.data.length;
		const d = decode.data;
		while (i < c) {
			if (d[i] === chr) return i;
			i++;
		}
		throw new Error("Invalid data: Missing delimiter \"" + String.fromCharCode(chr) + "\" [0x" + chr.toString(16) + "]");
	};
	decode.dictionary = function() {
		decode.position++;
		const dict = {};
		while (decode.data[decode.position] !== END_OF_TYPE) {
			const buffer = decode.buffer();
			let key = arr2text(buffer);
			if (key.includes("�")) key = arr2hex(buffer);
			dict[key] = decode.next();
		}
		decode.position++;
		return dict;
	};
	decode.list = function() {
		decode.position++;
		const lst = [];
		while (decode.data[decode.position] !== END_OF_TYPE) lst.push(decode.next());
		decode.position++;
		return lst;
	};
	decode.integer = function() {
		const end = decode.find(END_OF_TYPE);
		const number = getIntFromBuffer(decode.data, decode.position + 1, end);
		decode.position += end + 1 - decode.position;
		return number;
	};
	decode.buffer = function() {
		let sep = decode.find(STRING_DELIM);
		const length = getIntFromBuffer(decode.data, decode.position, sep);
		const end = ++sep + length;
		decode.position = end;
		return decode.encoding ? arr2text(decode.data.slice(sep, end)) : decode.data.slice(sep, end);
	};
	function listLength(list) {
		let length = 2;
		for (const value of list) length += encodingLength$1(value);
		return length;
	}
	function mapLength(map) {
		let length = 2;
		for (const [key, value] of map) {
			const keyLength = text2arr(key).byteLength;
			length += digitCount(keyLength) + 1 + keyLength;
			length += encodingLength$1(value);
		}
		return length;
	}
	function objectLength(value) {
		let length = 2;
		const keys = Object.keys(value);
		for (let i = 0; i < keys.length; i++) {
			const keyLength = text2arr(keys[i]).byteLength;
			length += digitCount(keyLength) + 1 + keyLength;
			length += encodingLength$1(value[keys[i]]);
		}
		return length;
	}
	function stringLength(value) {
		const length = text2arr(value).byteLength;
		return digitCount(length) + 1 + length;
	}
	function arrayBufferLength(value) {
		const length = value.byteLength - value.byteOffset;
		return digitCount(length) + 1 + length;
	}
	function encodingLength$1(value) {
		const length = 0;
		if (value == null) return length;
		const type = getType(value);
		switch (type) {
			case "arraybufferview": return arrayBufferLength(value);
			case "string": return stringLength(value);
			case "array":
			case "set": return listLength(value);
			case "number": return 1 + digitCount(Math.floor(value)) + 1;
			case "bigint": return 1 + value.toString().length + 1;
			case "object": return objectLength(value);
			case "map": return mapLength(value);
			default: throw new TypeError(`Unsupported value of type "${type}"`);
		}
	}
	var bencode_default = {
		encode,
		decode,
		byteLength: encodingLength$1,
		encodingLength: encodingLength$1
	};
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
			if (blob) try {
				const list = await this.parseTorrentFilesFromBlob(blob);
				console.log(list);
				(0, file_saver.saveAs)(blob, filename);
			} catch (e) {
				console.error(`解析错误信息：${e} `);
				console.error(`${filename} 下载失败，请手动处理。`);
			}
		}
		async parseTorrentFilesFromBlob(blob) {
			const arrayBuffer = await blob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const torrentData = bencode_default.decode(uint8Array);
			if (!torrentData || !torrentData.info) throw new Error("无效的 BT 种子文件");
			const info = torrentData.info;
			const filesList = [];
			const bufferToString = (buf) => {
				if (!buf) return "";
				return new TextDecoder("utf-8").decode(buf);
			};
			if (info.files && Array.isArray(info.files)) info.files.forEach((file) => {
				const fullPath = file.path.map((seg) => bufferToString(seg)).join("/");
				filesList.push({
					path: fullPath,
					length: file.length
				});
			});
			else if (info.length) filesList.push({
				path: bufferToString(info.name),
				length: info.length
			});
			return filesList;
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
		openInfoWin(options = {
			data: [],
			downloadAll: () => {},
			downloadChecked: () => {},
			clearNotDownload: () => {},
			downloadScheduler: null
		}) {
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
			await Promise.all([init()]);
			new DetailPageController().init();
		}
	}
	await(router());
})(saveAs);
