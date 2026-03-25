import { ValidatedTransaction } from "@/features/ledger-import/model/types";

export interface MatchResult {
    transaction: ValidatedTransaction;
    isSuggested: boolean;
    suggestionType?: 'transfer' | 'merchant_refinement' | 'ai_category';
    confidence: number;
    metadata?: Record<string, any>;
}

export class MatchingEngine {
    private static TRANSFER_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

    /**
     * 정규화: 지점명 및 불필요한 공백 제거
     */
    static normalizeMerchantName(name: string): string {
        if (!name) return "";
        
        return name
            .replace(/\s+/g, "") // 공백 제거
            .replace(/(점|지점|마포|분당|강남|역삼|본점|가산|구로)$/, "") // 일반적인 지점 접미어 제거 (단순 예시)
            .toUpperCase();
    }

    /**
     * 복합 거래(이체-결제) 식별 및 매칭
     * @param transactions 이번 배치에 포함된 거래 목록
     */
    static identifyTransfers(transactions: ValidatedTransaction[]): MatchResult[] {
        const results: MatchResult[] = transactions.map(tx => ({
            transaction: tx,
            isSuggested: false,
            confidence: 1.0
        }));

        // 1. Withdrawal/Deposit 쌍 찾기 (금액이 같고 시간이 5분 이내인 경우)
        for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
                const txA = results[i].transaction;
                const txB = results[j].transaction;

                // 이미 다른 매칭이 된 경우 스킵
                if (results[i].isSuggested || results[j].isSuggested) continue;

                const timeA = new Date(txA.date).getTime();
                const timeB = new Date(txB.date).getTime();
                const timeDiff = Math.abs(timeA - timeB);
                const amountMatch = Math.abs(txA.amount) === Math.abs(txB.amount);

                // 부호가 반대이고 금액이 같으며 시간차가 5분 이내인 경우
                if (amountMatch && timeDiff <= this.TRANSFER_WINDOW_MS && (txA.amount * txB.amount < 0)) {
                    // 이체로 제안
                    results[i].isSuggested = true;
                    results[i].suggestionType = 'transfer';
                    results[i].confidence = 0.95;
                    results[i].metadata = { matchedWith: j, reason: "Time/Amount similarity" };

                    results[j].isSuggested = true;
                    results[j].suggestionType = 'transfer';
                    results[j].confidence = 0.95;
                    results[j].metadata = { matchedWith: i, reason: "Time/Amount similarity" };
                }
            }
        }

        return results;
    }

    /**
     * 가맹점명 정규화 및 상위 태그 제안 (Heuristic)
     */
    static refineMerchants(matches: MatchResult[]): MatchResult[] {
        return matches.map(match => {
            const description = match.transaction.description || "";
            const normalized = this.normalizeMerchantName(description);
            
            // 이미 이체로 분류된 경우 패스
            if (match.suggestionType === 'transfer') return match;

            // 특정 키워드 기반 정규화 예시
            if (normalized.includes("CU") || normalized.includes("GS25") || normalized.includes("SEVENELEVEN")) {
                return {
                    ...match,
                    isSuggested: true,
                    suggestionType: 'merchant_refinement',
                    confidence: 0.9,
                    transaction: {
                        ...match.transaction,
                        normalized_name: "편의점",
                        categoryRaw: "식비 > 간식"
                    }
                };
            }

            if (normalized.includes("COUPANG") || normalized.includes("쿠팡")) {
                return {
                    ...match,
                    isSuggested: true,
                    suggestionType: 'ai_category',
                    confidence: 0.7, // 쿠팡은 모호하므로 확신도 낮춤 -> Action Center 확인 유도
                    transaction: {
                        ...match.transaction,
                        normalized_name: "쿠팡"
                    }
                };
            }

            return match;
        });
    }

    /**
     * 전체 프로세스 통합 실행
     */
    static processBatch(transactions: ValidatedTransaction[]): MatchResult[] {
        const withTransfers = this.identifyTransfers(transactions);
        return this.refineMerchants(withTransfers);
    }
}
