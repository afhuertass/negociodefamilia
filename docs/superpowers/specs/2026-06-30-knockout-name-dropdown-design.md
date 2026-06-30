# Knockout Predictions: Name Dropdown (no access code)

**Date:** 2026-06-30
**Topic:** Replace the cookie/code login gate on knockout prediction pages with an on-page name dropdown.

## 1. Goal & context

We moved into the knockout stages (Round of 32 onward). Participants found the
`/entrar` name+accessCode login too cumbersome, so for knockout predictions
(`app/predicciones/[round]/page.tsx`) we drop the access-code requirement and let
participants pick their name from a dropdown on the page itself.

Out of scope (unchanged):

- `/entrar` keeps the name+accessCode flow.
- `/predicciones/grupos` and `/predicciones/partidos` keep using the
  `participantId` cookie via `getParticipantId()`.
- `/predicciones` index page is untouched.
- The schema's `accessCode` column stays; no migrations.

## 2. Scope of changes

Only **`app/predicciones/[round]/page.tsx`** and one new client component. Affects
all knockout slugs that share this route: `dieciseisavos`, `octavos`, `cuartos`,
`semifinales`, `final`.

A new sibling client component **`app/components/NameSelector.tsx`** mirrors the
existing `Combobox` autocomplete but submits via GET to the current slug.

## 3. Page flow (query-param based, option A)

The server component in `app/predicciones/[round]/page.tsx`:

1. No longer calls `getParticipantId()`.
2. Reads `participante` from `searchParams` (a participant **name**, trimmed).
3. Looks the name up in the `Participant` table (exact, case-sensitive after
   trim). Existing DB names are normalized forms like `ZenonHuertas`, `Iván`,
   `Sergio S`, `Juan Fierro`.
4. **If absent or unmatched:** renders an empty state with a `<NameSelector>`
   form. Submitting it navigates (GET) to
   `/predicciones/<slug>?participante=<name>`.
5. **If matched:** resolves the `Participant.id`, loads that participant's
   existing `MatchPrediction` rows for the round as `defaultValue`s, and emits a
   hidden `<input type="hidden" name="participantId" value={id}>` inside the
   existing save `<form>`. The page renders exactly as today otherwise.

`searchParams` `ok`/`error`/`locked` banners behave unchanged.

## 4. `savePredictions` server action changes

- Remove the `participantId = await getParticipantId(); if (!participantId)
  redirect("/entrar")` block.
- Read `participantId` from the form field:
  `const participantId = String(formData.get("participantId"))`.
- Validate the participant exists: `const participant = await
  prisma.participant.findUnique({ where: { id: participantId } }); if
  (!participant) redirect("/");` (invalid/garbage ids bounce back rather than
  404).
- Phase-lock check, per-match validation (locked, both teams assigned, integer
  non-negative goals, `qualifiedTeamId` ∈ {homeTeamId, awayTeamId}), and the
  `matchPrediction.upsert` loop are unchanged.
- No cookie writes.
- On success, redirect stays `/predicciones/${roundSlug}?ok=1&participante=<name>`
  so the participant's selection persists across the round-trip (the action must
  forward the resolved participant's name back into the redirect).

## 5. `NameSelector` component

A client component (`"use client"`) modeled on `app/components/Combobox.tsx`:

- Props: `participants: { name: string }[]`, `slug: string`.
- Autocomplete text input over participant names (same dropdown styling as
  `Combobox`).
- On select, submits a GET navigation to
  `/predicciones/<slug>?participante=<encoded name>`. Implementation can use a
  plain `<form method="get">` with a hidden/visible `participante` input plus a
  submit button, or `useRouter().push()` — whichever follows existing patterns.
  Prefer the plain form to avoid client-router surprises.
- Keys handling is not required beyond what already exists in `Combobox`.

## 6. Risks & accepted trade-offs

- **Spoofing:** anyone who knows a participant's name can save predictions
  under that name. Accepted by design for this family poll.
- **Name→id resolution:** exact match after trimming. The DPB participant names
  are pre-normalized camelCase / single-token forms (e.g. `ZenonHuertas`), so the
  dropdown prevents free-form typos.
- **Cookie isolation:** this change does not affect any other page. Other
  prediction pages keep the cookie gate.

## 7. Out-of-plan follow-up (data import)

The two Excel exports under `results/`
(`sudafrica_vs_canada.xlsx`, `matches_second_diesiceisavos.xlsx`) contain
free-text predictions for four Round-of-32 fixtures. These will be inserted
directly into the Neon production database **by hand** after the user:

1. assigns the four real team pairs to specific matchNumbers via
   `/admin/partidos` (`assignTeams`), and
2. enters the two already-played results (South Africa 0–1 Canada, Brazil 2–1
   Japan) and marks them finished/locked.

No ingestion script will be committed to the repo. The user validates the inserts
afterward. This is **not** part of the implementation plan.

## 8. Testing

- Manual: visit `/predicciones/dieciseisavos` unauthenticated -> see name
  selector. Pick a name -> existing picks load as defaults. Save -> redirect
  preserves the selected participant and shows "Predicciones guardadas."
- Manual: visit with `?participante=<nonexistent>` -> empty state / selector
  shown, no crash.
- Manual: `/predicciones/grupos` still requires the old cookie (regression).
- `npx tsc --noEmit` must pass.