---
activation: glob
glob: "src/**/*.{ts,tsx}"
description: >
  Load this rule when editing or creating TypeScript/TSX files under src/.
  Enforces FSD architecture, type safety, and Prism Design System compliance.
---

# Coding Standards (Active for src/**/*.ts, src/**/*.tsx)

## FSD Layer Rules

```
shared     ← No business logic. Pure reusable units only.
entities   ← Domain models. API calls + Zod schemas.
features   ← User interactions + business use cases.
widgets    ← Large independent UI blocks (combine features + entities).
app        ← Routing only. No logic here.
```

**Unidirectional dependency — lower layers CANNOT import upper layers:**
- ❌ `shared` importing from `features`
- ❌ `entities` importing from `widgets`
- ✅ `features` importing from `entities` and `shared`

**Public API only:** All slices communicate only through their `index.ts`. Deep imports forbidden.
```typescript
// ✅ Correct
import { getClients } from '@/entities/client';
// ❌ Wrong
import { getClients } from '@/entities/client/api/get-clients';
```

## TypeScript Rules

```typescript
// ❌ Absolutely forbidden — no exceptions
const data: any = response;
const cast = value as any;

// ❌ Also forbidden — unknown without Zod/type guard
const raw: unknown = response;
const name = (raw as { name: string }).name; // ❌ still effectively as any

// ✅ Preferred — Zod inference (use this first)
const ClientSchema = z.object({ id: z.string(), name: z.string() });
type Client = z.infer<typeof ClientSchema>;
const parsed = ClientSchema.parse(response); // safe

// ✅ Narrow exception — unknown for JSONB/external API parsing with type guard
function isClient(val: unknown): val is Client {
  return typeof val === 'object' && val !== null && 'id' in val;
}
// Only valid when Zod is not practical (e.g., raw Supabase JSONB column access)
```

## Error Handling Pattern

```typescript
// ❌ Never throw from Server Actions
export async function getClients() {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) throw error; // ❌
}

// ✅ Always return result object
export async function getClients(): Promise<{ success: boolean; data?: Client[]; error?: string }> {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

## Prism System V2.1 — Color Rules

```tsx
// ❌ Hardcoded colors — NEVER use these
<div className="bg-white text-zinc-400 border-zinc-200">

// ✅ Semantic tokens only
<div className="bg-background text-muted-foreground border-border">

// ✅ Glassmorphism containers
<div className="glass-panel">   {/* backdrop-blur-xl + bg/40 */}
<div className="glass-card">    {/* backdrop-blur-md + bg/60 */}
```

## Server Actions Pattern

```typescript
'use server'
// All DB mutations must be in Server Actions
// All mutations must be atomic (single transaction when touching multiple tables)

export async function createDailyLog({ log, crew, expenses }: Input) {
  const supabase = await createClient();
  // 1. Insert main record
  // 2. Insert related records
  // 3. If any step fails → return { success: false, error }
  // Never leave partial state in DB
}
```

## Import Path Aliases

Always use `@/` alias, never relative paths across layers:
```typescript
// ✅
import { Button } from '@/shared/ui/button';
// ❌
import { Button } from '../../../shared/ui/button';
```
