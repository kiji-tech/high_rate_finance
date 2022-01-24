import { Config } from "../../config/config";
import { Finance } from "../../model/finance";
import { Pages } from "../pages";

export class YahooFinance extends Pages {

    home_url: string = 'https://info.finance.yahoo.co.jp/ranking/?kd=8&mk=1&tm=d&vl=a';


    async getFinanceList() {
        return await this.page?.$$eval('#contents-body-bottom > div.rankdata > div.rankingTableWrapper > table > tbody > tr', (firms => firms.map(firm => {
            const code = firm.querySelector<HTMLLinkElement>('td:nth-child(2) > a');
            const share_rate = firm.querySelector('td:nth-child(9)');
            return {
                code: code?.innerHTML, link: code?.href, rate: share_rate?.innerHTML
            }
        })));
    }

    async getFinanceData() {
        // 各種データの取得
        let f: Finance = new Finance();
        f.code = await this.getInnerHTMLText('#industry > span');
        f.sector = await this.getInnerHTMLText('#industry > a');
        f.name = await this.getInnerHTMLText('#root > main > div > div > div.XuqDlHPN > div:nth-child(2) > section._1zZriTjI._2l2sDX5w > div._1nb3c4wQ > header > div.DL5lxuTC > h1');
        f.market = await this.getInnerHTMLText('#root > main > div > div > div.XuqDlHPN > div:nth-child(2) > section._1zZriTjI._2l2sDX5w > div._3fnAlHmn.ISpYsbjr > span');
        let value = await this.getInnerHTMLText('#detail > section._2Yx3YP9V._3v4W38Hq > div > ul > li:nth-child(1) > dl > dd > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span');
        f.value = Number(value?.replace(',', ''));
        let share_value = await this.getInnerHTMLText('#referenc > div > ul > li:nth-child(4) > dl > dd > a > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span');
        f.share_value = Number(share_value?.replace(',', ''));
        f.share_rate = Number(await this.getInnerHTMLText('#referenc > div > ul > li:nth-child(3) > dl > dd > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span._3rXWJKZF._11kV6f2G'));
        f.per = Number(await this.getInnerHTMLText('#referenc > div > ul > li:nth-child(5) > dl > dd > a > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span._3rXWJKZF._11kV6f2G'));
        f.pbr = Number(await this.getInnerHTMLText('#referenc > div > ul > li:nth-child(6) > dl > dd > a > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span._3rXWJKZF._11kV6f2G'));
        let eps = await this.getInnerHTMLText('#referenc > div > ul > li:nth-child(7) > dl > dd > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span._3rXWJKZF._11kV6f2G');
        f.eps = Number(eps?.replace(',', ''));
        return f;
    }


    async run() {
        try {
            await this.setup();

            let result: Finance[] = [];

            //  配当比率が3.00%を下回るまで
            while (true) {
                // 現在ページにある､配当利回りリストを取得
                let finance_list = await this.getFinanceList();
                if (finance_list) {
                    for (let finance of finance_list) {
                        console.log(`${JSON.stringify(finance)}`);
                        if (Number(finance.rate?.substring(0, finance.rate.length - 1)) < Config.getShareRateMinimum()) {
                            console.log('配当利回りが基準値を下回ったため終了します｡')
                            return result;
                        }

                        if (finance.link) {
                            // 銘柄ページへ遷移
                            await Promise.all([
                                this.page?.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
                                this.page?.goto(finance.link)
                            ]);

                            // PERが一定以上(割高)の場合はスキップ
                            const per = Number(await this.getInnerHTMLText('#referenc > div > ul > li:nth-child(5) > dl > dd > a > span._1fofaCjs._2aohzPlv._1DMRub9m > span > span._3rXWJKZF._11kV6f2G'));
                            if (per < Config.getCompPerValue())
                                result.push(await this.getFinanceData());

                            // 1つ前のページに戻る
                            await Promise.all([
                                this.page?.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
                                this.page?.goBack()
                            ]);
                            await this.wait(1000);
                        }
                    }
                    // 次へページがあれば実行する
                    let next_page = await this.page?.$('#contents-body-bottom > div.rankdata > ul > a:nth-last-child(1)');
                    let label = await (await (await next_page?.getProperty('textContent'))?.jsonValue<string>());
                    if (label && label.indexOf('次へ') >= 0) {
                        await Promise.all([
                            this.page?.waitForNavigation({ waitUntil: ['load', 'networkidle2'] }),
                            next_page?.click()
                        ]);
                    } else {
                        // ない場合は処理を終了する
                        return result;
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            await this.close();
        }
    }

}