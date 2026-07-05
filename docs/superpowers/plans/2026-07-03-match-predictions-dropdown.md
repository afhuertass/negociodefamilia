# Match Predictions Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an expandable "all predictions" dropdown per knockout match row on `/tabla/:id`, so participants can compare their picks against everyone else's.

**Architecture:** One new `MatchPredictionRow` client component wraps each `<tr>` in the knockout table with a toggle button (▼/▲) and an expandable sub-row showing all participants' predictions for that match. The server page pre-computes points for every prediction using `scoreMatchPrediction` (avoiding Prisma imports in the client) and passes a `Map<matchId, AllPrediction[]>` to the client components.

**Tech Stack:** Next.js 16 server/client components, Prisma, React 19, TypeScript. No new dependencies.

---

### Task 1: Create `MatchPredictionRow` client component

**Files:**
- Create: `app/components/MatchPredictionRow.tsx`

- [ ] **Step 1: Create the component**

Create `app/components/MatchPredictionRow.tsx`:

```tsx
"use client";

import { useState } from "react";
import { TeamTooltip } from "./TeamTooltip";

type MatchHistory = {
  matchNumber: number | null;
  round: string;
  startsAt: string | null;
  stadium: string | null;
  homeTeamName: string;
  awayTeamName: string;
  result: { homeGoals: number; awayGoals: number } | null;
};

type AllPrediction = {
  participantId: string;
  participantName: string;
  homeGoals: number;
  awayGoals: number;
  qualifiedTeamName: string;
  points: number | null;
};

export function MatchPredictionRow({
  prediction,
  allPredictions,
  teamHistory,
  currentParticipantId,
}: {
  prediction: {
    id: string;
    homeGoals: number;
    awayGoals: number;
    qualifiedTeam: { name: string };
    match: {
      matchNumber: number | null;
      homeSlot: string | null;
      awaySlot: string | null;
      homeTeamId: string | null;
      awayTeamId: string | null;
      homeTeam: { id: string; name: string } | null;
      awayTeam: { id: string; name: string } | null;
      result: { homeGoals: number; awayGoals: number; qualifiedTeam: { name: string } } | null;
    };
  };
  allPredictions: AllPrediction[];
  teamHistory: MatchHistory[];
  currentParticipantId: string;
  awarded: number | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const match = prediction.match;
  const homeName = match.homeTeam?.name || match.homeSlot || "Por definir";
  const awayName = match.awayTeam?.name || match.awaySlot || "Por definir";
  const result = match.result;

  // Sort all predictions: points desc, then name asc.
  const sorted = [...allPredictions].sort((a, b) => {
    const pa = a.points ?? -1;
    const pb = b.points ?? -1;
    if (pb !== pa) return pb - pa;
    return a.participantName.localeCompare(b.participantName);
  });

  return (
    <>
      <tr className="border-b last:border-0">
        <td className="p-3 font-semibold">
          <span className="inline-flex items-center gap-2">
            #{match.matchNumber ?? ""} ·{" "}
            {match.homeTeamId ? (
              <TeamTooltip teamName={homeName} history={teamHistory}>
                {homeName}
              </TeamTooltip>
            ) : homeName}
            {" vs "}
            {match.awayTeamId ? (
              <TeamTooltip teamName={awayName} history={teamHistory}>
                {awayName}
              </TeamTooltip>
            ) : awayName}
          </span>
        </td>
        <td className="p-3 font-black">{prediction.homeGoals} - {prediction.awayGoals}</td>
        <td className="p-3">{prediction.qualifiedTeam.name}</td>
        <td className="p-3 text-slate-600">
          {result
            ? `${result.homeGoals} - ${result.awayGoals}, clasifica ${result.qualifiedTeam.name}`
            : "Pendiente"}
        </td>
        <td className="p-3 text-right font-black text-emerald-700">
          {awarded === null ? "—" : awarded}
        </td>
        <td className="p-3 text-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-expanded={open}
            aria-label={open ? "Ocultar predicciones" : "Ver predicciones de todos"}
          >
            {open ? "▲" : "▼"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-slate-50 px-6 py-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Predicciones de todos · #{match.matchNumber} {homeName} vs {awayName}
            </p>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="pb-2 text-left font-bold">Participante</th>
                    <th className="pb-2 text-left font-bold">Predicción</th>
                    <th className="pb-2 text-left font-bold">Clasifica</th>
                    <th className="pb-2 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => {
                    const isCurrent = p.participantId === currentParticipantId;
                    return (
                      <tr
                        key={p.participantId}
                        className={`border-t border-slate-100 ${isCurrent ? "bg-emerald-50" : ""}`}
                      >
                        <td className={`py-1.5 ${isCurrent ? "font-black text-emerald-800" : "font-semibold"}`}>
                          {p.participantName}
                        </td>
                        <td className="py-1.5 font-bold">{p.homeGoals} - {p.awayGoals}</td>
                        <td className="py-1.5">{p.qualifiedTeamName}</td>
                        <td className="py-1.5 text-right font-bold text-emerald-700">
                          {p.points === null ? "—" : p.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/MatchPredictionRow.tsx
git commit -m "feat: add MatchPredictionRow client component"
```

---

### Task 2: Wire up the participant detail page

**Files:**
- Modify: `app/tabla/[participantId]/page.tsx`

Three edits: (a) add the all-match-predictions query + points pre-computation, (b) add the 6th column header, (c) replace the `<tr>` rendering with `MatchPredictionRow`.

- [ ] **Step 1: Add all-match-predictions query + points pre-computation**

In `app/tabla/[participantId]/page.tsx`, find the existing team history query block (after `teamHistory.set(m.awayTeamId, arr);`) and the `const totalPoints` line:

```tsx
  }

  const totalPoints
```

Replace with:

```tsx
  }

  // Load ALL participants' predictions for every knockout match on this page.
  const allMatchPredictionsRaw = participant.matchPredictions.length > 0
    ? await prisma.matchPrediction.findMany({
        where: {
          matchId: { in: participant.matchPredictions.map((mp) => mp.matchId) },
        },
        include: { participant: true, qualifiedTeam: true, match: { include: { result: true } } },
        orderBy: [{ match: { matchNumber: "asc" } }, { participant: { name: "asc" } }],
      })
    : [];

  // Pre-compute points for each prediction (avoids importing scoringRules in client).
  const allPredictionsByMatch = new Map<string, {
    participantId: string; participantName: string;
    homeGoals: number; awayGoals: number; qualifiedTeamName: string; points: number | null;
  }[]>();
  for (const mp of allMatchPredictionsRaw) {
    const round = mp.match.round;
    const result = mp.match.result;
    const pts = result
      ? scoreMatchPrediction({
          round,
          predictedHomeGoals: mp.homeGoals,
          predictedAwayGoals: mp.awayGoals,
          predictedQualifiedTeamId: mp.qualifiedTeamId,
          actualHomeGoals: result.homeGoals,
          actualAwayGoals: result.awayGoals,
          actualQualifiedTeamId: result.qualifiedTeamId,
        }).points
      : null;
    const entry = {
      participantId: mp.participantId,
      participantName: mp.participant.name,
      homeGoals: mp.homeGoals,
      awayGoals: mp.awayGoals,
      qualifiedTeamName: mp.qualifiedTeam.name,
      points: pts,
    };
    const arr = allPredictionsByMatch.get(mp.matchId) ?? [];
    arr.push(entry);
    allPredictionsByMatch.set(mp.matchId, arr);
  }

  const totalPoints
```

- [ ] **Step 2: Import `MatchPredictionRow`**

Find:

```tsx
import { TeamTooltip } from "@/app/components/TeamTooltip";
```

Replace with:

```tsx
import { TeamTooltip } from "@/app/components/TeamTooltip";
import { MatchPredictionRow } from "@/app/components/MatchPredictionRow";
```

- [ ] **Step 3: Add the 6th column header**

Find the table header in the knockout section:

```tsx
                    <th className="p-3 text-right">Puntos</th>
                  </tr>
```

Replace with:

```tsx
                    <th className="p-3 text-right">Puntos</th>
                    <th className="p-3 w-10"></th>
                  </tr>
```

- [ ] **Step 4: Replace the `<tr>` rendering with `MatchPredictionRow`**

Find the entire `<tbody>` block in the knockout section:

```tsx
                <tbody>
                  {predictions.map((prediction) => {
                    const result = prediction.match.result;
                    const awarded = result
                      ? scoreMatchPrediction({
                          round,
                          predictedHomeGoals: prediction.homeGoals,
                          predictedAwayGoals: prediction.awayGoals,
                          predictedQualifiedTeamId: prediction.qualifiedTeamId,
                          actualHomeGoals: result.homeGoals,
                          actualAwayGoals: result.awayGoals,
                          actualQualifiedTeamId: result.qualifiedTeamId,
                        }).points
                      : null;

                    return (
                      <tr key={prediction.id} className="border-b last:border-0">
                        <td className="p-3 font-semibold">
                          {(() => {
                            const match = prediction.match;
                            const home = match.homeTeam?.name || match.homeSlot || "Por definir";
                            const away = match.awayTeam?.name || match.awaySlot || "Por definir";
                            return (
                              <>
                                #{match.matchNumber ?? ""} ·{" "}
                                {match.homeTeamId ? (
                                  <TeamTooltip teamName={home} history={teamHistory.get(match.homeTeamId) ?? []}>
                                    {home}
                                  </TeamTooltip>
                                ) : home}
                                {" vs "}
                                {match.awayTeamId ? (
                                  <TeamTooltip teamName={away} history={teamHistory.get(match.awayTeamId) ?? []}>
                                    {away}
                                  </TeamTooltip>
                                ) : away}
                              </>
                            );
                          })()}
                        </td>
                        <td className="p-3 font-black">{prediction.homeGoals} - {prediction.awayGoals}</td>
                        <td className="p-3">{prediction.qualifiedTeam.name}</td>
                        <td className="p-3 text-slate-600">
                          {result
                            ? `${result.homeGoals} - ${result.awayGoals}, clasifica ${result.qualifiedTeam.name}`
                            : "Pendiente"}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          {awarded === null ? "—" : awarded}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
```

Replace with:

```tsx
                <tbody>
                  {predictions.map((prediction) => {
                    const match = prediction.match;
                    const result = match.result;
                    const awarded = result
                      ? scoreMatchPrediction({
                          round,
                          predictedHomeGoals: prediction.homeGoals,
                          predictedAwayGoals: prediction.awayGoals,
                          predictedQualifiedTeamId: prediction.qualifiedTeamId,
                          actualHomeGoals: result.homeGoals,
                          actualAwayGoals: result.awayGoals,
                          actualQualifiedTeamId: result.qualifiedTeamId,
                        }).points
                      : null;
                    const homeId = match.homeTeamId;
                    const awayId = match.awayTeamId;
                    const homeHistory = homeId ? teamHistory.get(homeId) ?? [] : [];
                    const awayHistory = awayId ? teamHistory.get(awayId) ?? [] : [];
                    const combinedHistory = [...homeHistory, ...awayHistory].filter(
                      (v, i, a) => a.findIndex((x) => x.matchNumber === v.matchNumber) === i
                    );

                    return (
                      <MatchPredictionRow
                        key={prediction.id}
                        prediction={prediction}
                        allPredictions={allPredictionsByMatch.get(prediction.matchId) ?? []}
                        teamHistory={combinedHistory}
                        currentParticipantId={participant.id}
                        awarded={awarded}
                      />
                    );
                  })}
                </tbody>
```

Note: the `MatchPredictionRow` component handles the `<tr>` and optional sub-row internally. The parent `<tbody>` maps over predictions and renders `MatchPredictionRow` instances. The `teamHistory` for the main row's TeamTooltip is combined from both home and away team histories (the match label shows both teams).

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Run production build**

Run: `npm run build`
Expected: build succeeds; `/tabla/[participantId]` listed in route map.

- [ ] **Step 7: Commit**

```bash
git add app/tabla/[participantId]/page.tsx
git commit -m "feat: add expandable all-predictions dropdown to knockout table"
```

---

### Task 3: Manual verification

**Files:** none (browser).

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: server starts on http://localhost:3000.

- [ ] **Step 2: Visit a participant detail page**

Open `http://localhost:3000/tabla` and click on a participant.
Expected: knockout table now has a 6th column with ▼ buttons on each row.

- [ ] **Step 3: Expand a match**

Click the ▼ button on a knockout match row.
Expected: a sub-row expands below showing all participants' predictions sorted by points. Current participant highlighted in emerald. Click ▲ to collapse.

- [ ] **Step 4: Verify sorting and highlighting**

Check that the sub-row is sorted by points (highest first) and the current participant's row has an emerald background.

- [ ] **Step 5: Match with no result**

If any knockout match has no result yet, expand it.
Expected: "Pts" column shows "—" for all participants.

- [ ] **Step 6: Final build**

Run: `npm run build`
Expected: success.