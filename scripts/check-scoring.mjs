const Round = {
  ROUND_OF_32: 'ROUND_OF_32',
  FINAL: 'FINAL',
};

function scoreMatchPrediction(input) {
  const exactScoreHit = input.predictedHomeGoals === input.actualHomeGoals && input.predictedAwayGoals === input.actualAwayGoals;
  const predictedDraw = input.predictedHomeGoals === input.predictedAwayGoals;
  const actualDraw = input.actualHomeGoals === input.actualAwayGoals;
  const qualifiedHit = input.predictedQualifiedTeamId === input.actualQualifiedTeamId;

  if (input.round === Round.FINAL) {
    if (exactScoreHit && qualifiedHit) return { points: 5, exactScoreHit: true, qualifiedHit, reason: 'final_exact_score_and_champion' };
    if (qualifiedHit) return { points: 3, exactScoreHit: false, qualifiedHit, reason: 'final_champion' };
    if (predictedDraw && actualDraw) return { points: 1, exactScoreHit: false, qualifiedHit, reason: 'final_draw_only' };
    return { points: 0, exactScoreHit: false, qualifiedHit, reason: 'no_hit' };
  }

  if (predictedDraw) {
    if (exactScoreHit && qualifiedHit) return { points: 3, exactScoreHit: true, qualifiedHit, reason: 'draw_exact_score_and_qualified' };
    if (actualDraw && qualifiedHit) return { points: 2, exactScoreHit: false, qualifiedHit, reason: 'draw_and_qualified' };
    if (actualDraw) return { points: 1, exactScoreHit: false, qualifiedHit, reason: 'draw_only' };
    if (qualifiedHit) return { points: 1, exactScoreHit: false, qualifiedHit, reason: 'qualified_only' };
    return { points: 0, exactScoreHit: false, qualifiedHit, reason: 'no_hit' };
  }

  if (exactScoreHit && qualifiedHit) return { points: 3, exactScoreHit: true, qualifiedHit, reason: 'exact_score' };
  if (qualifiedHit) return { points: 1, exactScoreHit: false, qualifiedHit, reason: 'qualified_only' };
  return { points: 0, exactScoreHit: false, qualifiedHit, reason: 'no_hit' };
}

const A = 'A';
const B = 'B';
const cases = [
  ['KO exact non-draw', 3, { round: Round.ROUND_OF_32, predictedHomeGoals: 2, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 2, actualAwayGoals: 1, actualQualifiedTeamId: A }],
  ['KO exact score wrong team', 0, { round: Round.ROUND_OF_32, predictedHomeGoals: 2, predictedAwayGoals: 1, predictedQualifiedTeamId: B, actualHomeGoals: 2, actualAwayGoals: 1, actualQualifiedTeamId: A }],
  ['KO qualified only', 1, { round: Round.ROUND_OF_32, predictedHomeGoals: 1, predictedAwayGoals: 0, predictedQualifiedTeamId: A, actualHomeGoals: 3, actualAwayGoals: 1, actualQualifiedTeamId: A }],
  ['KO no hit', 0, { round: Round.ROUND_OF_32, predictedHomeGoals: 1, predictedAwayGoals: 0, predictedQualifiedTeamId: A, actualHomeGoals: 0, actualAwayGoals: 2, actualQualifiedTeamId: B }],
  ['KO predicted draw exact + qualified', 3, { round: Round.ROUND_OF_32, predictedHomeGoals: 1, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 1, actualAwayGoals: 1, actualQualifiedTeamId: A }],
  ['KO predicted draw not exact + qualified', 2, { round: Round.ROUND_OF_32, predictedHomeGoals: 1, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 2, actualAwayGoals: 2, actualQualifiedTeamId: A }],
  ['KO predicted draw only', 1, { round: Round.ROUND_OF_32, predictedHomeGoals: 1, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 2, actualAwayGoals: 2, actualQualifiedTeamId: B }],
  ['KO predicted draw qualified only', 1, { round: Round.ROUND_OF_32, predictedHomeGoals: 1, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 2, actualAwayGoals: 0, actualQualifiedTeamId: A }],
  ['Final exact + champion', 5, { round: Round.FINAL, predictedHomeGoals: 2, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 2, actualAwayGoals: 1, actualQualifiedTeamId: A }],
  ['Final champion only', 3, { round: Round.FINAL, predictedHomeGoals: 1, predictedAwayGoals: 0, predictedQualifiedTeamId: A, actualHomeGoals: 3, actualAwayGoals: 1, actualQualifiedTeamId: A }],
  ['Final draw only', 1, { round: Round.FINAL, predictedHomeGoals: 1, predictedAwayGoals: 1, predictedQualifiedTeamId: A, actualHomeGoals: 2, actualAwayGoals: 2, actualQualifiedTeamId: B }],
  ['Final no hit', 0, { round: Round.FINAL, predictedHomeGoals: 1, predictedAwayGoals: 0, predictedQualifiedTeamId: A, actualHomeGoals: 0, actualAwayGoals: 2, actualQualifiedTeamId: B }],
];

let failed = 0;
for (const [name, expected, input] of cases) {
  const actual = scoreMatchPrediction(input);
  const ok = actual.points === expected;
  console.log(`${ok ? '✅' : '❌'} ${name}: expected ${expected}, got ${actual.points} (${actual.reason})`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log('\nAll mock scoring checks passed.');
