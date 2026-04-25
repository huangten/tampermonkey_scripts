export class DownloadInfoWindowView {
    constructor(containerId) {
        this.index = 0;
        this.containerId = containerId;
    }

    ensure() {
        if (this.index !== 0) {
            return this.index;
        }
        this.index = layui.layer.open({
            type: 1,
            title: '下载面板',
            shadeClose: false,
            closeBtn: 0,
            shade: 0,
            moveOut: true,
            maxmin: true,
            area: ['70%', '80%'],
            content: `<div id="${this.containerId}" style="width: 100%;height: 99%;"></div>`,
            success: function (layero, index) {
                layui.layer.setTop(layero);
                layui.layer.min(index);
            }
        });
        return this.index;
    }

    setTitle(title) {
        layui.layer.title(title, this.ensure());
    }

    minimize() {
        layui.layer.min(this.ensure());
    }

    restore() {
        layui.layer.restore(this.ensure());
    }

    resetTitle() {
        this.setTitle('下载面板');
    }

    getContainer() {
        return document.getElementById(this.containerId);
    }
}

