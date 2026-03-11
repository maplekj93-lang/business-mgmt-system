# Antigravity 체크리스트 (Quick Verification)
**최종 업데이트**: 2026-03-09 22:30 KST
**목적**: Task 1, 2 검증 및 완료 확인

---

## ✅ 1단계: 코드 상태 확인 (5분)

### 1-1. TypeScript 컴파일 확인
```bash
cd /sessions/friendly-determined-archimedes/mnt/business-mgmt-system
npx tsc --noEmit
```
**예상 결과**: `✅ TypeScript compilation successful` (또는 에러 없음)

- [ ] 컴파일 성공

### 1-2. 파일 존재 확인
```bash
# Task 1 파일
ls src/entities/crew/api/crew-api.ts
ls src/entities/crew/model/types.ts
ls src/app/\(dashboard\)/settings/crew/page.tsx

# Task 2 파일
ls src/entities/vat/api/vat-api.ts
ls src/entities/vat/model/types.ts
ls src/widgets/vat-reserve-card/ui/VatReserveCard.tsx

# 문서 파일
ls docs/planning/TASK_1_PROGRESS.md
ls docs/planning/TASK_2_PROGRESS.md
```

- [ ] Task 1: 3개 파일 존재
- [ ] Task 2: 3개 파일 존재
- [ ] 문서: 2개 파일 존재

---

## 🧪 2단계: Task 1 기능 검증 (10분)

### 2-1. 크루 관리 페이지 접근
**URL**: `http://localhost:3000/settings/crew`

**확인 항목**:
- [ ] 페이지 로드됨
- [ ] "새 크루 추가" 버튼 보임
- [ ] 크루 목록 표시됨 (없으면 "등록된 크루가 없습니다" 메시지)

### 2-2. 크루 추가 테스트
1. "새 크루 추가" 클릭
2. 다음 정보 입력:
   - **이름**: 박세컨
   - **역할**: 세컨
   - **원천징수율**: 0.033 (자동 표시)
   - **계좌**: 국민은행 123-456
   - **연락처**: 010-1234-5678

**확인 항목**:
- [ ] 다이얼로그 열림
- [ ] 역할 선택 시 원천징수율 자동 설정 (세컨 = 0.033)
- [ ] 저장 후 목록에 추가됨
- [ ] 성공 토스트 메시지 나타남

### 2-3. 일당 입력 시 크루 선택
1. **비즈니스 페이지** 접근: `http://localhost:3000/business`
2. "현장 일당 기록 추가" 클릭
3. 크루 인건비 섹션에서 크루 선택 확인

**확인 항목**:
- [ ] 크루 드롭다운에 "박세컨" 표시
- [ ] 크루 선택 시 원천징수율 자동 설정
- [ ] 지급액 입력 시 "실수령액" 자동 계산 표시
  - 예: 지급액 1,000,000 → 실수령액 967,000원 (1,000,000 × 0.967)

### 2-4. DB 데이터 확인
**Supabase Dashboard** → `crew_profiles` 테이블

**확인 항목**:
- [ ] 박세컨 레코드 존재
- [ ] withholding_rate = 0.033
- [ ] account_info = "국민은행 123-456"
- [ ] is_active = true

---

## 🧪 3단계: Task 2 기능 검증 (10분)

### 3-1. 대시보드에서 VAT 카드 보기
**URL**: `http://localhost:3000`

**확인 항목**:
- [ ] 비즈니스 대시보드 로드됨
- [ ] 하단에 amber 색 "이번달 부가세" 카드 보임
- [ ] "준비금 적립 중" 상태 표시 또는 금액 표시 (0원이면 정상)

### 3-2. 수입 매칭으로 VAT 자동 생성
1. **비즈니스 페이지** 접근
2. **프로젝트 센터** → 프로젝트 선택
3. **수입 매칭** 버튼 클릭
4. 거래 선택하여 매칭 확인

**확인 항목**:
- [ ] 수입 매칭 성공 토스트 메시지
- [ ] 대시보드로 돌아가기
- [ ] VAT 카드에 금액 표시 (수입의 10%)
  - 예: 수입 1,000,000 → VAT 카드에 100,000원 표시

### 3-3. 월별 누적 확인
1. 같은 달에 여러 수입 매칭
   - 첫 번째: 500,000 (VAT 50,000)
   - 두 번째: 300,000 (VAT 30,000)
2. VAT 카드에 표시되는 금액 확인

**확인 항목**:
- [ ] VAT 카드에 80,000원 표시 (50,000 + 30,000)
- [ ] 합산이 정확하게 작동

### 3-4. DB 데이터 확인
**Supabase Dashboard** → `vat_reserves` 테이블

**확인 항목**:
- [ ] 현재 월(2026-03) 레코드 존재
- [ ] total_income = 800,000 (누적)
- [ ] vat_10_percent = 80,000 (누적)
- [ ] status = 'pending'

---

## 📋 4단계: 문서 확인 (5분)

### 4-1. 진행 상황 문서 읽기
다음 파일 확인:
```
docs/planning/TASK_1_PROGRESS.md
docs/planning/TASK_2_PROGRESS.md
docs/planning/IMPLEMENTATION_SUMMARY.md (현재)
docs/planning/PRIORITY_1_IMPLEMENTATION.md
```

**확인 항목**:
- [ ] 모든 문서 읽음
- [ ] 타입 이슈 해결 방법 이해함 (as any 캐스트)
- [ ] 다음 단계 이해함 (Task 3)

### 4-2. 코드 리뷰
다음 파일들의 주석과 로직 확인:
```
src/entities/crew/api/crew-api.ts
src/entities/vat/api/vat-api.ts
src/widgets/vat-reserve-card/ui/VatReserveCard.tsx
```

**확인 항목**:
- [ ] 함수 로직 이해함
- [ ] 주석이 명확함
- [ ] as any 캐스트 위치 파악함

---

## 🎉 5단계: 완료 표시 (2분)

### 5-1. 진행 상황 업데이트
**파일**: `docs/planning/PRIORITY_1_IMPLEMENTATION.md`

다음 섹션 업데이트:
```
## 📊 진행 상황 추적

| Task | 상태 |
|---|---|
| Task 1: 크루 3.3% | ✅ 완료 및 테스트 검증 완료 |
| Task 2: 부가세 추정 | ✅ 완료 및 테스트 검증 완료 |
| Task 3: 고정비 자동 | ⚪ 준비 중 |
```

- [ ] PRIORITY_1_IMPLEMENTATION.md 업데이트

### 5-2. 다른 문서 업데이트
**선택사항**: 다음 파일들도 업데이트하면 좋음:
```
docs/planning/PHASE4_TASKS.md
docs/planning/PHASE4_PLAN_V2.md
```

- [ ] 선택 업데이트 완료 (선택사항)

---

## 🚀 6단계: Task 3 준비 (선택사항)

### 6-1. Task 3 계획 검토
**파일**: `docs/planning/PRIORITY_1_IMPLEMENTATION.md` → Task 3 섹션

**확인 항목**:
- [ ] 고정비 테이블 설계 이해함
- [ ] 자동 기록 스케줄러 개념 이해함
- [ ] 설정 UI 필요성 이해함

### 6-2. Task 3 준비 작업
선택적으로 다음 작업 시작:
1. 기존 categories/transactions 테이블 구조 검토
2. `recurring_expenses` 테이블 설계
3. 고정비 API 함수 설계

- [ ] Task 3 설계 검토 (선택사항)

---

## ❓ 문제 해결 FAQ

### Q: 크루 드롭다운이 비어 있음
**A**:
1. 크루 관리 페이지에서 크루 추가 필요
2. DB 확인: Supabase → crew_profiles 테이블에 is_active = true 확인

### Q: VAT 카드가 보이지 않음
**A**:
1. BusinessDashboard.tsx 확인: VatReserveCard 임포트 여부
2. 수입 매칭 테스트: 금액이 있어야 카드에 표시됨

### Q: TypeScript 오류 발생
**A**:
```bash
npx tsc --noEmit
```
로 구체적 오류 확인, `as any` 캐스트 추가 필요

### Q: 데이터가 DB에 저장되지 않음
**A**:
1. Supabase 연결 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. RLS 정책 확인 (user_id 기반 필터링)

### Q: 계산이 잘못됨
**A**:
1. 크루: 실수령액 = 지급액 × (1 - 원천징수율)
   - 예: 1,000,000 × (1 - 0.033) = 967,000
2. VAT: vat_amount = 수입액 × 0.1
   - 예: 1,000,000 × 0.1 = 100,000

---

## 📊 검증 요약 체크리스트

```
[1단계] 코드 상태
  [ ] TypeScript 컴파일 성공
  [ ] 모든 파일 존재 확인

[2단계] Task 1 기능
  [ ] 크루 관리 페이지 접근 가능
  [ ] 크루 추가 기능 작동
  [ ] 일당 입력 시 크루 선택 및 원천징수율 자동 설정
  [ ] DB 데이터 저장 확인

[3단계] Task 2 기능
  [ ] 대시보드에 VAT 카드 표시
  [ ] 수입 매칭으로 VAT 자동 생성
  [ ] 월별 누적 계산 확인
  [ ] DB 데이터 저장 확인

[4단계] 문서
  [ ] 모든 진행 상황 문서 읽음
  [ ] 코드 이해함

[5단계] 완료
  [ ] 진행 상황 문서 업데이트
  [ ] 완료 표시
```

---

## ⏱️ 예상 소요 시간

| 단계 | 시간 | 비고 |
|------|------|------|
| 1단계: 코드 상태 | 5분 | 빠름 |
| 2단계: Task 1 | 10분 | UI 테스트 |
| 3단계: Task 2 | 10분 | UI 테스트 |
| 4단계: 문서 | 5분 | 읽기 |
| 5단계: 완료 | 2분 | 표시 |
| 6단계: Task 3 준비 | 15분 | 선택사항 |
| **총합** | **~40분** | 6단계까지 모두 |

---

## 📞 연락처 및 참고

### 참고 문서
- `TASK_1_PROGRESS.md` - Task 1 상세 정보
- `TASK_2_PROGRESS.md` - Task 2 상세 정보
- `IMPLEMENTATION_SUMMARY.md` - 전체 요약
- `PRIORITY_1_IMPLEMENTATION.md` - 전체 계획

### 다음 단계
- Task 1, 2 테스트 완료 후 → Task 3 시작 준비
- 문제 발생 시 → 각 TASK_*_PROGRESS.md의 문제 해결 섹션 참고

---

**예상 완료 시간**: 2026-03-10 (내일)
**상태**: ✅ 코드 완료 / 🧪 검증 대기
**담당자**: Antigravity

**성공 기준**:
- [ ] 2단계 모든 항목 확인
- [ ] 3단계 모든 항목 확인
- [ ] TypeScript 컴파일 성공
- [ ] 5단계 문서 업데이트 완료
