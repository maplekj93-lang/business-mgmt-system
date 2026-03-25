import { createClient } from '@/shared/api/supabase/client';
import { KakaoPayRow } from './parser';

export interface MatchResult {
  transactionId: string;
  kakaoPayRow: KakaoPayRow;
  confidence: number; // 0 to 100
}

/**
 * 카카오페이 매칭 엔진
 */
export const matchKakaoTransactions = async (
  unmatchedTransactions: any[],
  kakaoPayRows: KakaoPayRow[]
): Promise<MatchResult[]> => {
  const results: MatchResult[] = [];

  for (const tx of unmatchedTransactions) {
    // '카카오'가 포함된 모든 적요를 대상으로 하되, 타행 이체 등 오탐지 방지를 위해 '뱅크'는 제외
    const desc = tx.description || '';
    const isKakaoName = desc.includes('카카오') && !desc.includes('뱅크');
    
    if (!isKakaoName) continue;

    const matches = kakaoPayRows.filter((row) => {
      const matchAmount = Math.abs(row.amount) === Math.abs(tx.amount);
      
      // DB Date: "2026-02-14"
      // Kakao Row Date: "2026.02.14" -> "2026-02-14" 변환 필요 (Invalid Date 방지)
      const formattedRowDate = row.date.replace(/\./g, '-');
      
      const txDate = new Date(tx.date);
      const rowDate = new Date(formattedRowDate);

      // 1. 시간(Time)에 의한 날짜 차이 오차 방지를 위해 UTC 자정 기준으로 통일
      const txZero = new Date(Date.UTC(txDate.getFullYear(), txDate.getMonth(), txDate.getDate()));
      const rowZero = new Date(Date.UTC(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate()));
      
      const diffTime = Math.abs(txZero.getTime() - rowZero.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      return matchAmount && diffDays <= 1;
    });

    if (matches.length === 1) {
      results.push({
        transactionId: tx.id,
        kakaoPayRow: matches[0],
        confidence: 100,
      });
    } else if (matches.length > 1) {
      results.push({
        transactionId: tx.id,
        kakaoPayRow: matches[0],
        confidence: 50,
      });
    }
  }

  return results;
};

/**
 * 매칭된 내역 DB 저장
 */
export const saveKakaoMappings = async (matches: MatchResult[]) => {
  const supabase = createClient();
  
  // @ts-ignore - 새 테이블 타입이 아직 반영되지 않음
  const { error } = await supabase
    .from('kakao_pay_mappings' as any)
    .insert(matches.map((m) => ({
      source_transaction_id: m.transactionId,
      kakao_merchant_name: m.kakaoPayRow.merchant,
      amount: m.kakaoPayRow.amount,
      kakao_type: m.kakaoPayRow.type,
      matched_date: m.kakaoPayRow.date,
    })));

  if (error) throw error;
};
