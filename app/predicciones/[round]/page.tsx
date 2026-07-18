import { Round } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPhaseLocked } from "@/lib/locks";
import { normalizeParticipantName } from "./resolveParticipant";
import NameSelector from "@/app/components/NameSelector";

const rounds: Record<string, Round> = {
  dieciseisavos: Round.ROUND_OF_32,
  octavos: Round.ROUND_OF_16,
  cuartos: Round.QUARTER_FINALS,
  semifinales: Round.SEMI_FINALS,
  tercerpuesto: Round.THIRD_PLACE,
  final: Round.FINAL,
};

const roundTitles: Record<string, string> = {
  dieciseisavos: "Dieciseisavos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semifinales: "Semifinales",
  tercerpuesto: "Tercer puesto",
  final: "Final",
};

const CALENDAR_TIME_ZONE = "America/Mexico_City";

const dayFormatter = new Intl.DateTimeFormat("es", {
  timeZone: CALENDAR_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const matchDateFormatter = new Intl.DateTimeFormat("es", {
  timeZone: CALENDAR_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

function dateGroup(match: { startsAt?: Date | null }) {
  return match.startsAt ? dayFormatter.format(match.startsAt) : "Fecha por definir";
}

function completionStatus({
  disabled,
  prediction,
}: {
  disabled: boolean;
  prediction?: { homeGoals: number; awayGoals: number; qualifiedTeamId: string };
}) {
  if (disabled) return { label: "Pendiente", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  if (!prediction) return { label: "Por llenar", className: "bg-amber-50 text-amber-700 ring-amber-200" };
  return { label: "Completo", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
}

async function savePredictions(formData: FormData) {
  "use server";
  const participantId = String(formData.get("participantId") || "");
  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) redirect("/");
  const roundSlug = String(formData.get("roundSlug"));
  const round = rounds[roundSlug];
  if (!round) redirect("/");

  if (await isPhaseLocked(round)) redirect(`/predicciones/${roundSlug}?error=locked&participante=${encodeURIComponent(participant.name)}`);

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
  redirect(`/predicciones/${roundSlug}?ok=1&participante=${encodeURIComponent(participant.name)}`);
}

export default async function RoundPredictionsPage({ params, searchParams }: { params: Promise<{ round: string }>; searchParams: Promise<{ ok?: string; error?: string; participante?: string }> }) {
  const [{ round: slug }, { ok, error, participante }] = await Promise.all([params, searchParams]);
  const round = rounds[slug];
  if (!round) redirect("/");

  const rawName = normalizeParticipantName(participante);
  const participant = rawName ? await prisma.participant.findUnique({ where: { name: rawName } }) : null;

  if (!participant) {
    const participants = await prisma.participant.findMany({ select: { name: true }, orderBy: { name: "asc" } });
    return (
      <div className="mx-auto max-w-lg card">
        <h1 className="text-3xl font-black">Predicciones eliminatorias</h1>
        <p className="mt-3 text-sm text-slate-600">
          Selecciona tu nombre para ver y guardar tus predicciones de {roundTitles[slug]}.
        </p>
        <NameSelector participants={participants} slug={slug} />
      </div>
    );
  }
  const participantId = participant.id;

  const [matches, predictions, phaseLocked] = await Promise.all([
    prisma.match.findMany({ where: { round }, include: { homeTeam: true, awayTeam: true }, orderBy: { startsAt: "asc" } }),
    prisma.matchPrediction.findMany({ where: { participantId } }),
    isPhaseLocked(round),
  ]);
  const byMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const playableMatches = matches.filter((match) => match.homeTeamId && match.awayTeamId && !match.locked && !phaseLocked);
  const completedMatches = playableMatches.filter((match) => byMatch.has(match.id)).length;
  const groupedMatches = [...new Set(matches.map(dateGroup))].map((date) => ({
    date,
    matches: matches.filter((match) => dateGroup(match) === date),
  }));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-sky-700 to-indigo-800 p-6 text-white shadow-sm md:p-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-100">Eliminatorias</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Predicciones: {roundTitles[slug]}</h1>
        <p className="mt-3 max-w-2xl text-sm font-medium text-sky-50 md:text-base">
          Escribe el marcador en tiempo reglamentario y elige quién clasifica. Si pronosticas empate, selecciona quién avanza por penales.
        </p>
      </section>

      {ok && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Predicciones guardadas.</p>}
      {phaseLocked && <p className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-700">Esta fase está bloqueada. Puedes revisar, pero no editar.</p>}
      {error === "locked" && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">La fase está bloqueada por el admin.</p>}

      {matches.length === 0 ? <p className="card text-sm text-slate-600">Aún no hay partidos cargados para esta ronda.</p> : (
        <form action={savePredictions} className="space-y-6">
          <input type="hidden" name="roundSlug" value={slug} />
          <input type="hidden" name="participantId" value={participantId} />

          {!phaseLocked && (
            <div className="sticky top-24 z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-white/95 p-4 shadow-sm backdrop-blur">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Progreso</p>
                <p className="text-sm font-bold text-slate-700">{completedMatches}/{playableMatches.length} partidos completos</p>
              </div>
              <button className="btn">Guardar predicciones</button>
            </div>
          )}

          {groupedMatches.map((group) => (
            <section key={group.date} className="space-y-4">
              <h2 className="text-xl font-black capitalize text-slate-800">{group.date}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {group.matches.map((match) => {
                  const p = byMatch.get(match.id);
                  const homeLabel = match.homeTeam?.name || match.homeSlot || "Por definir";
                  const awayLabel = match.awayTeam?.name || match.awaySlot || "Por definir";
                  const disabled = phaseLocked || match.locked || !match.homeTeamId || !match.awayTeamId;
                  const status = completionStatus({ disabled, prediction: p });
                  const isDrawPrediction = p && p.homeGoals === p.awayGoals;

                  return (
                    <div key={match.id} className={["rounded-3xl border bg-white p-5 shadow-sm", disabled ? "border-slate-200 opacity-80" : "border-slate-200"].join(" ")}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Partido #{match.matchNumber}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {match.startsAt ? matchDateFormatter.format(match.startsAt) : "Fecha por definir"}{match.stadium ? ` · ${match.stadium}` : ""}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${status.className}`}>{status.label}</span>
                      </div>

                      {disabled && (
                        <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                          {match.locked || phaseLocked ? "Este partido está bloqueado." : "El admin debe asignar los equipos reales antes de poder predecir este partido."}
                        </p>
                      )}

                      <div className="mt-5 space-y-3">
                        <div className="grid grid-cols-[1fr_5rem] items-center gap-3 rounded-2xl bg-slate-50 p-3">
                          <label className="font-black text-slate-900" htmlFor={`homeGoals:${match.id}`}>{homeLabel}</label>
                          <input id={`homeGoals:${match.id}`} className="input text-center text-lg font-black" disabled={disabled} type="number" min="0" name={`homeGoals:${match.id}`} defaultValue={p?.homeGoals} placeholder="0" />
                        </div>
                        <div className="grid grid-cols-[1fr_5rem] items-center gap-3 rounded-2xl bg-slate-50 p-3">
                          <label className="font-black text-slate-900" htmlFor={`awayGoals:${match.id}`}>{awayLabel}</label>
                          <input id={`awayGoals:${match.id}`} className="input text-center text-lg font-black" disabled={disabled} type="number" min="0" name={`awayGoals:${match.id}`} defaultValue={p?.awayGoals} placeholder="0" />
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-sm font-black text-slate-700">{isDrawPrediction ? "Empate: ¿quién avanza por penales?" : "¿Quién clasifica?"}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {match.homeTeamId && (
                            <label className="block">
                              <input className="peer sr-only" disabled={disabled} type="radio" name={`qualified:${match.id}`} value={match.homeTeamId} defaultChecked={p?.qualifiedTeamId === match.homeTeamId} />
                              <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-700 transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-disabled:cursor-not-allowed peer-disabled:bg-slate-50 peer-disabled:text-slate-400">
                                {homeLabel}
                              </span>
                            </label>
                          )}
                          {match.awayTeamId && (
                            <label className="block">
                              <input className="peer sr-only" disabled={disabled} type="radio" name={`qualified:${match.id}`} value={match.awayTeamId} defaultChecked={p?.qualifiedTeamId === match.awayTeamId} />
                              <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-black text-slate-700 transition peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-disabled:cursor-not-allowed peer-disabled:bg-slate-50 peer-disabled:text-slate-400">
                                {awayLabel}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </form>
      )}
    </div>
  );
}
