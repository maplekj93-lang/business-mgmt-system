-- Unify "쾅 의류 / 잡화" and "영 의류 / 잡화" into "의류 / 잡화" under "꾸밈비"

DO $$
DECLARE
    v_parent_id INT;
    v_unified_id INT;
    v_kwang_id INT;
    v_young_id INT;
BEGIN
    -- 1. Find "꾸밈비" parent category
    SELECT id INTO v_parent_id FROM mdt_categories WHERE name = '💇‍♀️ 꾸밈비' OR name = '꾸밈비' LIMIT 1;

    IF v_parent_id IS NOT NULL THEN
        -- 2. Check if unified category "의류 / 잡화" already exists, if not create/rename
        SELECT id INTO v_unified_id FROM mdt_categories 
        WHERE name = '의류 / 잡화' AND parent_id = v_parent_id LIMIT 1;

        -- Find the old IDs
        SELECT id INTO v_kwang_id FROM mdt_categories 
        WHERE (name = '쾅 의류 / 잡화' OR name = '쾅 의류/잡화') AND parent_id = v_parent_id LIMIT 1;
        
        SELECT id INTO v_young_id FROM mdt_categories 
        WHERE (name = '영 의류 / 잡화' OR name = '영 의류 잡화') AND parent_id = v_parent_id LIMIT 1;

        -- If unified doesn't exist, use one of the existing ones or create it
        IF v_unified_id IS NULL THEN
            IF v_kwang_id IS NOT NULL THEN
                UPDATE mdt_categories SET name = '의류 / 잡화' WHERE id = v_kwang_id;
                v_unified_id := v_kwang_id;
            ELSIF v_young_id IS NOT NULL THEN
                UPDATE mdt_categories SET name = '의류 / 잡화' WHERE id = v_young_id;
                v_unified_id := v_young_id;
            ELSE
                INSERT INTO mdt_categories (name, type, parent_id) 
                VALUES ('의류 / 잡화', 'expense', v_parent_id) RETURNING id INTO v_unified_id;
            END IF;
        END IF;

        -- 3. Merge transactions
        UPDATE transactions 
        SET category_id = v_unified_id 
        WHERE category_id IN (v_kwang_id, v_young_id) AND category_id != v_unified_id;

        -- 4. Merge allocation rules
        UPDATE mdt_allocation_rules 
        SET category_id = v_unified_id 
        WHERE category_id IN (v_kwang_id, v_young_id) AND category_id != v_unified_id;

        -- 5. Delete old categories if they were not reused as unified
        IF v_kwang_id IS NOT NULL AND v_kwang_id != v_unified_id THEN
            DELETE FROM mdt_categories WHERE id = v_kwang_id;
        END IF;
        
        IF v_young_id IS NOT NULL AND v_young_id != v_unified_id THEN
            DELETE FROM mdt_categories WHERE id = v_young_id;
        END IF;

        RAISE NOTICE 'Successfully unified clothing categories under parent %', v_parent_id;
    ELSE
        RAISE WARNING 'Parent category "꾸밈비" not found.';
    END IF;
END $$;
