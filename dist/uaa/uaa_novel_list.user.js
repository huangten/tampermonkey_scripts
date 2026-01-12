// ==UserScript==
// @name       UAA 书籍列表页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-01-12.20:00:03
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @match      https://*.uaa.com/novel/list*
// @require    https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant      GM_addStyle
// @grant      GM_download
// @grant      GM_getResourceText
// @grant      GM_notification
// @grant      GM_xmlhttpRequest
// @grant      unsafeWindow
// @noframes
// ==/UserScript==

(function (fileSaver, JSZip) {
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
  const INVISIBLE_RE = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF]/g;
  function cleanText(str) {
    return str.replace(/\u00A0/g, " ").replace(INVISIBLE_RE, "");
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  class CommonRes {
    constructor() {
      if (CommonRes.instance) {
        return CommonRes.instance;
      }
      CommonRes.instance = this;
      this.logoImg = null;
      this.girlImg = null;
      this.line1Img = null;
      this.mainCss = null;
      this.fontsCss = null;
    }
    static getInstance() {
      if (!CommonRes.instance) {
        CommonRes.instance = new CommonRes();
      }
      return CommonRes.instance;
    }
    async gmFetchCoverImageBlob(url) {
      return new Promise((resolve, reject) => {
        _GM_xmlhttpRequest({
          method: "GET",
          url,
          responseType: "blob",
          headers: {
            Referer: "https://www.uaa.com/"
          },
          onload: (res) => {
            if (res.status === 200) {
              resolve(res.response);
            } else {
              reject(new Error("HTTP CODE " + res.status));
            }
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
            if (res.status === 200) {
              resolve(res.response);
            } else {
              reject(new Error("HTTP CODE " + res.status));
            }
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
            if (res.status !== 200) {
              reject(new Error(`HTTP CODE ${res.status}`));
            } else {
              resolve(res.response);
            }
          },
          onerror: (err) => reject(err)
        });
      });
    }
    async getLogoImg() {
      if (this.logoImg === null) {
        this.logoImg = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp");
      }
      return this.logoImg;
    }
    async getGirlImg() {
      if (this.girlImg === null) {
        this.girlImg = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg");
      }
      return this.girlImg;
    }
    async getLine1Img() {
      if (this.line1Img === null) {
        this.line1Img = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/line1.webp");
      }
      return this.line1Img;
    }
    async getMainCss() {
      if (this.mainCss === null) {
        this.mainCss = await this.gmFetchText("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/main.css");
      }
      return this.mainCss;
    }
    async getFontsCss() {
      if (this.fontsCss === null) {
        this.fontsCss = await this.gmFetchText("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/fonts.css");
      }
      return this.fontsCss;
    }
  }
  function fetchBookIntro(url) {
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    }).then((htmlString) => {
      const parser = new DOMParser();
      return parser.parseFromString(htmlString, "text/html");
    });
  }
  async function buildEpub(url) {
    const zip = new JSZip();
    let doc = await fetchBookIntro(url).catch((e) => {
      throw new Error(e);
    });
    let bookName = escapeHtml(cleanText(doc.getElementsByClassName("info_box")[0].getElementsByTagName("h1")[0].innerText.trim()));
    let author = "";
    let type = "";
    let tags = doc.getElementsByClassName("tag_box")[0].innerText.replaceAll("\n", "").replaceAll("标签：", "").replaceAll(" ", "").replaceAll("#", " #").trim();
    let rou = doc.getElementsByClassName("props_box")[0].getElementsByTagName("li")[0].innerText.trim();
    let score = "";
    let lastUpdateTime = "";
    let intro = doc.getElementsByClassName("brief_box")[0].innerText.replaceAll("小说简介：", "").replaceAll("\n", "").trim();
    let infoBox = doc.getElementsByClassName("info_box")[0].getElementsByTagName("div");
    for (let i = 0; i < infoBox.length; i++) {
      if (infoBox[i].innerText.trim().includes("最新：")) {
        lastUpdateTime = infoBox[i].innerText.replace("最新：", "").trim();
      }
      if (infoBox[i].innerText.trim().includes("作者：")) {
        author = escapeHtml(cleanText(infoBox[i].innerText.replace("作者：", "").trim()));
      }
      if (infoBox[i].innerText.trim().includes("题材：")) {
        type = infoBox[i].innerText.replace("题材：", "").split(" ").map((str) => str.trim()).filter((str) => str.length > 0);
      }
      if (infoBox[i].innerText.trim().includes("评分：")) {
        score = infoBox[i].innerText.replace("评分：", "").trim();
      }
    }
    let chapters = getChapterMenu(doc);
    zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
    zip.folder("META-INF").file("container.xml", createContainer());
    const o = zip.folder("OEBPS");
    const cssFolder = o.folder("Styles");
    cssFolder.file("main.css", await CommonRes.getInstance().getMainCss());
    cssFolder.file("fonts.css", await CommonRes.getInstance().getFontsCss());
    const imgFolder = o.folder("Images");
    let coverUrl = doc.getElementsByClassName("cover")[0].src;
    imgFolder.file("cover.jpg", await CommonRes.getInstance().gmFetchCoverImageBlob(coverUrl));
    imgFolder.file("logo.webp", await CommonRes.getInstance().getLogoImg());
    imgFolder.file("girl.jpg", await CommonRes.getInstance().getGirlImg());
    const manifest = [], spine = [], ncxNav = [];
    const textFolder = o.folder("Text");
    textFolder.file(`cover.xhtml`, genCoverHtmlPage());
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
    <navLabel><text>${c.title}</text></navLabel>
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
          let ncxNav2 = `
 <navPoint id="${did}" playOrder="${i + 1}">
    <navLabel><text>${d.title}</text></navLabel>
    <content src="Text/${did}.xhtml"/>
</navPoint>
                        `;
          volumeNcxNav += `
${ncxNav2}`;
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
      <dc:date opf:event="creation" xmlns:opf="http://www.idpf.org/2007/opf">${ new Date()}</dc:date>
      <meta name="cover" content="cover" />
  </metadata>
  <manifest>
        ${manifest.join("\n        ")}
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="main.css" href="Styles/main.css" media-type="text/css"/>
        <item id="fonts.css" href="Styles/fonts.css" media-type="text/css"/>
        <item id="cover" href="Images/cover.jpg" media-type="image/jpeg"/>
        <item id="logo.webp" href="Images/logo.webp" media-type="image/webp"/>
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
    const blob = await zip.generateAsync({
      type: "blob"



});
    fileSaver.saveAs(blob, `${bookName} 作者：${author}.epub`);
    console.log(bookName + " 下载完毕！");
  }
  function getChapterMenu(doc) {
    let menus = [];
    let lis = doc.querySelectorAll(".catalog_ul > li");
    for (let index = 0; index < lis.length; index++) {
      let preName = "";
      if (lis[index].className.indexOf("menu") > -1) {
        let alist = lis[index].getElementsByTagName("a");
        for (let j = 0; j < alist.length; j++) {
          let aspan = alist[j].querySelector("span");
          if (aspan) {
            aspan.remove();
          }
          menus.push({
            "id": (index + 1) * 1e8 + j,
            "title": escapeHtml((preName + alist[j].innerText.trim()).split(" ").map((str) => str.trim()).filter((str) => str.length > 0).join(" ")),
            "href": alist[j].href,
            "children": []
          });
        }
      }
      if (lis[index].className.indexOf("volume") > -1) {
        preName = escapeHtml(cleanText(lis[index].querySelector("span").innerText.trim().split(" ").map((str) => str.trim()).filter((str) => str.length > 0).join(" ")));
        let children = [];
        let alist = lis[index].getElementsByTagName("a");
        for (let j = 0; j < alist.length; j++) {
          let aspan = alist[j].querySelector("span");
          if (aspan) {
            aspan.remove();
          }
          children.push({
            "id": (index + 1) * 1e8 + j + 1,
            "title": escapeHtml(cleanText(alist[j].innerText.trim().split(" ").map((str) => str.trim()).filter((str) => str.length > 0).join(" "))),
            "href": alist[j].href,
            "children": []
          });
        }
        menus.push({
          "id": (index + 1) * 1e8,
          "title": preName,
          "href": "",
          "children": children
        });
      }
    }
    return menus;
  }
  function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function formatXML(xmlStr) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, "application/xml");
    const xslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="xhtml">

  <!-- 输出为 XML，带缩进 -->
  <xsl:output
    method="xml"
    indent="yes"
    encoding="UTF-8"/>

  <!-- 去除无意义空白 -->
  <xsl:strip-space elements="*"/>

  <!-- 核心：恒等拷贝（identity transform） -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
`;
    const xsltDoc = parser.parseFromString(xslt, "application/xml");
    const processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    const result = processor.transformToDocument(xml);
    return new XMLSerializer().serializeToString(result);
  }
  function formatXHTML(xmlStr) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, "application/xhtml+xml");
    const xslt = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="xhtml">

  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
  <xsl:strip-space elements="*"/>

  <!-- 默认拷贝 -->
  <xsl:template match="@*|node()">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
`;
    const xsltDoc = parser.parseFromString(xslt, "application/xml");
    const processor = new XSLTProcessor();
    processor.importStylesheet(xsltDoc);
    const result = processor.transformToDocument(xml);
    return new XMLSerializer().serializeToString(result);
  }
  function serializeXML(doc) {
    const xml = new XMLSerializer().serializeToString(doc);
    return '<?xml version="1.0" encoding="utf-8"?>\n' + formatXML(xml);
  }
  function serializeXHTML(doc) {
    const xml = new XMLSerializer().serializeToString(doc);
    return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n' + formatXHTML(xml);
  }
  function createContainer() {
    const doc = document.implementation.createDocument(
      null,
      "container",
      null
    );
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
  function genCoverHtmlPage() {
    const doc = document.implementation.createDocument(
      null,
      "html",
      null
    );
    const html = doc.documentElement;
    html.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    html.setAttribute("xmlns:epub", "http://www.idpf.org/2007/ops");
    const head = doc.createElement("head");
    const title = doc.createElement("title");
    title.textContent = "Cover";
    head.appendChild(title);
    const body = doc.createElement("body");
    const div = doc.createElement("div");
    div.setAttribute("style", "text-align: center;padding: 0pt;margin: 0pt;");
    const img = doc.createElement("img");
    img.setAttribute("width", "100%");
    img.setAttribute("src", "../Images/cover.jpg");
    div.appendChild(img);
    body.appendChild(div);
    html.appendChild(head);
    html.appendChild(body);
    return serializeXHTML(doc);
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
    if (titleArray.length > 1) {
      t2 = titleArray.slice(1).join(" ");
    }
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
  class Downloader {
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
onTaskBefore: () => {
        },
onTaskComplete: () => {
        },
onFinish: () => {
        },
onCatch: (err) => {
        },
        downloadHandler: null,

retryFailed: false,
uniqueKey: (task) => task?.href
};
    }




setConfig(options = {}) {
      this.config = { ...this.config, ...options };
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
      if (typeof this.config.downloadHandler !== "function") {
        throw new Error("请先通过 setConfig 设置 downloadHandler 回调");
      }
      this.running = true;
      while (this.failed.length > 0) {
        this.queue.unshift(this.failed.shift());
      }
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
  }
  let openBookListWindowIndex = 0;
  const openNewWindowScheduler = new Downloader();
  openNewWindowScheduler.setConfig({
    interval: 50,
    downloadHandler: function(task) {
      const a = document.createElement("a");
      a.href = task.href;
      a.target = "_blank";
      a.click();
      return true;
    },
    onTaskComplete: (task, success) => {
      console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
      console.log("打开结束 ✅");
    },
    onCatch: async (err) => {
      layui.layer.alert("出现错误：" + err.message, { icon: 5, shadeClose: true });
    }
  });
  const exportEpubScheduler = new Downloader();
  exportEpubScheduler.setConfig({
    interval: 50,
    onTaskBefore: (task) => {
    },
    downloadHandler: async function(task) {
      await buildEpub(task.href);
      return true;
    },
    onTaskComplete: (task, success) => {
      console.log(`${task.title} 下载 ${success ? "成功" : "失败"}, 结束时间: ${task.endTime}`);
    },
    onFinish: async (downloaded, failed) => {
      console.log("打开结束 ✅");
      layui.layer.min(openBookListWindow());
      layui.layer.msg("书籍导出完毕", { icon: 1, shadeClose: true });
    },
    onCatch: async (err) => {
      layui.layer.alert("导出失败：" + err.message, { icon: 5, shadeClose: true });
    }
  });
  init().then(() => {
    run();
  });
  function run() {
    layui.use(function() {
      layui.util.fixbar({
        bars: [{
          type: "本页书籍单",
          icon: "layui-icon-list"
        }],
        default: false,
        bgcolor: "#ff5722",
        css: { bottom: "15%", right: 0 },
        margin: 0,
click: function(type) {
          if (type === "本页书籍单") {
            openBookListWindow();
          }
        }
      });
    });
  }
  function openBookListWindow() {
    if (openBookListWindowIndex !== 0) {
      return openBookListWindowIndex;
    }
    openBookListWindowIndex = layui.layer.open({
      type: 1,
      title: "书籍列表",
      shadeClose: false,
      closeBtn: false,
      offset: "r",
      shade: 0,
      anim: "slideLeft",
area: ["60%", "80%"],
      skin: "layui-layer-win10",
moveOut: true,
      maxmin: true,
content: `<div id='openPage'></div>`,
      btn: ["全选", "1-12", "13-24", "25-36", "37-49", "打开选中书籍", "导出EPUB", "清除选中"],
      btn1: function(index, layero, that) {
        const type = "全选";
        layui.tree.reload("bookListTree", { data: setMenuTreeChecked(layui.tree, "bookListTree", type) });
        return false;
      },
      btn2: function(index, layero, that) {
        const type = "1-12";
        layui.tree.reload("bookListTree", { data: setMenuTreeChecked(layui.tree, "bookListTree", type) });
        return false;
      },
      btn3: function(index, layero, that) {
        const type = "13-24";
        layui.tree.reload("bookListTree", { data: setMenuTreeChecked(layui.tree, "bookListTree", type) });
        return false;
      },
      btn4: function(index, layero, that) {
        const type = "25-36";
        layui.tree.reload("bookListTree", { data: setMenuTreeChecked(layui.tree, "bookListTree", type) });
        return false;
      },
      btn5: function(index, layero, that) {
        const type = "37-49";
        layui.tree.reload("bookListTree", { data: setMenuTreeChecked(layui.tree, "bookListTree", type) });
        return false;
      },
      btn6: function(index, layero, that) {
        if (openNewWindowScheduler.running) {
          layui.layer.msg("正在打开中，请等待打开完后再继续");
          return;
        }
        openNewWindow().then();
        return false;
      },
      btn7: function(index, layero, that) {
        if (exportEpubScheduler.running) {
          layui.layer.msg("正在导出中，请等待导出完后再继续");
          return;
        }
        exportEpub().then();
        return false;
      },
      btn8: function(index, layero, that) {
        reloadTree();
        openNewWindowScheduler.clear();
        exportEpubScheduler.clear();
        return false;
      },
      success: function(layero, index, that) {
        layui.tree.render({
          elem: "#openPage",
          data: getMenuTree(),
          showCheckbox: true,
          onlyIconControl: true,
id: "bookListTree",
          isJump: false,
click: function(obj) {
            let data = obj.data;
            let all = getMenuTreeChecked(layui.tree, "bookListTree");
            for (let i = 0; i < all.length; i++) {
              if (data.id === all[i].id) {
                all[i].checked = !data.checked;
              }
            }
            layui.tree.reload("bookListTree", { data: all });
          }
        });
      }
    });
    return openBookListWindowIndex;
  }
  async function openNewWindow() {
    let checkedData = layui.tree.getChecked("bookListTree");
    checkedData.reverse();
    checkedData.forEach((data) => {
      openNewWindowScheduler.add(data);
    });
    await openNewWindowScheduler.start();
  }
  async function exportEpub() {
    let checkedData = layui.tree.getChecked("bookListTree");
    checkedData.reverse();
    checkedData.forEach((date) => {
      exportEpubScheduler.add(date);
    });
    await exportEpubScheduler.start();
  }
  function reloadTree() {
    layui.tree.reload("bookListTree", {
data: getMenuTree()
    });
  }
  function getMenuTree() {
    let menus = [];
    let lis = document.querySelectorAll(".cover_box > a");
    for (let index = 0; index < lis.length; index++) {
      let url = new URL(lis[index].href);
      let params = url.searchParams;
      menus.push({
        "id": params.get("id"),
        "title": lis[index].title,
        "href": lis[index].href,
        "spread": true,
        "field": "",
        "checked": false
      });
    }
    return menus;
  }
  function setMenuTreeChecked(t, treeId, type) {
    let all = getMenuTreeChecked(t, treeId);
    switch (type) {
      case "全选":
        {
          for (let i = 0; i < all.length; i++) {
            all[i].checked = true;
          }
        }
        break;
      case "1-12":
        {
          for (let i = 0; i < all.length; i++) {
            if (i >= 0 && i < 12) {
              all[i].checked = !all[i].checked;
            }
          }
        }
        break;
      case "13-24":
        {
          for (let i = 0; i < all.length; i++) {
            if (i >= 12 && i < 24) {
              all[i].checked = !all[i].checked;
            }
          }
        }
        break;
      case "25-36":
        {
          for (let i = 0; i < all.length; i++) {
            if (i >= 24 && i < 36) {
              all[i].checked = !all[i].checked;
            }
          }
        }
        break;
      case "37-49":
        {
          for (let i = 0; i < all.length; i++) {
            if (i >= 36 && i <= 48) {
              all[i].checked = !all[i].checked;
            }
          }
        }
        break;
    }
    return all;
  }
  function getMenuTreeChecked(t, treeId) {
    let checked = t.getChecked(treeId);
    let checkedIds = [];
    for (let i = 0; i < checked.length; i++) {
      checkedIds.push(checked[i].id);
    }
    let all = getMenuTree();
    for (let i = 0; i < all.length; i++) {
      if (checkedIds.includes(all[i].id)) {
        all[i].checked = true;
      }
    }
    return all;
  }

})(saveAs, JSZip);