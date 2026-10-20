/**
 * 预处理页面，去掉不用的元素
 */
export function listAdjustUI() {
    const cheros = document.getElementsByClassName('cn-chero');
    if (cheros) {
        for (const chero of [...cheros]) {
            chero.remove();
        }
    }
    document.getElementById('cnEntries')?.style.setProperty("padding-top", "60px");
}