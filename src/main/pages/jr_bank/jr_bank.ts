import { Finance } from "../../model/finance";
import { Pages } from "../pages";

export class JRBank extends Pages {
    home_url: string = 'https://irbank.net/';

    finance: Finance;

    constructor(finance: Finance) {
        super();
        this.finance = finance;
        this.home_url = this.home_url + this.finance.code;
    }

    // 1株配当金の取得
    async downloadShareValue() {
        let list = await this.page?.$$eval('#container > main > div.csb.cc1 > div > div > section:nth-child(5) > div:nth-child(2) > table > tbody > tr', (films => films.map(firm => {
            const date = firm.querySelector('td:nth-child(1) > a')?.innerHTML;
            const value: any = firm.querySelector('td:nth-child(2) > span.text')?.innerHTML;
            return { date: date, value: value };
        })));
        list = list?.filter((value) => {
            return value.date != null;
        });
        if (list) {
            for (let item of list) {
                this.finance.share_value_list.push({ date: item.date!, value: Number(item.value) || 0 });
            }
        }
    }


    // 売上 営業利益率の取得
    async downloadSalesInfo() {
        let list = await this.page?.$$eval('#container > main > div.csb.cc1 > div > div > section:nth-child(2) > div:nth-child(2) > table > tbody > tr', (films => films.map(firm => {
            const sales_label: any = firm.querySelector('td:nth-child(2) > span.text')?.innerHTML;
            const profit_label: any = firm.querySelector('td:nth-child(10) > span.text')?.innerHTML;
            const date = firm.querySelector('td:nth-child(1) > a')?.innerHTML;
            return { date: date, sales: sales_label, profit: profit_label };
        })));
        list = list?.filter((value) => {
            return value.date != null;
        })
        if (list) {
            for (let item of list) {
                let sales = 0;
                // 兆､億､万を削除｡最後の文字列分整数倍する
                if (item.sales) {
                    const label = item.sales?.substring(item.sales.length - 1);
                    sales = Number(item.sales?.replace("億", '').replace('兆', '').replace('万', ''));
                    let diameter = (label == '万') ? 10000 : 100000000;
                    sales = sales * diameter;
                }
                this.finance.amount_of_sales_list.push({ date: item.date!, value: sales });
                this.finance.operating_profit_margin_list.push({ date: item.date!, value: Number(item.profit) || 0 });
            }
        }
    }

    // 自己資本比率の取得
    async downloadCapitalRate() {
        let list = await this.page?.$$eval('#container > main > div.csb.cc1 > div > div > section:nth-child(3) > div:nth-child(2) > table > tbody > tr', (films => films.map(firm => {
            const date = firm.querySelector('td:nth-child(1) > a')?.innerHTML;
            const value: any = firm.querySelector('td:nth-child(5) > span.text')?.innerHTML;
            return { date: date, value: value };
        })));
        list = list?.filter((value) => {
            return value.date != null;
        })
        if (list) {
            for (let item of list) {
                this.finance.capital_adequacy_rate_list.push({ date: item.date!, value: Number(item.value) || 0 });
            }
        }
    }



    // 営業キャッシュフロー 取得
    async downloadCashFlow() {
        let list = await this.page?.$$eval('#container > main > div.csb.cc1 > div > div > section:nth-child(4) > div:nth-child(2) > table > tbody > tr', (films => films.map(firm => {
            const date = firm.querySelector('td:nth-child(1) > a')?.innerHTML;
            const value: any = firm.querySelector('td:nth-child(2) > span.text')?.innerHTML;
            return { date: date, value: value };
        })));
        list = list?.filter((value) => {
            return value.date != null;
        });
        if (list) {
            for (let item of list) {
                let value = 0;
                // 兆､億､万を削除｡最後の文字列分整数倍する
                if (item.value) {
                    const label = item.value?.substring(item.value.length - 1);
                    value = Number(item.value?.replace("億", '').replace('兆', '').replace('万', ''));
                    let diameter = (label == '万') ? 10000 : 100000000;
                    value = value * diameter;
                }
                this.finance.cf_of_sales_activites_list.push({ date: item.date!, value: value || 0 });
            }
        }
    }

    // 現金など 取得
    async downloadCash() {
        let list = await this.page?.$$eval('#container > main > div.csb.cc1 > div > div > section:nth-child(4) > div:nth-child(2) > table > tbody > tr', (films => films.map(firm => {
            const date = firm.querySelector('td:nth-child(1) > a')?.innerHTML;
            const value: any = firm.querySelector('td:nth-child(7) > span.text')?.innerHTML;
            return { date: date, value: value };
        })));
        list = list?.filter((value) => {
            return value.date != null;
        });
        if (list) {
            for (let item of list) {
                let value = 0;
                // 兆､億､万を削除｡最後の文字列分整数倍する
                if (item.value) {
                    const label = item.value?.substring(item.value.length - 1);
                    value = Number(item.value?.replace("億", '').replace('兆', '').replace('万', ''));
                    let diameter = (label == '万') ? 10000 : 100000000;
                    value = value * diameter;
                }
                this.finance.cash_list.push({ date: item.date!, value: value || 0 });
            }
        }
    }



    async run() {
        try {
            await this.setup();
            // 決算ページへ遷移
            let link = await this.page?.$('#chb > dl > dd:nth-child(22) > ul > li:nth-child(2) > a');
            await Promise.all([
                this.page?.waitForNavigation({ waitUntil: ['load', 'networkidle2'] })
                , link?.click()
            ]);

            await Promise.all([
                this.downloadShareValue(),
                this.downloadSalesInfo(),
                this.downloadCapitalRate(),
                this.downloadCashFlow(),
                this.downloadCash(),
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            await this.close();
        }
    }
}