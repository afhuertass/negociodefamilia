import { Round } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function scoreGroupStage() {
  const actual = await prisma.actualQualifiedTeam.findMany();
  const actualKeys = new Set(actual.map((a) => `${a.teamId}:${a.type}`));
  const participants = await prisma.participant.findMany({
    include: { groupPredictions: true },
  });

  for (const participant of participants) {
    const points = participant.groupPredictions.filter((p) =>
      actualKeys.has(`${p.teamId}:${p.type}`),
    ).length;

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
    where: { round, result: { isNot: null } },
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

      const exact =
        prediction.homeGoals === result.homeGoals && prediction.awayGoals === result.awayGoals;
      const predictedDraw = prediction.homeGoals === prediction.awayGoals;
      const actualDraw = result.homeGoals === result.awayGoals;
      const classified = prediction.qualifiedTeamId === result.qualifiedTeamId;

      if (classified) qualifiedHits += 1;

      if (round === Round.FINAL) {
        if (exact && classified) {
          points += 5;
          exactScores += 1;
        } else if (actualDraw && predictedDraw) {
          points += 1;
        } else if (classified) {
          points += 3;
        }
        continue;
      }

      if (predictedDraw) {
        if (exact && classified) {
          points += 3;
          exactScores += 1;
        } else if (actualDraw && classified) {
          points += 2;
        } else if (actualDraw) {
          points += 1;
        } else if (classified) {
          points += 1;
        }
      } else if (exact) {
        points += 3;
        exactScores += 1;
      } else if (classified) {
        points += 1;
      }
    }

    await prisma.score.upsert({
      where: { participantId_phase: { participantId: participant.id, phase: round } },
      update: { points, exactScores, qualifiedHits },
      create: { participantId: participant.id, phase: round, points, exactScores, qualifiedHits },
    });
  }
}
