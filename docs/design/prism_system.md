# Prism System V3.0 (Tactile UI / Claymorphism)

BrightGlory의 디자인 시스템을 'Tactile UI'의 부드럽고 입체적인 감성으로 재정의합니다. 물리적인 부피감, 만지고 싶은 질감, 그리고 따뜻한 정서를 핵심 가치로 삼습니다.

## 1. Core Principles
- **Volume (부피감)**: 빛과 그림자를 이용한 부드러운 3D 입체 효과.
- **Softness (부드러움)**: 극단적으로 둥근 모서리와 유기적인 형태.
- **Physical Feedback (물리적 피드백)**: 실제 버튼을 누르는 듯한 내부 그림자 효과.
- **Friendly Clarity (친근한 명확성)**: 따뜻한 톤의 배경과 대비되는 명확한 타이포그래피.

## 2. Visual Tokens

### Color Palette (Warm & Pastel)
- **Primary Base**: Bright Indigo (`hsl(250 85% 60%)`)
- **Backgrounds**:
  - **Light Mode**: Warm Off-White (`hsl(35 30% 98%)`)
  - **Dark Mode**: Soft Deep Slate (`hsl(222 25% 10%)`) - 다크 모드에서도 부드러운 질감 유지.
- **Accents**: 피로도가 낮은 파스텔톤 (Mint, Peach, Lavender).

### Shadows & Elevation (The "Tactile" Core)
Tactile UI의 핵심은 공간감과 물리적 피드백입니다. 이를 `globals.css`에 직접 정의하여 전역 컨테이너에 실제 질감을 부여합니다.

```css
:root {
  /* Light Mode (Background: Warm Off-White hsl(35 30% 98%) / #fdfbf7) */
  --tactile-shadow-sm: 8px 8px 16px #eadecf, -8px -8px 16px #ffffff;
  --tactile-shadow-md: 12px 12px 24px #eadecf, -12px -12px 24px #ffffff;
  --tactile-inner: inset 6px 6px 12px #eadecf, inset -6px -6px 12px #ffffff;
  --tactile-glow: 0 0 15px rgba(99, 102, 241, 0.4), inset 2px 2px 4px rgba(255, 255, 255, 0.3);
}

.dark {
  /* Dark Mode (Background: Soft Deep Slate hsl(222 25% 10%) / #13151a) */
  /* 다크모드에서는 빛의 대비가 적으므로 더 어두운 그림자와 미세한 밝은 그림자를 배치합니다 */
  --tactile-shadow-sm: 8px 8px 16px #0c0d11, -8px -8px 16px #1a1d23;
  --tactile-shadow-md: 12px 12px 24px #0c0d11, -12px -12px 24px #1a1d23;
  --tactile-inner: inset 4px 4px 8px #0c0d11, inset -4px -4px 8px #1a1d23;
  --tactile-glow: 0 0 15px rgba(99, 102, 241, 0.3), inset 2px 2px 4px rgba(255, 255, 255, 0.1);
}
```

### Borders & Rounding
- **Borders**: 테두리는 기본적으로 제거(0px)하고 그림자로 영역을 구분합니다. 필요시 `rgba(255,255,255,0.5)` 같은 반투명 흰색 선을 하이라이트로 사용합니다.
- **Rounding**: `radius` 값을 크게 주어 유기적인 형태를 만듭니다.
  - 기본 컨테이너: `1.5rem ~ 2rem (24px~32px)`
  - 버튼/배지: `9999px` (완벽한 Pill 형태)

### Motion & Animation
- **Spring Physics**: 딱딱한 Linear 애니메이션 대신, 탄성 있는 스프링 애니메이션(Bouncy)을 사용하여 젤리를 누르는 듯한 물리적 감각을 제공합니다.
- **Interaction**: 버튼은 hover 시 살짝 커지고(`scale-105`), active 시 작아지며 내부 그림자로 변환(`scale-95`, `tactile-inner`)되어야 합니다.

## 3. Component Guidelines

### CSS Utilities (`globals.css`)
`ui_patterns.md`에서 규정한 찰흙 질감 컨테이너들을 실제 렌더링하기 위한 전역 유틸리티 클래스 정의입니다. `globals.css`의 `@layer components` 내부에 위치합니다.

```css
@layer components {
  /* 글로벌 컨테이너 패턴 */
  .tactile-panel {
    @apply bg-background border-none rounded-[2rem] md:rounded-[2.5rem] transition-all duration-300;
    box-shadow: var(--tactile-shadow-sm);
  }

  /* 상호작용 가능한 카드 패턴 */
  .tactile-card {
    @apply bg-background border-none rounded-[1.5rem] transition-all duration-300;
    box-shadow: var(--tactile-shadow-sm);
  }
  
  .tactile-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--tactile-shadow-md);
  }

  .tactile-card:active,
  .tactile-pressed {
    transform: translateY(1px) scale(0.98);
    box-shadow: var(--tactile-inner);
  }

  /* 클릭 가능한 버튼/배지 패턴 */
  .tactile-button {
    @apply bg-background border border-white/40 dark:border-white/5 rounded-full transition-all duration-200 font-bold;
    box-shadow: var(--tactile-shadow-sm);
  }

  .tactile-button:hover {
    @apply scale-105;
    box-shadow: var(--tactile-shadow-md);
  }

  .tactile-button:active {
    @apply scale-95;
    box-shadow: var(--tactile-inner);
  }
}
```

---
V2.1에서 V3.0(Tactile UI)으로 마이그레이션 시, 기존에 하드코딩되었던 색상 및 형태 토큰은 위에서 정의한 CSS 변수와 `@layer components`의 `tactile-*` 유틸리티 클래스로 전면 교체되어야 합니다.
