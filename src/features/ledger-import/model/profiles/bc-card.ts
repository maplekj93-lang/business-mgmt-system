
import { BankProfile } from "../types";

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
    // "이용카드"(카드 suffix 컬럼)와 "가맹점명"은 BC카드 고유
    // 이용금액 / 승인금액 둘 다 커버하기 위해 이용금액 키워드 제거
    keywords: ["이용카드", "가맹점명"],
    mapping: {
        // 신포맷: "승인\n일시" (개행 포함) / 구포맷: "이용일자" or "이용일시"
        date: ["승인\n일시", "이용일자", "이용일시"],
        time: "이용시간",    // 구포맷에만 존재, 없으면 무시
        // 신포맷: "승인금액" / 구포맷: "이용금액(원)" or "이용금액"
        amount: ["승인금액", "이용금액(원)", "이용금액"],
        merchant: "가맹점명",
        // 신포맷: "접수\n현황" / 구포맷: "매출구분" or "승인상태"
        status: ["접수\n현황", "매출구분", "승인상태"],
        authCode: "승인번호",
        // 이용카드 suffix (A010, A429 등) → source_raw_data.card_no 에 저장
        cardNo: "이용카드",
    },
    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
            return parseFloat(str) || 0;
        },
        parseStatus: (val: any) => {
            const s = String(val ?? '').replace(/[\n\r]/g, '').trim();
            // 전체 취소: 거래 자체가 없던 일 → 임포트 스킵
            if (s === '취소') return 'skip';
            // 부분취소: 실제 지출 발생 (취소분 제외한 금액) → 정상 지출 처리
            // (정확한 순금액 계산은 향후 개선, 현재는 원금액 그대로)
            return 'approved';
        }
    }
};
