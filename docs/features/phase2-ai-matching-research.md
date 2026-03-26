# Phase 2 Research: AI Matching Engine & Data Patterns

## 1. Overview
Phase 2의 핵심 목표는 **데이터 정리의 자동화**입니다. 현재 사용자가 겪고 있는 가장 큰 페인 포인트는 다양한 결제 수단(카카오페이, 쿠팡, 카드 등)에서 발생하는 파편화된 데이터를 수동으로 분류하고 매칭하는 데 드는 시간 소모입니다.

## 2. Key Findings: Data Patterns

### 2.1 Ambiguous Merchant Names (가맹점명 모호성)
- **카카오페이**: 은행 거래내역에는 "카카오페이" 또는 "카카오페이_결제"로만 표시되어 무엇을 샀는지 알 수 없음.
- **쿠팡**: "쿠팡(Coupang)"으로 통합 표시되나, 실제로는 식비, 생필품, 에셋 구매 등 다양한 성격의 지출이 포함됨.
- **편의점**: "GS25 마포한림점", "씨유(CU)망원로점" 등 지점명이 포함되어 동일 브랜드 인식이 어려움.

### 2.2 Complex Payment Flows (복합 결제 흐름)
- **충전형 결제**: 은행에서 "카카오페이 충전" (-10,000원) 발생 후, 카카오페이 내역에서 실제 "쿠팡 결제" (-10,000원) 발생.
- **이중 기록**: 동일한 지출이 은행 내역과 페이 내역에 중복으로 존재할 수 있으며, 이를 '이체/충전'으로 인식하여 순지출을 중복 계산하지 않아야 함.

### 2.3 Current Logic Analysis (`upload-batch.ts`)
- **Rule Engine**: 키워드 기반 단순 매칭 (예: "스타벅스" -> "식비").
- **Refund Matching**: 입금 내역 중 금액과 가맹점이 일치하는 과거 지출을 찾아 카테고리를 자동 복사.
- **Asset Linking**: 카드 번호나 은행명을 기반으로 `asset_id`를 연결.

## 3. Challenges
- **Time Sensitivity**: 결제 시점과 충전 시점이 초 단위로 다를 수 있음.
- **Category Granularity**: 단순 가맹점명만으로는 부족하며, 구매 품목(Metadata)에 대한 추론이 필요함.
- **User Trust**: 오분류된 데이터는 신뢰도를 급격히 떨어뜨리므로, 'AI 추천'과 '사용자 컨펌'의 조화가 필수적임.

## 4. Next Step: Design
- **Action Center Strategy**: 미분류/AI 추천 내역을 관리하는 대시보드 위젯 설계.
- **Matching Engine Architecture**: Exact Match -> Fuzzy Match -> AI Classification 레이어링.
