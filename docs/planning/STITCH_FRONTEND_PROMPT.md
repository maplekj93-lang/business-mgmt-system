# 🧵 Google Stitch Frontend Development Prompt

이 문서는 **Google Stitch**를 사용하여 이 프로젝트의 프론트엔드를 고도화하거나 새로운 기능을 설계할 때 복사하여 사용할 수 있는 종합 프롬프트 가이드입니다.

---

## 1. 앱 개요 (App Description)

**App Name:** BrightGlory Business Management System (Total ERP for Freelancers & SMBs)

**Core Concept:** 
개인 가계부와 프리랜서 사업 관리(ERP)가 통합된 시스템입니다. 현장 일당 기록, 프로젝트 파이프라인 관리, 지출 태깅, 견적서 생성을 하나의 흐름으로 연결합니다.

**Target Audience:** 
현장 중심의 전문가, 프리랜서, 소규모 사업자. 프로젝트별 수입/지출을 실시간으로 추적하고 전문적인 문서를 발행해야 하는 사용자.

---

## 2. 디자인 가이드라인 (Design System Rules)

Stitch의 **Style/Theme** 설정에 입력하세요.

- **Aesthetic:** "Premium, Modern, Glassmorphism"
- **Background:** HSL 기반의 세련된 다크/라이트 모드, `backdrop-blur-xl` 다수 사용.
- **Color:** Vibrant Blue (#2563eb)를 메인 포인트로 사용.
- **Card:** `rounded-2xl` (1.5rem), `border-border/40`의 얇은 테두리, 입체적인 호버 효과.
- **Typography:** Inter/Roboto 폰트, 헤더는 `font-black`과 `tracking-tight` 적용.
- **Accents:** 상태별 글로우 효과(shadow)와 부드러운 그라디언트 활용.

---

## 3. 기능 현황 (Feature Status)

### ✅ 이미 구현된 기능 (Implemented)
- **Dashboard 모드 전환**: Personal / Business / Total 모드 필터링.
- **대시보드 요약 위젯**: 프로젝트 수, 매출액, 미결제 건수, 인건비 실시간 요약 (Premium UI).
- **수입 파이프라인 (Kanban)**: Inquiry → In Progress → Done → Settled 단계별 관리.
- **현장 일당 기록 (Log Modal)**: 크루 인건비, 경비, 청구 요약을 한 번에 입력하는 고도화된 모달.
- **지출 항목 태깅**: 가계부 지출 내역을 특정 프로젝트의 사업비로 연결.
- **견적서 생성기**: 사업자 정보를 바탕으로 A4 규격 PDF 견적서 자동 생성.
- **거래처 즉시 생성**: 프로젝트 생성 흐름에서 인라인으로 신규 거래처 추가.

### 🚀 구현하고 싶은 / 해야 할 기능 (Planned & Desired)
- **통합 캐시플로우 캘린더**: 월별 수입/지출 흐름을 달력 형태로 시각화하는 위젯.
- **원천징수(3.3%) 자동 계산**: 인건비 지급 시 원천세 산출 및 신고용 데이터 정리.
- **자동 분류 룰 엔진**: 가맹점명 기반의 카테고리 자동 매핑 및 학습 기능.
- **수입-입금 자동 매칭**: 통장 입금 내역과 파이프라인 카드를 해시 기반으로 자동 매칭.
- **모바일 최적화 레이아웃**: 현장에서 스마트폰으로 빠르게 입력 가능한 전용 UI 모드.

---

## 4. Stitch 요청용 프롬프트 예시 (Sample Prompt)

Stitch의 **Prompt** 입력창에 아래 내용을 상황에 맞춰 수정해서 입력하세요.

> "현재 [BrightGlory ERP] 프로젝트의 디자인 시스템(Glassmorphism, Vibrant Blue, Black Typography)을 유지하면서, **[여기에 원하는 기능, 예: 통합 캐시플로우 캘린더 위젯]**의 프론트엔드 UI를 설계해줘. 
> 
> 이 위젯은 다음과 같은 특징을 가져야 해:
> 1. 현재 대시보드의 요약 카드와 같은 유리 질감의 디자인을 가질 것.
> 2. 날짜별로 예상 수입과 확정 지출이 한눈에 보이게 할 것.
> 3. 클릭 시 해당 날짜의 상세 내역 팝오버가 뜰 것.
> 4. Tailwind CSS와 Lucide React 아이콘을 사용할 것."

---

## 5. 참고용 코드 스니펫 (Reference Snippets)

### 프리미엄 카드 (Glassmorphism)
```tsx
<div className="group relative overflow-hidden rounded-2xl border bg-background/50 p-6 backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-2xl hover:shadow-blue-500/10">
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20" />
    <h3 className="text-3xl font-black tracking-tight">{value}</h3>
</div>
```
