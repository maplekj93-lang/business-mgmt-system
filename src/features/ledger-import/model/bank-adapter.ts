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
    nelnaProfile
} from './profiles';

export const BANK_PROFILES: BankProfile[] = [
    // ⚠️ 해외 프로파일을 국내보다 먼저 등록 (키워드가 더 구체적이어서 선매칭 필요)
    samsungCardOverseasProfile,
    samsungCardProfile,
    bcCardProfile,
    hyundaiCardProfile,
    kakaoBankProfile,
    bankAccountProfile,
    nelnaProfile
];

/**
 * logic to identify which bank a sheet belongs to
 */
export function identifyBank(headers: string[]): BankProfile | null {
    const headerString = headers.join(' ').normalize('NFC').toLowerCase();

    // Sort profiles by specificity (more keywords matched = better)
    // For now, simple first-match based on unique keywords
    for (const profile of BANK_PROFILES) {
        if (profile.keywords.every(k => {
            const key = k.normalize('NFC').toLowerCase();
            return headerString.includes(key);
        })) {
            return profile;
        }
    }

    return null;
}
