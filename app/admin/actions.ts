"use server";

import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { scoreGroupStage, scoreRound } from "@/lib/scoring";
import { Round } from "@prisma/client";

async function recalculateScores(prismaClient: typeof prisma) {
  await scoreGroupStage(prismaClient);
  for (const round of [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL]) {
    await scoreRound(prismaClient, round);
  }
}

export async function fetchLiveResultsAction(_prevState: any, _formData: FormData) {
  if (!(await isAdmin())) return { success: false, error: "No autorizado" };

  const API_KEY = process.env.FOOTBALL_API;
  if (!API_KEY) return { success: false, error: "API Key no configurada" };

  try {
    const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026", {
      headers: { "X-Auth-Token": API_KEY },
      cache: "no-store",
    });

    if (!response.ok) {
      return { success: false, error: `Error de API: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    const matchesApi = data.matches;
    
    if (!matchesApi || !Array.isArray(matchesApi)) {
      return { success: false, error: "Formato de datos inválido" };
    }

    const matchesDb = await prisma.match.findMany({ include: { homeTeam: true, awayTeam: true } });
    
    for (const matchDb of matchesDb) {
      if (!matchDb.homeTeam?.name || !matchDb.awayTeam?.name) continue;

      const apiMatch = matchesApi.find((m: any) => 
        m.homeTeam?.name?.toLowerCase() === matchDb.homeTeam!.name.toLowerCase() &&
        m.awayTeam?.name?.toLowerCase() === matchDb.awayTeam!.name.toLowerCase()
      );
      
      // Skip if no matching API game found or if the game hasn't started yet
      if (!apiMatch || apiMatch.status === "SCHEDULED" || apiMatch.status === "TIMED") continue;

      const homeGoals = apiMatch.score.fullTime.home;
      const awayGoals = apiMatch.score.fullTime.away;
      
      if (homeGoals === null || awayGoals === null) continue;

      // Determine Qualified Team
      // Default to homeTeamId if not finished, so we can store the result
      let qualifiedTeamId = matchDb.homeTeamId ?? "";
      if (apiMatch.status === "FINISHED") {
        if (apiMatch.score.winner === "HOME_TEAM") {
          qualifiedTeamId = matchDb.homeTeamId ?? "";
        } else if (apiMatch.score.winner === "AWAY_TEAM") {
          qualifiedTeamId = matchDb.awayTeamId ?? "";
        } else if (apiMatch.score.winner === "DRAW") {
          qualifiedTeamId = matchDb.homeTeamId ?? "";
        }
      }

      await prisma.matchResult.upsert({
        where: { matchId: matchDb.id },
        update: { homeGoals, awayGoals, qualifiedTeamId },
        create: { 
          match: { connect: { id: matchDb.id } },
          qualifiedTeam: { connect: { id: qualifiedTeamId } },
          homeGoals, 
          awayGoals 
        }
      });
      
      await prisma.match.update({
        where: { id: matchDb.id },
        data: { finished: apiMatch.status === "FINISHED" }
      });
    }
    
    await recalculateScores(prisma);
    return { success: true };
  } catch (error: any) {
    console.error("Error fetching live results:", error);
    return { success: false, error: error.message || "Error al conectar con la API" };
  }
}
