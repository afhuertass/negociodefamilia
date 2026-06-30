# Materialized Ranking and Deltas Implementation Plan

> **For agentic workers:** Execute this plan in the current session. Do NOT commit any changes.

**Goal:** Materialize leaderboard state to calculate and display numeric ranking changes (`+N`, `-N`) between updates, only updating the snapshot when the ranking changes.

**Architecture:**
1.  Update `prisma/schema.prisma` to add `LeaderboardSnapshot`.
2.  Refactor ranking logic into `lib/leaderboard.ts`.
3.  Implement snapshotting logic in `lib/leaderboard.ts` with comparison check.
4.  Update `app/tabla/page.tsx` to display ranking deltas.

---

### Task 1: Update Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `LeaderboardSnapshot` model**

```prisma
// Add this model to prisma/schema.prisma
model LeaderboardSnapshot {
  id        String   @id @default(cuid())
  data      Json     // Array<{ participantId: string, rank: number }>
  createdAt DateTime @default(now())
}
```

### Task 2: Implement Ranking and Snapshotting Logic

**Files:**
- Create: `lib/leaderboard.ts`

- [ ] **Step 1: Implement `calculateRanking` and `updateSnapshot`**

```typescript
import { prisma } from "@/lib/db";

type ParticipantRow = { id: string; name: string; points: number; qualifiedHits: number };
type Ranking = { participantId: string; rank: number }[];

export function calculateRanking(participants: any[]): Ranking {
  const rows = participants
    .map((p) => ({
      id: p.id,
      name: p.name,
      points: p.scores.reduce((sum: number, s: any) => sum + s.points, 0),
      qualifiedHits: p.scores.reduce((sum: number, s: any) => sum + s.qualifiedHits, 0),
    }))
    .sort((a, b) => b.points - a.points || b.qualifiedHits - a.qualifiedHits || a.name.localeCompare(b.name));
  
  return rows.map((row, index) => ({ participantId: row.id, rank: index + 1 }));
}

export async function updateLeaderboardSnapshot(currentRanking: Ranking) {
  const latestSnapshot = await prisma.leaderboardSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const currentData = JSON.stringify(currentRanking);
  const previousData = latestSnapshot ? JSON.stringify(latestSnapshot.data) : null;

  if (currentData !== previousData) {
    await prisma.leaderboardSnapshot.create({
      data: { data: JSON.parse(currentData) },
    });
  }
}
```

### Task 3: Update Leaderboard View

**Files:**
- Modify: `app/tabla/page.tsx`

- [ ] **Step 1: Fetch snapshot and compute deltas**

```typescript
// app/tabla/page.tsx
// ... existing imports ...
import { calculateRanking } from "@/lib/leaderboard";

export default async function LeaderboardPage() {
  const [participants, latestSnapshot] = await Promise.all([
    prisma.participant.findMany({ include: { scores: true }, orderBy: { name: "asc" } }),
    prisma.leaderboardSnapshot.findFirst({ orderBy: { createdAt: "desc" } })
  ]);
  
  const currentRanking = calculateRanking(participants);
  const prevMap = new Map((latestSnapshot?.data as any[] ?? []).map(p => [p.participantId, p.rank]));

  const rows = participants
    .map((p) => ({
      id: p.id,
      name: p.name,
      points: p.scores.reduce((sum, s) => sum + s.points, 0),
      qualifiedHits: p.scores.reduce((sum, s) => sum + s.qualifiedHits, 0),
    }))
    .sort((a, b) => b.points - a.points || b.qualifiedHits - a.qualifiedHits || a.name.localeCompare(b.name));

  // ... (use rows and currentRanking to map deltas)
```

- [ ] **Step 2: Update Table to show delta**

```tsx
// Inside <tbody> of app/tabla/page.tsx table:
{rows.map((row, index) => {
  const currentRank = index + 1;
  const prevRank = prevMap.get(row.id);
  const delta = prevRank ? prevRank - currentRank : 0;
  // ... render delta
})}
```

---

**Execution:** I will now apply these changes step-by-step. I will NOT commit any changes to git.
