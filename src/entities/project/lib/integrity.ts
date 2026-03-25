import { ProjectStatus } from '@/shared/constants/business';

export interface ProjectIntegrityResult {
    isHealthy: boolean;
    warnings: string[];
    level: 'healthy' | 'warning' | 'critical';
}

export interface ProjectProfitabilityMinimal {
    id: string;
    name: string;
    total_revenue: number;
    crew_labor: number;
    site_expenses: number;
    status: ProjectStatus;
}

/**
 * 프로젝트 데이터의 무결성을 검증합니다.
 * 주요 검증 항목:
 * 1. 완료된 프로젝트인데 인건비나 경비가 0원인 경우 (데이터 누락 의심)
 * 2. 진행중/완료 프로젝트인데 매출이 0원인 경우
 */
export function checkProjectIntegrity(project: ProjectProfitabilityMinimal): ProjectIntegrityResult {
    const warnings: string[] = [];

    // Rule 1: 완료된 프로젝트인데 매출은 있는데 비용이 0인 경우
    if (project.status === 'completed') {
        if (project.total_revenue > 0 && project.crew_labor === 0) {
            warnings.push('인건비 데이터가 입력되지 않았습니다.');
        }
        if (project.total_revenue > 0 && project.site_expenses === 0) {
            warnings.push('현장 경비 데이터가 입력되지 않았습니다.');
        }
    }

    // Rule 2: 진행중 혹은 완료 프로젝트인데 매출이 0원인 경우
    if (project.total_revenue === 0 && (project.status === 'active' || project.status === 'completed')) {
        warnings.push('매출 데이터가 0원입니다.');
    }

    let level: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (warnings.length > 0) {
        level = project.status === 'completed' ? 'critical' : 'warning';
    }

    return {
        isHealthy: warnings.length === 0,
        warnings,
        level
    };
}
