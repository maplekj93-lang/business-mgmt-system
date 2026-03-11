# Task 1 진행 상황: 크루 3.3% 자동 계산
**최종 업데이트**: 2026-03-09 22:00 KST
**담당자**: Claude → Antigravity에게 인수

---

## ✅ 완료된 작업

### 1. 데이터베이스 마이그레이션 ✅
- **파일**: 직접 Supabase에 적용
- **테이블**: `crew_profiles` 생성
- 필드: id, user_id, name, role, withholding_rate (기본 0.033), account_info, phone, is_active, notes, created_at, updated_at
- **RLS 정책**: 사용자별 데이터 격리 완료

### 2. TypeScript 타입 정의 ✅
- **파일**: `src/entities/crew/model/types.ts` 생성
- 인터페이스: `CrewProfile`
- 상수: `CREW_ROLES`, `DEFAULT_WITHHOLDING_RATES`

### 3. API 함수 구현 ✅
- **파일**: `src/entities/crew/api/crew-api.ts` 생성
- 함수:
  - `getCrewProfiles()` - 활성 크루 목록 조회 (user_id별)
  - `createCrewProfile()` - 새 크루 추가
  - `updateCrewProfile()` - 크루 정보 수정
  - `deleteCrewProfile()` - 크루 삭제
  - `getCrewByName()` - 특정 크루 조회

### 4. 크루 관리 페이지 (Settings) ✅
- **경로**: `src/app/(dashboard)/settings/crew/page.tsx` 생성
- 기능:
  - 크루 목록 표시 (이름, 역할, 원천징수율, 계좌, 연락처)
  - 크루 추가/수정/삭제 다이얼로그
  - 역할별 기본 원천징수율 자동 제안

### 5. 일당 입력 UI 수정 ✅
- **파일**: `src/features/log-daily-rate/ui/LogDailyRateModal.tsx` 수정
- 변경사항:
  - 크루 이름 Input → Select (crew_profiles에서 로드)
  - 크루 선택 시 withholding_rate 자동 설정
  - 지급액 입력 → 실시간 "실수령액" 계산 표시 (녹색)
  - 크루 추가 버튼의 기본값 0.033으로 수정

---

## ⚠️ 현재 상태: TypeScript 타입 이슈

### 문제
Supabase의 생성된 타입이 아직 `crew_profiles` 테이블을 인식하지 못함:
```
Argument of type '"crew_profiles"' is not assignable to parameter of type '"business_profiles" | "clients" | "assets" | ...
```

### 원인
- `src/shared/api/supabase/types.ts`가 기본 테이블만 정의하고 있음
- Supabase의 자동 생성 타입에 crew_profiles가 추가되었지만, 수동 정의가 부분적임

### 해결 방법 (Antigravity를 위함)

#### 방법 1: 자동 타입 재생성 (권장)
CLI에서:
```bash
# Supabase CLI로 타입 재생성
npx supabase gen types typescript > src/shared/api/supabase/types.ts
```

#### 방법 2: 수동 타입 업데이트
`src/shared/api/supabase/types.ts`를 다음과 같이 업데이트:
```typescript
export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" }
  public: {
    Tables: {
      // 기존 테이블들...
      crew_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          role?: string
          withholding_rate: number
          account_info?: string
          phone?: string
          is_active: boolean
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
        Relationships: []
      }
    }
  }
}
```

---

## 🧪 테스트 체크리스트

```
[ ] TypeScript 컴파일 에러 해결
    → ./node_modules/.bin/tsc --noEmit 통과 확인

[ ] 크루 설정 페이지 접근 가능
    → http://localhost:3000/settings/crew 접근 확인

[ ] 크루 추가 기능
    → "새 크루 추가" 버튼 클릭
    → 이름: "박세컨"
    → 역할: "세컨"
    → 원천징수율: 3.3% (자동)
    → 계좌: "국민은행 123-456"
    → 저장 후 목록에 나타나는지 확인

[ ] 일당 입력 시 크루 선택
    → 비즈니스 페이지 → "현장 일당 기록 추가"
    → "크루 인건비" 펼치기
    → 크루 이름 선택 (드롭다운에 "박세컨" 표시)
    → 역할, 원천징수율 자동 설정 확인

[ ] 실수령액 자동 계산
    → 세전 금액: 1,000,000
    → 원천징수율: 3.3% (0.033)
    → 실수령액: 967,000원 자동 표시 (1,000,000 * 0.967)

[ ] DB 저장 확인
    → 크루 페이먼트의 withholding_rate 값 확인
    → amount_net 필드 자동 계산 확인 (DB 함수 `amount_net = amount_gross * (1 - withholding_rate)`)
```

---

## 📋 Antigravity를 위한 다음 단계

### 즉시 할 일
1. **TypeScript 타입 이슈 해결**
   - 위 "해결 방법" 참고
   - `tsc --noEmit` 통과 확인

2. **테스트**
   - 위 체크리스트 실행

3. **완료 표시**
   - `docs/planning/PHASE4_TASKS.md`에서 체크 표시 변경:
     ```
     - [x] 크루 3.3% 자동 계산 (완료)
     ```

### Task 2로 이동 (필요시)
- `PRIORITY_1_IMPLEMENTATION.md`의 Task 2: 부가세 자동 추정 참고
- Task 1이 완료되면 같은 방식으로 진행 가능

---

## 📁 생성된 파일 목록

```
src/entities/crew/
├── model/
│   └── types.ts (신규 생성)
└── api/
    └── crew-api.ts (신규 생성)

src/app/(dashboard)/settings/crew/
└── page.tsx (신규 생성)

src/features/log-daily-rate/ui/
└── LogDailyRateModal.tsx (수정됨)

docs/planning/
├── PRIORITY_1_IMPLEMENTATION.md (마스터 계획)
└── TASK_1_PROGRESS.md (현재 문서)
```

---

## 💡 팁

- 크루 프로필은 한 번 설정하면 재사용 가능 (선택 드롭다운)
- 원천징수율은 역할별로 다를 수 있으니 개별 조정 가능
- 광준 자신의 경우 원천징수율 = 0 설정
- 테스트 중 DB에서 직접 데이터 수정 가능 (Supabase Dashboard)

---

**마지막 수정**: 2026-03-09 22:00
**상태**: TypeScript 타입 이슈 해결 대기 → 그 후 테스트 진행
