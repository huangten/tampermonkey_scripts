export class EditorPageView {
    constructor(doc = document) {
        this.doc = doc;
        this.index = 0;
        this.containerId = 'editorContainer';
    }

    async ensure() {
        return new Promise((resolve, reject) => {
            if (this.index !== 0) {
                return resolve(this.index);
            }
            this.index = layui.layer.open({
                type: 1,
                title: '编辑面板',
                shadeClose: false,
                closeBtn: 0,
                shade: 0,
                moveOut: true,
                maxmin: true,
                area: ['80%', '95%'],
                content: `<div id="${this.containerId}" style="width: 100%;height: 99%;"></div>`,
                success: function (layero, index) {
                    layui.layer.setTop(layero);
                    console.log('编辑面板初始化完毕！')
                }
            });
            return resolve(this.index);
        });


    }
}