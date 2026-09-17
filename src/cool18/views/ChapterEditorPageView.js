/// <reference types="monaco-editor" />
// 方式 A：在文件顶部加入这行，直接让全局变量 monaco 获得类型

export class ChapterEditorPageView {
    constructor(doc = document) {
        this.doc = doc;
        this.index = 0;
        this.containerId = 'editorContainer';
        this.editor = null;
    }

    async ensure() {
        return new Promise((resolve, reject) => {
            if (this.index !== 0) {
                return resolve();
            }
            const self = this;
            this.index = layui.layer.open({
                type: 1,
                title: '编辑面板',
                shadeClose: false,
                closeBtn: 0,
                shade: 0,
                moveOut: true,
                maxmin: true,
                skin: 'layui-layer-win10',
                area: ['90%', '95%'],
                content: `<div id="${this.containerId}" style="width: 100%;height: 100%;"></div>`,
                success: function (layero, index) {
                    layui.layer.setTop(layero);
                    // console.log('编辑面板初始化完毕！')
                    self.createEditor(self.containerId)
                    resolve()
                }
            });
        });
    }

    async createEditor(containerId) {
        const container = this.doc.getElementById(containerId);
        this.editor = monaco.editor.create(container,
            {
                model: null,
                automaticLayout: true,
                minimap: {
                    enabled: true,
                    side: 'right',
                    showSlider: 'mouseover',
                    renderCharacters: true,
                    size: 'fill',
                    maxColumn: 120,
                },
                unicodeHighlight: {
                    ambiguousCharacters: false,
                    invisibleCharacters: false,
                    nonBasicASCII: false
                },
                wordWrap: 'off',
                // fontFamily: 'Noto Sans CJK SC',
                fontSize: 16,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                renderWhitespace: 'all',
                theme: 'vs'
            });
    }

    setEditorValue(value) {
        this.editor.setValue(value);
    }

    getEditorValue() {
        return this.editor.getValue();
    }

    getEditorModel() {
        return this.editor.getModel()
    }

    setEditorModel(text, language = 'plaintext') {
        const model = monaco.editor.createModel(text, language);
        this.editor.setModel(model);
    }

    addRightClickMenu(id, label, contextMenuOrder, callback, contextMenuGroupId = 'navigation') {
        this.editor.addAction({
            id: id,
            label: label,
            // precondition: 'editorHasSelection', // 选中才出现
            contextMenuGroupId: contextMenuGroupId,
            contextMenuOrder: contextMenuOrder,
            run(editor) {
                callback?.(editor);
                // const selection = editor.getSelection();
                // if (!selection) {
                //     return;
                // }
                // const text = editor.getModel().getValueInRange(selection);
                // console.log('选中的内容：', text);

                // const text = editor.getValue();
                //
                // const newText = text
                //     .split('\n')
                //     .map(line => line.replace(/^\s+/g, ''))
                //     .join('\n');
                //
                // editor.setValue(newText);
            }
        })

    }
}