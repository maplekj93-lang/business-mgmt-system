
import { BankProfile } from "../types";

export const hyundaiCardProfile: BankProfile = {
    name: "Hyundai Card",
    // 1. 이용내역 포맷: ["현대카드", "이용가맹점", "결제후잔액"]
    // 2. 승인내역 포맷: ["승인일", "가맹점명", "승인금액", "이용구분", "승인번호", "카드종류"]
    keywords: ["승인번호", "가맹점명", "카드종류"], 
    mapping: {
        date: ["이용일자", "승인일"],
        time: ["승인시각", "이용시간"],
        amount: ["이용금액", "승인금액"],
        merchant: ["이용가맹점", "가맹점명"],
        status: ["상태", "승인구분"],
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
