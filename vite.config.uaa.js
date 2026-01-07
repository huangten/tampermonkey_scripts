import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, {cdn, util} from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';
// import Components from 'unplugin-vue-components/vite'
// import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'


const date = new Date();
const version = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.01`


// 1. 定义你的脚本库配置
const scriptConfigs = {
    uaa_novel_intro: {
        entry: 'src/uaa/intro/intro.js',
        userscript: {
            name: 'UAA 描述页 增强',
            author: 'YourName',
            match: ['https://www.uaa.com/novel/intro*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=uaa.com',
            namespace: 'https://tampermonkey.net/',
            version: version,
            noframes: true,

        },
        build: {
            outDir: "uaa",
            fileName: "uaa_novel_intro"
        }
    },
    uaa_novel_chapter: {
        entry: 'src/uaa/chapter/chapter.js',
        userscript: {
            name: 'UAA 章节页 增强',
            author: 'YourName',
            match: ['https://www.uaa.com/novel/chapter*'],
            icon: 'https://www.google.com/s2/favicons?sz=64&domain=uaa.com',
            namespace: 'https://tampermonkey.net/',
            version: version,
            noframes: true,
        },
        build: {
            outDir: "uaa",
            fileName: "uaa_novel_chapter"
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
        build:{
            outDir:`dist/${config.build.outDir}`,
            emptyOutDir:false
        },
        server: {
            open: false,
            port: 5173,
            strictPort: true, // 如果 5173 被占用直接报错，而不是切换到 5173
        },
        plugins: [
            vue(),
            AutoImport({
                imports: [util.unimportPreset],
                // resolvers: [ElementPlusResolver()],
            }),
            // Components({
            //     resolvers: [ElementPlusResolver({importStyle: 'css'})],
            // }),
            monkey(
                {
                    entry: config.entry,
                    userscript: {
                        grant: ['GM_getResourceText', 'GM_addStyle', 'unsafeWindow'],
                        ...config.userscript
                    },
                    build: {
                        // 3. 关键：让生成的脚本文件名包含脚本 Key
                        fileName: `${config.build.fileName}.user.js`,
                        // 关键：告诉 Vite，如果代码里出现了 'layui'，请不要打包它，直接找全局变量
                        // externalGlobals: {
                        //     // 这里的配置会让打包体积瞬间减小
                        //     vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
                        //     'element-plus': cdn.jsdelivr('ElementPlus', 'dist/index.full.min.js'),
                        // },
                        // externalResource: {
                        //     // 引入 Element Plus 的 CSS
                        //     'element-plus/dist/index.css': cdn.jsdelivr(),
                        // },
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
