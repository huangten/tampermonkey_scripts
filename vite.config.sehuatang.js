import {defineConfig} from 'vite';
import monkey, {cdn, util} from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';
import {getVersion} from "./src/common/version.js";


// 1. 定义你的脚本库配置
const scriptConfigs = {
    sehuatang_list: {
        entry: 'src/sehuatang/list/list.js',
        userscript: {
            name: 'sehuatang 列表页 增强',
            author: 'YourName',
            match: ['https://*.sehuatang.org/forum*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org',
            namespace: 'https://tampermonkey.net/',
            version: getVersion(),
            noframes: true,

        },
        build: {
            outDir: "sehuatang",
            fileName: "sehuatang_list"
        }
    },

    sehuatang_list_v2: {
        entry: 'src/sehuatang/list/list_v2.js',
        userscript: {
            name: 'sehuatang 列表页 增强 V2',
            author: 'YourName',
            match: ['https://*.sehuatang.org/forum*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org',
            namespace: 'https://tampermonkey.net/',
            version: getVersion(),
            noframes: true,

        },
        build: {
            outDir: "sehuatang",
            fileName: "sehuatang_list_v2"
        }
    },

    sehuatang_details_page: {
        entry: 'src/sehuatang/details_page/details_page.js',
        userscript: {
            name: 'sehuatang 详情页 增强',
            author: 'YourName',
            match: [
                'https://*.sehuatang.org/thread*',
                'https://*.sehuatang.org/forum.php?mod=viewthread&tid=*'
            ],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=sehuatang.org',
            namespace: 'https://tampermonkey.net/',
            version: getVersion(),
            noframes: true,
        },
        build: {
            outDir: "sehuatang",
            fileName: "sehuatang_details_page"
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
            emptyOutDir: false,
            rollupOptions: {
                external: ['file-saver'], // 排除这些包
                // 如果还需要其他 Rollup 配置，可以在这里添加
            },
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
                        grant: ['GM_getResourceText', 'GM_addStyle', 'unsafeWindow', 'GM_xmlhttpRequest', 'GM_download', 'GM_notification', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand'],
                        connect: ['*'],
                        require: [
                            'https://unpkg.com/hacktimer/HackTimer.js',
                            'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js'
                        ],
                        ...config.userscript
                    },
                    build: {
                        // 3. 关键：让生成的脚本文件名包含脚本 Key
                        fileName: `${config.build.fileName}.user.js`,
                        // 配置外部全局变量
                        externalGlobals: {
                            // 格式：'包名': util.cdn.jsdelivr('全局变量名', '文件名')
                            // 对于 file-saver，它的全局变量名通常是 saveAs
                            'file-saver': 'saveAs',
                        },
                    }
                }),
        ],
    };
});



