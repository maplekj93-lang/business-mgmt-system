
import { BankProfile } from "../types";

export const nelnaProfile: BankProfile = {
    name: "Nelna Ledger",
    keywords: ["대분류", "소분류"],
    mapping: {
        date: "날짜",
        amount: ["금액"],
        merchant: ["내용", "내역"],
        type: ["구분"],
        categoryMain: ["대분류"],
        categorySub: ["소분류"],
        depositAccount: ["입금계좌"],
        withdrawalAccount: ["출금계좌"],
    },
    transforms: {
        parseAmount: (val: unknown) => {
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/,/g, ''));
        }
    }
};
