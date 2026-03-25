import Decimal from 'decimal.js';

/**
 * 정밀한 부가세(10%) 계산
 * @param amountGross 총액 (부가세 포함)
 * @returns 부가세 금액
 */
export function calculateVat(amountGross: number): number {
    return new Decimal(amountGross).times(0.1).dividedBy(1.1).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * 부가세를 제외한 공급가액 계산
 * @param amountGross 총액
 * @returns 공급가액
 */
export function calculateNetSupply(amountGross: number): number {
    return new Decimal(amountGross).minus(calculateVat(amountGross)).toNumber();
}

/**
 * 실질 프로젝트 순이익 계산
 * 로직: 총매출 - 부가세 - 인건비 - 현장경비
 */
export function calculateProjectNetProfit(params: {
    totalRevenue: number;
    crewLabor: number;
    siteExpenses: number;
}): number {
    const netRevenue = calculateNetSupply(params.totalRevenue);
    return new Decimal(netRevenue)
        .minus(params.crewLabor)
        .minus(params.siteExpenses)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber();
}

/**
 * 수익률(%) 계산
 */
export function calculateProfitMargin(revenue: number, profit: number): number {
    if (revenue === 0) return 0;
    return new Decimal(profit).dividedBy(revenue).times(100).toDecimalPlaces(2).toNumber();
}

/**
 * 통화 포맷팅 (KRW)
 */
export function formatKrw(amount: number): string {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
    }).format(amount);
}
