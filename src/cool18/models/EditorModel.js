export class EditorModel {
    constructor(doc = document) {

    }

    dispose() {

    }

    create(containerId, value) {

        // editor.addAction({
        //     id: 'hello-world',
        //     label: '去除空白符',
        //     precondition: 'editorHasSelection', // 选中才出现
        //     contextMenuGroupId: 'navigation',
        //     contextMenuOrder: 1,
        //     run(editor) {
        //         // const selection = editor.getSelection();
        //         // if (!selection) {
        //         //     return;
        //         // }
        //         // const text = editor.getModel().getValueInRange(selection);
        //         // console.log('选中的内容：', text);
        //
        //         const text = editor.getValue();
        //
        //         const newText = text
        //             .split('\n')
        //             .map(line => line.replace(/^\s+/g, ''))
        //             .join('\n');
        //
        //         editor.setValue(newText);
        //
        //     }
        // });
        // return editor;
    }
}