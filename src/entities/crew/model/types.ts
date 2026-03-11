export interface CrewProfile {
  id: string;
  user_id: string;
  name: string;
  role?: string | null;  // 세컨, 서드, 막내, 기타 등
  withholding_rate: number;  // 0.033 = 3.3%, 0 = 광준 자신
  account_info?: string | null;
  phone?: string | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}


export type CrewRole = '세컨' | '서드' | '막내' | '기타';

export const CREW_ROLES: CrewRole[] = ['세컨', '서드', '막내', '기타'];

export const DEFAULT_WITHHOLDING_RATES: Record<string, number> = {
  '세컨': 0.033,      // 3.3%
  '서드': 0.033,      // 3.3%
  '막내': 0.033,      // 3.3%
  '기타': 0.033,      // 3.3%
  'kwangjun': 0,      // 광준 자신 (원천징수 없음)
};
