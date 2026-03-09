import { BankProfile } from "../types";

/**
 * 삼성카드 해외승인 이용내역 프로파일
 * 삼성카드 앱/홈페이지 > 이용내역 > 해외이용 탭에서 다운로드
 *
 * 시트명: ■ 해외이용내역
 * 컬럼: 카드번호 | 취소구분 | 본인가족구분 | 승인일자 | 승인시각 | 업종 | 가맹점명
 *      | 승인금액(USD) | 현지이용금액 | 현지거래통화 | 승인번호
 *
 * 환율 처리:
 * - 현지거래통화 = KRW  → 현지이용금액 그대로 사용 (정확)
 * - 현지거래통화 = USD  → 승인금액(USD) × 환율 (근사치, source_raw_data에 원본 보존)
 * - 기타 통화 (EUR 등) → 동일하게 근사치 처리
 */
export const samsungCardOverseasProfile: BankProfile = {
    name: "Samsung Card (해외)",

    // "승인금액(USD)"와 "현지거래통화"가 있으면 해외 파일 — 국내 파일과 명확히 구분됨
    keywords: ["승인금액(usd)", "현지거래통화"],

    mapping: {
        date:          "승인일자",
        time:          "승인시각",
        amount:        "승인금액(USD)",      // USD 기준 승인금액 (fallback)
        merchant:      "가맹점명",
        status:        "취소구분",
        authCode:      "승인번호",
        cardNo:        "카드번호",
        localAmount:   "현지이용금액",       // 현지 실 결제금액
        localCurrency: "현지거래통화",       // USD / KRW / EUR / JPY ...
    },

    transforms: {
        parseAmount: (val: any) => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') return parseFloat(val.replace(/,/g, '')) || 0;
            return 0;
        },
        parseStatus: (val: any) => {
            const s = String(val || '').trim();
            if (s && s !== '') return 'cancelled'; // 취소구분이 채워져 있으면 취소
            return 'approved';
        },
    },
};
