# 📋 Mobile UX + Smart Tagging 통합 검토 정리 (2026-03-11)

> **목적:** Mobile_UX_Optimization.md와 Smart_Tagging_Optimization.md의 일관성 검토 및 통합 설계
> **완료 범위:** 두 문서 V1.1 → V2.1 업그레이드

---

## 🎯 검토 결과 요약

### 발견된 이슈 5개

| # | 이슈 | 심각도 | 해결 방법 | 상태 |
|---|------|--------|---------|------|
| **Issue 1** | 사이드바 상태 관리 미설계 | ⚠️ 중 | SidebarProvider + useMediaQuery 구체화 | ✅ 완료 |
| **Issue 2** | 미분류 패널과 모바일 UX 충돌 | 🔴 높음 | 반응형 분기 설계 (인라인 vs 시트) | ✅ 완료 |
| **Issue 3** | 하단 탭 네비게이션 모호 | ⚠️ 중 | Phase 2로 연기 (MVP 제외) | ✅ 완료 |
| **Issue 4** | Part 3 단건 로직 완전성 | ⚠️ 중 | Contains 우선순위 + History 정규화 | ✅ 완료 |
| **Issue 5** | 파일 업로드 UX 불명확 | ℹ️ 낮 | 현재 코드 확인 후 정의 필요 | ⏳ 보류 |

---

## 📝 수정 사항 상세

### 1️⃣ Mobile_UX_Optimization.md V1.0 → V1.1

#### 1-1. 사이드바 반응형 구현 (구체화)

**추가 내용:**
- Breakpoint 정의 (Desktop ≥1024px / Tablet 768~1023px / Mobile <768px)
- SidebarProvider 상태 관리 구현 코드 (전체 45줄)
- useMediaQuery 커스텀 훅 (14줄)
- Header, Sidebar, Layout 수정 코드 예시

**효과:**
- 개발자가 바로 코딩할 수 있는 수준의 구체성 확보
- React Context + useEffect 기반 반응형 state 관리 패턴 제시

#### 1-2. 행 인터랙션 패턴 (신규 섹션 2 추가)

**통합 설계:**
```
데스크톱/태블릿  →  행 클릭  →  인라인 Collapsible 패널
모바일         →  행 탭    →  Bottom Sheet 모달
```

**구현 전략:**
- `getTransactionsByIds()` 공유 데이터 계층
- `UnclassifiedRow` 반응형 컴포넌트 (분기 로직 포함)
- `TransactionDetailPanel` (인라인용)
- `TransactionDetailSheet` (모바일용) — 신규 컴포넌트

**효과:**
- 모바일과 데스크톱에서 **동일한 논리** 유지
- 렌더링만 변경하므로 유지보수 용이
- Smart Tagging Part 2와 완벽한 동기화

#### 1-3. 하단 네비게이션 (Phase 2 연기)

**결정:**
- MVP에서 제외 (Slide-over 사이드바로 충분)
- 사용 패턴 분석 후 Phase 2에서 재검토

**이유:**
- 화면 공간 압박
- 실제 필요성 데이터 부족

#### 1-4. 파일 업로드 (상황 파악 필요)

**현황:** 현재 코드베이스 확인 필요
**예정:** Part 4로 분리 (별도 작업 일정)

---

### 2️⃣ Smart_Tagging_Optimization.md V2.0 → V2.1

#### Part 2 보강: 반응형 설계 통합

**변경 내용:**
```
V2.0: 데스크톱만 고려 (인라인 패널)
V2.1: 모바일도 지원 (Bottom Sheet + 반응형 분기)
```

**구현 코드 추가:**
- `UnclassifiedRow` 전체 컴포넌트 코드 (반응형 로직 포함)
- `TransactionDetailPanel` (인라인용, 데스크톱/태블릿)
- `TransactionDetailSheet` 참고 (모바일용)

**효과:**
- Mobile_UX_Optimization.md와의 명확한 통합 지점 확보
- 디바이스별 렌더링 방식이 일관성 있게 정의됨

#### Part 3 강화: 단건 로직 완전화

**추가 사항:**
1. **Contains 우선순위 처리**
   - `rules.filter().sort((a,b) => a.priority - b.priority).find()` 패턴
   - priority 기반 매칭 순서 보장

2. **History Match 정규화 고려사항**
   - `description.trim().toLowerCase()`로 정규화된 키로 조회
   - 데이터 구조 결정 필요성 명시

3. **Pseudocode 개선**
   - 명시적인 단계별 처리 + rule_type 속성 추가

**효과:**
- Part 3이 완전한 구현 가이드 수준으로 상향
- 단순 개선안이 아닌 실제 코드 패턴 제시

#### 체크리스트 업데이트

**V2.0:**
- Part 1-2만 정의
- `suggest-category.ts` "변경 없음"

**V2.1:**
- Part 3 전용 항목 추가 (5개)
- `suggest-category.ts` "수정" 로 변경
- `transaction-detail-sheet.tsx` 명시 (모바일 컴포넌트)

---

## 🔗 문서 간 통합 맵

```
Mobile_UX_Optimization.md (V1.1)
├─ 1-2. 행 인터랙션 패턴
│   └─ TransactionDetailSheet 컴포넌트 정의
│
└─ 관련 문서: Smart Tagging Part 2

Smart_Tagging_Optimization.md (V2.1)
├─ Part 2. 미분류 상세 패널
│   ├─ UnclassifiedRow (반응형 분기)
│   ├─ TransactionDetailPanel (인라인)
│   └─ TransactionDetailSheet (모바일, Mobile_UX 참고)
│
├─ Part 3. 단건 로직
│   └─ Contains 우선순위 + History 정규화
│
└─ 관련 문서: Mobile_UX_Optimization.md (2-1)
```

---

## ✅ 구현 우선순위

### Phase 1 (MVP)

#### 필수 (P0)
1. **Part 1: 성능 최적화**
   - `suggest-category-bulk.ts` (신규)
   - `apply-tagging-rules.ts` (수정)
   - 목표: 쿼리 202+N → 5회 고정

2. **Part 2: 미분류 상세 패널**
   - `unclassified-row.tsx` (신규, 반응형)
   - `transaction-detail-panel.tsx` (신규)
   - `get-transactions-by-ids.ts` (신규)
   - 목표: 행 클릭 → 상세 정보 표시

3. **Mobile UX: 사이드바 + 행 인터랙션**
   - `sidebar-provider.tsx` (신규)
   - `use-media-query.ts` (신규)
   - `transaction-detail-sheet.tsx` (신규)
   - 목표: 반응형 UI + 모바일 최적화

#### 권장 (P1)
4. **Part 3: 단건 로직 개선**
   - `suggest-category.ts` (수정)
   - 목표: 대소문자/공백 처리 + priority 순 정렬

### Phase 2 (이후)

- 하단 네비게이션 (사용 패턴 분석 후)
- 파일 업로드 폴백 (현재 기능 확인 후)
- 스와이프 액션 (성능 영향 평가 후)

---

## 📊 파일 현황 체크리스트

### Mobile_UX_Optimization.md

| 섹션 | 완성도 | 구현 코드 | 테스트 가이드 |
|------|--------|---------|--------------|
| 1-1. Sidebar (구체화) | ✅ 100% | ✅ 포함 | ✅ 포함 |
| 1-2. 행 인터랙션 | ✅ 100% | ✅ 포함 | ✅ 포함 |
| 1-3. 하단 탭 | ✅ 100% (Phase 2 결정) | - | - |
| 2-1. 터치 최적화 | ✅ 100% | ℹ️ 가이드 | ✅ 포함 |
| 4. 파일 업로드 | ⏳ 50% | ℹ️ 구조만 | ⏳ 필요 |

### Smart_Tagging_Optimization.md

| 섹션 | 완성도 | 구현 코드 | 체크리스트 |
|------|--------|---------|-----------|
| Part 1. 성능 최적화 | ✅ 100% | ✅ 포함 | ✅ 5개 항목 |
| Part 2. 상세 패널 | ✅ 95% | ✅ 포함 | ✅ 8개 항목 |
| Part 3. 단건 로직 | ✅ 100% | ✅ 포함 | ✅ 5개 항목 |

---

## 🚀 다음 단계

### 즉시 (오늘)

1. **Antigravity 전달:**
   - Smart_Tagging_Optimization.md V2.1 (Part 1-3)
   - Mobile_UX_Optimization.md V1.1 (1-2 행 인터랙션)
   - 우선순위: Part 1 → Part 2 → Mobile UX → Part 3

2. **확인 필요:**
   - 현재 코드베이스 파일 업로드 기능 유무
   - `mdt_allocation_rules` DB 스키마 priority 컬럼 확인

### 구현 진행 중

- Part 1 (쿼리 최적화)
- Part 2 (상세 패널, 반응형)
- 모바일 사이드바 (useMediaQuery + Provider)

### 구현 후

- Part 3 (단건 로직 개선)
- 통합 테스트 (반응형 동작 검증)
- Phase 2 계획 수립

---

## 📌 주요 개선 포인트 요약

| 항목 | V1 문제점 | V2 해결책 | 효과 |
|------|---------|---------|------|
| **구체성** | 개념만 설명 | 실제 코드 (45줄 이상) | 개발자 착수 용이 |
| **완전성** | Part 3 미흡 | Contains 우선순위 + History | 구현 가이드 수준 |
| **통합성** | 모바일 고려 부족 | 반응형 컴포넌트 분리 | 유지보수 용이 |
| **명확성** | 체크리스트 불완전 | 부분별 상세 항목 | 진행률 추적 가능 |
| **연계성** | 문서 간 고립 | 명시적 Cross-ref | 전체 그림 파악 용이 |

---

**문서 최종 상태:** ✅ 설계 완료 / 구현 준비 완료
