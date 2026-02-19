
import { BankProfile } from "../types";

export const kakaoBankProfile: BankProfile = {
    name: "Kakao Bank",
    keywords: ["거래 후 잔액", "거래금액", "거래일시"],
    mapping: {
        date: "거래일시", // "2025.03.01 03:22:08" format
        amount: "거래금액",
        balance: ["거래후 잔액", "거래 후 잔액"],
        merchant: ["거래내용", "내용"], // "내용" contains the actual merchant/description
        type: "구분", // "입금" or "출금"
    },
    transforms: {
        parseAmount: (val: any) => {
            // Kakao Bank sample: "-2,037,273" or "1,337,175"
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/,/g, ''));
        }
    }
};
