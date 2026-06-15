import { Round } from "@prisma/client";

type ScoreInput = {
  round: Round;
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  predictedQualifiedTeamId: string;
  actualHomeGoals: number;
  actualAwayGoals: number;
  actualQualifiedTeamId: string;
};

export type MatchScoreBreakdown = {
  points: number;
  exactScoreHit: boolean;
  qualifiedHit: boolean;
  reason: string;
};

export function scoreMatchPrediction(input: ScoreInput): MatchScoreBreakdown {
  const exactScoreHit =
    input.predictedHomeGoals === input.actualHomeGoals &&
    input.predictedAwayGoals === input.actualAwayGoals;
  const predictedDraw = input.predictedHomeGoals === input.predictedAwayGoals;
  const actualDraw = input.actualHomeGoals === input.actualAwayGoals;
  const qualifiedHit = input.predictedQualifiedTeamId === input.actualQualifiedTeamId;

  if (input.round === Round.FINAL) {
    if (exactScoreHit && qualifiedHit) {
      return { points: 5, exactScoreHit: true, qualifiedHit, reason: "final_exact_score_and_champion" };
    }
    if (qualifiedHit) {
      return { points: 3, exactScoreHit: false, qualifiedHit, reason: "final_champion" };
    }
    if (predictedDraw && actualDraw) {
      return { points: 1, exactScoreHit: false, qualifiedHit, reason: "final_draw_only" };
    }
    return { points: 0, exactScoreHit: false, qualifiedHit, reason: "no_hit" };
  }

  if (predictedDraw) {
    if (exactScoreHit && qualifiedHit) {
      return { points: 3, exactScoreHit: true, qualifiedHit, reason: "draw_exact_score_and_qualified" };
    }
    if (actualDraw && qualifiedHit) {
      return { points: 2, exactScoreHit: false, qualifiedHit, reason: "draw_and_qualified" };
    }
    if (actualDraw) {
      return { points: 1, exactScoreHit: false, qualifiedHit, reason: "draw_only" };
    }
    return { points: 0, exactScoreHit: false, qualifiedHit, reason: "no_hit" };
  }

  if (exactScoreHit && qualifiedHit) {
    return { points: 3, exactScoreHit: true, qualifiedHit, reason: "exact_score" };
  }
  if (qualifiedHit) {
    return { points: 1, exactScoreHit: false, qualifiedHit, reason: "qualified_only" };
  }
  return { points: 0, exactScoreHit: false, qualifiedHit, reason: "no_hit" };
}
