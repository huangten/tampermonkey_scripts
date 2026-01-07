import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, {util} from 'vite-plugin-monkey';
import AutoImport from 'unplugin-auto-import/vite';


const date = new Date();
const version = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.01`


// 1. 定义你的脚本库配置
const scriptConfigs = {
    sshuba_chapter: {
        entry: 'src/sshuba/chapter/chapter.js',
        userscript: {
            name: 'sshuba 章节页 增强',
            author: 'YourName',
            match: ['*://sshuba.com/books/*'],
            namespace: 'https://tampermonkey.net/',
            version: version,
            noframes: true,
        },
        build: {
            outDir: "sshuba",
            fileName: "sshuba_book_chapter"
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
            vue(),
            AutoImport({
                imports: [util.unimportPreset],
            }),
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
                    }
                }),
        ],
    };
});


