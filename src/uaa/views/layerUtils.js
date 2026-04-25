export function topLayerMsg(content, options = {zIndex: layui.layer.zIndex}, end) {
    if (typeof options === 'function') {
        end = options;
        options = {};
    }

    const success = options.success;
    return layui.layer.msg(content, {
        ...options,
        success(layero, index) {
            layui.layer.setTop(layero);
            success?.(layero, index);
        }
    }, end);
}

export function topLayerConfirm(content, yes, cancel, options = { zIndex: layui.layer.zIndex }) {
    const success = options.success;
    return layui.layer.confirm(content, {
        icon: 3,
        title: '确认操作',
        ...options,
        success(layero, index) {
            layui.layer.setTop(layero);
            success?.(layero, index);
        }
    }, yes, cancel);
}

