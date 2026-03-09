
import { BankProfile } from "../types";

export const samsungCardProfile: BankProfile = {
    name: "Samsung Card",
    keywords: ["카드번호", "본인가족구분", "승인번호"],
    mapping: {
        date: "승인일자",
        time: "승인시각",
        amount: "승인금액(원)",
        merchant: "가맹점명",
        status: "취소여부",
        authCode: "승인번호",
        cardNo: "카드번호",
    },
    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val.replace(/,/g, ''));
            return 0;
        },
        parseStatus: (val: any) => {
            // "전체취소" -> cancelled
            if (String(val).includes("취소")) return "cancelled";
            return "approved";
        }
    }
};
