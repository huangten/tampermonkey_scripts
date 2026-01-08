import {saveAs} from "file-saver";
import JSZip from "jszip";

class EpubBuilder {
    constructor() {
        this.zip = new JSZip();

        this.manifest = [];
        this.spine = [];
        this.ncxNav = [];

        this.oebps = this.zip.folder("OEBPS");
        this.text = this.oebps.folder("Text");
        this.styles = this.oebps.folder("Styles");
        this.images = this.oebps.folder("Images");
    }

    init() {
        this.zip.file(
            "mimetype",
            "application/epub+zip",
            { compression: "STORE" }
        );

        this.zip
            .folder("META-INF")
            .file("container.xml", XmlUtil.serialize(XmlFactory.container()));
    }

    addCss(name, content) {
        this.styles.file(name, content);
        this.manifest.push(
            OpfBuilder.item(name, `Styles/${name}`, "text/css")
        );
    }

    addImage(id, path, blob, type) {
        this.images.file(path, blob);
        this.manifest.push(
            OpfBuilder.item(id, `Images/${path}`, type)
        );
    }

    addXhtml(id, filename, doc, spine = true) {
        this.text.file(filename, XmlUtil.serializeXHTML(doc));
        this.manifest.push(
            OpfBuilder.item(id, `Text/${filename}`, "application/xhtml+xml")
        );
        if (spine) {
            this.spine.push(OpfBuilder.spineItem(id));
        }
    }

    addNavPoint(navPoint) {
        this.ncxNav.push(navPoint);
    }

    buildOpf(meta) {
        this.oebps.file(
            "content.opf",
            XmlUtil.serialize(
                OpfBuilder.build(meta, this.manifest, this.spine)
            )
        );
    }

    buildNcx(meta) {
        this.oebps.file(
            "toc.ncx",
            XmlUtil.serialize(
                NcxBuilder.build(meta, this.ncxNav)
            )
        );
    }

    async generate(filename) {
        const blob = await this.zip.generateAsync({ type: "blob" });
        saveAs(blob, filename);
    }
}




class XmlUtil {
    static serialize(doc) {
        return new XMLSerializer().serializeToString(doc);
    }

    static serializeXHTML(doc) {
        return `<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n`
            + this.serialize(doc);
    }

    static el(doc, name, attrs = {}, text = null) {
        const el = doc.createElement(name);
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        if (text !== null) el.textContent = text;
        return el;
    }
}



class XmlFactory {
    static container() {
        const doc = document.implementation.createDocument(
            "urn:oasis:names:tc:opendocument:xmlns:container",
            "container"
        );

        const rootfiles = doc.createElement("rootfiles");
        const rootfile = doc.createElement("rootfile");

        rootfile.setAttribute("full-path", "OEBPS/content.opf");
        rootfile.setAttribute("media-type", "application/oebps-package+xml");

        rootfiles.appendChild(rootfile);
        doc.documentElement.appendChild(rootfiles);

        return doc;
    }
}
class OpfBuilder {
    static item(id, href, mediaType) {
        return { id, href, mediaType };
    }

    static spineItem(id) {
        return { idref: id };
    }

    static build(meta, manifest, spine) {
        const doc = document.implementation.createDocument(
            "http://www.idpf.org/2007/opf",
            "package"
        );

        const pkg = doc.documentElement;
        pkg.setAttribute("version", "2.0");
        pkg.setAttribute("unique-identifier", "bookid");

        const metadata = doc.createElement("metadata");
        metadata.appendChild(XmlUtil.el(doc, "dc:title", {}, meta.title));
        metadata.appendChild(XmlUtil.el(doc, "dc:language", {}, "zh-CN"));
        metadata.appendChild(XmlUtil.el(doc, "dc:creator", {}, meta.author));
        pkg.appendChild(metadata);

        const mani = doc.createElement("manifest");
        manifest.forEach(i => {
            mani.appendChild(
                XmlUtil.el(doc, "item", {
                    id: i.id,
                    href: i.href,
                    "media-type": i.mediaType
                })
            );
        });

        const sp = doc.createElement("spine");
        spine.forEach(i => {
            sp.appendChild(XmlUtil.el(doc, "itemref", i));
        });

        pkg.append(mani, sp);
        return doc;
    }
}
class NcxBuilder {
    static navPoint(doc, id, label, src, children = []) {
        const np = XmlUtil.el(doc, "navPoint", { id });

        np.appendChild(
            XmlUtil.el(doc, "navLabel", {}, label)
        );

        np.appendChild(
            XmlUtil.el(doc, "content", { src })
        );

        children.forEach(c => np.appendChild(c));
        return np;
    }

    static build(meta, navPoints) {
        const doc = document.implementation.createDocument(
            "http://www.daisy.org/z3986/2005/ncx/",
            "ncx"
        );

        const navMap = doc.createElement("navMap");
        navPoints.forEach(n => navMap.appendChild(n));

        doc.documentElement.appendChild(navMap);
        return doc;
    }
}


/***********************
 * XHTML / XML 工具
 ***********************/
class XhtmlUtil {
    static createDoc() {
        const doc = document.implementation.createDocument(
            "http://www.w3.org/1999/xhtml",
            "html",
            null
        );
        const html = doc.documentElement;
        html.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        return doc;
    }

    static el(doc, tag, attrs = {}, text = null) {
        const el = doc.createElement(tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        if (text !== null) el.textContent = text;
        return el;
    }

    static head(doc, title, cssList = []) {
        const head = doc.createElement("head");
        head.appendChild(this.el(doc, "title", {}, title));

        cssList.forEach(href => {
            head.appendChild(
                this.el(doc, "link", {
                    rel: "stylesheet",
                    type: "text/css",
                    href
                })
            );
        });

        return head;
    }

    static serializeXHTML(doc) {
        return (
            `<?xml version="1.0" encoding="utf-8"?>\n` +
            `<!DOCTYPE html>\n` +
            new XMLSerializer().serializeToString(doc)
        );
    }
}

/***********************
 * XHTML 页面工厂
 ***********************/
class XhtmlFactory {

    /* cover.xhtml */
    static cover() {
        const doc = XhtmlUtil.createDoc();
        const html = doc.documentElement;

        const head = XhtmlUtil.head(doc, "Cover");
        const body = doc.createElement("body");

        const div = XhtmlUtil.el(doc, "div", {
            style: "text-align:center;padding:0;margin:0;"
        });

        div.appendChild(
            XhtmlUtil.el(doc, "img", {
                src: "../Images/cover.jpg",
                width: "100%"
            })
        );

        body.appendChild(div);
        html.append(head, body);
        return doc;
    }

    /* fy.xhtml */
    static fy({ name, author }) {
        const doc = XhtmlUtil.createDoc();
        const html = doc.documentElement;

        const head = XhtmlUtil.head(doc, "扉页");

        const style = doc.createElement("style");
        style.textContent = `
.pic{
  margin:0;
  padding:2px;
  border:1px solid #f5f5dc;
  border-radius:1px;
}
`;
        head.appendChild(style);

        const body = XhtmlUtil.el(doc, "body", {
            style: "text-align:center;"
        });

        const pic = XhtmlUtil.el(doc, "div", { class: "pic" });
        pic.appendChild(
            XhtmlUtil.el(doc, "img", {
                src: "../Images/cover.jpg",
                style: "width:100%;height:auto;"
            })
        );

        body.append(
            pic,
            XhtmlUtil.el(doc, "h1", {
                style: "margin-top:5%;font-size:110%;"
            }, name),
            XhtmlUtil.el(
                doc,
                "div",
                { class: "author" },
                `${author} / 著`
            )
        );

        html.append(head, body);
        return doc;
    }

    /* intro.xhtml */
    static intro(info) {
        const doc = XhtmlUtil.createDoc();
        const html = doc.documentElement;

        const head = XhtmlUtil.head(doc, "内容简介", [
            "../Styles/fonts.css",
            "../Styles/main.css"
        ]);

        const body = XhtmlUtil.el(doc, "body", { class: "speci" });
        const box = XhtmlUtil.el(doc, "div", { class: "oval" });

        box.appendChild(
            XhtmlUtil.el(doc, "h2", {
                class: "ovaltitle",
                style: "margin-bottom:2em;"
            }, "内容简介")
        );

        [
            ["📖 书名", info.bookName],
            ["👤 作者", info.author],
            ["🗂 分类", info.type],
            ["🔖 标签", info.tags],
            ["🗿 肉量", info.rou],
            ["✏ 评分", info.score],
            ["🕰 上次更新", info.lastUpdateTime],
            ["🏷 简介", info.intro],
        ].forEach(([k, v]) => {
            box.appendChild(
                XhtmlUtil.el(doc, "p", {}, `${k}：${v}`)
            );
        });

        body.appendChild(box);
        html.append(head, body);
        return doc;
    }

    /* chapter.xhtml */
    static chapter(title) {
        const doc = XhtmlUtil.createDoc();
        const html = doc.documentElement;

        const head = XhtmlUtil.head(doc, title, [
            "../Styles/fonts.css",
            "../Styles/main.css"
        ]);

        const body = doc.createElement("body");

        const logo = XhtmlUtil.el(doc, "div", { class: "chapter-head" });
        logo.appendChild(
            XhtmlUtil.el(doc, "img", {
                src: "../Images/logo.webp",
                class: "chapter-head",
                alt: "logo"
            })
        );

        const parts = title.split(" ").filter(Boolean);
        const h2 = XhtmlUtil.el(doc, "h2", { class: "chapter-title" });
        h2.appendChild(XhtmlUtil.el(doc, "span", {}, parts[0] || ""));

        if (parts.length > 1) {
            h2.appendChild(doc.createElement("br"));
            h2.appendChild(
                doc.createTextNode(parts.slice(1).join(" "))
            );
        }

        body.append(
            logo,
            h2,
            XhtmlUtil.el(doc, "p", {}, "null")
        );

        html.append(head, body);
        return doc;
    }

    /* volume.xhtml */
    static volume(title, index = 0) {
        const doc = XhtmlUtil.createDoc();
        const html = doc.documentElement;

        html.setAttribute("xml:lang", "zh-CN");
        html.setAttribute("xmlns:epub", "http://www.idpf.org/2007/ops");

        const head = XhtmlUtil.head(doc, title, [
            "../Styles/fonts.css",
            "../Styles/main.css"
        ]);

        const body = XhtmlUtil.el(
            doc,
            "body",
            { class: `bg_${String(index + 1).padStart(2, "0")}` }
        );

        const h1 = doc.createElement("h1");
        title.split(" ").filter(Boolean).forEach((t, i) => {
            if (i > 0) h1.appendChild(doc.createElement("br"));
            h1.appendChild(doc.createTextNode(t));
        });

        body.appendChild(h1);
        html.append(head, body);
        return doc;
    }
}
