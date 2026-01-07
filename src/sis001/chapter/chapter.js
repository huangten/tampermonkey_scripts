import {copyContext, init} from '../../common/common.js'

init().then(() => {
    run();
});

function run() {
    layui.use(function () {
        const util = layui.util;
        const fixbarStyle = "background-color: #ba350f;font-size: 16px;width:160px;height:36px;line-height:36px;margin-bottom:6px;border-radius:10px;"
        // 自定义固定条
        util.fixbar({
            bars: [
                {
                    type: 'CopyContent',
                    content: '复制内容',
                    style: fixbarStyle
                },
                {
                    type: 'CopyContentHtml',
                    content: '复制内容HTML',
                    style: fixbarStyle
                }
            ],
            default: false,
            css: {bottom: "21%"},
            margin: 0,
            // 点击事件
            click: function (type) {
                console.log(this, type);
                // layer.msg(type);
                if (type === "CopyContent") {
                    getPreTagContent();

                }
                if (type === "CopyContentHtml") {
                    getPreTagContentHtml();
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

function getPreTagContent(uw = unsafeWindow) {
    copyContext(getElement(uw).innerText).then();
}

function getPreTagContentHtml(uw = unsafeWindow) {
    copyContext(getElement(uw).innerHTML).then();
}