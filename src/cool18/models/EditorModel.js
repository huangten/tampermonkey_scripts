export class EditorModel {
    constructor(content) {
        this.lines = content.split('\n').filter(Boolean);
    }

    // 章节清洗
    handleLine() {
        if (this.lines.length < 2) {
            return '';
        }

        const result = [];
        for (let index = 0; index < this.lines.length; index++) {
            let line = this.lines[index];
            let l = {
                // 是否是特殊行，特殊行，单独放一行
                isSpecialLine: false,
                // 处理后的文字
                showText: '',
            }

            if (index === 0) {
                l.isSpecialLine = true;
                l.showText = line.trim() + '\n';
                result.push(l);
                continue;
            }

            if (index === 1) {
                l.isSpecialLine = true;
                l.showText = line.trim() + '\n\n\n\n';
                result.push(l);
                continue;
            }

            if (/^\s*第[\d一二三四五六七八九十]+卷(.*?)$/.test(line)) {
                l.isSpecialLine = true;
                l.showText = `\n${line.trim()}\n`;
                result.push(l);
                continue;
            }

            if (/^\s*[（第][\d一二三四五六七八九十零百千万 　]+[章）话回集](.*?)$/.test(line)) {
                l.isSpecialLine = true;
                l.showText = `\n${line.trim()}\n`;
                result.push(l);
                continue;
            }

            if (/^[ 　]{2,}/.test(line)) {
                const lls = line.replaceAll('    ', '　　').split('　　').join(`\n　　`).trimStart();
                result.push({
                    isSpecialLine: false,
                    showText: `\n　　${lls}`
                })

            } else {
                const lls = line.replaceAll('    ', '　　').split('　　').join(`\n　　`).trimStart();
                result.push({
                    isSpecialLine: false,
                    showText: lls
                })
            }
        }
        const contents = [];
        for (let i = 0; i < result.length; i++) {
            // if (result[i].isSpecialLine) {
            contents.push(result[i].showText);
            // } else {
            //     if (result[i - 1].isSpecialLine) {
            //         contents.push('\n' + result[i].showText);
            //     } else {
            //         contents.push(result[i].showText);
            //     }
            // }

        }

        return contents.join('');
    }

    toString() {
        return this.lines.join('\n');
    }
}