// ==UserScript==
// @name       UAA 书籍列表页 增强
// @namespace  https://tampermonkey.net/
// @version    2026-1-8.17:24:22.01
// @author     YourName
// @icon       https://www.google.com/s2/favicons?sz=64&domain=uaa.com
// @match      https://*.uaa.com/novel/list*
// @require    https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require    https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant      GM_addStyle
// @grant      GM_download
// @grant      GM_getResourceText
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
  function init() {
    return Promise.all([
      addCss("layui_css", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/css/layui.min.css"),
      addScript("layui_id", "https://cdnjs.cloudflare.com/ajax/libs/layui/2.12.0/layui.min.js")
    ]);
  }
  var _GM_xmlhttpRequest = (() => typeof GM_xmlhttpRequest != "undefined" ? GM_xmlhttpRequest : void 0)();
  class CommonRes {
    static logoImg = null;
    static girlImg = null;
    static line1Img = null;
    static mainCss = null;
    static fontsCss = null;
    static async gmFetchCoverImageBlob(url) {
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
    static async gmFetchImageBlob(url) {
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
    static async gmFetchText(url) {
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
    static async getLogoImg() {
      if (this.logoImg === null) {
        this.logoImg = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp");
      }
      return this.logoImg;
    }
    static async getGirlImg() {
      if (this.girlImg === null) {
        this.girlImg = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg");
      }
      return this.girlImg;
    }
    static async getLine1Img() {
      if (this.line1Img === null) {
        this.line1Img = await this.gmFetchImageBlob("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/line1.webp");
      }
      return this.line1Img;
    }
    static async getMainCss() {
      if (this.mainCss === null) {
        this.mainCss = await this.gmFetchText("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/main.css");
      }
      return this.mainCss;
    }
    static async getFontsCss() {
      if (this.fontsCss === null) {
        this.fontsCss = await this.gmFetchText("https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/fonts.css");
      }
      return this.fontsCss;
    }
  }
  class BackgroundTabScheduler {
    constructor({
      interval = 1e3,
      jitter = 600
    } = {}) {
      this.queue = [];
      this.interval = interval;
      this.jitter = jitter;
      this.running = false;
    }
    enqueue(url) {
      if (this.running) return;
      this.queue.push(url);
    }
    start() {
      if (this.running) return;
      this.running = true;
      this._tick().then(() => {
      });
    }
    clear() {
      if (this.running) return;
      this.running = false;
      this.queue = [];
    }
    async _tick() {
      if (!this.queue.length) {
        this.running = false;
        return;
      }
      const url = this.queue.shift();
      this._openInBackground(url);
      if (!this.queue.length) {
        layui.layer.alert(
          "打开完毕",
          { icon: 1, shadeClose: true },
          function(index) {
            layer.close(index);
          }
        );
      }
      const delay = this.interval + Math.random() * this.jitter;
      setTimeout(() => this._tick(), delay);
    }
    _openInBackground(url) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          ctrlKey: true
})
      );
    }
  }
  class BackgroundExportEpubScheduler {
    constructor({
      interval = 1e3,
      jitter = 600
    } = {}) {
      this.queue = [];
      this.interval = interval;
      this.jitter = jitter;
      this.running = false;
    }
    enqueue(url) {
      if (this.running) return;
      this.queue.push(url);
    }
    async start() {
      if (this.running) return;
      this.running = true;
      if (this.running) {
        layer.msg("开始导出中，请稍等。。。");
      }
      await this._tick();
    }
    clear() {
      if (this.running) return;
      this.running = false;
      this.queue = [];
    }
    async _tick() {
      if (!this.queue.length) {
        this.running = false;
        return;
      }
      const url = this.queue.shift();
      await this._openInBackground(url);
      if (!this.queue.length) {
        layui.layer.alert(
          "导出完毕",
          { icon: 1, shadeClose: true },
          function(index) {
            layui.layer.close(index);
          }
        );
      }
      const delay = this.interval + Math.random() * this.jitter;
      setTimeout(() => this._tick(), delay);
    }
    async _openInBackground(url) {
      await buildEpub(url).catch((reason) => {
        console.log(reason);
        layui.layer.alert(
          "导出失败",
          { icon: 1, shadeClose: true },
          function(index) {
            layui.layer.close(index);
          }
        );
        this.clear();
      });
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
    try {
      const zip = new JSZip();
      let doc = await fetchBookIntro(url).catch((e) => {
        console.log(e);
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
      cssFolder.file("main.css", CommonRes.getMainCss());
      cssFolder.file("fonts.css", CommonRes.getFontsCss());
      const imgFolder = o.folder("Images");
      let coverUrl = doc.getElementsByClassName("cover")[0].src;
      imgFolder.file("cover.jpg", await CommonRes.gmFetchCoverImageBlob(coverUrl));
      imgFolder.file("logo.webp", await CommonRes.getLogoImg());
      imgFolder.file("girl.jpg", await CommonRes.getGirlImg());
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
      o.file("content.opf", contentOpfStr);
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
      console.log(contentOpfStr);
      const blob = await zip.generateAsync({ type: "blob" });
      fileSaver.saveAs(blob, `${bookName} 作者：${author}.epub`);
      console.log(bookName + " 下载完毕！");
    } catch (e) {
      console.log(e);
    }
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
  init().then(() => {
    run();
  });
  function run() {
    const scheduler = new BackgroundTabScheduler({
      interval: 100,
      jitter: 100
    });
    const exportEpubScheduler = new BackgroundExportEpubScheduler({
      interval: 500,
      jitter: 100
    });
    const fixbarStyle = `
                    background-color: #ff5555;
                    font-size: 12px;
                    width:80px;
                    height:36px;
                    line-height:36px;
                    margin-bottom:6px;
                    border-radius:10px;
                    `;
    layui.use(function() {
      const util = layui.util;
      util.fixbar({
        bars: [




{
            type: "bookList",
            content: "本页书籍单",
            style: fixbarStyle
          }
        ],
        default: false,
        css: { bottom: "15%" },
        margin: 0,
click: function(type) {
          if (type === "bookList") {
            openPage();
          }
        }
      });
    });
    function openPage() {
      layui.layer.open({
        type: 1,
        title: "书籍列表",
        shadeClose: false,
        offset: "r",
        shade: 0,
        anim: "slideLeft",
area: ["25%", "80%"],
        skin: "layui-layer-rim",
maxmin: true,
content: `<div id='openPage'></div>`,
        success: function(layero, index, that) {
          const tree = layui.tree;
          const layer2 = layui.layer;
          const util = layui.util;
          tree.render({
            elem: "#openPage",
            data: getMenuTree(),
            showCheckbox: true,
            onlyIconControl: true,
id: "title",
            isJump: false,
click: function(obj) {
              let data = obj.data;
              let all = getMenuTreeChecked(tree, "title");
              for (let i = 0; i < all.length; i++) {
                if (data.id === all[i].id) {
                  all[i].checked = !data.checked;
                }
              }
              tree.reload("title", { data: all });
            }
          });
          const openPagefixbarStyle = `
                    background-color: #ff5555;
                    font-size: 16px;
                    width:120px;
                    height:36px;
                    line-height:36px;
                    margin-bottom:6px;
                    border-radius:10px;
                    `;
          util.fixbar({
            bars: [
              {
                type: "全选",
                content: "全选",
                style: openPagefixbarStyle
              },
              {
                type: "1-12",
                content: "选中1-12",
                style: openPagefixbarStyle
              },
              {
                type: "13-24",
                content: "选中13-24",
                style: openPagefixbarStyle
              },
              {
                type: "25-36",
                content: "选中25-36",
                style: openPagefixbarStyle
              },
              {
                type: "37-49",
                content: "选中37-49",
                style: openPagefixbarStyle
              },
              {
                id: "getCheckedNodeData",
                type: "getCheckedNodeData",
                content: "打开选中书籍",
                style: openPagefixbarStyle
              },
              {
                type: "exportEpub",
                content: "导出EPUB",
                style: openPagefixbarStyle
              },
              {
                type: "clear",
                content: "清除选中",
                style: openPagefixbarStyle
              }
            ],
            default: false,
css: { bottom: "15%", right: 30 },
            target: layero,
click: function(type) {
              if (type === "getCheckedNodeData") {
                if (scheduler.running) {
                  layer2.msg("正在打开中，请等待打开完后再继续");
                  return;
                }
                getCheckedNodeData();
                scheduler.start();
                return;
              }
              if (type === "exportEpub") {
                if (exportEpubScheduler.running) {
                  layer2.msg("正在导出中，请等待导出完后再继续");
                  return;
                }
                exportEpub().then(() => {
                });
                return;
              }
              if (type === "clear") {
                reloadTree();
                scheduler.clear();
                exportEpubScheduler.clear();
                return;
              }
              tree.reload("title", { data: setMenuTreeChecked(tree, "title", type) });
            }
          });
          function getCheckedNodeData() {
            let checkedData = tree.getChecked("title");
            checkedData.reverse();
            for (let i = 0; i < checkedData.length; i++) {
              scheduler.enqueue(checkedData[i].href);
            }
          }
          async function exportEpub() {
            let checkedData = tree.getChecked("title");
            checkedData.reverse();
            for (let i = 0; i < checkedData.length; i++) {
              exportEpubScheduler.enqueue(checkedData[i].href);
            }
            await exportEpubScheduler.start();
          }
          function reloadTree() {
            tree.reload("title", {
data: getMenuTree()
            });
          }
        }
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
      let checkeds = t.getChecked(treeId);
      let checkedIds = [];
      for (let i = 0; i < checkeds.length; i++) {
        checkedIds.push(checkeds[i].id);
      }
      let all = getMenuTree();
      for (let i = 0; i < all.length; i++) {
        if (checkedIds.includes(all[i].id)) {
          all[i].checked = true;
        }
      }
      return all;
    }
  }

})(saveAs, JSZip);