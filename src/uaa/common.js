export class CommonRes {
    constructor() {
        if (CommonRes.instance) {
            return CommonRes.instance;
        }
        CommonRes.instance = this;
        this.logoImg = null
        this.girlImg = null
        this.line1Img = null
        this.mainCss = null
        this.fontsCss = null
    }

    static getInstance() {
        if (!CommonRes.instance) {
            CommonRes.instance = new CommonRes();
        }
        return CommonRes.instance;
    }

    async gmFetchCoverImageBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', headers: {
                    Referer: "https://www.uaa.com/",
                }, onload: res => {
                    if (res.status === 200) {
                        resolve(res.response);
                    } else {
                        reject(new Error('HTTP CODE ' + res.status));
                    }
                }, onerror: err => reject(err),
            });
        });
    }

    async gmFetchImageBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url, responseType: 'blob', onload: res => {
                    if (res.status === 200) {
                        resolve(res.response);
                    } else {
                        reject(new Error('HTTP CODE ' + res.status));
                    }
                }, onerror: err => reject(err),
            });
        });
    }

    async gmFetchText(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', url,
                responseType: 'arraybuffer',
                onload: res => {
                    if (res.status !== 200) {
                        reject(new Error(`HTTP CODE ${res.status}`));
                    } else {
                        //const decoder = new TextDecoder('utf-8');
                        //const text = decoder.decode(res.response);
                        resolve(res.response);
                    }
                },
                onerror: err => reject(err),
            });
        });
    }

    async getLogoImg() {
        if (this.logoImg === null) {
            this.logoImg = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/logo.webp');
        }
        return this.logoImg;
    }

    async getGirlImg() {
        if (this.girlImg === null) {
            this.girlImg = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/girl.jpg');
        }
        return this.girlImg;
    }

    async getLine1Img() {
        if (this.line1Img === null) {
            this.line1Img = await this.gmFetchImageBlob('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/line1.webp');
        }
        return this.line1Img;
    }

    async getMainCss() {
        if (this.mainCss === null) {
            this.mainCss = await this.gmFetchText('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/main.css');
        }
        return this.mainCss;
    }

    async getFontsCss() {
        if (this.fontsCss === null) {
            this.fontsCss = await this.gmFetchText('https://raw.githubusercontent.com/huangten/tampermonkey_scripts/refs/heads/master/uaa/fonts.css');
        }
        return this.fontsCss;
    }
}
