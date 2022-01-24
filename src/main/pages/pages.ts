import { Browser, Page } from "puppeteer";
const puppeteer = require('puppeteer');

export abstract class Pages {

    browser: Browser | null = null;

    page: Page | null | undefined = null;

    abstract home_url: string;

    constructor() { }

    async setup() {
        this.browser = await puppeteer.launch({ headless: true, slowMo: 10 });

        this.page = await this.browser?.newPage();
        await this.page?.goto(this.home_url);
    }

    async close() {
        if (this.browser) await this.browser.close();

        this.browser = null;
        this.page = null;
    }

    async getInnerHTMLText(selector: string) {
        return await (await (await this.page?.$(selector))?.getProperty('textContent'))?.jsonValue<string>();
    }


    wait(ms: number): Promise<any> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve('');
            }, ms);
        });
    }


}