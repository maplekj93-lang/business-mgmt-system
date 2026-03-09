
DO $$
DECLARE
  v_user_id uuid;
  v_parent_id integer;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Delete ALL existing categories first to make a completely fresh start
  DELETE FROM public.mdt_categories;

  -- Reset sequence just in case
  ALTER SEQUENCE public.mdt_categories_id_seq RESTART WITH 1;


  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🏠 주거비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '전세이자', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '관리비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '수도요금', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '도시가스', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '전기요금', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🛍️ 물품구입비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '생활필수품', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '운동용품', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '세탁비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '가전 / 가구', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기타물품', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '수리비', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🍽️ 식비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '식자재', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '외식', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '디저트 / 간식', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '배달', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '편의점', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '코스트코', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '☕️ 커피', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '커피', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🚌 교통비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '대중교통', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '택시비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기차 / 버스', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '차량관리비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '과태료', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '차량렌탈', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '주유비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '주차비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '통행료 / 톨비', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💰 보험료', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '실비보험', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '자동차보험', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '건강보험', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '생명보험', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '여행자보험', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '국민연금', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🩺 건강', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '병원비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '약제비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '건강식품', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기타건강비', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🎬 문화생활', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '영화', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '도서', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '학원 / 수강', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '전시', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '운동', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💻 구독 / 서비스', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '넷플릭스', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '애플', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, 'Chat GPT', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '어도비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '구글', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '유튜브 프리미엄', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '디즈니플러스', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, 'ENVATO', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '쿠팡', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기타', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '📞 통신비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '쾅 통신요금', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '인터넷', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '영 통신요금', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '우편료', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '👩‍💻 사업비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '장비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '식비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '출장비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '진행비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '인건비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '사업 관련 세금', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💛 기부금', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '헌금', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '십일조', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '공간', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '정기후원', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '세금', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '지방세', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '자동차세', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '관세', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '과태료', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '재산세', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '양도세', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '증여세', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기타세금', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '🎁 경조 / 선물', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '가족 / 친척', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '교회', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '지인 / 친구', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '모임 회비', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💰 저축', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '청약', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💇‍♀️ 꾸밈비', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '뷰티 / 화장품', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '쾅 의류 / 잡화', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '세탁수선비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '미용 / 헤어', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '영 의류 / 잡화', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '✈️ 여행', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '식비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '이동수단', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기념품 / 쇼핑', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '서비스 / 데이터', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '숙박비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '관광 / 입장료', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '항공비', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '그외', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '⚠️ 기타비용', 'expense', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '기타', 'expense', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '지급수수료', 'expense', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💼 사업소득', 'income', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '쾅 사업소득', 'income', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '영 사업소득', 'income', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '블로그', 'income', v_parent_id);
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '쾅영 사업소득', 'income', v_parent_id);

  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '💵 금융소득', 'income', NULL) RETURNING id INTO v_parent_id;
  INSERT INTO public.mdt_categories (user_id, name, type, parent_id)
  VALUES (v_user_id, '이자소득', 'income', v_parent_id);
END $$;