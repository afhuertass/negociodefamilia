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
  const qualifiedHit = input.predictedQualifiedTeamId === input.actualQualifiedTeamId;
  const isFinal = input.round === Round.FINAL;
  const scoreWeight = exactScoreHit ? (isFinal ? 5 : 2) : 0;
  const qualWeight = qualifiedHit ? (isFinal ? 3 : 1) : 0;

  let reason: string;
  if (exactScoreHit && qualifiedHit) reason = "exact_and_qualified";
  else if (exactScoreHit) reason = "exact_only";
  else if (qualifiedHit) reason = "qualified_only";
  else reason = "no_hit";

  return { points: scoreWeight + qualWeight, exactScoreHit, qualifiedHit, reason };
}