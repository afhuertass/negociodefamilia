# Match Predictions Dropdown Design

**Date:** 2026-07-03
**Topic:** Expandable "all predictions" dropdown per knockout match row on `/tabla/:id`.

## 1. Goal & context

Participants viewing `/tabla/:id` want to compare one person's knockout
predictions against everyone else's — without navigating away. This adds a
toggle button on each knockout match row that expands to reveal all
participants' predictions for that match, sorted by points (highest first)
with the current participant highlighted.

## 2. Scope

- **Modify:** `app/tabla/[participantId]/page.tsx` — add a second Prisma
  query loading all participants' predictions for the displayed knockout
  matches; pass to the client component.
- **Create:** `app/components/MatchPredictionRow.tsx` — client component
  wrapping each table row with expand/collapse toggle and sub-row panel.
- No schema, API, or route changes.

## 3. Data loading (server-side)

After loading the participant (existing `getParticipantData`), run one
additional Prisma query:

```ts
const allMatchPredictions = await prisma.matchPrediction.findMany({
  where: {
    matchId: { in: participant.matchPredictions.map((mp) => mp.matchId) },
  },
  include: { participant: true, qualifiedTeam: true, match: { include: { result: true } } },
  orderBy: [{ match: { matchNumber: "asc" } }, { participant: { name: "asc" } }],
});
```

Group into `Map<matchId, AllPrediction[]>` where:

```ts
type AllPrediction = {
  participantId: string;
  participantName: string;
  homeGoals: number;
  awayGoals: number;
  qualifiedTeamName: string;
  points: number | null; // null if match has no result
};
```

Points are computed server-side using `scoreMatchPrediction` for each
prediction against the match result (if it exists). This pre-computation
avoids importing Prisma types in the client component. Pass this map as a
serialized prop to the client components.

## 4. `MatchPredictionRow` client component

`app/components/MatchPredictionRow.tsx` — wraps each `<tr>` in the knockout
predictions table.

**Props:**

- `prediction` — the current participant's prediction (for the main row
  content: match label, score, qualifier, result, points).
- `allPredictions` — array of all participants' predictions for this match
  (with pre-computed `points`, see §3).
- `teamHistory` — `MatchHistory[]` for TeamTooltip (passed through to the
  main row's match-label cell).
- `currentParticipantId` — to highlight the current participant's row in the
  expanded panel.

**Behavior:**

- Renders the existing table row content (Partido, Predicción, Clasifica,
  Resultado real, Puntos) unchanged.
- Adds a 6th column with a toggle button (▼ / ▲ icon).
- On click, a sub-row appears below (`<tr>` with `colSpan={6}`) containing
  a mini-table of all participants' predictions.

## 5. Expanded sub-row content

When toggled open, the sub-row shows:

```
┌────────────────────────────────────────────────────────────┐
│  Predicciones de todos · #76 Brazil vs Japan               │
│                                                            │
│  Participante          Predicción   Clasifica      Pts     │
│  ────────────────────────────────────────────────────────  │
│  DavidHuertas          2-1          Brazil         3       │
│  AndresH               2-1          Brazil         3       │
│  SimónHernández        2-1          Brazil         3       │
│  Hector Huertas        0-2          Japan          1       │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```

- Sorted by points descending, then participant name ascending.
- The current participant's row is highlighted with an emerald background
  (`bg-emerald-50`) so it stands out among the group.
- If the match has no result yet, the "Pts" column shows "—".
- Max-height with overflow-y scroll if many participants (cap at ~400px).

## 6. Table structure

The existing `<table>` gains a 6th column header:

```tsx
<th className="p-3 w-10"></th>
```

Each `<tbody>` row is replaced with a `MatchPredictionRow` client component
that renders the `<tr>` and the optional sub-row. The parent `<tbody>` remains
a server component that maps over predictions and renders
`MatchPredictionRow` instances.

## 7. Risks & notes

- **Data volume:** 22 participants × ~16 knockout matches = ~350 prediction
  rows loaded. ~35KB serialized. Negligible overhead.
- **No schema or API changes.**
- **Multiple sub-rows:** each `MatchPredictionRow` manages its own open/closed
  state independently. Users can have multiple sub-rows open simultaneously.
- **Points pre-computation:** `scoreMatchPrediction` runs server-side for each
  prediction. For ~350 calls this is instant (~1ms total).

## 8. Testing

- `npx tsc --noEmit` + `npm run build`.
- Manual: visit `/tabla/<id>`, click the ▼ button on a knockout match row →
  sub-row expands showing all participants' predictions sorted by points.
  Current participant highlighted. Click ▲ to collapse.
- Manual: match with no result → "Pts" column shows "—" for all rows.
- Manual: multiple sub-rows can be open simultaneously.