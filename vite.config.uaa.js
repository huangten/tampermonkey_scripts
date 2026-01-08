import {defineConfig} from 'vite';
import monkey, {cdn, util} from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';


const date = new Date();
const version = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.01`


// 1. 定义你的脚本库配置
const scriptConfigs = {
    uaa_novel_intro: {
        entry: 'src/uaa/intro/intro.v2.js',
        userscript: {
            name: 'UAA 书籍描述页 增强 V2',
            author: 'YourName',
            match: ['https://*.uaa.com/novel/intro*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=uaa.com',
            namespace: 'https://tampermonkey.net/',
            version: version,
            noframes: true,

        },
        build: {
            outDir: "uaa",
            fileName: "uaa_novel_intro_v2"
        }
    },
    uaa_novel_chapter: {
        entry: 'src/uaa/chapter/chapter.js',
        userscript: {
            name: 'UAA 书籍章节页 增强',
            author: 'YourName',
            match: ['https://*.uaa.com/novel/chapter*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=uaa.com',
            namespace: 'https://tampermonkey.net/',
            version: version,
            noframes: true,
        },
        build: {
            outDir: "uaa",
            fileName: "uaa_novel_chapter"
        }
    },
    uaa_novel_list: {
        entry: 'src/uaa/list/list.js',
        userscript: {
            name: 'UAA 书籍列表页 增强',
            author: 'YourName',
            match: ['https://*.uaa.com/novel/list*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=uaa.com',
            namespace: 'https://tampermonkey.net/',
            require: [
                'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
                'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
            ],
            version: version,
            noframes: true,
        },
        build: {
            outDir: "uaa",
            fileName: "uaa_novel_list"
        }
    }
};


export default defineConfig(({mode}) => {

    console.log(mode)
    // 2. 获取当前要打包的脚本 Key
    const targetKey = process.env.TARGET_SCRIPT;
    const config = scriptConfigs[targetKey];
    if (!config) {
        throw new Error(`请指定有效的脚本名称！当前输入: ${targetKey}`);
    }

    return {
        build: {
            outDir: `dist/${config.build.outDir}`,
            emptyOutDir: false
        },
        server: {
            open: false,
            port: 5173,
            strictPort: true, // 如果 5173 被占用直接报错，而不是切换到 5173
        },
        plugins: [
            AutoImport({
                imports: [util.unimportPreset],
            }),
            monkey(
                {
                    entry: config.entry,
                    userscript: {
                        grant: ['GM_getResourceText', 'GM_addStyle', 'unsafeWindow', 'GM_download'],
                        require: [
                            'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
                        ],
                        ...config.userscript
                    },
                    build: {
                        // 3. 关键：让生成的脚本文件名包含脚本 Key
                        fileName: `${config.build.fileName}.user.js`,                        // 配置外部全局变量
                        externalGlobals: {
                            // 格式：'包名': util.cdn.jsdelivr('全局变量名', '文件名')
                            // 对于 file-saver，它的全局变量名通常是 saveAs
                            'file-saver': 'saveAs',
                            'jszip': 'JSZip'
                        },
                    }
                }),
        ],
    };
});
