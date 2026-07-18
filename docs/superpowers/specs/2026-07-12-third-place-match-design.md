# Third-Place Match Design

**Date:** 2026-07-12
**Topic:** Add the 3rd-place consolation match (match #103) as a playable round.

## 1. Goal & context

The FIFA 2026 bracket includes a 3rd-place consolation match played the day
before the Final. The current schema's `Round` enum has no `THIRD_PLACE` value,
so this match can't be represented. Adding it lets participants predict the
3rd-place match, which uses regular knockout scoring (2 pts exact, 1 pt
qualifier) — not the Final's bonus (5/3).

## 2. Scope

- **Schema:** add `THIRD_PLACE` to the `Round` enum.
- **DB:** create match #103 with `round=THIRD_PLACE`, placeholder slots.
- **Pages:** `/predicciones/tercerpuesto`, admin, nav, leaderboard, locks.
- **Scoring:** `scoreMatchPrediction` already handles this — `THIRD_PLACE` is
  not `FINAL`, so it gets knockout scoring (2/1). No scoring code changes.

## 3. Schema change

Add `THIRD_PLACE` to the `Round` enum in `prisma/schema.prisma`:

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

Run `npx prisma migrate dev` + `npx prisma migrate deploy` on Neon.

## 4. DB seed — match #103

Create or update `prisma/seed-knockout.js` to include match #103:

```js
[103, Round.THIRD_PLACE, '2026-07-18T17:00:00-04:00', 'Miami Gardens',
 'Loser Match 101', 'Loser Match 102'],
```

Then run `npm run seed:knockout` against Neon. Alternatively, create the match
directly via a one-off script:

```ts
await prisma.match.create({
  data: { matchNumber: 103, round: 'THIRD_PLACE',
    homeSlot: 'Loser Match 101', awaySlot: 'Loser Match 102',
    startsAt: new Date('2026-07-18T21:00:00Z'), stadium: 'Miami Gardens' },
});
```

Teams will be assigned later via `/admin/partidos` once the semi-final losers
are known.

## 5. Prediction page — `/predicciones/tercerpuesto`

Add `tercerpuesto: Round.THIRD_PLACE` to the `rounds` and `roundTitles` maps
in `app/predicciones/[round]/page.tsx`. This creates the route automatically
via the dynamic `[round]` slug.

## 6. Nav dropdown

Add to the `knockoutItems` array in `app/components/NavLinks.tsx`:

```ts
{ href: "/predicciones/tercerpuesto", label: "Tercer puesto", icon: "🥉", match: "startsWith" },
```

## 7. Admin — `/admin/partidos`

Add `Round.THIRD_PLACE` to the `knockoutRounds` array and `roundName` map in
`app/admin/partidos/page.tsx`:

```ts
THIRD_PLACE: "Tercer puesto",
```

## 8. Scoring + locks

- `lib/scoringRules.ts`: no change — `THIRD_PLACE` ≠ `FINAL`, gets knockout
  scoring (2/1) automatically.
- `lib/locks.ts`: add `THIRD_PLACE: "Tercer puesto"` to `phaseLabels`.
- `lib/scoring.ts`: no change — `scoreRound` works for any `Round` value.

## 9. Leaderboard + roundOrder

Add `Round.THIRD_PLACE` to `roundOrder` arrays in:

- `app/tabla/[participantId]/page.tsx`
- `app/tabla/page.tsx` (if it filters by round)

This ensures the 3rd-place match appears in the correct position (after
SEMI_FINALS, before FINAL) on participant detail pages.

## 10. Risks & notes

- **Enum ordering:** `THIRD_PLACE` must be added between `SEMI_FINALS` and
  `FINAL` in the Prisma schema so that `roundOrder` sorting is correct.
- **Migration:** adding an enum value requires a Prisma migration. On Neon
  this is a schema-only change (no data loss).
- **No scoring code changes** — `THIRD_PLACE` naturally falls through to the
  knockout scoring branch.
- **Team assignment:** match #103 starts with placeholder slots
  ("Loser Match 101" / "Loser Match 102"). Admin assigns real teams after
  semi-finals are played.

## 11. Testing

- `npx tsc --noEmit` + `npm run build`.
- Manual: `/predicciones/tercerpuesto` loads the prediction form for match #103.
- Manual: nav dropdown shows "Tercer puesto" option.
- Manual: `/admin/partidos` shows "Tercer puesto" section with match #103.
- Manual: scoring for the 3rd-place match uses knockout rules (2/1), not Final
  (5/3).