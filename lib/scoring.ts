import { Round } from "@prisma/client";
import { prisma } from "@/lib/db";
import { scoreMatchPrediction } from "@/lib/scoringRules";

export async function scoreGroupStage() {
  const actual = await prisma.actualQualifiedTeam.findMany();
  const actualTeamIds = new Set(actual.map((a) => a.teamId));
  const participants = await prisma.participant.findMany({
    include: { groupPredictions: true },
  });

  for (const participant of participants) {
    const predictedTeamIds = new Set(participant.groupPredictions.map((p) => p.teamId));
    let points = 0;
    for (const teamId of predictedTeamIds) {
      if (actualTeamIds.has(teamId)) points++;
    }

    await prisma.score.upsert({
      where: { participantId_phase: { participantId: participant.id, phase: Round.GROUP_STAGE } },
      update: { points, exactScores: 0, qualifiedHits: points },
      create: {
        participantId: participant.id,
        phase: Round.GROUP_STAGE,
        points,
        exactScores: 0,
        qualifiedHits: points,
      },
    });
  }
}

export async function scoreRound(round: Round) {
  const matches = await prisma.match.findMany({
    where: { round, finished: true, result: { isNot: null } },
    include: { result: true, predictions: true },
  });
  const participants = await prisma.participant.findMany();

  for (const participant of participants) {
    let points = 0;
    let exactScores = 0;
    let qualifiedHits = 0;

    for (const match of matches) {
      const result = match.result;
      if (!result) continue;
      const prediction = match.predictions.find((p) => p.participantId === participant.id);
      if (!prediction) continue;

      const breakdown = scoreMatchPrediction({
        round,
        predictedHomeGoals: prediction.homeGoals,
        predictedAwayGoals: prediction.awayGoals,
        predictedQualifiedTeamId: prediction.qualifiedTeamId,
        actualHomeGoals: result.homeGoals,
        actualAwayGoals: result.awayGoals,
        actualQualifiedTeamId: result.qualifiedTeamId,
      });

      points += breakdown.points;
      if (breakdown.exactScoreHit) exactScores += 1;
      if (breakdown.qualifiedHit) qualifiedHits += 1;
    }

    await prisma.score.upsert({
      where: { participantId_phase: { participantId: participant.id, phase: round } },
      update: { points, exactScores, qualifiedHits },
      create: { participantId: participant.id, phase: round, points, exactScores, qualifiedHits },
    });
  }
}
