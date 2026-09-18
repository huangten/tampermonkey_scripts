import {ChapterView} from "../views/ChapterView.js";
import {ChapterEditorPageView} from "../views/ChapterEditorPageView.js";
import {EditorModel} from "../models/EditorModel.js";
import {ChapterModel} from "../models/ChapterModel.js";

export class ChapterController {
    constructor(doc = document) {
        this.doc = doc;
        /** @type {ChapterModel} */
        this.chapterModel = new ChapterModel(this.doc);
        /** @type {ChapterView} */
        this.chapterView = new ChapterView()
        /** @type {ChapterEditorPageView} */
        this.editorPageView = null;

        // 创建UI，显示UI，并添加相关处理事件
        this.create();
    }


    create() {
        this.chapterView.renderFixbar({
            onAction: (type) => this.handleAction(type)
        });
    }

    async handleAction(type) {
        switch (type) {
            case "复制书名": {
                this.chapterModel.getBookname();
            }
                break;
            case "复制内容": {
                this.chapterModel.getPreTagContent();
            }
                break;
            case "原样下载": {
                this.chapterModel.downloadChapterContent();
            }
                break;
            case "添加空白符下载": {
                this.chapterModel.downloadChapterContent('blank');
            }
                break;
            case "复制内容HTML": {
                this.chapterModel.getPreTagContentHtml();
            }
                break;
            case "调整排版并复制": {
                this.chapterModel.copyChapterContent();
            }
                break;
            case "编辑文本": {
                await this.openEditorTextView();
            }
                break;
            default:
                console.log(type);
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

    // 添加右键菜单命令
    handleEditorRightClickMenus() {
        this.editorPageView.addRightClickMenu('去除每行开头空白符', '去除每行开头空白符', 1, () => {
            const text = this.editorPageView.getEditorValue();
            const newText = text
                .split('\n')
                .map(line => line.replace(/^\s+/g, ''))
                .join('\n');
            this.editorPageView.setEditorValue(newText);
        });
        this.editorPageView.addRightClickMenu('每行开头添加中文空白符', '每行开头添加中文空白符', 2, () => {
            const text = this.editorPageView.getEditorValue();
            const newText = text
                .split('\n')
                .map(line => {
                    if (line.length > 0) {
                        return `　　${line}`;
                    }
                })
                .join('\n');
            this.editorPageView.setEditorValue(newText);
        });

        this.editorPageView.addRightClickMenu('按照两个中文空格拆分段落', '按照两个中文空格拆分段落', 3, () => {
            const text = this.editorPageView.getEditorValue();
            const texts = text.split('\n');
            const firstLine = texts.shift().trim();
            if (!firstLine) {
                return;
            }

            const newText = texts
                .join('')
                .replaceAll('　　', '\n　　')
                .replaceAll('    ', '\n　　')
                .split('\n')
                .map(line => {
                    // 空白行
                    if (/^　+$/.test(line)) {
                        return line.trim();
                    }
                    if (/^\s*第[\d一二三四五六七八九十]+卷(.*?)$/.test(line)) {
                        return line.trim()
                    }

                    if (/^\s*[（第][\d一二三四五六七八九十零百千万]+[章）话回集](.*?)$/.test(line)) {
                        return line.trim()
                    }

                    return line;
                }).join('\n');

            this.editorPageView.setEditorValue(firstLine + '\n\n' + newText);
        });

        this.editorPageView.addRightClickMenu('清洗英文单双引号', '清洗英文单双引号', 4, () => {
            const text = this.editorPageView.getEditorValue();
            const newText = text
                .split('\n')
                .map(line => {
                    return line.replaceAll(/"([^"]+)"/g, '“$1”').replaceAll(/'([^']+)'/g, '‘$1’');
                })
                .join('\n');
            this.editorPageView.setEditorValue(newText);
        });

        this.editorPageView.addRightClickMenu('重置文本', '重置文本', 4, () => {
            this.editorPageView.setEditorValue(this.chapterModel.getDownloadContent());
        });

        this.editorPageView.addRightClickMenu('下载文件', '下载文件', 4, () => {
            const text = this.editorPageView.getEditorValue();
            const texts = text.split('\n');
            if (texts.length < 2) {
                return;
            }
            let filename = texts[0].trim();
            if (!filename.includes('作者')) {
                filename += texts[1].trim();
            }
            // 调用model下载
            this.chapterModel.saveContentToLocationTxtFile(filename, texts.join('\n'));
        });
    }
}
