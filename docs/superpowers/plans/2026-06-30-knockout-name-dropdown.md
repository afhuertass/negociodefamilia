# Knockout Name Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let participants fill knockout predictions (`/predicciones/[round]`) by selecting their name from a dropdown — no access code — using a `?participante=<name>` query param instead of the cookie session.

**Architecture:** The `[round]/page.tsx` server component stops reading the `participantId` cookie. It reads `participante` from `searchParams`, resolves it to a `Participant`, and either shows a `NameSelector` (empty state) or renders the existing prediction form with a hidden `participantId` field. The `savePredictions` server action reads `participantId` from the form field, validates the participant exists, and redirects back with the name preserved. `/entrar`, `/predicciones/grupos`, and `/predicciones/partidos` keep the cookie-based `getParticipantId()` flow unchanged.

**Tech Stack:** Next.js 16 App Router, React 19 server/client components, Prisma, TypeScript. Tests run via `npx tsx` (the project has no jest/vitest — existing tests are integration scripts under `tests/integration/`).

---

### Task 1: Pure participant-name resolver + test

**Files:**
- Create: `app/predicciones/[round]/resolveParticipant.ts`
- Create: `tests/integration/participant-name.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/integration/participant-name.ts`:

```ts
import { normalizeParticipantName } from "../../app/predicciones/[round]/resolveParticipant";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

assert(normalizeParticipantName(undefined) === null, "undefined -> null");
assert(normalizeParticipantName("") === null, "empty -> null");
assert(normalizeParticipantName("   ") === null, "whitespace -> null");
assert(normalizeParticipantName("ZenonHuertas") === "ZenonHuertas", "name preserved");
assert(normalizeParticipantName(" Iván ") === "Iván", "trimmed");
assert(normalizeParticipantName(["AndresH"]) === "AndresH", "array first element");
assert(normalizeParticipantName(["", "x"]) === null, "array with empty first -> null");
assert(normalizeParticipantName(123 as unknown) === null, "non-string -> null");

console.log("All participant-name tests passed.");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx tests/integration/participant-name.ts`
Expected: FAIL with a module-not-found / import error for `resolveParticipant`.

- [ ] **Step 3: Write minimal implementation**

Create `app/predicciones/[round]/resolveParticipant.ts`:

```ts
/**
 * Normalize a `participante` query-param value into a participant name, or null
 * if absent/empty. Accepts the string | string[] | undefined shapes that
 * Next.js `searchParams` can produce. Matching against the DB is exact (after
 * trim) — the NameSelector dropdown prevents typos, so no fuzzy logic here.
 */
export function normalizeParticipantName(
  raw: string | string[] | undefined
): string | null {
  if (Array.isArray(raw)) raw = raw[0];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx tests/integration/participant-name.ts`
Expected: prints `ok:` lines and `All participant-name tests passed.`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/predicciones/[round]/resolveParticipant.ts tests/integration/participant-name.ts
git commit -m "feat: add participant-name normalizer for knockout predictions"
```

---

### Task 2: NameSelector client component

**Files:**
- Create: `app/components/NameSelector.tsx`

This mirrors the existing `app/components/Combobox.tsx` autocomplete, but wraps it in a plain GET `<form>` that navigates to `/predicciones/<slug>?participante=<name>` on submit. No test harness exists for client components in this project; verification is manual in Task 3.

- [ ] **Step 1: Create the component**

Create `app/components/NameSelector.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

export default function NameSelector({
  participants,
  slug,
}: {
  participants: { name: string }[];
  slug: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = participants.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form action={`/predicciones/${slug}`} method="get" className="mt-6 space-y-4">
      <div className="relative" ref={containerRef}>
        <input
          type="text"
          className="input mt-1 w-full"
          placeholder="Escribe tu nombre..."
          value={selectedName || searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            setSearchTerm(value);
            setSelectedName("");
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          required
        />
        {/* Hidden field carries the resolved name; empty until a suggestion is picked. */}
        <input type="hidden" name="participante" value={selectedName} />

        {isOpen && searchTerm.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-slate-200 shadow-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.name}
                  className="cursor-pointer px-4 py-2 hover:bg-slate-100"
                  onClick={() => {
                    setSelectedName(option.name);
                    setSearchTerm(option.name);
                    setIsOpen(false);
                  }}
                >
                  {option.name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-slate-500">No encontrado</li>
            )}
          </ul>
        )}
      </div>
      <button
        className="btn w-full disabled:cursor-not-allowed disabled:bg-emerald-400"
        disabled={!selectedName}
      >
        Continuar
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/components/NameSelector.tsx
git commit -m "feat: add NameSelector dropdown for knockout predictions"
```

---

### Task 3: Rewire `[round]/page.tsx` to the query-param flow

**Files:**
- Modify: `app/predicciones/[round]/page.tsx`

Three edits: imports + `savePredictions`, the empty-state top of the component, and adding a hidden `participantId` input inside the existing `<form>`.

- [ ] **Step 1: Replace imports**

In `app/predicciones/[round]/page.tsx`, replace the top import block:

```tsx
import { Round } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPhaseLocked } from "@/lib/locks";
import { getParticipantId } from "@/lib/session";
```

with:

```tsx
import { Round } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPhaseLocked } from "@/lib/locks";
import { normalizeParticipantName } from "./resolveParticipant";
import NameSelector from "@/app/components/NameSelector";
```

(`Link` and `getParticipantId` are no longer used on this page.)

- [ ] **Step 2: Replace `savePredictions`**

Replace the existing `savePredictions` function:

```tsx
async function savePredictions(formData: FormData) {
  "use server";
  const participantId = await getParticipantId();
  if (!participantId) redirect("/entrar");
  const roundSlug = String(formData.get("roundSlug"));
  const round = rounds[roundSlug];
  if (!round) redirect("/");

  if (await isPhaseLocked(round)) redirect(`/predicciones/${roundSlug}?error=locked`);

  const matches = await prisma.match.findMany({ where: { round }, include: { homeTeam: true, awayTeam: true } });
  for (const match of matches) {
    if (match.locked || !match.homeTeamId || !match.awayTeamId) continue;
    const homeGoals = Number(formData.get(`homeGoals:${match.id}`));
    const awayGoals = Number(formData.get(`awayGoals:${match.id}`));
    const qualifiedTeamId = String(formData.get(`qualified:${match.id}`) || "");
    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) || homeGoals < 0 || awayGoals < 0) continue;
    if (![match.homeTeamId, match.awayTeamId].includes(qualifiedTeamId)) continue;
    await prisma.matchPrediction.upsert({
      where: { participantId_matchId: { participantId, matchId: match.id } },
      update: { homeGoals, awayGoals, qualifiedTeamId },
      create: { participantId, matchId: match.id, homeGoals, awayGoals, qualifiedTeamId },
    });
  }
  redirect(`/predicciones/${roundSlug}?ok=1`);
}
```

with:

```tsx
async function savePredictions(formData: FormData) {
  "use server";
  const participantId = String(formData.get("participantId") || "");
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) redirect("/");
  const roundSlug = String(formData.get("roundSlug"));
  const round = rounds[roundSlug];
  if (!round) redirect("/");

  if (await isPhaseLocked(round)) redirect(`/predicciones/${roundSlug}?error=locked&participante=${encodeURIComponent(participant.name)}`);

  const matches = await prisma.match.findMany({ where: { round }, include: { homeTeam: true, awayTeam: true } });
  for (const match of matches) {
    if (match.locked || !match.homeTeamId || !match.awayTeamId) continue;
    const homeGoals = Number(formData.get(`homeGoals:${match.id}`));
    const awayGoals = Number(formData.get(`awayGoals:${match.id}`));
    const qualifiedTeamId = String(formData.get(`qualified:${match.id}`) || "");
    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) || homeGoals < 0 || awayGoals < 0) continue;
    if (![match.homeTeamId, match.awayTeamId].includes(qualifiedTeamId)) continue;
    await prisma.matchPrediction.upsert({
      where: { participantId_matchId: { participantId, matchId: match.id } },
      update: { homeGoals, awayGoals, qualifiedTeamId },
      create: { participantId, matchId: match.id, homeGoals, awayGoals, qualifiedTeamId },
    });
  }
  redirect(`/predicciones/${roundSlug}?ok=1&participante=${encodeURIComponent(participant.name)}`);
}
```

- [ ] **Step 3: Replace the empty-state / participant-resolution block**

Replace:

```tsx
export default async function RoundPredictionsPage({ params, searchParams }: { params: Promise<{ round: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return (
      <div className="mx-auto max-w-lg card">
        <h1 className="text-3xl font-black">Predicciones eliminatorias</h1>
        <p className="mt-3 text-sm text-slate-600">
          Para llenar predicciones primero debes entrar con tu nombre y código.
        </p>
        <Link className="btn mt-5" href="/entrar">Entrar</Link>
      </div>
    );
  }
  const [{ round: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const round = rounds[slug];
  if (!round) redirect("/");
```

with:

```tsx
export default async function RoundPredictionsPage({ params, searchParams }: { params: Promise<{ round: string }>; searchParams: Promise<{ ok?: string; error?: string; participante?: string }> }) {
  const [{ round: slug }, { ok, error, participante }] = await Promise.all([params, searchParams]);
  const round = rounds[slug];
  if (!round) redirect("/");

  const rawName = normalizeParticipantName(participante);
  const participant = rawName ? await prisma.participant.findUnique({ where: { name: rawName } }) : null;

  if (!participant) {
    const participants = await prisma.participant.findMany({ select: { name: true }, orderBy: { name: "asc" } });
    return (
      <div className="mx-auto max-w-lg card">
        <h1 className="text-3xl font-black">Predicciones eliminatorias</h1>
        <p className="mt-3 text-sm text-slate-600">
          Selecciona tu nombre para ver y guardar tus predicciones de {roundTitles[slug]}.
        </p>
        <NameSelector participants={participants} slug={slug} />
      </div>
    );
  }
  const participantId = participant.id;
```

- [ ] **Step 4: Add the hidden `participantId` field to the form**

In the same file, replace:

```tsx
        <form action={savePredictions} className="space-y-6">
          <input type="hidden" name="roundSlug" value={slug} />
```

with:

```tsx
        <form action={savePredictions} className="space-y-6">
          <input type="hidden" name="roundSlug" value={slug} />
          <input type="hidden" name="participantId" value={participantId} />
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirms `Link`/`getParticipantId` removal didn't leave dangling references, and `searchParams` typing is consistent.)

- [ ] **Step 6: Run the unit test to confirm no regression**

Run: `npx tsx tests/integration/participant-name.ts`
Expected: `All participant-name tests passed.`, exit 0.

- [ ] **Step 7: Commit**

```bash
git add app/predicciones/[round]/page.tsx
git commit -m "feat: knockout predictions use name dropdown instead of login"
```

---

### Task 4: Manual verification

**Files:** none (runtime checks against local dev DB or production Neon as available).

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Next dev server starts on http://localhost:3000.

- [ ] **Step 2: Empty state without a name**

Open `http://localhost:3000/predicciones/dieciseisavos`.
Expected: Card titled "Predicciones eliminatorias" with subtitle naming "Dieciseisavos" and the `NameSelector` dropdown (search input + disabled "Continuar" button).

- [ ] **Step 3: Selecting a name loads predictions**

Type a name fragment (e.g. "hue"), click a suggestion (e.g. `ZenonHuertas`), click "Continuar".
Expected: URL becomes `/predicciones/dieciseisavos?participante=ZenonHuertas` and the prediction card deck renders with that participant's saved picks as defaults (or empty inputs if none saved).

- [ ] **Step 4: Saving preserves the selection**

Fill one unlocked match (score + qualifier), click "Guardar predicciones".
Expected: Redirect to `/predicciones/dieciseisavos?ok=1&participante=ZenonHuertas`, the "Predicciones guardadas." banner shows, and the saved values persist on reload.

- [ ] **Step 5: Unknown name falls back to selector**

Open `http://localhost:3000/predicciones/dieciseisavos?participante=NoExiste`.
Expected: The empty-state `NameSelector` card renders (no crash, no 500).

- [ ] **Step 6: Phase-lock redirect preserves the name**

(Only if you can toggle a lock.) With the round locked via `/admin`, attempt to save.
Expected: Redirect to `/predicciones/dieciseisavos?error=locked&participante=<name>` showing the locked banner, and the selector deck is still tied to the same participant.

- [ ] **Step 7: Regression — grupos still uses the cookie flow**

Ensure you are NOT logged in, then open `http://localhost:3000/predicciones/grupos`.
Expected: The existing "Para llenar predicciones primero debes entrar…" gate still appears (cookie-based `getParticipantId()`), confirming this page was not affected.

- [ ] **Step 8: Final build check**

Run: `npm run build`
Expected: Build succeeds (this also runs `tsc -p tsconfig.build.json`).