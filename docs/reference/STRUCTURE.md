# Project Directory Structure (FSD Blueprint)

/root
├── AI_RULES.md             # 프로젝트 절대 헌법
├── STRUCTURE.md            # 폴더 구조 설명서 (본 파일)
├── MDT_CATALOG.md          # 비즈니스 로직 및 카테고리 사전
├── supabase/               # SQL 마이그레이션, Seed 데이터
├── public/                 # 정적 자산 (이미지, 폰트)
└── src/
    ├── app/                # Next.js App Router (Routing Only)
    │   ├── layout.tsx      # 전역 레이아웃 (Providers)
    │   ├── page.tsx        # 메인 대시보드 진입점
    │   └── (routes)/       # 라우트별 페이지
    │
    ├── widgets/            # 독립적인 대형 UI 블록 (Features + UI 조합)
    │   ├── sidebar/        # 전역 네비게이션
    │   └── stats-card/     # 통계 위젯
    │
    ├── features/           # 사용자 인터랙션 & 비즈니스 유스케이스
    │   ├── ledger-import/  # 엑셀 파싱 및 검증 로직
    │   ├── create-quote/   # 견적서 생성 프로세스
    │   └── auth/           # 로그인 로직
    │
    ├── entities/           # 비즈니스 도메인 모델 (Schema + Type)
    │   ├── transaction/    # 거래 내역 모델 (Zod Schema)
    │   ├── project/        # 프로젝트 모델
    │   └── item/           # 조명/자재 아이템 모델
    │
    └── shared/             # 비즈니스 로직이 없는 순수 재사용 단위
        ├── ui/             # Shadcn UI 컴포넌트 (Button, Input)
        ├── api/            # Supabase 클라이언트 유틸
        ├── lib/            # 날짜, 통화 포맷팅 함수
        └── types/          # 전역 공통 타입
