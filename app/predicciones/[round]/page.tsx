import { Round } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPhaseLocked } from "@/lib/locks";
import { getParticipantId } from "@/lib/session";

const rounds: Record<string, Round> = {
  dieciseisavos: Round.ROUND_OF_32,
  octavos: Round.ROUND_OF_16,
  cuartos: Round.QUARTER_FINALS,
  semifinales: Round.SEMI_FINALS,
  final: Round.FINAL,
};

async function savePredictions(formData: FormData) {
  "use server";
  const participantId = await getParticipantId();
  if (!participantId) redirect("/entrar");
  const roundSlug = String(formData.get("roundSlug"));
  const round = rounds[roundSlug];
  if (!round) redirect("/");

  if (await isPhaseLocked(round)) redirect(`/predicciones/${roundSlug}?error=locked`);

  const matches = await prisma.match.findMany({ where: { round }, include: { homeTeam: true, awayTeam: true } });
  for (const match of matches) {
    if (match.locked || !match.homeTeamId || !match.awayTeamId) continue;
    const homeGoals = Number(formData.get(`homeGoals:${match.id}`));
    const awayGoals = Number(formData.get(`awayGoals:${match.id}`));
    const qualifiedTeamId = String(formData.get(`qualified:${match.id}`) || "");
    if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) || homeGoals < 0 || awayGoals < 0) continue;
    if (![match.homeTeamId, match.awayTeamId].includes(qualifiedTeamId)) continue;
    await prisma.matchPrediction.upsert({
      where: { participantId_matchId: { participantId, matchId: match.id } },
      update: { homeGoals, awayGoals, qualifiedTeamId },
      create: { participantId, matchId: match.id, homeGoals, awayGoals, qualifiedTeamId },
    });
  }
  redirect(`/predicciones/${roundSlug}?ok=1`);
}

export default async function RoundPredictionsPage({ params, searchParams }: { params: Promise<{ round: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const participantId = await getParticipantId();
  if (!participantId) {
    return (
      <div className="mx-auto max-w-lg card">
        <h1 className="text-3xl font-black">Predicciones eliminatorias</h1>
        <p className="mt-3 text-sm text-slate-600">
          Para llenar predicciones primero debes entrar con tu nombre y código.
        </p>
        <Link className="btn mt-5" href="/entrar">Entrar</Link>
      </div>
    );
  }
  const [{ round: slug }, { ok, error }] = await Promise.all([params, searchParams]);
  const round = rounds[slug];
  if (!round) redirect("/");

  const [matches, predictions, phaseLocked] = await Promise.all([
    prisma.match.findMany({ where: { round }, include: { homeTeam: true, awayTeam: true }, orderBy: { startsAt: "asc" } }),
    prisma.matchPrediction.findMany({ where: { participantId } }),
    isPhaseLocked(round),
  ]);
  const byMatch = new Map(predictions.map((p) => [p.matchId, p]));

  return (
    <div className="card">
      <h1 className="text-3xl font-black capitalize">Predicciones: {slug}</h1>
      {ok && <p className="mt-3 text-sm font-semibold text-emerald-700">Predicciones guardadas.</p>}
      {phaseLocked && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">Esta fase está bloqueada. Puedes revisar, pero no editar.</p>}
      {error === "locked" && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">La fase está bloqueada por el admin.</p>}
      {matches.length === 0 ? <p className="mt-4 text-sm text-slate-600">Aún no hay partidos cargados para esta ronda.</p> : (
        <form action={savePredictions} className="mt-6 space-y-4">
          <input type="hidden" name="roundSlug" value={slug} />
          {matches.map((match) => {
            const p = byMatch.get(match.id);
            const homeLabel = match.homeTeam?.name || match.homeSlot || "Por definir";
            const awayLabel = match.awayTeam?.name || match.awaySlot || "Por definir";
            const disabled = phaseLocked || match.locked || !match.homeTeamId || !match.awayTeamId;
            return (
              <div key={match.id} className="rounded-2xl border p-4">
                <p className="font-black">#{match.matchNumber} · {homeLabel} vs {awayLabel} {match.locked && <span className="text-xs text-red-600">Bloqueado</span>}</p>
                {disabled && !match.locked && <p className="mt-1 text-xs font-semibold text-amber-700">El admin debe asignar los equipos reales antes de poder predecir este partido.</p>}
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <input className="input" disabled={disabled} type="number" min="0" name={`homeGoals:${match.id}`} defaultValue={p?.homeGoals} placeholder={`Goles ${homeLabel}`} />
                  <input className="input" disabled={disabled} type="number" min="0" name={`awayGoals:${match.id}`} defaultValue={p?.awayGoals} placeholder={`Goles ${awayLabel}`} />
                  <select className="input" disabled={disabled} name={`qualified:${match.id}`} defaultValue={p?.qualifiedTeamId || ""}>
                    <option value="">Clasifica...</option>
                    {match.homeTeamId && <option value={match.homeTeamId}>{homeLabel}</option>}
                    {match.awayTeamId && <option value={match.awayTeamId}>{awayLabel}</option>}
                  </select>
                </div>
              </div>
            );
          })}
          {!phaseLocked && <button className="btn">Guardar</button>}
        </form>
      )}
    </div>
  );
}
