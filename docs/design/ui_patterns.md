# UI Patterns & Component Guide (V1.0)

> **목적:** 디자인 테마가 교체되어도 컴포넌트 구조와 Prism 토큰 규칙은 유지됩니다.
> 이 문서는 "포장지(테마)와 알맹이(구조)를 분리"하는 것을 목표로 합니다.
>
>
> **관계 문서:**
> - 토큰 시스템 → `docs/design/prism_system.md`
> - 대시보드 레이아웃 → `docs/design/dashboard_design.md`
> - 코딩 규칙(색상 강제) → `.agents/rules/02_coding_standards.md`

---

## 핵심 원칙

1. **시맨틱 토큰 전용** — `bg-white`, `text-zinc-400` 같은 하드코딩 색상 절대 금지.
2. **tactile-panel / tactile-card 우선** — 컨테이너는 항상 Prism V3.0 유틸리티 클래스 사용.
3. **Pill & Rounding** — 버튼은 `rounded-full`, 카드는 `rounded-[2rem]` 이상 준수.
4. **인터랙션 상태 포함** — 모든 컴포넌트 패턴에 tactile-pressed 상태를 명시.

---

## 1. 페이지 레이아웃 컨테이너

### 1.1. 기본 페이지 래퍼

```tsx
// ✅ 모든 페이지의 최상위 래퍼
<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
  {/* 페이지 헤더 - 촉각적 패널 */}
  <div className="tactile-panel p-8 rounded-[2.5rem]">
    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">페이지 제목</h1>
    <p className="text-base text-muted-foreground mt-2">부제목 또는 설명</p>
  </div>

  {/* 콘텐츠 영역 */}
</div>
```

### 1.2. 50:50 대시보드 스플릿

```tsx
// ✅ 대시보드 전용 — Personal(좌) / Business(우) 분할
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Personal Section — 부드러운 인포셋 */}
  <section className="tactile-panel rounded-[2rem] p-8 space-y-6">
    <div className="flex items-center gap-3 border-b border-border/50 pb-4">
      <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
      <h2 className="text-base font-bold text-foreground uppercase tracking-tight">
        가계부
      </h2>
    </div>
    {/* ... */}
  </section>

  {/* Business Section */}
  <section className="tactile-panel rounded-[2rem] p-8 space-y-6">
    <div className="flex items-center gap-3 border-b border-border/50 pb-4">
      <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
      <h2 className="text-base font-bold text-foreground uppercase tracking-tight">
        비즈니스
      </h2>
    </div>
    {/* ... */}
  </section>
</div>
```

---

## 2. 카드 컴포넌트

### 2.1. 요약 지표 카드 (Metric Card)

대시보드의 "이번 달 총 지출", "미수금 총액" 등 핵심 숫자를 표시할 때 사용.

```tsx
// ✅ 요약 지표 카드 구조 - Claymorphic Shadow 적용
<div className="tactile-card rounded-3xl p-6 space-y-2 hover:translate-y-[-2px] transition-transform">
  <p className="text-sm font-semibold text-muted-foreground">{label}</p>
  <p className="text-4xl font-black text-foreground tracking-tighter">
    {formattedAmount}
  </p>
  {/* 선택적: 보조 지표 */}
  <div className="pt-2">
    <span className="text-xs font-bold px-2 py-1 bg-primary/10 rounded-full text-primary">
      {subtext}
    </span>
  </div>
</div>
```

### 2.2. 프로그레스 바 카드 (Budget/Goal Card)

복잡한 차트 대신 Progress Bar로 달성률을 표현. (`dashboard_design.md` §3.1 기반)

```tsx
import { Progress } from '@/shared/ui/progress';

// ✅ 예산 소진율 카드 - 부드러운 젤리 질감
<div className="tactile-card rounded-3xl p-6 space-y-4">
  <div className="flex justify-between items-center">
    <p className="text-base font-bold text-foreground">{title}</p>
    <span className="text-sm font-black text-primary px-3 py-1 bg-background rounded-full shadow-inner">
      {percentage}%
    </span>
  </div>
  <Progress value={percentage} className="h-3 rounded-full bg-secondary" />
  <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">
    <span>USED: {used}</span>
    <span>LEFT: {remaining}</span>
  </div>
</div>
```

### 2.3. 칸반 아이템 카드 (Kanban Card)

`/business` 수입 파이프라인 칸반에서 프로젝트/수입 항목을 표시.

```tsx
// ✅ 칸반 카드 — 둥근 조약돌 형태, 클릭 시 깊이감 변화
<div
  className="tactile-card rounded-[1.5rem] p-5 space-y-3 cursor-pointer
             active:shadow-inner active:scale-[0.98] transition-all duration-200"
  onClick={onCardClick}
>
  {/* 상단: 제목 + 상태 배지 */}
  <div className="flex items-start justify-between gap-3">
    <p className="text-base font-bold text-foreground leading-tight line-clamp-2">
      {title}
    </p>
    <StatusBadge status={status} className="rounded-full px-3 py-1 text-[10px]" />
  </div>

  {/* 중단: 핵심 수치 */}
  <p className="text-xl font-black text-foreground">{formattedAmount}</p>

  {/* 하단: 메타 정보 */}
  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/70">
    <div className="w-6 h-6 rounded-full bg-muted shadow-sm flex items-center justify-center">
      <User className="w-3 h-3" />
    </div>
    <span>{clientName}</span>
    <span>·</span>
    <span>{dueDate}</span>
  </div>
</div>
```

---

## 3. 테이블 컴포넌트

### 3.1. 기본 데이터 테이블

`/personal/transactions` 거래 내역 테이블 패턴.

```tsx
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/shared/ui/table';

// ✅ 데이터 테이블 구조
<div className="tactile-panel rounded-[2rem] overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="border-border hover:bg-transparent">
        <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider">
          {columnLabel}
        </TableHead>
        {/* ... */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          className="border-border hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onRowClick(row)}
        >
          <TableCell className="text-foreground">{row.value}</TableCell>
          {/* ... */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### 3.2. 빈 상태 (Empty State)

```tsx
// ✅ 테이블/목록의 빈 상태 — 항상 명시
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
    <IconComponent className="h-6 w-6 text-muted-foreground" />
  </div>
  <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
  <p className="text-xs text-muted-foreground mt-1">{emptyDescription}</p>
</div>
```

---

## 4. 모달 / 다이얼로그

### 4.1. 표준 확인/취소 다이얼로그

CRUD 폼 제출, 삭제 확인 등에 사용.

```tsx
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

// ✅ 표준 모달 구조
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription className="text-muted-foreground">
        {description}
      </DialogDescription>
    </DialogHeader>

    {/* 폼 또는 콘텐츠 영역 */}
    <div className="space-y-4 py-2">
      {/* ... */}
    </div>

    <DialogFooter className="gap-2">
      <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
        취소
      </Button>
      <Button onClick={onConfirm} disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            처리 중...
          </>
        ) : (
          confirmLabel
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4.2. 파괴적 행위 확인 모달 (Destructive)

삭제, 초기화 등 불가역 행위 전 사용.

```tsx
// ✅ Destructive 모달 — 확인 버튼에 variant="destructive" 필수
<DialogFooter className="gap-2">
  <Button variant="outline" onClick={onClose}>취소</Button>
  <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
    삭제 확인
  </Button>
</DialogFooter>
```

---

## 5. 폼 컴포넌트

### 5.1. 표준 입력 폼 필드

```tsx
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

// ✅ 라벨 + 입력 + 에러 메시지 세트
<div className="space-y-1.5">
  <Label htmlFor={id} className="text-sm font-medium text-foreground">
    {label}
    {required && <span className="text-destructive ml-1">*</span>}
  </Label>
  <Input
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={cn(error && "border-destructive focus-visible:ring-destructive")}
  />
  {error && (
    <p className="text-xs text-destructive">{error}</p>
  )}
</div>
```

### 5.2. 금액 입력 필드

```tsx
// ✅ 금액 입력 — 우측 통화 단위 표시
<div className="space-y-1.5">
  <Label className="text-sm font-medium text-foreground">{label}</Label>
  <div className="relative">
    <Input
      type="number"
      value={value}
      onChange={onChange}
      className="pr-8"
      placeholder="0"
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
      ₩
    </span>
  </div>
</div>
```

### 5.3. Select 필드

```tsx
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/shared/ui/select';

// ✅ 선택 필드
<div className="space-y-1.5">
  <Label className="text-sm font-medium text-foreground">{label}</Label>
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger>
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

## 6. 배지 (Badge)

### 6.1. 상태 배지 패턴

프로젝트 상태, 결제 상태 등을 표시.

```tsx
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

// ✅ 상태별 배지 — variant 대신 className으로 시맨틱 색상 적용
const STATUS_STYLES: Record<string, string> = {
  active:    'bg-primary/10 text-primary border-primary/20',
  pending:   'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

<Badge
  variant="outline"
  className={cn("text-xs font-medium", STATUS_STYLES[status])}
>
  {STATUS_LABELS[status]}
</Badge>
```

---

## 7. 로딩 상태

### 7.1. 페이지/섹션 로딩

```tsx
// ✅ 콘텐츠 로딩 중 — 스피너
<div className="flex items-center justify-center py-16">
  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
</div>
```

### 7.2. 버튼 제출 중

```tsx
// ✅ 폼 제출 중 — 버튼 내부 스피너
<Button disabled={isPending}>
  {isPending ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />처리 중...</>
  ) : (
    submitLabel
  )}
</Button>
```

---

## 8. 글로벌 FAB (Floating Action Button)

화면 우하단 고정. 퀵 액션 메뉴 트리거.

```tsx
// ✅ FAB 컨테이너 — fixed 포지셔닝
<div className="fixed bottom-6 right-6 z-50">
  {/* 메뉴 펼쳐진 상태 (선택적) */}
  {isOpen && (
    <div className="flex flex-col gap-2 mb-3 items-end animate-in slide-in-from-bottom-2 duration-200">
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={action.onClick}
          className="flex items-center gap-2 tactile-card rounded-full px-4 py-2 text-sm font-medium
                     text-foreground hover:bg-accent transition-all duration-150"
        >
          <action.Icon className="h-4 w-4 text-primary" />
          {action.label}
        </button>
      ))}
    </div>
  )}

  {/* 메인 FAB 버튼 */}
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="h-14 w-14 rounded-full bg-primary text-primary-foreground
               flex items-center justify-center shadow-lg
               hover:bg-primary/90 transition-all duration-200
               hover:scale-105 active:scale-95"
  >
    <Plus className={cn("h-6 w-6 transition-transform duration-200", isOpen && "rotate-45")} />
  </button>
</div>
```

---

## 9. 사이드 패널 (Sheet)

모바일에서 하단 시트로, 데스크탑에서 우측 슬라이드 패널로 활용.

```tsx
import {
  Sheet, SheetContent, SheetDescription,
  SheetHeader, SheetTitle
} from '@/shared/ui/sheet'; // 미구현 시 Dialog로 대체 가능

// ✅ 상세 보기 / 편집 패널
<Sheet open={isOpen} onOpenChange={onClose}>
  <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
    <SheetHeader className="pb-4 border-b border-border">
      <SheetTitle className="text-foreground">{title}</SheetTitle>
      <SheetDescription className="text-muted-foreground">
        {description}
      </SheetDescription>
    </SheetHeader>
    <div className="mt-6 space-y-6">
      {/* 상세 콘텐츠 */}
    </div>
  </SheetContent>
</Sheet>
```

> **참고:** `@/shared/ui/`에 `sheet.tsx`가 없으면 `dialog.tsx`로 동일한 UX 구성 가능.

---

## 10. 탭 네비게이션

페이지 내 섹션 전환 (예: 프로젝트 내 일일 기록 / 수입 / 지출 탭).

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';

// ✅ 컨텐츠 탭 — 항상 tactile-panel 컨테이너 안에 배치
<div className="tactile-panel rounded-[2rem] p-1">
  <Tabs defaultValue={defaultTab}>
    <TabsList className="w-full bg-transparent">
      <TabsTrigger
        value="tab1"
        className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
      >
        탭 제목
      </TabsTrigger>
    </TabsList>

    <TabsContent value="tab1" className="mt-4 px-4 pb-4">
      {/* 탭 콘텐츠 */}
    </TabsContent>
  </Tabs>
</div>
```

---

## ⚠️ 금지 패턴 (Anti-Patterns)

```tsx
// ❌ 하드코딩된 색상
<div className="bg-white text-zinc-400 bg-slate-900/40 border-white/10">

// ❌ 인라인 스타일로 색상 지정
<div style={{ backgroundColor: '#ffffff' }}>

// ❌ 상태 없는 버튼 (loading 처리 누락)
<Button onClick={handleSubmit}>저장</Button>  // isPending 처리 없음

// ❌ 빈 상태 누락
{items.map(item => <Card key={item.id} />)}  // items가 빈 배열일 때 처리 없음

// ✅ 올바른 패턴
<div className="tactile-panel bg-background text-foreground border-none">
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
| :--- | :--- | :--- |
| V1.0 | 2026-03-10 | 초기 작성 — 기존 코드베이스 패턴 기반 |
| V1.1 | 2026-03-11 | Prism System V3.0 (Tactile UI) 반영 및 클래스 체계 개편 |
