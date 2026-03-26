# 📋 Sprint 2 구현 계획 검토 분석 (2026-03-11)

> **검토 대상:** `docs/planning/Sprint2_Implementation_Plan.md`
> **상태:** ⚠️ 중요 문제점 5개 발견
> **권장 조치:** 업데이트 또는 전환

---

## 🚨 발견된 이슈 (우선순위순)

### Issue 1: 범위 오류 (🔴 Critical)

**문제:**
```
제목: "Sprint 2: 비즈니스 ERP 기반 구축"
실제 범위: Phase 4 (기업 ERP) 개념과 혼재
```

**상세:**
- 문서는 "비즈니스 ERP" 이라고 표현
- 하지만 실제로는 **현재 가계부 앱의 운영 효율화** (Sprint 2)
- Phase 4는 `/business/*` 완전 별도 라우트로 진행될 예정

**예시:**
```markdown
문서에서 언급:
  - "가계부와 사업비의 엄격한 분리"
  - "Business ERP Foundation 구축"

실제 범위:
  - 현재 가계부 앱 내에서 이중 지출 차단
  - Phase 4에서 별도 비즈니스 ERP 구축 (향후)
```

**수정안:**
```markdown
제목 변경:
"Sprint 2: 가계부 운영 효율화 (Ledger Optimization & Smart Tagging)"

설명 추가:
본 Sprint는 현재 가계부 애플리케이션의 운영 효율화에 집중합니다.
비즈니스 전용 ERP 구축(Business Dashboard, 거래처 관리, 프로젝트 수익 추적 등)은
Phase 4에서 별도 라우트(/business/*)로 진행될 예정입니다.
```

---

### Issue 2: 범위 명확성 부족 (⚠️ High)

**문제:**
```
4개 기능이 정의되어 있으나, 각 기능이:
  - Sprint 2에만 포함되는지
  - Phase 4에도 영향을 주는지
  - 어떤 우선순위인지
불명확함
```

**현황 분석:**

| 기능 | 설계 문서 | Issue 1 수정 후 |
|------|----------|----------------|
| 1. 이중 지출 차단 | L_and_D_ERP_Sprint2 (M-3) | ✅ Sprint 2만 |
| 2. 구독 사업비 정밀 관리 | L_and_D_ERP_Sprint2 (S-7) | ✅ Sprint 2만 |
| 3. 스마트 태깅 Lite | L_and_D_ERP_Sprint2 (S-1) | ✅ Sprint 2만 |
| 4. 입금 지연 추적 | L_and_D_ERP_Sprint2 (S-2) | ⚠️ 모호 (projects 테이블 포함) |

**4번 기능의 모호성:**
```
현황: "프로젝트별 입금 일정" 언급
문제: projects 테이블은 현재 가계부 범위 밖
질문: 이 기능이 Phase 4 비즈니스 ERP와 얼마나 겹치는가?
```

**수정안:**
```markdown
### 4. 입금 지연 추적 (Lead-Time Tracker) — Sprint 2 범위 한정

현재 가계부 앱에서는:
  - projects 테이블의 3개 DATE 컬럼 추가 (invoice_sent_date, expected_payment_date, actual_payment_date)
  - 대시보드 위젯(ReceivablesAlertCard) 추가로 경고 표시
  - 기본적 입금 추적만 구현

Phase 4에서 확장:
  - 클라이언트별 상세 관리 (clients 테이블)
  - 비즈니스 대시보드 통합
  - 세금계산서 연동
```

---

### Issue 3: 파일 경로 오류 (⚠️ Medium)

**문제:**
```markdown
[MODIFY] [allocation-dialog.tsx](file:///Users/kwang/Desktop/business-mgmt-system/...)
         ↑ 로컬 절대 경로 링크
```

**이유:**
- GitHub/GitLab에서 작동 안 함
- 다른 사람의 컴퓨터에서는 패스가 다름
- 상대 경로 권장

**수정안:**
```markdown
- [MODIFY] src/features/allocate-transaction/ui/allocation-dialog.tsx
- [MODIFY] src/app/(dashboard)/settings/recurring-expenses/page.tsx
- [NEW] src/app/(dashboard)/settings/tagging-rules/page.tsx
```

---

### Issue 4: DB 마이그레이션 사전조건 미명시 (⚠️ Medium)

**문제:**
```
문서에서:
  - "excluded_from_personal 필터 추가"
  - "is_business 컬럼 사용"

하지만:
  - 이 컬럼들이 DB에 있는지 확인 안 함
  - 마이그레이션 순서 언급 없음
```

**위험:**
```
시나리오:
  1. 개발자가 코드 작성 시작
  2. "excluded_from_personal" 타입 에러 발생
  3. DB 마이그레이션 필요 깨달음
  4. 코드 작성 중단 후 마이그레이션 먼저 진행
  → 비효율적 진행
```

**수정안:**
```markdown
## 사전 조건 (Prerequisites)

구현 시작 **전에** 반드시 완료:

1. DB 마이그레이션 실행
   - SQL: `20260311_sprint2_tagging_and_tracking.sql`
   - 위치: `/supabase/migrations/`

2. TypeScript 타입 재생성
   ```bash
   npx supabase gen types typescript --project-id <project-id> \
     > src/shared/api/supabase/database.types.ts
   ```

3. 필수 컬럼 확인
   - mdt_allocation_rules: is_business, business_tag, match_type, priority
   - transactions: excluded_from_personal
   - projects: invoice_sent_date, expected_payment_date, actual_payment_date
   - clients: avg_payment_lead_days (Phase 4용, 지금은 선택)

✅ 이 3단계가 완료되어야 코딩 시작 가능
```

---

### Issue 5: 검증 계획이 추상적 (⚠️ Low)

**현황:**
```markdown
### Verification Plan

### Automated Tests
- `npx tsc --noEmit`을 통한 타입 안정성 검증.
- DB RPC 함수(`get_filtered_transactions` 등)의 필터링 로직 SQL 검증.

### Manual Verification
1. **이중 차단**: ... 는가?
```

**문제:**
```
1. "DB RPC 함수"를 언급하는데 함수가 실제로 있는지 미확인
2. "Manual Verification"이 너무 추상적 (실제 테스트 단계 부족)
3. 4개 기능별 구체적 검증 기준 없음
```

**수정안:**
```markdown
## 검증 계획 (상세화)

### 자동 검증
```bash
# TypeScript 컴파일
npm run type-check

# 기존 테스트 통과
npm test

# 빌드 성공
npm run build
```

### 수동 검증 (기능별)

#### 1️⃣ 이중 지출 차단 (M-3)
```
목표: 사업비로 분류된 거래는 가계부 지출에서 제외

테스트:
  1. 대시보드 → 임의의 거래 선택
  2. 분류 다이얼로그 → "사업비" 선택 → 저장
  3. 대시보드 개인 지출 합계 확인
     ✅ 해당 거래 금액만큼 감소
  4. DB 확인
     SELECT excluded_from_personal
     WHERE id = '<거래ID>'
     ✅ true 확인

검증 기준:
  - UI: 즉시 합계 감소
  - DB: excluded_from_personal = true
  - 재계산: 페이지 새로고침 후에도 유지
```

#### 2️⃣ 구독 사업비 정밀 관리 (S-7)
```
목표: 사업용 구독 항목을 별도 추적, 세액 공제액 계산

테스트:
  1. 설정 → 정기 결제 관리
  2. "Gemini Pro" 구독 항목 → 사업용 선택
  3. "사업용 구독 월 합계" 카드 확인
     ✅ 금액이 반영됨
  4. "매입세액 공제 가능액" 확인
     ✅ (금액 / 11) 계산 정확

검증 기준:
  - 사업/개인 레이어 시각적 분리 (색상, 스타일)
  - 세액 계산식 검증 (금액/11)
  - DB: is_business = true 확인
```

#### 3️⃣ 스마트 태깅 Lite (S-1)
```
목표: 사용자가 분류 규칙을 관리, 높은 신뢰도 자동 분류

테스트:
  1. 설정 → 분류 규칙 관리 (신규 페이지)
     ✅ /settings/tagging-rules 접근 가능
  2. 새 규칙 생성
     - 키워드: "카페" → 분류: "식비"
     - 저장
     ✅ 규칙 목록에 추가
  3. 미분류 → "자동 분류" 버튼
     ✅ High confidence 항목만 적용
     ✅ 다른 항목은 추천(Medium/Low) 수준
  4. DB 확인
     SELECT * FROM mdt_allocation_rules WHERE keyword = '카페'
     ✅ priority, match_type 컬럼 포함

검증 기준:
  - CRUD: 규칙 생성/수정/삭제 작동
  - 매칭: Exact > Contains > History 우선순위 보장
  - Priority: 낮은 숫자부터 적용
  - 대소문자/공백 정규화 ('CAFE', ' 카페 ' → '카페' 매칭)
```

#### 4️⃣ 입금 지연 추적 (S-2)
```
목표: 예상 입금일 지난 프로젝트 경고, 클라이언트별 평균 리드타임

테스트:
  1. 대시보드 → ReceivablesAlertCard 위젯 확인
     ✅ 위젯 표시됨
  2. 과거 날짜로 invoice_sent_date 설정한 프로젝트
     ✅ "입금 지연" 경고 표시
     ✅ 남은 일수 계산 정확 (actual_payment_date - expected_payment_date)
  3. DB 확인
     SELECT invoice_sent_date, expected_payment_date, actual_payment_date
     FROM projects WHERE id = '<프로젝트ID>'
     ✅ 3개 DATE 컬럼 모두 확인

검증 기준:
  - UI: 경고 색상 및 텍스트 명확
  - 계산: lead_time = actual_payment_date - invoice_sent_date
  - 집계: 클라이언트별 평균값 정확성
```

### 통합 검증
```
테스트 케이스:
  1. 전체 플로우
     거래 생성 → 사업비 분류 → 개인지출 감소 → 규칙 추천 적용

  2. 엣지 케이스
     - 대소문자 혼재 키워드
     - 공백 포함 거래명
     - 우선순위 충돌 규칙 여러 개

  3. 성능
     - 100건 자동 분류: 목표 5초 이내
     - 규칙 목록 로딩: 1초 이내
```
```

---

## 📊 문서 현황 평가

| 항목 | 상태 | 심각도 | 개선 필요 |
|------|------|--------|----------|
| **범위 명확성** | ❌ 혼란 | 🔴 Critical | 제목 + 설명 변경 필수 |
| **설계 일치도** | ✅ 일치 | - | 최소 (이미 L_and_D와 동기화) |
| **구현 가이드** | ⚠️ 부분적 | ⚠️ Medium | 파일 경로 수정, 구체적 단계 추가 |
| **DB 사전조건** | ❌ 없음 | ⚠️ Medium | "Prerequisites" 섹션 신규 추가 |
| **검증 계획** | ⚠️ 추상적 | ℹ️ Low | 기능별 구체적 테스트 케이스 추가 |

---

## 🎯 권장 조치

### 옵션 A: 업데이트 (권장) ⭐

**이유:**
- 설계 내용은 좋음 (L_and_D_ERP_Sprint2와 동일)
- 5개 이슈만 수정하면 완성
- 구현자를 위한 실질적 가이드가 됨

**예상 시간:** 1시간

**수정 내용:**
1. 제목 + 범위 명확화 (15분)
2. Prerequisites 섹션 추가 (15분)
3. 파일 경로 수정 (10분)
4. 검증 계획 구체화 (20분)

### 옵션 B: 대체 문서 작성

**신규 생성:**
```
Sprint2_Checklist.md (경량 버전)
├─ 사전 조건 (마이그레이션, 타입 생성)
├─ 4개 기능별 체크리스트
├─ 파일 목록 (신규 + 수정)
└─ 검증 항목
```

**장점:** 더 간결, 실행 가능한 체크리스트
**단점:** 설계 내용 중복 손실

### 옵션 C: 통합 (최적) ✅

**1단계:** 이 문서(검토 분석) 참고하여 Sprint2_Implementation_Plan.md 업데이트
**2단계:** 업데이트 후 COMPLETE_IMPLEMENTATION_GUIDE의 Sprint 2 섹션과 연계
**결과:** 일관성 있는 3단계 가이드
```
  ① L_and_D_ERP_Sprint2_Design.md (설계)
  ② Sprint2_Implementation_Plan.md (실행 계획)
  ③ COMPLETE_IMPLEMENTATION_GUIDE.md (구현 단계별)
```

---

## 💡 이 문서와 기존 문서의 관계

### 현재 상황

| 문서 | 용도 | 상태 |
|------|------|------|
| `L_and_D_ERP_Sprint2_Design.md` | 설계 | ✅ V1.0 완료 |
| `Sprint2_Implementation_Plan.md` | 실행 계획 | ⚠️ 문제 5개 |
| `COMPLETE_IMPLEMENTATION_GUIDE.md` | 구현 단계 | ✅ V1.0 완료 |

### 문제점

- `Sprint2_Implementation_Plan.md`는 "설계"와 "구현 가이드" 중간 단계
- 내용이 설계 문서와 중복되면서 불명확함
- 구현 가이드보다 덜 상세함

### 해결책

**최적 배치:**
```
1. 설계
   L_and_D_ERP_Sprint2_Design.md
   └─ 4개 기능의 데이터 구조, 로직 설명

2. 실행 계획 (개선된 Sprint2_Implementation_Plan.md)
   ├─ 사전 조건 (DB 마이그레이션)
   ├─ 4개 기능별 구현 순서
   ├─ 각 기능의 파일 목록
   └─ 검증 항목

3. 구현 단계별 가이드
   COMPLETE_IMPLEMENTATION_GUIDE.md Part 1-4
   └─ Phase별 상세 코드 및 체크리스트
```

---

## ✅ 최종 권장사항

### 지금 바로

```
□ 이 검토 분석 문서 공유
□ 옵션 A (업데이트) 선택 검토
□ 수정 항목 우선순위 확인
```

### Sprint 2 구현 시작 전

```
□ Sprint2_Implementation_Plan.md 업데이트 완료
□ 사전 조건(Prerequisites) 섹션 추가 확인
□ DB 마이그레이션 실행 확인
□ TypeScript 타입 재생성 확인
```

### 구현자(Antigravity)에게 전달

```
① L_and_D_ERP_Sprint2_Design.md (설계 이해)
② (업데이트된) Sprint2_Implementation_Plan.md (계획 확인)
③ COMPLETE_IMPLEMENTATION_GUIDE.md (구현 진행)
```

---

## 🎁 제공 파일

**이미 있음:**
- ✅ COMPLETE_IMPLEMENTATION_GUIDE_20260311.md (Sprint 1용, Sprint 2도 포함)
- ✅ DB_MIGRATION_CHECKLIST_20260311.md
- ✅ START_HERE_20260311.md

**검토 완료:**
- 📋 이 파일 (SPRINT2_IMPLEMENTATION_REVIEW_20260311.md)

**필요한 조치:**
- ⚠️ Sprint2_Implementation_Plan.md 업데이트 (위 이슈 5개 수정)

---

**결론: 업데이트하면 Sprint 2 실행 계획이 완성됩니다!** 🚀
