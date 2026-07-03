# Team History Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover/tap tooltips showing a team's full tournament record to every team name displayed on `/tabla/:id` — both group-stage pills and knockout table cells.

**Architecture:** One new `TeamTooltip` client component (`app/components/TeamTooltip.tsx`) renders a floating tooltip on hover/focus/tap. The server page (`app/tabla/[participantId]/page.tsx`) fetches all finished matches for every team on the page, groups them into a `Map<teamId, Match[]>`, and passes the serialized map to `TeamTooltip` instances wrapping each team name.

**Tech Stack:** Next.js 16 server/client components, Prisma, React 19, TypeScript. No new dependencies.

---

### Task 1: Create `TeamTooltip` client component

**Files:**
- Create: `app/components/TeamTooltip.tsx`

- [ ] **Step 1: Create the component**

Create `app/components/TeamTooltip.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

type MatchHistory = {
  matchNumber: number | null;
  round: string;
  startsAt: string | null;
  stadium: string | null;
  homeTeamName: string;
  awayTeamName: string;
  result: { homeGoals: number; awayGoals: number } | null;
};

const roundLabels: Record<string, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "16avos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  FINAL: "Final",
};

export function TeamTooltip({
  teamId,
  teamName,
  history,
  children,
}: {
  teamId: string;
  teamName: string;
  history: MatchHistory[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!history || history.length === 0) return <>{children}</>;

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="cursor-help underline decoration-dotted decoration-slate-300 underline-offset-2">
        {children}
      </span>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
          <span className="block font-black text-slate-800 mb-2">
            Partidos de {teamName}
          </span>
          {history.map((m, i) => {
            const isHome = m.homeTeamName === teamName;
            const opponent = isHome ? m.awayTeamName : m.homeTeamName;
            const score = m.result
              ? `${m.result.homeGoals} - ${m.result.awayGoals}`
              : "Pendiente";
            const label = m.matchNumber
              ? `#${m.matchNumber} ${roundLabels[m.round] || m.round}`
              : roundLabels[m.round] || m.round;
            return (
              <span
                key={i}
                className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
              >
                <span className="text-slate-500 truncate">{label}</span>
                <span className="text-slate-700 truncate">
                  {isHome ? "vs" : "@"} {opponent}
                </span>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {score}
                </span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/TeamTooltip.tsx
git commit -m "feat: add TeamTooltip client component"
```

---

### Task 2: Wire up the participant detail page

**Files:**
- Modify: `app/tabla/[participantId]/page.tsx`

Three edits: (a) add team history query after participant fetch, (b) wrap group-stage pills with `TeamTooltip`, (c) split knockout table match-label cell into individually wrapped team names.

- [ ] **Step 1: Add team history query**

In `app/tabla/[participantId]/page.tsx`, after the existing `getParticipantData` + `actualQualifiedTeams` fetches, add a query that loads all finished matches for every team on the page.

Find:

```tsx
  const [participant, actualQualifiedTeams] = await Promise.all([
    getParticipantData(participantId),
    prisma.actualQualifiedTeam.findMany(),
  ]);
  if (!participant) notFound();
```

Replace with:

```tsx
  const [participant, actualQualifiedTeams] = await Promise.all([
    getParticipantData(participantId),
    prisma.actualQualifiedTeam.findMany(),
  ]);
  if (!participant) notFound();

  // Collect all team IDs shown on this page (group picks + knockout match teams).
  const teamIds = new Set<string>();
  for (const gp of participant.groupPredictions) teamIds.add(gp.teamId);
  for (const mp of participant.matchPredictions) {
    if (mp.match.homeTeamId) teamIds.add(mp.match.homeTeamId);
    if (mp.match.awayTeamId) teamIds.add(mp.match.awayTeamId);
  }

  // Fetch all finished matches involving those teams.
  const teamMatches = teamIds.size > 0
    ? await prisma.match.findMany({
        where: {
          finished: true,
          OR: [
            { homeTeamId: { in: Array.from(teamIds) } },
            { awayTeamId: { in: Array.from(teamIds) } },
          ],
        },
        include: { homeTeam: true, awayTeam: true, result: true },
        orderBy: { startsAt: "asc" },
      })
    : [];

  // Group matches by team ID. A match appears under both the home and away team.
  const teamHistory = new Map<string, {
    matchNumber: number | null; round: string; startsAt: string | null;
    stadium: string | null; homeTeamName: string; awayTeamName: string;
    result: { homeGoals: number; awayGoals: number } | null;
  }[]>();
  for (const m of teamMatches) {
    const entry = {
      matchNumber: m.matchNumber,
      round: m.round,
      startsAt: m.startsAt?.toISOString() ?? null,
      stadium: m.stadium,
      homeTeamName: m.homeTeam?.name ?? "",
      awayTeamName: m.awayTeam?.name ?? "",
      result: m.result ? { homeGoals: m.result.homeGoals, awayGoals: m.result.awayGoals } : null,
    };
    if (m.homeTeamId) {
      const arr = teamHistory.get(m.homeTeamId) ?? [];
      arr.push(entry);
      teamHistory.set(m.homeTeamId, arr);
    }
    if (m.awayTeamId) {
      const arr = teamHistory.get(m.awayTeamId) ?? [];
      arr.push(entry);
      teamHistory.set(m.awayTeamId, arr);
    }
  }
```

- [ ] **Step 2: Import `TeamTooltip`**

Find:

```tsx
import Avatar from "@/app/components/Avatar";
```

Replace with:

```tsx
import Avatar from "@/app/components/Avatar";
import { TeamTooltip } from "@/app/components/TeamTooltip";
```

- [ ] **Step 3: Wrap group-stage pills with `TeamTooltip`**

Find the "1º / 2º de grupo" pill rendering:

```tsx
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    {p.team.group} · {p.team.name} <b>{hit ? "+1" : "0"}</b>
                  </span>
```

Replace with:

```tsx
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    <TeamTooltip teamId={p.teamId} teamName={p.team.name} history={teamHistory.get(p.teamId) ?? []}>
                      {p.team.group} · {p.team.name}
                    </TeamTooltip> <b>{hit ? "+1" : "0"}</b>
                  </span>
```

Find the "Mejores terceros" pill rendering:

```tsx
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-sky-50 text-sky-800" : "bg-slate-100 text-slate-700"}`}>
                    {p.team.group} · {p.team.name} <b>{hit ? "+1" : "0"}</b>
                  </span>
```

Replace with:

```tsx
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-sky-50 text-sky-800" : "bg-slate-100 text-slate-700"}`}>
                    <TeamTooltip teamId={p.teamId} teamName={p.team.name} history={teamHistory.get(p.teamId) ?? []}>
                      {p.team.group} · {p.team.name}
                    </TeamTooltip> <b>{hit ? "+1" : "0"}</b>
                  </span>
```

- [ ] **Step 4: Split knockout table match-label cell into wrapped team names**

Find the table cell in the knockout section:

```tsx
                        <td className="p-3 font-semibold">{matchLabel(prediction)}</td>
```

Replace with:

```tsx
                        <td className="p-3 font-semibold">
                          {(() => {
                            const match = prediction.match;
                            const home = match.homeTeam?.name || match.homeSlot || "Por definir";
                            const away = match.awayTeam?.name || match.awaySlot || "Por definir";
                            return (
                              <>
                                {match.homeTeamId ? (
                                  <TeamTooltip teamId={match.homeTeamId} teamName={home} history={teamHistory.get(match.homeTeamId) ?? []}>
                                    {home}
                                  </TeamTooltip>
                                ) : home}
                                {" vs "}
                                {match.awayTeamId ? (
                                  <TeamTooltip teamId={match.awayTeamId} teamName={away} history={teamHistory.get(match.awayTeamId) ?? []}>
                                    {away}
                                  </TeamTooltip>
                                ) : away}
                              </>
                            );
                          })()}
                        </td>
```

- [ ] **Step 5: Remove the now-dead `matchLabel()` function**

The inline rendering in Step 4 replaces the only call site of `matchLabel`. Remove the function entirely:

Find and delete:
```ts
function matchLabel(prediction: NonNullable<Awaited<ReturnType<typeof getParticipantData>>>["matchPredictions"][number]) {
  const match = prediction.match;
  const home = match.homeTeam?.name || match.homeSlot || "Por definir";
  const away = match.awayTeam?.name || match.awaySlot || "Por definir";
  return `#${match.matchNumber ?? ""} · ${home} vs ${away}`;
}
```

- [ ] **Step 6: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Run production build**

Run: `npm run build`
Expected: build succeeds; `/tabla/[participantId]` listed in route map.

- [ ] **Step 8: Commit**

```bash
git add app/tabla/[participantId]/page.tsx
git commit -m "feat: add team history tooltips to participant detail page"
```

---

### Task 3: Manual verification

**Files:** none (browser checks against local dev DB or Neon).

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: server starts on http://localhost:3000.

- [ ] **Step 2: Visit a participant detail page**

Open `http://localhost:3000/tabla` and click on any participant to go to `/tabla/<id>`.
Expected: page loads normally with all existing content.

- [ ] **Step 3: Hover over a knockout table team name**

In any knockout predictions section, hover over a team name (e.g. "France" in "France vs Sweden").
Expected: a tooltip appears above the name showing that team's finished matches with opponent, round label, and score. Team name has dotted underline.

- [ ] **Step 4: Hover over a group-stage team pill**

In the "Fase de grupos" section, hover over a team name (e.g. "A · Mexico").
Expected: same tooltip appears with that team's tournament record.

- [ ] **Step 5: Mobile tap test**

On a touch device (or browser DevTools touch emulation), tap a team name.
Expected: tooltip toggles open. Tap elsewhere to close.

- [ ] **Step 6: Team with no finished matches**

If any team on the page hasn't played yet (e.g. a future knockout matchup), hover over their name.
Expected: no tooltip, plain text rendered (no dotted underline).

- [ ] **Step 7: Final build**

Run: `npm run build`
Expected: success.