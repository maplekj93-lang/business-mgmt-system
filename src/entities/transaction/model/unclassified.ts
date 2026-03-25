export const OWNER_OPTIONS = [
    { value: 'kwangjun', label: '광준' },
    { value: 'euiyoung', label: '의영' },
    { value: 'joint', label: '공동' },
    { value: 'business', label: '회사' },
    { value: 'other', label: '미상/기타' }
] as const;

export interface UnclassifiedGroup {
    rawName: string;
    amount: number;
    ownerType: string;
    count: number;
    transactionIds: string[];
    sampleDate: string;
    totalAmount: number;
    type: 'income' | 'expense';
    isGroupable: boolean;
}
