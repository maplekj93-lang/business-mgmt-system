import { BankProfile, ValidatedTransaction, DetectedFile } from "./types";

export * from "./types";

/**
 * Registry of all available bank profiles
 */
import {
    samsungCardProfile,
    samsungCardOverseasProfile,
    bcCardProfile,
    hyundaiCardProfile,
    kakaoBankProfile,
    bankAccountProfile,
    nelnaProfile,
    kakaoPayProfile,
    ibkAccountProfile
} from './profiles';

export const BANK_PROFILES: BankProfile[] = [
    // ⚠️ 해외 프로파일 및 특수 매퍼 프로파일을 먼저 등록
    samsungCardOverseasProfile,
    kakaoPayProfile, // 카카오페이 매퍼용 프로파일 우선순위 상향
    ibkAccountProfile, // IBK 전용 프로파일 우선순위 상향
    bcCardProfile,
    samsungCardProfile,
    hyundaiCardProfile,
    kakaoBankProfile,
    bankAccountProfile,
    nelnaProfile
];

/**
 * logic to identify which bank a sheet belongs to
 */
export function identifyBank(headers: string[]): BankProfile | null {
    const normalizedHeaders = headers.map(h => String(h || "").replace(/\s/g, '').normalize('NFC').toLowerCase());
    const headerString = normalizedHeaders.join(' ');

    for (const profile of BANK_PROFILES) {
        if (profile.keywords.every(k => {
            const key = k.replace(/\s/g, '').normalize('NFC').toLowerCase();
            return headerString.includes(key);
        })) {
            return profile;
        }
    }

    return null;
}
