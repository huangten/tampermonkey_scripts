import {defineConfig} from 'vite';
import monkey, {util} from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';


// 1. 定义你的脚本库配置
const scriptConfigs = {
    uaa_novel_intro: {
        entry: 'src/uaa/uaa_novel_intro.js',
        userscript: {
            name: 'UAA 描述页 增强',
            author: 'YourName',
            match: ['https://www.uaa.com/novel/intro*'],
            icon: 'https://vitejs.dev/logo.svg',
            namespace: 'https://tampermonkey.net/',
            version: "2025-12-30.01",
            noframes: true,

        }
    },
    uaa_novel_chapter: {
        entry: 'src/uaa/uaa_novel_chapter.js',
        userscript: {
            name: 'UAA 章节页 增强',
            author: 'YourName',
            match: ['https://www.uaa.com/novel/chapter*'],
            icon: 'https://vitejs.dev/logo.svg',
            namespace: 'https://tampermonkey.net/',
            version: "2025-12-30.01",
            noframes: true,
        }
    }
};


export default defineConfig(({mode}) => {

    console.log(mode)
    // 2. 获取当前要打包的脚本 Key
    const targetKey = process.env.TARGET_SCRIPT;
    const config = scriptConfigs[targetKey];
    // console.log(config)
    if (!config) {
        throw new Error(`请指定有效的脚本名称！当前输入: ${targetKey}`);
    }

    return {
        server: {
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
                        grant: ['GM_getResourceText', 'GM_addStyle'],
                        ...config.userscript
                    },
                    build: {
                        // 3. 关键：让生成的脚本文件名包含脚本 Key
                        fileName: `${targetKey}.user.js`,
                        // 关键：告诉 Vite，如果代码里出现了 'layui'，请不要打包它，直接找全局变量
                        externalGlobals: {
                            layui: 'layui'
                        }
                    }
                }),
        ],
    };
});


// https://vitejs.dev/config/
// export default defineConfig({
//     plugins: [
//         AutoImport({
//             imports: [util.unimportPreset],
//         }),
//         monkey({
//             entry: 'src/main.js',
//             userscript: {
//                 icon: 'https://vitejs.dev/logo.svg',
//                 namespace: 'https://tampermonkey.net/',
//                 match: ['https://www.google.com/'],
//                 version: "2025-12-30.01",
//                 noframes: true,
//             },
//         }),
//     ],
// });
