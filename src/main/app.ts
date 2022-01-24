import { Config } from "./config/config";
import { JRBank } from "./pages/jr_bank/jr_bank";
import { YahooFinance } from "./pages/yahoo_finance/yahoo_finance";
require('dotenv').config();
import * as fs from 'fs';
import path from "path";
import { Finance } from "./model/finance";

console.dir(Config.config);


var runYahooFinance = async () => {
    // YahooFinanceからデータを取得
    console.log('=== YahooFinance get high rate finance list ===');
    let yf = new YahooFinance();
    let result = await yf.run();
    result = result?.sort((a, b) => Number(a.code) - Number(b.code));
    console.log(result);
    await fs.writeFileSync(Config.getFinanceListPath(), JSON.stringify(result, null, '    '));
    console.log('=== YahooFinance get high rate finance list end ===');

}

var runJRBank = async () => {
    // JR Bankからデータを取得
    console.log('=== JR Bank get finance data ===');
    let file = await fs.readFileSync(Config.getFinanceListPath(), 'utf-8');
    let result;
    if (file) {
        result = JSON.parse(file);
    }

    if (result) {
        for (let finance of result) {
            if (!finance.name) continue;
            finance.share_value_list = [];
            console.log(`${finance.code} ${finance.name} start`);
            let jr_bank = new JRBank(finance);
            await jr_bank.run();
            await fs.writeFileSync(Config.getCompanyFilePath() + finance.code + ".json", JSON.stringify(finance, null, '    '));
            console.log(`${finance.code} ${finance.name} end`);
        }
    }
    console.log('=== JR Bank get finance data end ===');
}

var runAnalyze = async () => {
    // === 銘柄を分析する ===
    console.log('=== JR Bank Data Analyze start ===');
    return new Promise((resolve, reject) => {
        fs.readdir(Config.getCompanyFilePath(), async (err, file_list) => {
            if (err) {
                console.error('analyzed read dir error.');
                console.error(err);

                resolve(null);
            }

            for (const file of file_list) {
                fs.stat(path.join(Config.getCompanyFilePath(), file), async (err, status) => {
                    if (err) {
                        console.error('analyzed read file error.');
                        console.error(err);

                        resolve(null);
                    }

                    // file => json 
                    const r_file = await fs.readFileSync(path.join(Config.getCompanyFilePath(), file), 'utf-8');
                    let data: Finance;
                    if (r_file) {
                        data = JSON.parse(r_file);
                    } else {
                        console.error('analyzed read file error .');
                        resolve(null);
                        return;
                    }
                    const result = await analyze(data, Config.getAnalyzeTermN(), Config.getAnalyzeTermM());

                    if (result) {
                        console.log(`${data.code} ${data.name} => complete`);
                        // completeフォルダに移動
                        fs.rename(path.join(Config.getCompanyFilePath(), file), path.join(Config.getCompleteFilePath(), file), (err) => {
                            if (err) {
                                console.error(`analyzed file remove error.`);
                                console.error(err);
                            }
                        });;

                    } else {
                        console.log(`${data.code} ${data.name} => non`);
                    }
                });
            }
            console.log('=== JR Bank Data Analyze end ===');
        });
    });
}


var analyze = async (data: Finance, n: number = 3, m: number = 10) => {
    if (data.amount_of_sales_list.length <= Math.max(n, m)) {
        console.warn(`データ数が不足しているためスキップ.`);
        return false;
    }
    // 1株配当金 直近n回のデータで右肩上がり
    for (let idx: number = data.share_value_list.length - n; idx < data.share_value_list.length; idx++) {
        if ((data.share_value_list[idx - 1].value - data.share_value_list[idx].value) > 0) {
            return false;
        }
    }
    // 売上高 直近n回のデータで右肩上がり
    for (let idx: number = data.amount_of_sales_list.length - n; idx < data.amount_of_sales_list.length; idx++) {
        if ((data.amount_of_sales_list[idx - 1].value - data.amount_of_sales_list[idx].value) > 0) {
            return false;
        }
    }
    // 営業利益率 直近n回のデータがすべて7%以上
    for (let idx: number = data.operating_profit_margin_list.length - n; idx < data.operating_profit_margin_list.length; idx++) {
        if (data.operating_profit_margin_list[idx].value < 7) {
            return false;
        }
    }
    // 自己資本比率 直近n回のデータがすべて40%以上
    for (let idx: number = data.capital_adequacy_rate_list.length - n; idx < data.capital_adequacy_rate_list.length; idx++) {
        if (data.capital_adequacy_rate_list[idx].value < 40) {
            return false;
        }
    }
    // 営業活動のCF 直近n回のデータがすべて黒字
    for (let idx: number = data.cf_of_sales_activites_list.length - m; idx < data.cf_of_sales_activites_list.length; idx++) {
        if (data.cf_of_sales_activites_list[idx].value < 0) {
            return false;
        }
    }
    // 現金など 直近n回のデータで右肩上がり
    for (let idx: number = data.cash_list.length - n; idx < data.cash_list.length; idx++) {
        if ((data.cash_list[idx - 1].value - data.cash_list[idx].value) > 0) {
            return false;
        }
    }
    return true;

}


(async () => {

    if (process.argv.length < 2) process.exit(1);



    switch (process.argv[2]) {
        case 'yf' || 'YF':
            await runYahooFinance();
            break;
        case 'jr' || 'JR':
            await runJRBank();
            break;
        case 'analyze' || 'ANALYZE':
            await runAnalyze();
            break;
        case 'all' || 'ALL':
        default:
            await runYahooFinance();
            await runJRBank();
            await runAnalyze();
            break;
    }



})();
