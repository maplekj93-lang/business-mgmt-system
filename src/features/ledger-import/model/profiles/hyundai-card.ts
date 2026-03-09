
import { BankProfile } from "../types";

export const hyundaiCardProfile: BankProfile = {
    name: "Hyundai Card",
    keywords: ["현대카드", "이용가맹점", "결제후잔액"],
    mapping: {
        date: "이용일자",
        time: "이용시간",
        amount: "이용금액",
        merchant: "이용가맹점",
        status: "상태",
        authCode: "승인번호",
        cardNo: "카드번호",
    },
    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            return parseFloat(String(val).replace(/,/g, ''));
        }
    }
};
