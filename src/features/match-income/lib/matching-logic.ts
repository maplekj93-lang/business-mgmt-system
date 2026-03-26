/**
 * 입금 내역 매칭 신뢰도 및 시각적 스타일을 정의하는 유틸리티
 */

export type MatchConfidence = 'high' | 'medium' | 'low';

export interface ConfidenceBadgeConfig {
  label: string;
  color: string;
  bgColor: string;
}

export const CONFIDENCE_CONFIG: Record<MatchConfidence, ConfidenceBadgeConfig> = {
  high: {
    label: '신뢰도 높음',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  medium: {
    label: '보통',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  low: {
    label: '낮음',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

/**
 * 서버에서 받은 점수(0~100)를 기반으로 신뢰도 등급을 결정합니다.
 */
export const getConfidenceLevel = (score: number): MatchConfidence => {
  if (score >= 80) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

/**
 * 매칭 설명(Reason)을 사용자 친화적으로 변환합니다.
 */
export const formatMatchReason = (reason: string): string => {
  const map: Record<string, string> = {
    '금액 및 이름 일치': '금액과 입금자명이 모두 일치합니다.',
    '금액 일치': '금액이 정확히 일치합니다.',
    '이름 유사': '입금자명이 프로젝트 키워드와 유사합니다.',
    '잠재적 후보': '금액이나 이름이 일부 유사합니다.',
  };
  return map[reason] || reason;
};
