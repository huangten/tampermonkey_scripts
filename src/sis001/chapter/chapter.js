import {copyContext, init} from '../../common/common.js';

init().then(() => {
    run();
});

function run() {
    layui.use(function () {
        const util = layui.util;
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: '复制内容',
                    icon: 'layui-icon-auz'
                }
                , {
                    type: '复制内容HTML',
                    icon: 'layui-icon-fonts-code'
                }
                , {
                    type: '复制内容（第二版）',
                    icon: 'layui-icon-vercode'
                }
                // , {
                //     type: '复制内容HTML（第二版）',
                //     icon: 'layui-icon-code-circle'
                // }
            ],
            margin: 0,
            default: false,
            bgcolor: '#64822a',
            css: {bottom: "20%"},
            on: { // 任意事件 --  v2.8.0 新增
                mouseenter: function (type) {
                    layui.layer.tips(type, this, {
                        tips: 4,
                        fixed: true
                    });
                },
                mouseleave: function (type) {
                    layui.layer.closeAll('tips');
                }
            },
            // 点击事件
            click: function (type) {
                // console.log(this, type);
                // layer.msg(type);
                if (type === "复制内容") {
                    getContent();
                }
                if (type === "复制内容HTML") {
                    getContentHtml();
                }
                if (type === "复制内容（第二版）") {
                    getContentV2();
                }
                if (type === "复制内容HTML（第二版）") {
                    getContentHtmlV2();
                }
            }
        });
    });
}

function getElement(uw) {
    let e = uw.document.getElementsByClassName('postcontent')[0].getElementsByClassName("postmessage")[0];

    let e1 = e.cloneNode(true);

    let fieldset = e1.getElementsByTagName("fieldset")[0];
    let table = e1.getElementsByTagName("table")[0];


    // 1. 选中所有后代元素（包括直接子元素和非直接子元素）
    const allDescendants = e1.querySelectorAll('*');

    // 2. 遍历所有后代元素
    allDescendants.forEach(element => {
        // 3. 判断元素的直接父元素是否就是目标父元素
        if (element === fieldset) {
            // 4. 如果不是，则它是非直接子元素（孙子、曾孙等），执行移除
            element.remove();
        }
        if (element === table) {
            // 4. 如果不是，则它是非直接子元素（孙子、曾孙等），执行移除
            element.remove();
        }
        if (element.tagName === "A") {
            element.remove();
        }
    });

    return e1;
}

function getContent(uw = unsafeWindow) {
    copyContext(getElement(uw).innerText).then();
}

function getContentHtml(uw = unsafeWindow) {
    copyContext(getElement(uw).innerHTML).then();
}

function getContentV2(uw = unsafeWindow) {
    const text = getElement(uw).innerText
        .replaceAll('\n', '')
        .replaceAll('\t', '\n')
        .replaceAll('　　', '\n　　')
        .split('\n').filter(Boolean).join('\n');
    copyContext(text).then();
}

function getContentHtmlV2(uw = unsafeWindow) {
    const html = getElement(uw).innerHTML;
    copyContext(html).then();
}