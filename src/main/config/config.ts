require('dotenv').config();
export class Config {

    static config = {
        'share_rate_minimum': Number(process.env.SHARE_RATE_MINIMUM) || 4.00,
        'finance_list_path': process.env.FINANCE_LIST_PATH || 'output/finance-list.json',
        'company_file_path': process.env.COMPANY_FILE_PATH || 'output/company/',
        'complete_file_path': process.env.COMPLETE_FILE_PATH || 'output/complete/',
        'analyze_term_n': process.env.ANALYZE_TERM_N || 5,
        'analyze_term_m': process.env.ANALYZE_TERM_M || 10,
        'comp_per_value': process.env.COMP_PER_VALUE || 15,

    }

    static getShareRateMinimum(): number {
        return this.config['share_rate_minimum'];
    }

    static getFinanceListPath(): string {
        return this.config['finance_list_path'];
    }

    static getCompanyFilePath(): string {
        return this.config['company_file_path'];
    }

    static getCompleteFilePath(): string {
        return this.config['complete_file_path'];
    }

    static getAnalyzeTermN(): number {
        return Number(this.config['analyze_term_n']);
    }

    static getAnalyzeTermM(): number {
        return Number(this.config['analyze_term_m']);
    }

    static getCompPerValue(): number {
        return Number(this.config['comp_per_value']);
    }
}