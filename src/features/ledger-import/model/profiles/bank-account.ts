
import { BankProfile } from "../types";

export const bankAccountProfile: BankProfile = {
    name: "기본 은행 계좌",
    keywords: ["거래일시", "출금", "입금", "거래후 잔액"],
    mapping: {
        date: "거래일시",
        // time: merged into date
        amount: [], // Not used for this profile
        income: "입금",
        expense: "출금",
        balance: "거래후 잔액",
        merchant: "거래내용",
    },
    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/,/g, ''));
        }
    }
};
