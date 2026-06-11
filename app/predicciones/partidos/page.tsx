import { Round } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getParticipantId } from "@/lib/session";

async function saveGroupMatchPredictions(formData: FormData) {
  "use server";
  const participantId = await getParticipantId();
  if (!participantId) redirect("/entrar");

  const matches = await prisma.match.findMany({ where: { round: Round.GROUP_STAGE } });
  for (const match of matches) {
    const homeRaw = formData.get(`homeGoals:${match.id}`);
    const awayRaw = formData.get(`awayGoals:${match.id}`);
    if (homeRaw === null || awayRaw === null || homeRaw === "" || awayRaw === "") continue;
    const homeGoals = Number(homeRaw);
    const awayGoals = Number(awayRaw);
    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals)) continue;

    const qualifiedTeamId = homeGoals >= awayGoals ? match.homeTeamId : match.awayTeamId;
    if (!qualifiedTeamId) continue;
    await prisma.matchPrediction.upsert({
      where: { participantId_matchId: { participantId, matchId: match.id } },
      update: { homeGoals, awayGoals, qualifiedTeamId },
      create: { participantId, matchId: match.id, homeGoals, awayGoals, qualifiedTeamId },
    });
  }

  redirect("/predicciones/partidos?ok=1");
}

export default async function GroupMatchPredictionsPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return (
      <div className="mx-auto max-w-lg card">
        <h1 className="text-3xl font-black">Predicción de partidos</h1>
        <p className="mt-3 text-sm text-slate-600">
          Para guardar marcadores primero debes entrar con tu nombre y código.
        </p>
        <Link className="btn mt-5" href="/entrar">Entrar</Link>
      </div>
    );
  }
  const [{ ok }, matches, predictions] = await Promise.all([
    searchParams,
    prisma.match.findMany({
      where: { round: Round.GROUP_STAGE },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ matchNumber: "asc" }],
    }),
    prisma.matchPrediction.findMany({ where: { participantId } }),
  ]);
  const byMatch = new Map(predictions.map((p) => [p.matchId, p]));

  return (
    <div className="card">
      <h1 className="text-3xl font-black">Predicción de partidos de grupos</h1>
      <p className="mt-2 text-sm text-slate-600">
        Ingresa marcadores de fase de grupos. Nota: según las reglas originales, la fase 1 puntúa clasificados; estos marcadores quedan guardados para consulta.
      </p>
      {ok && <p className="mt-3 text-sm font-semibold text-emerald-700">Predicciones guardadas.</p>}
      {matches.length === 0 ? <p className="mt-4 text-sm text-slate-600">Aún no hay partidos cargados.</p> : (
        <form action={saveGroupMatchPredictions} className="mt-6 space-y-4">
          {matches.map((match) => {
            const p = byMatch.get(match.id);
            const homeLabel = match.homeTeam?.name || match.homeSlot || "Por definir";
            const awayLabel = match.awayTeam?.name || match.awaySlot || "Por definir";
            return (
              <div key={match.id} className="rounded-2xl border p-4">
                <p className="font-black">#{match.matchNumber} · {homeLabel} vs {awayLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{match.startsAt?.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} · {match.stadium}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input className="input" type="number" min="0" name={`homeGoals:${match.id}`} defaultValue={p?.homeGoals} placeholder={`Goles ${homeLabel}`} />
                  <input className="input" type="number" min="0" name={`awayGoals:${match.id}`} defaultValue={p?.awayGoals} placeholder={`Goles ${awayLabel}`} />
                </div>
              </div>
            );
          })}
          <button className="btn">Guardar marcadores</button>
        </form>
      )}
    </div>
  );
}
