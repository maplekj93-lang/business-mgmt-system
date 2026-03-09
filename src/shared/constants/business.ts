// ─── 사업 주체 ───────────────────────────────────────────────
export const OWNER_TYPES = ['kwangjun', 'euiyoung', 'joint', 'household'] as const;
export type OwnerType = typeof OWNER_TYPES[number];

export const OWNER_LABELS: Record<OwnerType, string> = {
    kwangjun: '광준',
    euiyoung: '의영',
    joint: '공동',
    household: '가계',
};

/** 칸반 카드 헤더 컬러 (Tailwind bg 클래스) */
export const OWNER_COLORS: Record<OwnerType, string> = {
    kwangjun: 'bg-blue-500',      // 🟦
    euiyoung: 'bg-green-500',     // 🟩
    joint: 'bg-purple-500',       // 🟪
    household: 'bg-amber-500',    // 🟨
};

/** 프로젝트 상태 */
export const PROJECT_STATUSES = ['active', 'completed', 'cancelled', 'on_hold'] as const;
export type ProjectStatus = typeof PROJECT_STATUSES[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    active: '진행중',
    completed: '완료',
    cancelled: '취소',
    on_hold: '보류',
};

// ─── 수입 유형 ───────────────────────────────────────────────
export const INCOME_TYPES = ['freelance', 'daily_rate', 'photo_project'] as const;
export type IncomeType = typeof INCOME_TYPES[number];

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
    freelance: '프리랜서 계약',
    daily_rate: '퍼스트 일당',
    photo_project: '사진 프로젝트',
};

// ─── 칸반 상태 (파이프라인 순서 그대로) ─────────────────────
export const PIPELINE_STATUSES = [
    '의뢰중',
    '작업중',
    '보류취소',
    '작업완료',
    '수정완료',
    '입금대기',
    '입금완료',
    '포스팅완료',
] as const;
export type PipelineStatus = typeof PIPELINE_STATUSES[number];

// ─── 프로젝트 카테고리 태그 ──────────────────────────────────
export const PROJECT_CATEGORIES = [
    '영상조명', '영상스케치', '사진조명',
    '조명_퍼스트', '조명_프리랜서',
    '그래픽디자인', '공간디자인', '모션그래픽',
    '사진촬영_공동', '중계',
] as const;
export type ProjectCategory = typeof PROJECT_CATEGORIES[number];

// ─── 진행비 카테고리 ─────────────────────────────────────────
export const EXPENSE_CATEGORIES = ['주차비', '주유비', '톨비', '식비', '기타'] as const;
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// ─── 크루원 역할 ─────────────────────────────────────────────
export const CREW_ROLES = ['세컨', '서드', '막내', '기타'] as const;
export type CrewRole = typeof CREW_ROLES[number];
