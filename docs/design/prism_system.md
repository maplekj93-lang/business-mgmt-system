# The Prism Design System (V2.0)

## 1. Three-Layer Token System
1.  **Primitive:** `Nelna-Pink-500` (디자이너 팔레트)
2.  **Semantic:** `primary`, `background` (개발자 용어)
3.  **Component:** `card-glass` (UI 레시피)

## 2. CSS Variables Strategy
*   `globals.css`에서 `[data-theme="nelna"]` 속성을 사용하여 테마를 스위칭합니다.
*   투명도 조절을 위해 HSL 또는 RGB 값을 변수에 저장합니다.

## 3. Glassmorphism Recipes
*   **Glass Panel:** `bg-glass backdrop-blur-glass border border-glass shadow-lg rounded-3xl`
*   **Input:** `bg-white/50 border-white/20 focus:ring-primary`

## 4. Agent Rule
*   "색상을 하드코딩하지 말고 반드시 Semantic Token을 사용하십시오."
*   "테마 확장성을 위해 CSS 변수 기반 설정을 유지하십시오."
