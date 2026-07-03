# Team History Tooltip Design

**Date:** 2026-07-01
**Topic:** On-hover team history tooltips on `/tabla/:id` participant detail page.

## 1. Goal & context

Participants viewing someone's predictions at `/tabla/:id` want to quickly
recall a team's tournament record before judging that person's picks. This adds
hover (or tap on mobile) tooltips showing all finished matches for any team
name displayed on the page — both the group-stage qualified-team pills and
the knockout predictions table.

## 2. Scope

- **Modify:** `app/tabla/[participantId]/page.tsx` — add a second server query
  for team match history, pass it to the client tooltip, wrap team names.
- **Create:** `app/components/TeamTooltip.tsx` — client component that renders
  a floating tooltip on hover/tap.
- No schema changes, no new routes, no API endpoints.

## 3. Data fetch (server)

After loading the participant via the existing `getParticipantData`, collect
all unique team IDs from:

- `groupPredictions[].teamId`
- `matchPredictions[].match.homeTeamId`
- `matchPredictions[].match.awayTeamId`

Then run one Prisma query for all finished matches involving those teams:

```ts
const teamMatches = await prisma.match.findMany({
  where: {
    finished: true,
    OR: [
      { homeTeamId: { in: Array.from(teamIds) } },
      { awayTeamId: { in: Array.from(teamIds) } },
    ],
  },
  include: {
    homeTeam: true,
    awayTeam: true,
    result: { include: { qualifiedTeam: true } },
  },
  orderBy: { startsAt: "asc" },
});
```

Group into `Map<string, Match[]>` keyed by team ID (a match appears under
both the home and away team's entry). Pass as `teamHistory` to the page.

## 4. `TeamTooltip` client component

`app/components/TeamTooltip.tsx` — wraps any team name and shows a tooltip
on hover/focus (desktop) or tap (mobile).

**Props:**
- `teamId: string`
- `teamName: string`
- `history: Match[]` — the team's finished matches, serialized from server.
- `children: React.ReactNode` — the wrapped team name element.

**Behavior:**
- If `history` is empty, renders children as plain text (no tooltip).
- On hover/focus: shows a floating tooltip above the element.
- On mobile tap: toggles the tooltip. Outside click / Escape closes it.
- Decorative `underline decoration-dotted` on the team name signals
  "hoverable" affordance.

**Tooltip content (per match):**
- Opponent name (derived: if team is home → show away team name, prefixed
  with "vs"; if away → show home name, prefixed with "@").
- Score (`homeGoals - awayGoals`), or "Pendiente" if no result.
- Matches ordered chronologically (earliest first).

**Positioning:** `absolute bottom-full left-1/2 -translate-x-1/2` — tooltip
appears centered above the element. For teams near the top of the viewport
the tooltip may clip; acceptable for a family poll with 23 users. No
`@floating-ui` dependency needed.

## 5. Page integration

### Group-stage pills

Wrap each team name in the pill with `TeamTooltip`:

```tsx
<TeamTooltip teamId={p.team.id} teamName={p.team.name} history={teamHistory.get(p.team.id) || []}>
  {p.team.group} · {p.team.name}
</TeamTooltip>
```

Both the "1º / 2º de grupo" and "Mejores terceros" sections get this.

### Knockout table "Partido" column

Split the current `matchLabel()` rendering into two individually wrapped
team names:

```tsx
<td className="p-3 font-semibold">
  <TeamTooltip teamId={homeTeamId} teamName={home} history={teamHistory.get(homeTeamId) || []}>
    {home}
  </TeamTooltip>
  {" vs "}
  <TeamTooltip teamId={awayTeamId} teamName={away} history={teamHistory.get(awayTeamId) || []}>
    {away}
  </TeamTooltip>
</td>
```

## 6. Risks & accepted trade-offs

- **Tooltip clipping near viewport top:** acceptable for this audience size.
- **Touch devices:** `onClick` toggles; outside-click closes. No hover
  dependency.
- **Data freshness:** loaded once per page render (server). New results
  appear on next navigation. No client polling.
- **No schema or API changes.**

## 7. Testing

- `npx tsc --noEmit` + `npm run build`.
- Manual: visit `/tabla/<id>`, hover over a team name in the knockout table
  → tooltip shows that team's finished matches with scores.
- Manual: hover over a group-stage team pill → same tooltip.
- Manual: tap on mobile → tooltip toggles.
- Manual: team with no finished matches → no tooltip, plain text.