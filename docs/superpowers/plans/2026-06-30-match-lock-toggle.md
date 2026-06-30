# Admin Match-Lock Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-match "Bloquear/Desbloquear predicciones" toggle button to `/admin/partidos` that sets `Match.locked` independently of result entry.

**Architecture:** One new server action `setMatchLocked` in `app/admin/partidos/page.tsx` updates only `Match.locked`. The match-card `.map` block gains one small toggle form per match, rendered on every match regardless of team-assignment state. Prediction pages already skip locked matches, so no participant-side changes. No schema or `lib/locks.ts` changes.

**Tech Stack:** Next.js 16 App Router server action + server component, Prisma, TypeScript. No test harness for admin pages in this project (existing tests are integration scripts under `tests/integration/`); verification is `npx tsc --noEmit` + manual browser check.

---

### Task 1: Add `setMatchLocked` server action

**Files:**
- Modify: `app/admin/partidos/page.tsx` (add action alongside existing `clearResult`)

- [ ] **Step 1: Add the action**

In `app/admin/partidos/page.tsx`, immediately after the existing `clearResult` function (which ends with `redirect("/admin/partidos");` and a closing `}`), insert:

```tsx
async function setMatchLocked(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const matchId = String(formData.get("matchId"));
  const locked = formData.get("locked") === "true";
  await prisma.match.update({ where: { id: matchId }, data: { locked } });
  redirect("/admin/partidos");
}
```

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors. (`setMatchLocked` is defined but not yet referenced — that's fine for a top-level function in this file.)

- [ ] **Step 3: Commit**

```bash
git add app/admin/partidos/page.tsx
git commit -m "feat: add setMatchLocked admin server action"
```

---

### Task 2: Add per-match toggle button + status pill

**Files:**
- Modify: `app/admin/partidos/page.tsx` (the match-card `.map` block)

- [ ] **Step 1: Add the toggle form after the clear-result form**

Find the existing block (inside `roundMatches.map((match) => { ... return ( <div ...> ... )})`):

```tsx
                    {match.result && (
                      <form action={clearResult} className="mt-3 text-right">
                        <input type="hidden" name="matchId" value={match.id} />
                        <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" type="submit">
                          Borrar resultado y desbloquear
                        </button>
                      </form>
                    )}
```

Immediately after that closing `)}` (still inside the match card `<div>`), insert:

```tsx
                    <form action={setMatchLocked} className="mt-3 text-right">
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="locked" value={match.locked ? "false" : "true"} />
                      <button
                        type="submit"
                        className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                          match.locked
                            ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {match.locked ? "Desbloquear predicciones" : "Bloquear predicciones"}
                      </button>
                    </form>
```

- [ ] **Step 2: Add a "Predicciones bloqueadas" status pill to the card header**

In the same match-card `<div>`, find the existing result-status pill:

```tsx
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${match.result ? "bg-emerald-100 text-emerald-700" : teamsReady ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
                        {match.result ? "Resultado cargado" : teamsReady ? "Listo para resultado" : "Falta asignar equipos"}
                      </span>
```

Replace with a `flex` row containing the existing pill plus a conditional lock pill:

```tsx
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${match.result ? "bg-emerald-100 text-emerald-700" : teamsReady ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
                          {match.result ? "Resultado cargado" : teamsReady ? "Listo para resultado" : "Falta asignar equipos"}
                        </span>
                        {match.locked && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Predicciones bloqueadas</span>
                        )}
                      </div>
```

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: Build succeeds (also runs `tsc -p tsconfig.build.json`). `/admin/partidos` still listed in the route map.

- [ ] **Step 5: Commit**

```bash
git add app/admin/partidos/page.tsx
git commit -m "feat: add per-match lock toggle to admin partidos page"
```

---

### Task 3: Manual verification

**Files:** none (browser checks against local dev DB).

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: Next dev server starts on http://localhost:3000.

- [ ] **Step 2: Visit admin partidos (must be logged in as admin via `admin` cookie = `ADMIN_KEY`)**

Open `http://localhost:3000/admin/partidos`.
Expected: Every match card shows a "Bloquear predicciones" button (emerald). Matches currently locked via results show "Desbloquear predicciones" (amber).

- [ ] **Step 3: Toggle lock on an unfinished unassigned match**

Find a match placeholder (no teams yet). Click "Bloquear predicciones".
Expected: Page reloads; that match's button becomes "Desbloquear predicciones" (amber); a "Predicciones bloqueadas" pill appears next to its result-status pill.

- [ ] **Step 4: Verify participant side is blocked**

Open a knockout prediction page with a participant name, e.g. `http://localhost:3000/predicciones/dieciseisavos?participante=ZenonHuertas`.
Expected: The locked match shows "Este partido está bloqueado." and read-only inputs (the existing code path for `match.locked`).

- [ ] **Step 5: Toggle back**

Return to `/admin/partidos`, click "Desbloquear predicciones" on the same match.
Expected: Button reverts to "Bloquear predicciones"; the "Predicciones bloqueadas" pill disappears; participant prediction page allows editing the match once teams are assigned.

- [ ] **Step 6: Quirk check (option A, accepted)**

On a match with a result loaded, click "Borrar resultado y desbloquear".
Expected: Match unlocks (existing `clearResult` resets `locked=false`), even though you didn't use the new toggle. The new toggle button still reads "Bloquear predicciones". This is the accepted quirk — you can re-lock with the new toggle.

- [ ] **Step 7: Final build**

Run: `npm run build`
Expected: success.