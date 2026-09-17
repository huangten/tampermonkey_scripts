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
            this.editorPageView.setEditorModel(this.chapterModel.getChapterContent());
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
                .map(line => `　　${line}`)
                .join('\n');
            this.editorPageView.setEditorValue(newText);
        });
    }
}
