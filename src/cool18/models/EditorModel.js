import * as monaco from 'monaco-editor'

export class EditorModel {
    constructor(doc = document) {
        this.doc = doc;
    }

    dispose() {
        this.doc = null;
    }

    create(containerId, value) {
        const container = this.doc.getElementById(containerId);
        if (!container) {
            throw new Error('编辑器承载元素不存在');
        }
        const editor = monaco.editor.create(
            container
            ,
            {
                value: value,
                language: 'plaintext',
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
        editor.addAction({
            id: 'hello-world',
            label: '去除空白符',
            precondition: 'editorHasSelection', // 选中才出现
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1,
            run(editor) {
                // const selection = editor.getSelection();
                // if (!selection) {
                //     return;
                // }
                // const text = editor.getModel().getValueInRange(selection);
                // console.log('选中的内容：', text);

                const text = editor.getValue();

                const newText = text
                    .split('\n')
                    .map(line => line.replace(/^\s+/g, ''))
                    .join('\n');

                editor.setValue(newText);

            }
        });
        return editor;
    }
}