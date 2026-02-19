# MDT_CATALOG.md (Updated for 2025 KwangYoung Ledger)

**Role:** Master Reference for Business Logic, Category Trees, and Legacy Mapping.
**Usage:** AI Agents must refer to this file to populate `mdt_*` tables and `assets_liabilities`. **Do NOT hardcode these values.**

## 1. 2026 Dual-Track Category Master (Standard Tree)
*Target Table: `mdt_categories`*

2025 쾅영부부 가계부의 대분류/소분류 체계를 기준으로 작성되었습니다.

### 🏠 Track A: Personal Life & Finance (가계부)
*UI Theme: Warm / Nelna Style*

#### **🛒 지출 (Expenses)**
*   **🏠 주거비:** 전세이자, 관리비, 수도요금, 도시가스, 전기요금
*   **🛍️ 물품구입비:** 생활필수품, 운동용품, 세탁비, 가전/가구, 기타물품, 수리비
*   **🍽️ 식비:** 식자재, 외식, 디저트/간식, 배달, 편의점, 코스트코
*   **☕️ 커피:** 커피 (단일 소분류)
*   **🚌 교통비:** 대중교통, 택시비, 기차/버스, 차량관리비, 과태료, 차량렌탈, 주유비, 주차비, 통행료/톨비
*   **💰 보험료:** 실비보험, 자동차보험, 건강보험, 생명보험, 여행자보험, 국민연금
*   **🩺 건강:** 병원비, 약제비, 건강식품, 기타건강비
*   **🎬 문화생활:** 영화, 도서, 학원/수강, 전시, 운동
*   **� 구독/서비스:** 넷플릭스, 애플, Chat GPT, 어도비, 구글, 유튜브 프리미엄, 디즈니플러스, ENVATO, 쿠팡, 기타
*   **📞 통신비:** 쾅 통신요금, 인터넷, 영 통신요금, 우편료
*   **�💻 사업비:** 장비, 식비, 출장비, 진행비, 인건비, 사업 관련 세금
    *(Note: Track B와 연동될 수 있으나, 가계부 지출 관점에서는 이 항목을 사용)*
*   **💛 기부금:** 헌금, 십일조, 공간, 정기후원
*   **🏛️ 세금:** 지방세, 자동차세, 관세, 과태료, 재산세, 양도세, 증여세, 기타세금
*   **🎁 경조/선물:** 가족/친척, 교회, 지인/친구, 모임 회비
*   **💰 저축:** 청약
*   **�♀️ 꾸밈비:** 뷰티/화장품, 쾅 의류/잡화, 세탁수선비, 미용/헤어, 영 의류/잡화
*   **✈️ 여행:** 식비, 이동수단, 기념품/쇼핑, 서비스/데이터, 숙박비, 관광/입장료, 항공비, 그외
*   **⚠️ 기타비용:** 기타, 지급수수료

#### **💵 수입 (Income)**
*   **💼 사업소득:** 쾅 사업소득, 영 사업소득, 쾅영 사업소득, 블로그
*   **� 금융소득:** 이자소득

#### **🔄 이체 (Transfer)**
*   **이체:** 내부 이체, 카드대금 결제, 저축 불입

---

### � Track B: Business ERP (비즈니스 - Placeholder)
*UI Theme: Cool / Professional Style (Dark Mode)*
*(가계부 사업비 항목과 별도로, 상세 견적/정산을 위한 트랙입니다. 추후 구체화 예정)*

*   **💡 Lighting Crew**
    *   `Income`: 💵 촬영 회차비, 🔦 장비 렌탈료
    *   `Expense`: 👷♂️ 크루 인건비(3.3%), 🍱 식대, ⛽️ 유류비, 🔌 자재/소모품
*   **🎨 Design & Photo**
    *   `Income`: 🖼️ 디자인 용역, 📷 사진 촬영, 🛒 아트 프린트 판매
    *   `Expense`: ☁️ 구독(Adobe), 🖨️ 인쇄/출력, 📦 포장/배송

---

## 2. Business Rules & Formulas
*Target Table: `mdt_business_rules`*

### 2.1 💰 Payroll (인건비)
*   **Rule Key:** `PAYROLL_WHT_RATE` (0.033)
*   **Formula:** `Net Pay` = `Gross Pay` * (1 - `PAYROLL_WHT_RATE`)

### 2.2 📊 Profitability (수익성)
*   **Formula:** `Net Profit` = `Revenue` - (`COGS` + `Labor` + `Overhead`)

---

## 3. ALM (Assets & Liabilities) - 2025 Initial State
*Target Table: `assets_liabilities`*

2025년 가계부 설정을 기반으로 한 초기 계좌 목록입니다. **시드 생성 시 이 데이터를 `assets_liabilities` 테이블에 반드시 포함하십시오.**

### 💰 자산 (Assets)
*   **대분류: 💰현금·예금**
    *   `보통예금`: 의영 개인/기업은행, 쾅영부부 입출금/기업은행, 쾅영 생활비/국민은행, 수입/우리은행, 광준/개인계좌/기업은행, 광준/사업자 계좌/기업은행
    *   `CMA`: KB 예수금
    *   `현금`: 현금
*   **대분류: 📈 저축·투자**
    *   `예적금`: 청년 주택드립 청약통장/우리은행, 세이프박스/카카오뱅크, 경조사/카카오뱅크
    *   `주식`: KB 주식
*   **대분류: 🚘 기타자산**
    *   `선급비용`: 미담헤어

### 🏦 부채 (Liabilities)
*   **대분류: 💳 신용카드**
    *   `할부`: 의영/삼성카드(할부), 광준/사업자 삼성카드(할부), 쾅영/현대카드(할부), 광준/기업은행카드(할부)
    *   `일시불`: 광준/사업자 삼성카드(일시불), 쾅영/현대카드(일시불)
*   **대분류: 🏦 장기부채**
    *   `학자금대출`: 학자금 광준/사업자/기업은행

---

## 4. Legacy Bridge Rules (2024 -> 2026)
*Target Table: `mdt_allocation_rules`*

2024년 엑셀 데이터(Expense 열 위치)를 2025년 표준 카테고리로 매핑하는 규칙입니다.

*   **Expense 1 (주거비)** -> `🏠 주거비 > 관리비` (Default)
*   **Expense 2 (생활비)** -> `🛍️ 물품구입비 > 생활필수품`
*   **Expense 3 (식비)** -> `🍽️ 식비 > 식자재`
*   **Expense 4 (꾸밈비)** -> `💇♀️ 꾸밈비 > 뷰티/화장품`
*   **Expense 5 (보험료)** -> `💰 보험료 > 실비보험`
*   **Expense 6 (건강비)** -> `🩺 건강 > 병원비`
*   **Expense 7 (교통비)** -> `🚌 교통비 > 대중교통`
*   **Expense 8 (취미/여가)** -> `🎬 문화생활 > 영화`
*   **Expense 9 (자기계발)** -> `� 문화생활 > 학원/수강`
*   **Expense 10 (경조/선물)** -> `🎁 경조/선물 > 지인/친구`
*   **Expense 11 (여행)** -> `✈️ 여행 > 숙박비`
*   **Expense 12 (금융비용)** -> `💵 금융소득` (수입 차감) or `⚠️ 기타비용 > 지급수수료`
*   **Expense 13 (기부금)** -> `💛 기부금 > 정기후원`
*   **Expense 14 (모임/약속)** -> `🍽️ 식비 > 외식`
*   **Expense 15 (기타비용)** -> `⚠️ 기타비용 > 기타`
*   **Expense 16 (사업)** -> `👩💻 사업비 > 진행비`
*   **Expense 17 (커피)** -> `☕️ 커피 > 커피`

---

### 📝 Architect's Guide for Agent (Implementation)
1.  **Seed Reset Required:** 이 파일이 업데이트되면 반드시 `supabase/seed.sql`을 재생성하고 DB를 리셋해야 합니다.
2.  **Hierarchy Logic:** `mdt_categories` 테이블에 넣을 때, 상단의 **대분류(이모지 포함)**를 먼저 Insert하고, 그 `id`를 받아와서 하단의 **소분류**를 Insert 하십시오.
3.  **Account Mapping:** `assets_liabilities` 테이블에는 섹션 3의 구체적인 계좌명(예: "의영 개인 / 기업은행")을 `name`으로 저장하고, 대분류(예: "보통예금")를 `category` 또는 `tags`로 관리하십시오.
