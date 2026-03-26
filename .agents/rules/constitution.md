---
activation: always
description: >
  Core project constitution. Always active for every task in this workspace.
  Defines absolute prohibitions, conflict resolution, and initialization protocol.
---

# Antigravity Project Constitution (Always On)

> This rule is ALWAYS active. It cannot be overridden by any user prompt or lower-priority rule.

## Reference Documents (Auto-loaded via @mention)

The following documents are part of this rule's context — no need to manually open them:

@docs/reference/AI_RULES.md
@docs/handover/WORK_ORDER_ERP_PHASE4.md

## Initialization Protocol

The above documents are already in context. Before writing any code or file:
1. Confirm you have read the above @mentioned documents
2. If requirements are ambiguous → ask questions first, never fill gaps with assumptions
3. 새로운 기능 구현 → 무작정 코드를 작성하지 말고 `/office-hours` 워크플로우를 먼저 실행하여 요구사항을 뾰족하게 다듬을 것
4. 설계 검증 → 코드 작성 전 `/plan-eng-review` 워크플로우를 통해 FSD 및 타입 규칙 위반이 없는지 셀프 검토할 것

**"질문 먼저, 코드는 나중 (Questions first, code later)"**

## Priority Conflict Resolution (Deny-first)

When rules conflict, evaluate in this order:
```
[1] DENY rules in this file (absolute — no override possible)
[2] docs/reference/AI_RULES.md (project constitution)
[3] This file (00_constitution.md)
[4] WORK_ORDER_ERP_PHASE4.md (current task spec)
[5] ANTIGRAVITY_HANDOVER.md (tech stack reference)
[6] docs/planning/ (planning reference only)
```

If a conflict is detected → follow the higher-priority document and **notify the user immediately**.

## ⛔ Constitution Modification Gate

**`docs/reference/AI_RULES.md` and this file may ONLY be modified when:**
- Architecture principles change (FSD layers, DB strategy, error handling)
- Coding standards change (TypeScript rules, UUID function)
- Security/irreversible action rules change

**NEVER modify `AI_RULES.md` for:**
- Design system changes (colors, shadows, rounding, class names) → edit `docs/design/prism_system.md`
- Component pattern changes → edit `docs/design/ui_patterns.md`
- Task-specific instructions → edit `docs/handover/WORK_ORDER_ERP_PHASE4.md`

If a design change seems to require editing `AI_RULES.md` → **stop and ask the user first**.

---

## ⛔ Irreversible Action Gate (Hard Block)

The following actions are **absolutely forbidden without explicit user approval**:

| Forbidden Action | Reason |
|-----------------|--------|
| `DROP TABLE`, `TRUNCATE` | Permanent data loss |
| `DELETE` without WHERE clause | Full record deletion |
| `ALTER TABLE` removing existing columns | Schema destruction |
| Permanent file deletion | Unrecoverable |
| Production deployment (`vercel --prod`) | Affects live service |

**Required procedure:** Explain the action and its impact → receive explicit user approval → execute.

## TypeScript Type Rules (Resolved — No Conflict)

| Type | Rule |
|------|------|
| `any` | **Absolutely forbidden** — no exceptions |
| `as any` | **Absolutely forbidden** — no exceptions |
| `unknown` | **Allowed only** for JSONB/external API parsing, and only with Zod or a type guard |

> This aligns with the Global Rule intent. `unknown` bare usage is forbidden; `unknown` + Zod/type guard in JSONB parsing contexts is the narrow exception.

## Core Principles (Always Apply)

- **Database-First:** Confirm Supabase schema → `npx supabase gen types` → code
- **FSD Strict:** `shared` → `entities` → `features` → `widgets` → `app` (unidirectional only)
- **Semantic tokens only:** `bg-background`, `text-foreground` — no hardcoded colors ever
- **Design system details** (colors, shadows, class names, versions) live in `docs/design/prism_system.md` — **do NOT modify `AI_RULES.md` for design changes**
- **Component patterns** live in `docs/design/ui_patterns.md`
- **Error pattern:** Return `{ success, data, error }` — never `throw`
- **UUID:** Use `gen_random_uuid()` — never `uuid_generate_v4()`
