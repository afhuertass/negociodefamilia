import { PredictionType, Round } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { phaseLabels } from "@/lib/locks";
import { scoreMatchPrediction } from "@/lib/scoringRules";
import Avatar from "@/app/components/Avatar";
import { TeamTooltip } from "@/app/components/TeamTooltip";
import { MatchPredictionRow } from "@/app/components/MatchPredictionRow";

const roundOrder = [
  Round.GROUP_STAGE,
  Round.ROUND_OF_32,
  Round.ROUND_OF_16,
  Round.QUARTER_FINALS,
  Round.SEMI_FINALS,
  Round.FINAL,
];

async function getParticipantData(participantId: string) {
  return prisma.participant.findUnique({
    where: { id: participantId },
    include: {
      scores: true,
      groupPredictions: {
        include: { team: true },
        orderBy: [{ type: "asc" }, { team: { group: "asc" } }, { team: { name: "asc" } }],
      },
      matchPredictions: {
        include: {
          qualifiedTeam: true,
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              result: { include: { qualifiedTeam: true } },
            },
          },
        },
        orderBy: { match: { matchNumber: "asc" } },
      },
    },
  });
}

export default async function ParticipantPredictionsPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;
  const [participant, actualQualifiedTeams] = await Promise.all([
    getParticipantData(participantId),
    prisma.actualQualifiedTeam.findMany(),
  ]);
  if (!participant) notFound();

  // Collect all team IDs shown on this page (group picks + knockout match teams).
  const teamIds = new Set<string>();
  for (const gp of participant.groupPredictions) teamIds.add(gp.teamId);
  for (const mp of participant.matchPredictions) {
    if (mp.match.homeTeamId) teamIds.add(mp.match.homeTeamId);
    if (mp.match.awayTeamId) teamIds.add(mp.match.awayTeamId);
  }

  const teamMatches = teamIds.size > 0
    ? await prisma.match.findMany({
        where: {
          finished: true,
          OR: [
            { homeTeamId: { in: Array.from(teamIds) } },
            { awayTeamId: { in: Array.from(teamIds) } },
          ],
        },
        include: { homeTeam: true, awayTeam: true, result: true },
        orderBy: { startsAt: "asc" },
      })
    : [];

  type MatchEntry = {
    matchNumber: number | null; round: string; startsAt: string | null;
    stadium: string | null; homeTeamName: string; awayTeamName: string;
    result: { homeGoals: number; awayGoals: number } | null;
  };
  const teamHistory = new Map<string, MatchEntry[]>();
  for (const m of teamMatches) {
    const entry: MatchEntry = {
      matchNumber: m.matchNumber,
      round: m.round,
      startsAt: m.startsAt?.toISOString() ?? null,
      stadium: m.stadium,
      homeTeamName: m.homeTeam?.name ?? "",
      awayTeamName: m.awayTeam?.name ?? "",
      result: m.result ? { homeGoals: m.result.homeGoals, awayGoals: m.result.awayGoals } : null,
    };
    if (m.homeTeamId) {
      const arr = teamHistory.get(m.homeTeamId) ?? [];
      arr.push(entry);
      teamHistory.set(m.homeTeamId, arr);
    }
    if (m.awayTeamId) {
      const arr = teamHistory.get(m.awayTeamId) ?? [];
      arr.push(entry);
      teamHistory.set(m.awayTeamId, arr);
    }
  }

  // Load ALL participants' predictions for every knockout match on this page.
  const allMatchPredictionsRaw = participant.matchPredictions.length > 0
    ? await prisma.matchPrediction.findMany({
        where: {
          matchId: { in: participant.matchPredictions.map((mp) => mp.matchId) },
        },
        include: { participant: true, qualifiedTeam: true, match: { include: { result: true } } },
        orderBy: [{ match: { matchNumber: "asc" } }, { participant: { name: "asc" } }],
      })
    : [];

  // Pre-compute points for each prediction (avoids importing scoringRules in client).
  const allPredictionsByMatch = new Map<string, {
    participantId: string; participantName: string;
    homeGoals: number; awayGoals: number; qualifiedTeamName: string; points: number | null;
  }[]>();
  for (const mp of allMatchPredictionsRaw) {
    const mpRound = mp.match.round;
    const mpResult = mp.match.result;
    const pts = mpResult
      ? scoreMatchPrediction({
          round: mpRound,
          predictedHomeGoals: mp.homeGoals,
          predictedAwayGoals: mp.awayGoals,
          predictedQualifiedTeamId: mp.qualifiedTeamId,
          actualHomeGoals: mpResult.homeGoals,
          actualAwayGoals: mpResult.awayGoals,
          actualQualifiedTeamId: mpResult.qualifiedTeamId,
        }).points
      : null;
    const entry = {
      participantId: mp.participantId,
      participantName: mp.participant.name,
      homeGoals: mp.homeGoals,
      awayGoals: mp.awayGoals,
      qualifiedTeamName: mp.qualifiedTeam.name,
      points: pts,
    };
    const arr = allPredictionsByMatch.get(mp.matchId) ?? [];
    arr.push(entry);
    allPredictionsByMatch.set(mp.matchId, arr);
  }

  const totalPoints = participant.scores.reduce((sum, score) => sum + score.points, 0);
  const qualifiedHits = participant.scores.reduce((sum, score) => sum + score.qualifiedHits, 0);
  const topTwo = participant.groupPredictions.filter((p) => p.type === PredictionType.TOP_TWO);
  const bestThird = participant.groupPredictions.filter((p) => p.type === PredictionType.BEST_THIRD);
  const actualGroupIds = new Set(actualQualifiedTeams.map((item) => item.teamId));
  const topTwoHits = topTwo.filter((p) => actualGroupIds.has(p.teamId)).length;
  const bestThirdHits = bestThird.filter((p) => actualGroupIds.has(p.teamId)).length;
  const groupStagePoints = participant.scores.find((score) => score.phase === Round.GROUP_STAGE)?.points ?? 0;

  return (
    <div className="space-y-6">
      <section className="card">
        <Link className="text-sm font-bold text-emerald-700 hover:underline" href="/tabla">← Volver a la tabla</Link>
        <div className="mt-3 flex items-center gap-4">
          <Avatar participantId={participant.id} name={participant.name} />
          <h1 className="text-3xl font-black">Predicciones de {participant.name}</h1>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Puntos</p><p className="text-3xl font-black">{totalPoints}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Clasificados</p><p className="text-3xl font-black">{qualifiedHits}</p></div>
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black">Fase de grupos</h2>
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
            {groupStagePoints} puntos
          </span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <h3 className="font-black">1º / 2º de grupo ({topTwoHits}/24)</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {topTwo.map((p) => {
                const hit = actualGroupIds.has(p.teamId);
                return (
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    <TeamTooltip teamName={p.team.name} history={teamHistory.get(p.teamId) ?? []}>
                      {p.team.group} · {p.team.name}
                    </TeamTooltip> <b>{hit ? "+1" : "0"}</b>
                  </span>
                );
              })}
              {topTwo.length === 0 && <p className="text-sm text-slate-500">Sin predicciones.</p>}
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <h3 className="font-black">Mejores terceros ({bestThirdHits}/8)</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {bestThird.map((p) => {
                const hit = actualGroupIds.has(p.teamId);
                return (
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-sky-50 text-sky-800" : "bg-slate-100 text-slate-700"}`}>
                    <TeamTooltip teamName={p.team.name} history={teamHistory.get(p.teamId) ?? []}>
                      {p.team.group} · {p.team.name}
                    </TeamTooltip> <b>{hit ? "+1" : "0"}</b>
                  </span>
                );
              })}
              {bestThird.length === 0 && <p className="text-sm text-slate-500">Sin predicciones.</p>}
            </div>
          </div>
        </div>
      </section>

      {roundOrder.filter((round) => round !== Round.GROUP_STAGE).map((round) => {
        const predictions = participant.matchPredictions.filter((p) => p.match.round === round);
        return (
          <section key={round} className="card overflow-x-auto">
            <h2 className="text-2xl font-black">{phaseLabels[round]}</h2>
            {predictions.length === 0 ? <p className="mt-3 text-sm text-slate-500">Sin predicciones para esta fase.</p> : (
              <table className="mt-4 w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Partido</th>
                    <th className="p-3">Predicción</th>
                    <th className="p-3">Clasifica</th>
                    <th className="p-3">Resultado real</th>
                    <th className="p-3 text-right">Puntos</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction) => {
                    const match = prediction.match;
                    const result = match.result;
                    const awarded = result
                      ? scoreMatchPrediction({
                          round,
                          predictedHomeGoals: prediction.homeGoals,
                          predictedAwayGoals: prediction.awayGoals,
                          predictedQualifiedTeamId: prediction.qualifiedTeamId,
                          actualHomeGoals: result.homeGoals,
                          actualAwayGoals: result.awayGoals,
                          actualQualifiedTeamId: result.qualifiedTeamId,
                        }).points
                      : null;
                    const homeId = match.homeTeamId;
                    const awayId = match.awayTeamId;
                    const homeHistory = homeId ? teamHistory.get(homeId) ?? [] : [];
                    const awayHistory = awayId ? teamHistory.get(awayId) ?? [] : [];
                    const combinedHistory = [...homeHistory, ...awayHistory].filter(
                      (v, i, a) => a.findIndex((x) => x.matchNumber === v.matchNumber) === i
                    );

                    return (
                      <MatchPredictionRow
                        key={prediction.id}
                        prediction={prediction}
                        allPredictions={allPredictionsByMatch.get(prediction.matchId) ?? []}
                        teamHistory={combinedHistory}
                        currentParticipantId={participant.id}
                        awarded={awarded}
                      />
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </div>
  );
}
