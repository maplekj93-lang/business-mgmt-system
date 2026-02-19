
import { BankProfile } from "../types";

export const bcCardProfile: BankProfile = {
    name: "BC/Woori Card",
    // Keywords: Support both "Bill" (매출구분, 승인번호) and "Approval" (이용일시, 매입상태) formats
    keywords: ["이용카드", "가맹점명", "이용금액"],
    mapping: {
        date: ["이용일자", "이용일시"], // '이용일시' has YYYY.MM.DD\nHH:mm:ss
        time: "이용시간",
        amount: ["이용금액(원)", "이용금액"],
        merchant: "가맹점명",
        status: ["매출구분", "승인상태"], // '접수' or '취소' - '승인상태' is better than '매입상태'
        authCode: "승인번호", // Might be missing in Approval list?
    },
    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            const str = String(val).replace(/,/g, '');
            return parseFloat(str);
        },
        parseStatus: (val: any) => {
            const s = String(val);
            if (s.includes("취소")) return "cancelled";
            return "approved";
        }
    }
};
