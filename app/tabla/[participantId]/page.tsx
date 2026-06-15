import { PredictionType, Round } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { phaseLabels } from "@/lib/locks";
import { scoreMatchPrediction } from "@/lib/scoringRules";

const roundOrder = [
  Round.GROUP_STAGE,
  Round.ROUND_OF_32,
  Round.ROUND_OF_16,
  Round.QUARTER_FINALS,
  Round.SEMI_FINALS,
  Round.FINAL,
];

function matchLabel(prediction: NonNullable<Awaited<ReturnType<typeof getParticipantData>>>["matchPredictions"][number]) {
  const match = prediction.match;
  const home = match.homeTeam?.name || match.homeSlot || "Por definir";
  const away = match.awayTeam?.name || match.awaySlot || "Por definir";
  return `#${match.matchNumber ?? ""} · ${home} vs ${away}`;
}

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

  const totalPoints = participant.scores.reduce((sum, score) => sum + score.points, 0);
  const exactScores = participant.scores.reduce((sum, score) => sum + score.exactScores, 0);
  const qualifiedHits = participant.scores.reduce((sum, score) => sum + score.qualifiedHits, 0);
  const topTwo = participant.groupPredictions.filter((p) => p.type === PredictionType.TOP_TWO);
  const bestThird = participant.groupPredictions.filter((p) => p.type === PredictionType.BEST_THIRD);
  const actualGroupIds = new Set(actualQualifiedTeams.map((item) => item.teamId));
  const groupStagePoints = participant.scores.find((score) => score.phase === Round.GROUP_STAGE)?.points ?? 0;

  return (
    <div className="space-y-6">
      <section className="card">
        <Link className="text-sm font-bold text-emerald-700 hover:underline" href="/tabla">← Volver a la tabla</Link>
        <h1 className="mt-3 text-3xl font-black">Predicciones de {participant.name}</h1>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Puntos</p><p className="text-3xl font-black">{totalPoints}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Exactos</p><p className="text-3xl font-black">{exactScores}</p></div>
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
            <h3 className="font-black">1º / 2º de grupo ({topTwo.length}/24)</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {topTwo.map((p) => {
                const hit = actualGroupIds.has(p.teamId);
                return (
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                    {p.team.group} · {p.team.name} <b>{hit ? "+1" : "0"}</b>
                  </span>
                );
              })}
              {topTwo.length === 0 && <p className="text-sm text-slate-500">Sin predicciones.</p>}
            </div>
          </div>
          <div className="rounded-2xl border p-4">
            <h3 className="font-black">Mejores terceros ({bestThird.length}/8)</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {bestThird.map((p) => {
                const hit = actualGroupIds.has(p.teamId);
                return (
                  <span key={p.id} className={`rounded-full px-3 py-1 text-sm font-semibold ${hit ? "bg-sky-50 text-sky-800" : "bg-slate-100 text-slate-700"}`}>
                    {p.team.group} · {p.team.name} <b>{hit ? "+1" : "0"}</b>
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
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction) => {
                    const result = prediction.match.result;
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

                    return (
                      <tr key={prediction.id} className="border-b last:border-0">
                        <td className="p-3 font-semibold">{matchLabel(prediction)}</td>
                        <td className="p-3 font-black">{prediction.homeGoals} - {prediction.awayGoals}</td>
                        <td className="p-3">{prediction.qualifiedTeam.name}</td>
                        <td className="p-3 text-slate-600">
                          {result
                            ? `${result.homeGoals} - ${result.awayGoals}, clasifica ${result.qualifiedTeam.name}`
                            : "Pendiente"}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          {awarded === null ? "—" : awarded}
                        </td>
                      </tr>
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
