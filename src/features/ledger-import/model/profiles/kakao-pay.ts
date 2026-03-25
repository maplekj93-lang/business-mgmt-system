import { BankProfile } from "../types";

export const kakaoPayProfile: BankProfile = {
  name: '카카오페이(거래내역서)',
  keywords: ['거래일시', '거래구분', '거래금액', '결제 정보'],
  mapping: {
    date: '거래일시',
    amount: '거래금액',
    type: '거래구분',
    merchant: ['계좌 정보 / 결제 정보', '결제 정보', '계좌정보/결제정보'],
  },
  transforms: {
    parseAmount: (val: any) => {
        // "1,000" -> 1000, 콤마 및 통화 표시 제거
        if (typeof val === 'number') return val;
        return Math.abs(Number(String(val || '0').replace(/[^0-9.-]+/g, '')));
    }
  }
};
