export class Finance {
    code: string | undefined = '';
    name: string | undefined = '';
    sector: string | undefined = '';
    market: string | undefined = '';
    value: number | undefined = 0;
    share_value: number | undefined = 0;
    share_rate: number | undefined = 0;
    per: number | undefined = 0;
    pbr: number | undefined = 0;
    eps: number | undefined = 0;

    // 1株配当金
    share_value_list: { date: string, value: number }[] = [];

    // 売上高
    amount_of_sales_list: { date: string, value: number }[] = [];

    // 営業利益率
    operating_profit_margin_list: { date: string, value: number }[] = [];

    // 自己資本比率
    capital_adequacy_rate_list: { date: string, value: number }[] = [];

    // 営業活動のCF
    cf_of_sales_activites_list: { date: string, value: number }[] = [];

    // 現金など
    cash_list: { date: string, value: number }[] = [];
}