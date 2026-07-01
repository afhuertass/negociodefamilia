import { Round } from "@prisma/client";
import { scoreMatchPrediction } from "../../lib/scoringRules";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`✅ PASS: ${label} = ${actual}`);
  } else {
    console.error(`❌ FAIL: ${label} | expected ${expected}, got ${actual}`);
    failures++;
  }
}

const mk = (round: Round, ph: number, pa: number, pq: string, ah: number, aa: number, aq: string) =>
  scoreMatchPrediction({
    round,
    predictedHomeGoals: ph, predictedAwayGoals: pa, predictedQualifiedTeamId: pq,
    actualHomeGoals: ah, actualAwayGoals: aa, actualQualifiedTeamId: aq,
  });

const HOME = "home", AWAY = "away";

// ── Knockout (R32 → Semis): 0 / 1 / 2 / 3 ──
check("KO nothing correct", mk(Round.ROUND_OF_32, 2, 0, HOME, 0, 1, AWAY).points, 0);
check("KO qualified only", mk(Round.ROUND_OF_16, 3, 0, HOME, 1, 0, HOME).points, 1);
check("KO exact only (draw, wrong qualifier)", mk(Round.QUARTER_FINALS, 1, 1, HOME, 1, 1, AWAY).points, 2);
check("KO exact + qualified (non-draw forces qualifier)", mk(Round.SEMI_FINALS, 2, 1, HOME, 2, 1, HOME).points, 3);

// flags
check("KO exact-only flags", (() => {
  const r = mk(Round.ROUND_OF_32, 1, 1, HOME, 1, 1, AWAY);
  return `${r.exactScoreHit}/${r.qualifiedHit}`;
})(), "true/false");
check("KO qualified-only flags", (() => {
  const r = mk(Round.ROUND_OF_32, 3, 0, HOME, 1, 0, HOME);
  return `${r.exactScoreHit}/${r.qualifiedHit}`;
})(), "false/true");

// ── FINAL: 0 / 3 / 5 / 8 ──
check("FINAL nothing correct", mk(Round.FINAL, 2, 0, HOME, 0, 1, AWAY).points, 0);
check("FINAL champion only", mk(Round.FINAL, 3, 0, HOME, 1, 0, HOME).points, 3);
check("FINAL exact only (draw, wrong champion)", mk(Round.FINAL, 1, 1, HOME, 1, 1, AWAY).points, 5);
check("FINAL exact + champion", mk(Round.FINAL, 2, 1, HOME, 2, 1, HOME).points, 8);

// Non-draw exact score: the score itself determines the qualifier, so exact-hit on a non-draw
// also implies qualifiedHit=true (and points=3 or 8). Capture that linkage explicitly:
check("KO non-draw exact links qualifier", (() => {
  const r = mk(Round.ROUND_OF_32, 2, 1, HOME, 2, 1, HOME);
  return `${r.exactScoreHit}/${r.qualifiedHit}/${r.points}`;
})(), "true/true/3");

if (failures > 0) {
  console.error(`\n${failures} scoring-rules tests FAILED`);
  process.exit(1);
}
console.log("\nAll scoring-rules unit tests passed.");