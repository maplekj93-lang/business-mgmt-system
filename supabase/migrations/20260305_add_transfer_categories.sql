-- Phase 1: Transfer 타입 메인 카테고리 추가
INSERT INTO mdt_categories (id, name, type, parent_id)
VALUES (120, '🔄 이체 / 내부거래', 'transfer', NULL) ON CONFLICT (id) DO NOTHING;
-- Phase 2: Transfer 서브카테고리들
INSERT INTO mdt_categories (id, name, type, parent_id)
VALUES (121, '카드대금 결제', 'transfer', 120),
    (122, '내부 이체', 'transfer', 120),
    (123, '저축 불입', 'transfer', 120),
    (124, '학자금 상환', 'transfer', 120) ON CONFLICT (id) DO NOTHING;