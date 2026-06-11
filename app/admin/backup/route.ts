import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPhaseLocks } from "@/lib/locks";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rateLimit";
import { isAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    await checkRateLimit(`backup:${await getClientIp()}`, 10, 3600);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Demasiadas descargas. Intenta de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
      );
    }
    throw error;
  }

  const [
    participants,
    teams,
    matches,
    matchResults,
    groupPredictions,
    matchPredictions,
    scores,
    actualQualifiedTeams,
    phaseLocks,
  ] = await Promise.all([
    prisma.participant.findMany({ orderBy: { name: "asc" } }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.match.findMany({ orderBy: [{ matchNumber: "asc" }] }),
    prisma.matchResult.findMany(),
    prisma.groupPrediction.findMany(),
    prisma.matchPrediction.findMany(),
    prisma.score.findMany(),
    prisma.actualQualifiedTeam.findMany(),
    getPhaseLocks(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    app: "Polla Familia Huertas & Páez",
    version: 1,
    counts: {
      participants: participants.length,
      teams: teams.length,
      matches: matches.length,
      matchResults: matchResults.length,
      groupPredictions: groupPredictions.length,
      matchPredictions: matchPredictions.length,
      scores: scores.length,
      actualQualifiedTeams: actualQualifiedTeams.length,
      phaseLocks: phaseLocks.length,
    },
    data: {
      participants,
      teams,
      matches,
      matchResults,
      groupPredictions,
      matchPredictions,
      scores,
      actualQualifiedTeams,
      phaseLocks,
    },
  };

  const body = JSON.stringify(backup, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="polla-huertas-paez-backup-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
