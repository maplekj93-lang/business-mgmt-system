import { describe, it, expect } from 'vitest';
import { calculateVat, calculateNetSupply, calculateProjectNetProfit, calculateProfitMargin } from './currency';

describe('currency utilities (decimal.js)', () => {
    describe('calculateVat', () => {
        it('부가세 10%를 정확히 계산해야 함 (Gross 110,000 -> VAT 10,000)', () => {
            expect(calculateVat(110000)).toBe(10000);
        });

        it('소수점 발생 시 반올림해야 함 (Gross 10,000 -> VAT 909)', () => {
            // 10,000 / 11 = 909.0909... -> 909
            expect(calculateVat(10000)).toBe(909);
        });
    });

    describe('calculateNetSupply', () => {
        it('총액에서 부가세를 뺀 공급가액을 리턴해야 함', () => {
            expect(calculateNetSupply(110000)).toBe(100000);
        });
    });

    describe('calculateProjectNetProfit', () => {
        it('총매출 - 부가세 - 인건비 - 경비 = 순이익을 정확히 계산해야 함', () => {
            const result = calculateProjectNetProfit({
                totalRevenue: 1100000, // 공급가 1,000,000, VAT 100,000
                crewLabor: 300000,
                siteExpenses: 100000
            });
            // 1,000,000 - 300,000 - 100,000 = 600,000
            expect(result).toBe(600000);
        });
    });

    describe('calculateProfitMargin', () => {
        it('수익률을 소수점 2자리까지 계산해야 함', () => {
            // 매출 1,000,000, 수익 300,000 -> 30.00%
            expect(calculateProfitMargin(1000000, 300000)).toBe(30);
            // 매출 1,000,000, 수익 333,333 -> 33.33%
            expect(calculateProfitMargin(1000000, 333333)).toBe(33.33);
        });

        it('매출이 0인 경우 0을 리턴해야 함', () => {
            expect(calculateProfitMargin(0, 500000)).toBe(0);
        });
    });
});
