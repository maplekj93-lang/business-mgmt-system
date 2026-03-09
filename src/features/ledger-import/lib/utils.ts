/**
 * 동일 결제건 식별을 위한 고유 해시 생성.
 *
 * ⚠️ 설계 규칙:
 *   - date는 반드시 YYYY-MM-DD 로 정규화 후 입력
 *   - amount는 반드시 숫자형(number)으로 입력 (문자열 금액 금지)
 *   - description은 trim() 후 입력
 *   - 구분자로 '|' 사용 (설명에 '_'가 포함될 수 있어 '_' 사용 금지)
 */
export async function generateImportHash(
    date: string,       // YYYY-MM-DD
    assetId: string,    // UUID
    amount: number,
    description: string
): Promise<string> {
    const raw = `${date}|${assetId}|${amount}|${description.trim()}`;

    // Web Crypto API로 SHA-256 해시 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 권장 엑셀 다운로드 시작일 계산.
 *
 * 로직:
 *   1. 기준일 = 마지막 거래일 (없으면 오늘 - 30일 = 첫 사용자 기본값)
 *   2. 권장 시작일 = 기준일 - SAFETY_OVERLAP_DAYS (기본 3일)
 *      → 3일 겹쳐 받아도 import_hash로 자동 중복 제거됨
 *
 * 주의: 신용카드는 오늘 날짜를 제외하고 어제까지만 권장 (pending 처리)
 *   → 호출부에서 asset_type === 'card' 일 때 endDate를 yesterday로 제한할 것
 */
const SAFETY_OVERLAP_DAYS = 3;

export function calculateRecommendedDate(
    lastTransactionDate: string | null,
    _lastSyncedAt: string | null  // 현재는 표시용으로만 사용, 추후 로직 확장 가능
): string {
    const today = new Date();

    if (!lastTransactionDate) {
        // 한 번도 임포트 안 한 경우: 30일치 권장
        const defaultStart = new Date(today);
        defaultStart.setDate(today.getDate() - 30);
        return formatDateToISO(defaultStart);
    }

    const lastTxDate = new Date(lastTransactionDate);
    const recommended = new Date(lastTxDate);
    recommended.setDate(lastTxDate.getDate() - SAFETY_OVERLAP_DAYS);

    return formatDateToISO(recommended);
}

/** Date → "YYYY-MM-DD" 문자열 변환 */
function formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0];
}

/** "YYYY-MM-DD" → "YYYY. MM. DD" 한국 표시 포맷 */
export function formatDateKo(isoDate: string | null): string {
    if (!isoDate) return '없음';
    const [y, m, d] = isoDate.split('-');
    return `${y}. ${m}. ${d}`;
}

/** ISO timestamp → "YYYY. MM. DD HH:mm" 한국 표시 포맷 */
export function formatDateTimeKo(isoTimestamp: string | null): string {
    if (!isoTimestamp) return '기록 없음';
    const dt = new Date(isoTimestamp);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}. ${pad(dt.getMonth() + 1)}. ${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

/**
 * 배열을 지정된 크기로 분할.
 * 수백 건 일괄 upsert 시 Supabase 타임아웃 방지용.
 *
 * @example
 * chunkArray(rows, 150)  // 150건씩 분할
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * 은행/카드사별 엑셀 내역 다운로드 페이지 URL.
 * asset.name 이 아래 key와 매핑되면 버튼 표시.
 * 매핑 안 되면 버튼 숨김 처리.
 */
export const BANK_LINKS: Record<string, { label: string; url: string }> = {
    // 통장
    '농협': { label: '농협 인터넷뱅킹', url: 'https://www.nonghyup.com' },
    '신한': { label: '신한은행', url: 'https://www.shinhan.com' },
    '국민': { label: 'KB국민은행', url: 'https://www.kbstar.com' },
    '카카오뱅크': { label: '카카오뱅크', url: 'https://www.kakaobank.com' },
    '토스뱅크': { label: '토스뱅크', url: 'https://www.tossbank.com' },
    // 카드
    '신한카드': { label: '신한카드 파트너스', url: 'https://www.shinhancard.com' },
    '현대카드': { label: '현대카드', url: 'https://www.hyundaicard.com' },
    '삼성카드': { label: '삼성카드', url: 'https://www.samsungcard.com' },
    '롯데카드': { label: '롯데카드', url: 'https://www.lottecard.co.kr' },
};

/** asset_name에서 뱅킹 URL 찾기. 없으면 null 반환 */
export function getBankLink(assetName: string): { label: string; url: string } | null {
    const key = Object.keys(BANK_LINKS).find(k => assetName.includes(k));
    return key ? BANK_LINKS[key] : null;
}
