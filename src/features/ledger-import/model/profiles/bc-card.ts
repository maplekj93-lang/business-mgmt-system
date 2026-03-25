
import { BankProfile, ValidatedTransaction } from "../types";

/**
 * BC카드 승인내역 (Approve*.xls) 포맷
 *
 * 특징:
 *  - 헤더에 개행(\n)과 탭(\t) 포함 (예: "승인\n일시", "승인금액\t\t\t...")
 *  - 날짜+시간이 같은 셀에 개행으로 구분 ("2026.03.05\n18:47:44")
 *  - 이용카드 컬럼에 카드 suffix (A010, A429 등)
 *  - 접수현황: "접수" | "-" | "취소" | "부분\n취소"
 *  - 이전 포맷(이용일자/이용금액) 도 같은 프로필로 커버
 */
export const bcCardProfile: BankProfile = {
    name: "BC Card",
    keywords: ["승인번호", "가맹점명", "접수현황"],
    mapping: {
        date: ["승인일시", "이용일자", "승인일"],
        time: ["이용시간", "승인시각"],
        amount: ["승인금액", "이용금액(원)", "이용금액"],
        merchant: "가맹점명",
        status: ["접수현황", "매출구분", "승인상태"],
        authCode: "승인번호",
        cardNo: "이용카드",
    },
    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
            return parseFloat(str) || 0;
        },
        parseStatus: (val: any) => {
            const s = String(val ?? '').replace(/\s/g, '').trim();
            if (s === '취소' || s === '부분취소') return 'skip';
            return 'approved';
        },
        // [NEW] 후처리: 카드 번호에 따른 사용자 식별
        postProcess: (tx: ValidatedTransaction) => {
            const cardNo = tx.source_raw_data?.card_no;
            if (cardNo && tx.source_raw_data) {
                if (cardNo.includes('A429')) {
                    tx.source_raw_data.owner = "내 명의";
                } else if (cardNo.includes('A010')) {
                    tx.source_raw_data.owner = "아내 명의";
                }
            }
            return tx;
        }
    }
};
