# Scoring Rules Tweak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cascading knockout/Final scoring in `lib/scoringRules.ts` with an additive model (exact score = 2 pts, classifier = 1 pt; Final: exact = 5, champion = 3, summed), rescore the already-played Round of 32 matches on Neon, and fix the now-misleading leaderboard subheading.

**Architecture:** `scoreMatchPrediction` becomes ~8 lines computing `exactScoreHit` + `qualifiedHit` then summing weighted points. The `predictedDraw` branch and the `FINAL` cascading block are deleted. `Score.exactScores`/`qualifiedHits` semantics align with the flags. New pure unit tests cover the 8 outcome combinations (4 knockout + 4 Final) including the draw-with-wrong-qualifier edge. The existing integration `scoring.ts` is updated to the new expected points. A one-off rescore script re-runs `scoreRound(ROUND_OF_32)` against Neon.

**Tech Stack:** Next.js 16, Prisma, TypeScript. Test harness = `npx tsx` (no jest/vitest). The safety protocol guards the Neon rescore with a `url.includes('neon')` banner check before any write.

---

### Task 1: TDD — new pure unit tests for `scoreMatchPrediction`

**Files:**
- Create: `tests/integration/scoring-rules.ts`

Pure (no DB) tests of `scoreMatchPrediction` directly, covering every outcome combination in the spec.

- [ ] **Step 1: Write the failing test file**

Create `tests/integration/scoring-rules.ts`:

```ts
import { Round } from "@prisma/client";
import { scoreMatchPrediction } from "../../lib/scoringRules";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`✅ PASS: ${label} = ${actual}`);
  } else {
    console.error(`❌ FAIL: ${label} | expected ${expected}, got ${actual}`);
    failures++;
  }
}

const mk = (round: Round, ph: number, pa: number, pq: string, ah: number, aa: number, aq: string) =>
  scoreMatchPrediction({
    round,
    predictedHomeGoals: ph, predictedAwayGoals: pa, predictedQualifiedTeamId: pq,
    actualHomeGoals: ah, actualAwayGoals: aa, actualQualifiedTeamId: aq,
  });

const HOME = "home", AWAY = "away";

// ── Knockout (R32 → Semis): 0 / 1 / 2 / 3 ──
check("KO nothing correct", mk(Round.ROUND_OF_32, 2, 0, HOME, 0, 1, AWAY).points, 0);
check("KO qualified only", mk(Round.ROUND_OF_16, 3, 0, HOME, 1, 0, HOME).points, 1);
check("KO exact only (draw, wrong qualifier)", mk(Round.QUARTER_FINALS, 1, 1, HOME, 1, 1, AWAY).points, 2);
check("KO exact + qualified (non-draw forces qualifier)", mk(Round.SEMI_FINALS, 2, 1, HOME, 2, 1, HOME).points, 3);

// flags
check("KO exact-only flags", (() => {
  const r = mk(Round.ROUND_OF_32, 1, 1, HOME, 1, 1, AWAY);
  return `${r.exactScoreHit}/${r.qualifiedHit}`;
})(), "true/false");
check("KO qualified-only flags", (() => {
  const r = mk(Round.ROUND_OF_32, 3, 0, HOME, 1, 0, HOME);
  return `${r.exactScoreHit}/${r.qualifiedHit}`;
})(), "false/true");

// ── FINAL: 0 / 3 / 5 / 8 ──
check("FINAL nothing correct", mk(Round.FINAL, 2, 0, HOME, 0, 1, AWAY).points, 0);
check("FINAL champion only", mk(Round.FINAL, 3, 0, HOME, 1, 0, HOME).points, 3);
check("FINAL exact only (draw, wrong champion)", mk(Round.FINAL, 1, 1, HOME, 1, 1, AWAY).points, 5);
check("FINAL exact + champion", mk(Round.FINAL, 2, 1, HOME, 2, 1, HOME).points, 8);

// Non-draw exact score: the score itself determines the qualifier, so exact-hit on a non-draw
// also implies qualifiedHit=true (and points=3 or 8). Capture that linkage explicitly:
check("KO non-draw exact links qualifier", (() => {
  const r = mk(Round.ROUND_OF_32, 2, 1, HOME, 2, 1, HOME);
  return `${r.exactScoreHit}/${r.qualifiedHit}/${r.points}`;
})(), "true/true/3");

if (failures > 0) {
  console.error(`\n${failures} scoring-rules tests FAILED`);
  process.exit(1);
}
console.log("\nAll scoring-rules unit tests passed.");
```

Note: the last "impossible" check (`mk(...2,1,HOME, 2,1,AWAY)`) represents a contradictory actual-result that the validator in `/admin/partidos` would reject (you can't have actual score 2-1 with away qualifying). It only verifies the function computes qualifiedHit literally from the ids without trying to "fix" the data. Keep this in the suite as a data-correctness guard.

- [ ] **Step 2: Run the test and observe failures**

Run: `npx tsx tests/integration/scoring-rules.ts`
Expected: multiple `❌ FAIL` lines (the knockout `exact only = 2` and Final `exact only = 5`, `champion only = 3`, `exact + champion = 8` cases). The function still uses old rules; this confirms the test exercises the behavior we want.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/integration/scoring-rules.ts
git commit -m "test: new scoring-rules unit tests (expected under additive model)"
```

---

### Task 2: Rewrite `lib/scoringRules.ts` to the additive model

**Files:**
- Modify: `lib/scoringRules.ts`

- [ ] **Step 1: Replace the entire function body**

In `lib/scoringRules.ts`, replace the whole `scoreMatchPrediction` function (the `if (input.round === Round.FINAL) {...}` / `if (predictedDraw) {...}` / non-draw cascade) with the additive implementation. The `ScoreInput` type and `MatchScoreBreakdown` export at the top stay unchanged. The full new file:

```ts
import { Round } from "@prisma/client";

type ScoreInput = {
  round: Round;
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  predictedQualifiedTeamId: string;
  actualHomeGoals: number;
  actualAwayGoals: number;
  actualQualifiedTeamId: string;
};

export type MatchScoreBreakdown = {
  points: number;
  exactScoreHit: boolean;
  qualifiedHit: boolean;
  reason: string;
};

export function scoreMatchPrediction(input: ScoreInput): MatchScoreBreakdown {
  const exactScoreHit =
    input.predictedHomeGoals === input.actualHomeGoals &&
    input.predictedAwayGoals === input.actualAwayGoals;
  const qualifiedHit = input.predictedQualifiedTeamId === input.actualQualifiedTeamId;
  const isFinal = input.round === Round.FINAL;
  const scoreWeight = exactScoreHit ? (isFinal ? 5 : 2) : 0;
  const qualWeight = qualifiedHit ? (isFinal ? 3 : 1) : 0;

  let reason: string;
  if (exactScoreHit && qualifiedHit) reason = "exact_and_qualified";
  else if (exactScoreHit) reason = "exact_only";
  else if (qualifiedHit) reason = "qualified_only";
  else reason = "no_hit";

  return { points: scoreWeight + qualWeight, exactScoreHit, qualifiedHit, reason };
}
```

- [ ] **Step 2: Run the new unit tests**

Run: `npx tsx tests/integration/scoring-rules.ts`
Expected: every line reads `✅ PASS:` and the final line `All scoring-rules unit tests passed.` Exit 0.

- [ ] **Step 3: Commit**

```bash
git add lib/scoringRules.ts
git commit -m "feat: scoring rules — additive model (2/1 knockout, 5/3 Final)"
```

---

### Task 3: Update the existing integration `scoring.ts` to new expectations

**Files:**
- Modify: `tests/integration/scoring.ts`

Under the new rules:
- `testDrawScenario` (predict 1-1 / actual 2-2 / qual ✓) was old=2 → now **1** (qualified-only, inexact score).
- `testExactScoreScenario` (predict 2-1 / actual 2-1 / qual ✓) stays **3** — passes unchanged.
- `testFailedDrawScenario` (predict 1-1 / actual 2-1 / qual ✓) was old=0 → now **1** (qualified-hit alone).

- [ ] **Step 1: Update the two changed expectations**

In `tests/integration/scoring.ts`, find the `testDrawScenario` assertion:

```ts
  if (score?.points === 2) {
    console.log("✅ PASS: Draw scenario (2 points)");
  } else {
    console.error(`❌ FAIL: Draw scenario (Expected 2 points, Got ${score?.points})`);
  }
```

Replace with:

```ts
  if (score?.points === 1) {
    console.log("✅ PASS: Draw-inexact-qualified scenario (1 point under additive rules)");
  } else {
    console.error(`❌ FAIL: Draw-inexact-qualified (Expected 1 point, Got ${score?.points})`);
  }
```

Find the `testFailedDrawScenario` assertion:

```ts
  if (score?.points === 0) {
    console.log("✅ PASS: Failed Draw scenario (0 points)");
  } else {
    console.error(`❌ FAIL: Failed Draw scenario (Expected 0 points, Got ${score?.points})`);
  }
```

Replace with:

```ts
  if (score?.points === 1) {
    console.log("✅ PASS: Failed-draw-but-qualified scenario (1 point under additive rules)");
  } else {
    console.error(`❌ FAIL: Failed-draw-but-qualified (Expected 1 point, Got ${score?.points})`);
  }
```

(`testExactScoreScenario` already expects 3 — leave it.)

- [ ] **Step 2: Run the integration test**

This test uses the SQLite test DB; make sure the safety guardrail passes (no `DATABASE_URL` neon in env).

Run: `npx tsx tests/integration/scoring.ts`
Expected: three `✅ PASS` lines (Draw-inexact-qualified = 1 point; Exact score scenario = 3 points; Failed-draw-but-qualified = 1 point). Exit 0.

- [ ] **Step 3: Commit**

```bash
git add tests/integration/scoring.ts
git commit -m "test: update integration scoring expectations to additive rules"
```

---

### Task 4: UI text fix on the leaderboard subheading

**Files:**
- Modify: `app/tabla/page.tsx:65`

- [ ] **Step 1: Replace the misleading subheading**

Find line 65 in `app/tabla/page.tsx`:

```tsx
              Mira quién va arriba, desempates por marcadores exactos y aciertos de clasificados.
```

Replace with:

```tsx
              Mira quién va arriba, desempates por aciertos de clasificados.
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/tabla/page.tsx
git commit -m "fix(tabla): correct misleading tiebreaker subheading text"
```

---

### Task 5: TypeScript + build verification

**Files:** none.

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds; `/tabla` still listed in the route map.

- [ ] **Step 3: Re-run both test files for confidence**

Run: `npx tsx tests/integration/scoring-rules.ts && npx tsx tests/integration/scoring.ts`
Expected: both print all-pass and exit 0.

---

### Task 6: Rescore Round of 32 on Neon production

**Files:** none (one-off tsx script, not committed).

This re-runs `scoreRound(ROUND_OF_32)` against the live production DB so the two already-played matches (#73 South Africa 0-1 Canada, #76 Brazil 2-1 Japan) and their participants' stored `Score` rows reflect the new additive rules. The user has a Neon snapshot. **Per the project safety protocol, confirm with the user before running** ("I intend to run scoreRound(ROUND_OF_32) on Neon production. Please confirm.").

- [ ] **Step 1: Write and run the rescore script**

Create (temp, do NOT commit) `/Users/andres/mundial/_rescore.ts`:

```ts
import { PrismaClient, Round } from '@prisma/client';
import { scoreRound } from './lib/scoring';

async function main() {
  const url = process.env.DATABASE_URL_NEON || '';
  if (!url.includes('neon')) { console.error('❌ Not Neon — aborting'); process.exit(1); }
  console.log('⚠️  WRITE to Neon authorized (snapshot exists). Rescoring ROUND_OF_32.');

  const prisma = new PrismaClient();
  await scoreRound(prisma, Round.ROUND_OF_32);
  console.log('✅ scoreRound(ROUND_OF_32) complete.');

  const scores = await prisma.score.findMany({
    where: { phase: Round.ROUND_OF_32 },
    include: { participant: true },
    orderBy: [{ points: 'desc' }, { qualifiedHits: 'desc' }, { name: 'asc' }],
  });
  console.log('\nTop 10 R32 scores after rescore:');
  for (const s of scores.slice(0, 10)) {
    console.log(`  ${s.participant.name.padEnd(34)} pts=${s.points} exact=${s.exactScores} qual=${s.qualifiedHits}`);
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Get explicit user confirmation before running**

State: "I intend to run `scoreRound(ROUND_OF_32)` on Neon production. Please confirm this is the production database and you have a snapshot." Wait for the user to confirm.

- [ ] **Step 3: Run the rescore**

Run: `npx tsx _rescore.ts`
Expected: prints the safety banner + `✅ scoreRound(ROUND_OF_32) complete.` + a top-10 listing. The user will manually validate the new points afterward (per the spec).

- [ ] **Step 4: Delete the temp script**

Run: `rm -f _rescore.ts`

(no commit — script is not in repo)

---

### Task 7: Manual leaderboard verification

**Files:** none (browser).

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: server starts on http://localhost:3000.

- [ ] **Step 2: Visit leaderboard**

Open `http://localhost:3000/tabla`.
Expected: subheading now reads "Mira quién va arriba, desempates por aciertos de clasificados." Ranking order reflects the rescoring; participants who picked Brazil-as-champion-of-#76 and got the 2-1 exact score should be visibly near the top.

- [ ] **Step 3: Spot-check a participant detail**

Click a participant → `/tabla/<id>`.
Expected: per-match "Puntos" column shows new per-match points (0/1/2/3 for knockout matches, 0/3/5/8 for the Final once played). The #73 and #76 rows show non-zero points for correct picks.

- [ ] **Step 4: Final build (regression)**

Run: `npm run build`
Expected: success.