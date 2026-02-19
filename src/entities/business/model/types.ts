export type BusinessUnitType = 'production' | 'creative' | 'commerce';

export interface BusinessUnitMetadata {
    owner: 'husband' | 'wife' | 'joint';
    role: string;
}

export interface BusinessUnit {
    id: string; // UUID
    name: string;
    type: BusinessUnitType;
    metadata: BusinessUnitMetadata;
    created_at?: string;
}
