// ==UserScript==
// @name         UAA 小说 → 目录骨架 EPUB
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  从 UAA 小说目录生成空章节 EPUB（仅标题，不抓内容）
// @author       ChatGPT
// @match        https://www.uaa.com/novel/intro?id=*
// @grant        GM_notification
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const $$ = s => Array.from(document.querySelectorAll(s));

  function createButton() {
    const btn = document.createElement('button');
    btn.textContent = '导出目录EPUB';
    Object.assign(btn.style, {
      position:"fixed", right:"20px", bottom:"20px", zIndex:99999,
      padding:"10px 14px", borderRadius:"8px", background:"#28a745",
      color:"#fff", border:"none", cursor:"pointer"
    });
    document.body.appendChild(btn);
    return btn;
  }

  function findChapterLinks() {
    // 尝试找到目录 ul/ol > a
    let links = $$('a').filter(a =>
      /第.+章|章|\d+/.test(a.textContent) && a.href.includes('/novel/chapter/')
    );
    return [...new Set(links)];
  }

  async function buildEpub(meta, chapters) {
    const zip = new JSZip();

    zip.file('mimetype','application/epub+zip',{compression:'STORE'});
    zip.folder('META-INF').file('container.xml',`
<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
 <rootfiles>
  <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
 </rootfiles>
</container>`);

    const o = zip.folder('OEBPS');
    o.file('styles.css',`body{font-family:serif;line-height:1.6;margin:1em;}h1{font-size:1.2em;}`);

    const manifest=[], spine=[], ncxNav=[];
    const textFolder = o.folder('Text');

    chapters.forEach((c,i)=>{
      const id=`ch${i+1}`;
      const html = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="utf-8"/><title>${c.title}</title>
<link rel="stylesheet" href="../styles.css"/></head>
<body><h1>${c.title}</h1></body>
</html>`;

      textFolder.file(`${id}.xhtml`, html);
      manifest.push(`<item id="${id}" href="Text/${id}.xhtml" media-type="application/xhtml+xml"/>`);
      spine.push(`<itemref idref="${id}"/>`);
      ncxNav.push(`<navPoint id="nav-${i+1}" playOrder="${i+1}">
      <navLabel><text>${c.title}</text></navLabel>
      <content src="Text/${id}.xhtml"/>
      </navPoint>`);
    });

    o.file('content.opf',`<?xml version="1.0"?>
<package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${meta.title}</dc:title>
    <dc:creator>${meta.author}</dc:creator>
    <dc:language>zh-CN</dc:language>
    <dc:identifier id="id">${meta.id}</dc:identifier>
  </metadata>
  <manifest>
    ${manifest.join('\n')}
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
    ${spine.join('\n')}
  </spine>
</package>`);

    o.file('toc.ncx',`<?xml version="1.0"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${meta.id}"/></head>
  <docTitle><text>${meta.title}</text></docTitle>
  <navMap>${ncxNav.join('\n')}</navMap>
</ncx>`);

    const blob = await zip.generateAsync({type:'blob'});
    saveAs(blob,`${meta.title}_目录骨架.epub`);
  }

  function main() {
    const btn = createButton();

    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = '读取目录...';

      const title = document.querySelector('h1')?.innerText.trim() || 'novel';
      const author = document.querySelector('.author')?.innerText.trim() || '';
      const chaptersLink = findChapterLinks();

      const chapters = chaptersLink.map(a=>({ title:a.textContent.trim() }));
      btn.textContent = `生成 ${chapters.length} 章...`;

      await buildEpub({title, author, id:location.href}, chapters);
      btn.textContent = '导出目录EPUB ✓';

      GM_notification({text:`EPUB 已生成：${chapters.length}章`,title:'完成',timeout:4000});
    };
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', main)
    : main();
})();
