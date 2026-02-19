import { BankProfile, ValidatedTransaction, DetectedFile } from "./types";

export * from "./types";

/**
 * Registry of all available bank profiles
 */
import {
    samsungCardProfile,
    bcCardProfile,
    hyundaiCardProfile,
    kakaoBankProfile,
    bankAccountProfile
} from './profiles';

export const BANK_PROFILES: BankProfile[] = [
    samsungCardProfile,
    bcCardProfile,
    hyundaiCardProfile,
    kakaoBankProfile,
    bankAccountProfile
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
