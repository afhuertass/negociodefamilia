import { prisma } from "@/lib/db";
import { scoreGroupStage, scoreRound } from "@/lib/scoring";
import { Round } from "@prisma/client";

export async function runBackgroundSync() {
  try {
    const response = await fetch("https://worldcup26.ir/get/games", { cache: "no-store" });
    const data = await response.json();
    const games = Array.isArray(data) ? data : (data && Array.isArray(data.games) ? data.games : null);
    if (!games) return;

    const matches = await prisma.match.findMany({ include: { homeTeam: true, awayTeam: true } });
    let updated = false;

    for (const match of matches) {
      const apiMatch = games.find((d: any) => {
        if (match.homeTeam?.name && match.awayTeam?.name) {
          const apiHome = String(d.home_team_name_en || d.home_team_label || "").trim().toLowerCase();
          const apiAway = String(d.away_team_name_en || d.away_team_label || "").trim().toLowerCase();
          const dbHome = String(match.homeTeam.name).trim().toLowerCase();
          const dbAway = String(match.awayTeam.name).trim().toLowerCase();
          if (apiHome === dbHome && apiAway === dbAway) return true;
        }
        return d.id === String(match.matchNumber);
      });

      if (!apiMatch || apiMatch.time_elapsed === "notstarted") continue;

      const homeGoals = parseInt(apiMatch.home_score);
      const awayGoals = parseInt(apiMatch.away_score);
      if (isNaN(homeGoals) || isNaN(awayGoals)) continue;

      let qualifiedTeamId = "";
      if (homeGoals > awayGoals) {
        qualifiedTeamId = match.homeTeamId ?? "";
      } else if (awayGoals > homeGoals) {
        qualifiedTeamId = match.awayTeamId ?? "";
      } else {
        const winnerName = String(apiMatch.winner_team_name_en || "").trim().toLowerCase();
        if (winnerName && match.homeTeam?.name && match.awayTeam?.name) {
          if (winnerName === match.homeTeam.name.trim().toLowerCase()) {
            qualifiedTeamId = match.homeTeamId ?? "";
          } else if (winnerName === match.awayTeam.name.trim().toLowerCase()) {
            qualifiedTeamId = match.awayTeamId ?? "";
          }
        }
        if (!qualifiedTeamId) {
          qualifiedTeamId = match.homeTeamId ?? "";
        }
      }

      if (!qualifiedTeamId) continue;

      const existing = await prisma.matchResult.findUnique({ where: { matchId: match.id } });
      const scoreChanged = !existing || existing.homeGoals !== homeGoals || existing.awayGoals !== awayGoals;
      const finishedChanged = match.finished !== (apiMatch.finished === "TRUE");

      if (scoreChanged || finishedChanged) {
        await prisma.matchResult.upsert({
          where: { matchId: match.id },
          update: { homeGoals, awayGoals, qualifiedTeamId },
          create: { matchId: match.id, homeGoals, awayGoals, qualifiedTeamId }
        });

        await prisma.match.update({
          where: { id: match.id },
          data: { finished: apiMatch.finished === "TRUE" }
        });
        updated = true;
      }
    }

    if (updated) {
      await scoreGroupStage(prisma);
      for (const round of [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL]) {
        await scoreRound(prisma, round);
      }
      console.log("Background Sync: Pool scores updated successfully.");
    }
  } catch (err) {
    console.error("Background Sync Error:", err);
  }
}
