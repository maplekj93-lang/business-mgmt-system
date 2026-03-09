/**
 * FX Rate Utility
 * USD/KRW 환율을 exchangerate-api.com에서 실시간으로 가져옴.
 * API 실패 시 보수적 fallback(1440원) 사용.
 */

// 보수적 fallback 환율 (요즘 환율이 1400 이하로 안 내려가는 점 반영)
export const FX_FALLBACK_RATES: Record<string, number> = {
    USD: 1440,
    EUR: 1580,
    JPY: 9.8,    // 1 JPY → KRW
    GBP: 1850,
    CNY: 200,
};

export interface FxRates {
    rates: Record<string, number>;
    source: 'api' | 'fallback';
    fetchedAt: string; // ISO timestamp
}

let _cachedRates: FxRates | null = null;
let _cacheExpiry = 0; // Unix ms

/**
 * USD 기준 환율을 가져옵니다.
 * - 세션 내 5분 캐시 (중복 API 호출 방지)
 * - API 실패 시 FX_FALLBACK_RATES 반환
 */
export async function fetchFxRates(): Promise<FxRates> {
    const now = Date.now();

    // 캐시 유효 시 즉시 반환
    if (_cachedRates && now < _cacheExpiry) {
        return _cachedRates;
    }

    try {
        // exchangerate-api.com free tier (no key needed)
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
            signal: AbortSignal.timeout(5000), // 5초 타임아웃
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // data.rates = { KRW: 1382.5, EUR: 0.92, ... }
        const krwRate = data.rates?.KRW;
        if (!krwRate || typeof krwRate !== 'number') {
            throw new Error('KRW rate missing from API response');
        }

        const result: FxRates = {
            rates: { USD: krwRate, ...buildOtherRates(data.rates) },
            source: 'api',
            fetchedAt: new Date().toISOString(),
        };

        _cachedRates = result;
        _cacheExpiry = now + 5 * 60 * 1000; // 5분 캐시

        console.log(`[FX] 실시간 환율 (USD→KRW): ${krwRate}원`);
        return result;

    } catch (err) {
        console.warn('[FX] API 오류, fallback 환율 사용:', err);

        const result: FxRates = {
            rates: { ...FX_FALLBACK_RATES },
            source: 'fallback',
            fetchedAt: new Date().toISOString(),
        };

        // fallback은 짧게만 캐시 (30초)
        _cachedRates = result;
        _cacheExpiry = now + 30 * 1000;

        return result;
    }
}

/** API 응답에서 우리가 필요한 주요 통화만 추출 (USD 기준) */
function buildOtherRates(apiRates: Record<string, number>): Partial<Record<string, number>> {
    const currencies = ['EUR', 'JPY', 'GBP', 'CNY'];
    const result: Record<string, number> = {};

    for (const currency of currencies) {
        const rateFromUsd = apiRates[currency]; // e.g. EUR = 0.92 (1 USD = 0.92 EUR)
        const krwPerUsd = apiRates['KRW'] ?? FX_FALLBACK_RATES.USD;

        if (rateFromUsd && rateFromUsd > 0) {
            // 1 currency = krwPerUsd / rateFromUsd KRW
            result[currency] = krwPerUsd / rateFromUsd;
        } else {
            result[currency] = FX_FALLBACK_RATES[currency] ?? 0;
        }
    }

    return result;
}

/** 단일 환율 조회 편의함수 */
export async function getKrwRate(currency: string): Promise<number> {
    const fx = await fetchFxRates();
    return fx.rates[currency.toUpperCase()] ?? FX_FALLBACK_RATES[currency.toUpperCase()] ?? 1440;
}
