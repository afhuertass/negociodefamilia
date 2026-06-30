# AI Coding Agent Guide: Polla Mundialista Familiar

Welcome! This guide is created for AI Coding Agents to understand the context, architecture, database schema, rules, and best practices of the **Polla Mundialista Familiar** application.

Heed this guide to avoid breaking the codebase, losing functions, or failing compilation checks.

---

## 1. Executive Summary

This is a **World Cup 2026 Predictions Bracket Game** designed for a family/friend environment (called "Polla" or "Prode").

- Participants register with a simple name and an access code (no complex auth/password).
- They predict the outcomes of the **Group Stage** (choosing 24 qualified teams to advance to first/second and 8 best third-place teams).
- They predict **Knockout Stage matches** (scores, plus indicating which team qualifies/advances in case of a tie).
- Admin logs in with `ADMIN_KEY` to lock/unlock phases, enter real results, or trigger score recalculations.
- A live scoreboard ranks participants based on points, with exact score counts and correct qualified team hits as tiebreakers.

---

## 2. Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database ORM:** Prisma ORM
- **Database Provider:** PostgreSQL (Neon) for production, SQLite (`dev.db`) for local development.
- **Language:** TypeScript

---

## 3. Database Schema (`prisma/schema.prisma`)

Understanding the relationships between models is key:

### Models & Enums

- **`Round` (Enum):** `GROUP_STAGE`, `ROUND_OF_32`, `ROUND_OF_16`, `QUARTER_FINALS`, `SEMI_FINALS`, `FINAL`.
- **`PredictionType` (Enum):** `TOP_TWO` (1st or 2nd place), `BEST_THIRD` (best third place).
- **`Participant`:** Simple registration model. Has an `accessCode`, `name`, and relations to their predictions and scores.
- **`Team`:** Country/Team information. Has optional `group` (e.g., "A", "B").
- **`Match`:** Represents a schedule game. Has `matchNumber`, `round`, startsAt `DateTime`, optional stadium string, locks, finished status, and references `homeTeam` and `awayTeam` (or slot/placeholder strings if teams are not yet determined).
- **`MatchResult`:** The actual outcome of a `Match`. Holds home goals, away goals, and the ID of the team that qualified.
- **`GroupPrediction`:** Participant's group stage predictions (identifying which team qualifies via `PredictionType`).
- **`MatchPrediction`:** Participant's knockout stage predictions (predicted goals and who they think qualifies).
- **`Score`:** Aggregated performance model per participant and per phase (`Round`). Stores `points`, `exactScores` hits, and `qualifiedHits`.
- **`PhaseLock`:** Manages whether prediction submissions are closed (locked) for a particular `Round`.
- **`ActualQualifiedTeam`:** The actual results for the Group Stage (who qualified as `TOP_TWO` or `BEST_THIRD`).

---

## 4. Navigation & Directory Map

### Routes (`/app`)

- `app/page.tsx`: Landing page. Shows a hero section, navigation links, and a highlighted **"Partidos de hoy" (Today's matches)** section dynamically filtered from database matches based on the current date.
- `app/entrar/page.tsx`: Participant login/registration page. Users enter a username and numeric access code. If the user doesn't exist, a new participant is created automatically.
- `app/calendario/page.tsx`: Full group stage calendar. Shows teams grouped by alphabetical group, a "Partidos de hoy" card, and a table of matches sorted chronologically.
- `app/tabla/page.tsx`: The leaderboard. Displays the global ranking of participants, highlighting 1st, 2nd, and 3rd place with cards (podiums), summary statistics, and a full progress bar table. Clicking a participant links to:
  - `app/tabla/[participantId]/page.tsx`: Detailed look at a single participant's predictions and actual results.
- `app/reglas/page.tsx`: Regulations and scoring guide.
- `app/admin/page.tsx`: Administrative panel. Locked behind `ADMIN_KEY` session cookie. Includes phase lock toggles, participant deletion, manual group-stage result entry, and score recalculation.
- `app/admin/partidos/page.tsx`: Admin view for entering knockout stage scores.
- `app/predicciones/page.tsx`: Index for filling out predictions.
- `app/predicciones/grupos/page.tsx`: Group stage predictions (selecting top 2 and best 3rds). Features a sticky progress tracker at the top.
- `app/predicciones/[round]/page.tsx`: Dynamic route for knockout stage prediction forms. Shows responsive card decks sorted by date, with interactive button toggles (radio buttons) for selecting who qualifies, score inputs, and status badges.

### NavLinks (`app/components/NavLinks.tsx`)

Contains the navbar options:

1.  **Entrar/Activo** (Conditional based on session state)
2.  **Predicciones** (Dropdown menu item containing options to direct to the landing `/predicciones` page, or to individual knockout stages: _Dieciseisavos, Octavos, Cuartos, Semifinales, Final_).
3.  **Tabla**
4.  **Calendario**
5.  **Reglas**
6.  **Admin**

---

## 5. Scoring System (`lib/scoringRules.ts`)

Rules differ based on the phase:

### Phase 1: Group Stage (`GROUP_STAGE`)

- Every correctly predicted qualified team (whether 1st/2nd or best 3rd) earns **1 point**. Maximum of 32 points.

### Phase 2: Knockout Rounds (`ROUND_OF_32` to `SEMI_FINALS`)

- **3 points:** Exact score hit + Correct qualified team.
- **1 point:** Correct qualified team only.
- **If a draw was predicted:**
  - **3 points:** Exact score draw (e.g. 1-1 predicted, 1-1 actual) AND correct qualified team (who advances on penalties).
  - **2 points:** Score was a draw, but not exact (e.g. 1-1 predicted, 2-2 actual) AND correct qualified team.
  - **0 point:** Score was a draw, but incorrect qualified team.

### Phase 3: The Final (`FINAL`)

- **5 points:** Exact score hit AND correct champion.
- **3 points:** Correct champion only.
- **1 point:** Draw predicted, actual draw, but wrong champion.

## 7. Critical Agent Instructions & Troubleshooting

### ⚠️ SAFETY PROTOCOL: DATABASE OPERATIONS (TIER 3)

To prevent catastrophic data loss, all agents MUST follow these rules:

1.  **Isolation Verification:** Before running any script, the agent MUST inspect the environment to confirm it is NOT pointing to production.
2.  **Destructive Protection:** Any script performing `deleteMany`, `drop`, or `truncate` must contain a circuit breaker check:
    ```typescript
    if (process.env.DATABASE_URL?.includes("neon")) {
      console.error("❌ DANGER: Production database detected. Aborting.");
      process.exit(1);
    }
    ```
3.  **Mandatory Ask:** If the agent needs to perform a database operation that touches more than one row, the agent MUST explicitly ask the user for confirmation: _"I intend to run [script] on [database connection]. Please confirm this is a test database."_
4.  **No Exceptions:** These rules apply to all tools, including bash scripts and direct node execution.

### Avoid the "Deleted Function" Trap

...

- Do NOT overwrite core helper functions such as `recalculateScores()` when implementing newer features.
- Always read the full file first to make sure your `edit` replacement targets only the specific blocks intended.

### Next.js Server Actions Constraints

- Ensure `"use server"` is declared on functions intended to be Server Actions.
- Server Actions must return serializable values or perform redirects.
- `cookies()` and other header helpers are asynchronous in Next.js 15+. Always `await cookies()`.

### Edit Matching

- Keep `edits[].oldText` as small as possible. Include only enough context to be globally unique in the file.
- Double-check whitespace, braces, and line endings. Tailwind CSS and Prettier can cause minor formatting changes that prevent the `edit` tool from matching perfectly.

### Compilation Check

- Before declaring a task done, **always** run:
  `npx tsc --noEmit`
  to ensure your typescript compilation is successful.

---

🚀 Use this context to deliver clean, bulletproof features on every single turn!
