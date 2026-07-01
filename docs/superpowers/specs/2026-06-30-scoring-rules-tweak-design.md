# Scoring Rules Tweak Design

**Date:** 2026-06-30
**Topic:** Simplify knockout + Final scoring to an additive model.

## 1. Goal & context

The scoring rules were simplified to two independent criteria — **correct score**
and **correct classifier/champion** — summed. The old `scoreMatchPrediction`
used cascading if/else with special casing for the `FINAL` and a `predictedDraw`
branch that no longer applies. This change rewrites the rule to the new additive
model and rescoring the already-scored Phase 1 (group stage) is unnecessary
because its rules are unchanged.

## 2. New rules

For every knockout match (R32 → Semis):

| outcome                           | points |
|-----------------------------------|--------|
| nothing correct                   | 0      |
| correct classifier only           | 1      |
| correct exact score only          | 2      |
| correct exact score + classifier  | 3      |

For the FINAL:

| outcome                           | points |
|-----------------------------------|--------|
| nothing correct                   | 0      |
| correct champion only             | 3      |
| correct exact score only          | 5      |
| correct exact score + champion    | 8      |

Two outcomes are independent and **summed**. The "exact score but wrong
champion/qualifier" case is only physically possible on a draw (predicting X-X
and actual X-X but picking the wrong penalty-winner) — under the new rules that
yields 2 points (knockout) or 5 (Final). Confirmed by the user (Q2 = B).

## 3. `lib/scoringRules.ts` rewrite

Replace the cascading if/else with independent criteria summed:

```ts
export function scoreMatchPrediction(input: ScoreInput): MatchScoreBreakdown {
  const exactScoreHit =
    input.predictedHomeGoals === input.actualHomeGoals &&
    input.predictedAwayGoals === input.actualAwayGoals;
  const qualifiedHit = input.predictedQualifiedTeamId === input.actualQualifiedTeamId;
  const isFinal = input.round === Round.FINAL;
  const scoreWeight = exactScoreHit ? (isFinal ? 5 : 2) : 0;
  const qualWeight  = qualifiedHit  ? (isFinal ? 3 : 1) : 0;
  const points = scoreWeight + qualWeight;

  let reason: string;
  if (exactScoreHit && qualifiedHit)      reason = "exact_and_qualified";
  else if (exactScoreHit)                 reason = "exact_only";
  else if (qualifiedHit)                  reason = "qualified_only";
  else                                    reason = "no_hit";

  return { points, exactScoreHit, qualifiedHit, reason };
}
```

The `FINAL` cascading block and the entire `predictedDraw` branch are removed.
`exactScoreHit` and `qualifiedHit` keep their meanings (and now literal).

## 4. Flag semantics

`exactScoreHit` = predicted score equals actual score, regardless of qualifier.
`qualifiedHit` = predicted qualifier equals actual qualifier, regardless of score.

This changes what `Score.exactScores` counts (now: pure exact-score hits) but
that column is not displayed anywhere, and we are rescoring anyway. The
`qualifiedHits` meaning is unchanged, so the leaderboard tiebreaker
(`points` → `qualifiedHits` → `name`) behavior is preserved.

## 5. Rescore procedure (post-deploy)

A one-off script against Neon (read-then-write, safety banner verifying `url
includes('neon')`, snapshot exists):

1. `import { scoreRound } from './lib/scoring'` and run for `ROUND_OF_32`.
2. Later phases (R16/QF/SF/Final) self-correct when an admin enters a result —
   `saveResult` already invokes `scoreRound`. No extra script needed.
3. `scoreGroupStage` is NOT re-run (group rules unchanged).

## 6. UI text fix

`app/tabla/page.tsx:65` currently reads *"desempates por marcadores exactos y
aciertos de clasificados"*, but the sort uses only `qualifiedHits` (never
`exactScores`). Under both old and new logic this text is misleading. Change it
to *"desempates por aciertos de clasificados"* to match reality.

## 7. Risks & accepted trade-offs

- **Stored `Score.exactScores`** count changes meaning slightly — not used in
  sort or display, harmless.
- **Rescore of R32** rewrote stored points for already-played matches #73 and
  #76 under the new rules. Snapshot exists; nothing destructive beyond row
  updates.
- **No schema changes.** No new columns.

## 8. Testing

- New unit tests in `tests/integration/scoring-rules.ts` (run via `npx tsx`)
  covering:
  - Knockout 4 outcomes: 0 / 1 / 2 / 3.
  - Final 4 outcomes: 0 / 3 / 5 / 8.
  - Draw-with-wrong-qualifier edge case: predict 1-1 (qualifier A), actual 1-1
    (qualifier B) → 2 (R32), 5 (Final).
  - Non-draw exact-score-without-qualifier is **impossible** (assert returns 3
    / 8 because exact score forces qualifier match).
- `npx tsc --noEmit` + `npm run build`.
- Manual: re-run scoring, `/tabla` ranks reflect new points.
- Regression: group-stage scoring unchanged.