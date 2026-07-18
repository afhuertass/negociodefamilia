# Third-Place Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 3rd-place consolation match (match #103) as a playable round with regular knockout scoring (2/1). Creates the `/predicciones/tercerpuesto` route, nav link, admin section, and leaderboard integration.

**Architecture:** Add `THIRD_PLACE` to the Prisma `Round` enum (between `SEMI_FINALS` and `FINAL`). Seed match #103 in the DB. Update all maps/arrays that enumerate knockout rounds. `scoreMatchPrediction` needs no changes — `THIRD_PLACE` is not `FINAL`, so it gets knockout scoring automatically.

**Tech Stack:** Prisma schema migration, Next.js 16, TypeScript.

---

### Task 1: Prisma schema + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `THIRD_PLACE` to the `Round` enum**

In `prisma/schema.prisma`, find:

```prisma
enum Round {
  GROUP_STAGE
  ROUND_OF_32
  ROUND_OF_16
  QUARTER_FINALS
  SEMI_FINALS
  FINAL
}
```

Replace with:

```prisma
enum Round {
  GROUP_STAGE
  ROUND_OF_32
  ROUND_OF_16
  QUARTER_FINALS
  SEMI_FINALS
  THIRD_PLACE
  FINAL
}
```

Note: `THIRD_PLACE` is placed between `SEMI_FINALS` and `FINAL` so that natural enum ordering matches the tournament bracket order.

- [ ] **Step 2: Generate Prisma client**

Run: `npx prisma generate`
Expected: Prisma client regenerated with the new `THIRD_PLACE` enum value.

- [ ] **Step 3: Create the migration**

Run: `npx prisma migrate dev --name add-third-place`
Expected: a new migration file is created under `prisma/migrations/` that adds `'THIRD_PLACE'` to the `"Round"` enum type.

- [ ] **Step 4: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add THIRD_PLACE to Round enum"
```

---

### Task 2: Seed match #103 in the DB

**Files:**
- One-off script (not committed) to create match #103 on Neon.

- [ ] **Step 1: Write and run the seed script**

Create (temp, do NOT commit) `_seed103.ts`:

```ts
import { PrismaClient, Round } from '@prisma/client';
async function main() {
  if (!process.env.DATABASE_URL_NEON?.includes('neon')) { console.error('❌ Not Neon'); process.exit(1); }
  console.log('⚠️  WRITE to Neon authorized — create match #103');
  const prisma = new PrismaClient();
  const existing = await prisma.match.findUnique({ where: { matchNumber: 103 } });
  if (existing) { console.log('Match #103 already exists, skipping.'); await prisma.$disconnect(); return; }
  await prisma.match.create({
    data: {
      matchNumber: 103,
      round: Round.THIRD_PLACE,
      homeSlot: 'Loser Match 101',
      awaySlot: 'Loser Match 102',
      startsAt: new Date('2026-07-18T21:00:00Z'), // Jul 18, 5:00 PM ET (placeholder)
      stadium: 'Miami Gardens',
    },
  });
  console.log('✅ Match #103 created (THIRD_PLACE, placeholder teams)');
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Get user confirmation before running**

State: "I intend to create match #103 (THIRD_PLACE) on Neon production. Please confirm." Wait for confirmation.

- [ ] **Step 3: Run the script**

Run: `npx tsx _seed103.ts`
Expected: prints `✅ Match #103 created`.

- [ ] **Step 4: Delete the temp script**

Run: `rm -f _seed103.ts`

(no commit — script is not in repo)

---

### Task 3: Update `lib/locks.ts` — add THIRD_PLACE to phaseLabels

**Files:**
- Modify: `lib/locks.ts`

- [ ] **Step 1: Add the label**

In `lib/locks.ts`, find:

```ts
export const phaseLabels: Record<Round, string> = {
  GROUP_STAGE: "Fase de grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  FINAL: "Final",
};
```

Replace with:

```ts
export const phaseLabels: Record<Round, string> = {
  GROUP_STAGE: "Fase de grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/locks.ts
git commit -m "feat: add THIRD_PLACE to phaseLabels"
```

---

### Task 4: Update prediction page — add `tercerpuesto` slug

**Files:**
- Modify: `app/predicciones/[round]/page.tsx`

- [ ] **Step 1: Add to `rounds` map**

Find:

```ts
const rounds: Record<string, Round> = {
  dieciseisavos: Round.ROUND_OF_32,
  octavos: Round.ROUND_OF_16,
  cuartos: Round.QUARTER_FINALS,
  semifinales: Round.SEMI_FINALS,
  final: Round.FINAL,
};
```

Replace with:

```ts
const rounds: Record<string, Round> = {
  dieciseisavos: Round.ROUND_OF_32,
  octavos: Round.ROUND_OF_16,
  cuartos: Round.QUARTER_FINALS,
  semifinales: Round.SEMI_FINALS,
  tercerpuesto: Round.THIRD_PLACE,
  final: Round.FINAL,
};
```

- [ ] **Step 2: Add to `roundTitles` map**

Find:

```ts
const roundTitles: Record<string, string> = {
  dieciseisavos: "Dieciseisavos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semifinales: "Semifinales",
  final: "Final",
};
```

Replace with:

```ts
const roundTitles: Record<string, string> = {
  dieciseisavos: "Dieciseisavos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semifinales: "Semifinales",
  tercerpuesto: "Tercer puesto",
  final: "Final",
};
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/predicciones/[round]/page.tsx
git commit -m "feat: add tercerpuesto route for third-place predictions"
```

---

### Task 5: Update nav dropdown

**Files:**
- Modify: `app/components/NavLinks.tsx`

- [ ] **Step 1: Add to `knockoutItems`**

Find:

```ts
const knockoutItems: NavItem[] = [
  { href: "/predicciones/dieciseisavos", label: "Dieciseisavos", icon: "⚽", match: "startsWith" },
  { href: "/predicciones/octavos", label: "Octavos", icon: "🎯", match: "startsWith" },
  { href: "/predicciones/cuartos", label: "Cuartos", icon: "🏟️", match: "startsWith" },
  { href: "/predicciones/semifinales", label: "Semifinales", icon: "🔥", match: "startsWith" },
  { href: "/predicciones/final", label: "Final", icon: "🏆", match: "startsWith" },
];
```

Replace with:

```ts
const knockoutItems: NavItem[] = [
  { href: "/predicciones/dieciseisavos", label: "Dieciseisavos", icon: "⚽", match: "startsWith" },
  { href: "/predicciones/octavos", label: "Octavos", icon: "🎯", match: "startsWith" },
  { href: "/predicciones/cuartos", label: "Cuartos", icon: "🏟️", match: "startsWith" },
  { href: "/predicciones/semifinales", label: "Semifinales", icon: "🔥", match: "startsWith" },
  { href: "/predicciones/tercerpuesto", label: "Tercer puesto", icon: "🥉", match: "startsWith" },
  { href: "/predicciones/final", label: "Final", icon: "🏆", match: "startsWith" },
];
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/NavLinks.tsx
git commit -m "feat: add Tercer puesto to predictions nav dropdown"
```

---

### Task 6: Update admin partidos page

**Files:**
- Modify: `app/admin/partidos/page.tsx`

- [ ] **Step 1: Add to `roundName` map**

Find:

```ts
const roundName: Record<Round, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  FINAL: "Final",
};
```

Replace with:

```ts
const roundName: Record<Round, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};
```

- [ ] **Step 2: Add to `knockoutRounds` array**

Find:

```ts
const knockoutRounds = [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL];
```

Replace with:

```ts
const knockoutRounds = [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.THIRD_PLACE, Round.FINAL];
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/admin/partidos/page.tsx
git commit -m "feat: add THIRD_PLACE to admin partidos page"
```

---

### Task 7: Update roundOrder arrays in tabla pages

**Files:**
- Modify: `app/tabla/[participantId]/page.tsx`

- [ ] **Step 1: Add THIRD_PLACE to roundOrder**

Find:

```ts
const roundOrder = [
  Round.GROUP_STAGE,
  Round.ROUND_OF_32,
  Round.ROUND_OF_16,
  Round.QUARTER_FINALS,
  Round.SEMI_FINALS,
  Round.FINAL,
];
```

Replace with:

```ts
const roundOrder = [
  Round.GROUP_STAGE,
  Round.ROUND_OF_32,
  Round.ROUND_OF_16,
  Round.QUARTER_FINALS,
  Round.SEMI_FINALS,
  Round.THIRD_PLACE,
  Round.FINAL,
];
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/tabla/[participantId]/page.tsx
git commit -m "feat: add THIRD_PLACE to roundOrder on participant detail page"
```

---

### Task 8: Build + verification

**Files:** none.

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: build succeeds; `/predicciones/tercerpuesto` listed in route map.

- [ ] **Step 2: Manual verification**

- `/predicciones/tercerpuesto` loads the prediction form for match #103.
- Nav dropdown shows "Tercer puesto" between "Semifinales" and "Final".
- `/admin/partidos` shows "Tercer puesto" section.
- `/tabla/<id>` shows a "Tercer puesto" section (empty until predictions exist).