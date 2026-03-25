import { describe, it, expect } from 'vitest';
import { checkProjectIntegrity, ProjectProfitabilityMinimal } from './integrity';

describe('project integrity utilities', () => {
    it('정상적인 완료 프로젝트는 healthy를 리턴해야 함', () => {
        const project: ProjectProfitabilityMinimal = {
            id: '1',
            name: '정상 프로젝트',
            total_revenue: 1000000,
            crew_labor: 200000,
            site_expenses: 50000,
            status: 'completed'
        };
        const result = checkProjectIntegrity(project);
        expect(result.isHealthy).toBe(true);
        expect(result.level).toBe('healthy');
    });

    it('완료된 프로젝트인데 인건비가 0원이면 critical 경고를 리턴해야 함', () => {
        const project: ProjectProfitabilityMinimal = {
            id: '2',
            name: '인건비 누락 프로젝트',
            total_revenue: 1000000,
            crew_labor: 0,
            site_expenses: 50000,
            status: 'completed'
        };
        const result = checkProjectIntegrity(project);
        expect(result.isHealthy).toBe(false);
        expect(result.level).toBe('critical');
        expect(result.warnings).toContain('인건비 데이터가 입력되지 않았습니다.');
    });

    it('진행중인 프로젝트인데 매출이 0원이면 warning을 리턴해야 함', () => {
        const project: ProjectProfitabilityMinimal = {
            id: '3',
            name: '매출 0원 진행중',
            total_revenue: 0,
            crew_labor: 0,
            site_expenses: 0,
            status: 'active'
        };
        const result = checkProjectIntegrity(project);
        expect(result.isHealthy).toBe(false);
        expect(result.level).toBe('warning');
        expect(result.warnings).toContain('매출 데이터가 0원입니다.');
    });

    it('취소된 프로젝트는 데이터가 없어도 healthy여야 함', () => {
        const project: ProjectProfitabilityMinimal = {
            id: '4',
            name: '취소 프로젝트',
            total_revenue: 0,
            crew_labor: 0,
            site_expenses: 0,
            status: 'cancelled'
        };
        const result = checkProjectIntegrity(project);
        expect(result.isHealthy).toBe(true);
    });
});
