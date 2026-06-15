import { Round } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { scoreRound } from "@/lib/scoring";

async function addMatch(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const homeTeamId = String(formData.get("homeTeamId") || "") || null;
  const awayTeamId = String(formData.get("awayTeamId") || "") || null;

  await prisma.match.create({
    data: {
      round: formData.get("round") as Round,
      homeTeamId,
      awayTeamId,
      homeSlot: String(formData.get("homeSlot") || "").trim() || null,
      awaySlot: String(formData.get("awaySlot") || "").trim() || null,
    },
  });
  redirect("/admin/partidos");
}

async function assignTeams(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const matchId = String(formData.get("matchId"));
  const homeTeamId = String(formData.get("homeTeamId") || "") || null;
  const awayTeamId = String(formData.get("awayTeamId") || "") || null;

  await prisma.$transaction([
    prisma.matchResult.deleteMany({ where: { matchId } }),
    prisma.match.update({
      where: { id: matchId },
      data: { homeTeamId, awayTeamId, locked: false, finished: false },
    }),
  ]);
  redirect("/admin/partidos");
}

async function clearResult(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const matchId = String(formData.get("matchId") || "");
  if (!matchId) redirect("/admin/partidos");
  await prisma.$transaction([
    prisma.matchResult.deleteMany({ where: { matchId } }),
    prisma.match.update({ where: { id: matchId }, data: { finished: false, locked: false } }),
  ]);
  redirect("/admin/partidos");
}

async function saveResult(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const matchId = String(formData.get("matchId"));
  const round = formData.get("round") as Round;
  const qualifiedTeamId = String(formData.get("qualifiedTeamId") || "");
  const homeGoals = Number(formData.get("homeGoals"));
  const awayGoals = Number(formData.get("awayGoals"));
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match?.homeTeamId || !match.awayTeamId) redirect("/admin/partidos?error=teams");
  if (![match.homeTeamId, match.awayTeamId].includes(qualifiedTeamId)) redirect("/admin/partidos?error=qualified");
  if (!Number.isInteger(homeGoals) || !Number.isInteger(awayGoals) || homeGoals < 0 || awayGoals < 0) redirect("/admin/partidos?error=score");

  await prisma.matchResult.upsert({
    where: { matchId },
    update: { homeGoals, awayGoals, qualifiedTeamId },
    create: { matchId, homeGoals, awayGoals, qualifiedTeamId },
  });
  await prisma.match.update({ where: { id: matchId }, data: { finished: true, locked: true } });
  await scoreRound(prisma, round);
  redirect("/admin/partidos");
}

const roundName: Record<Round, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  FINAL: "Final",
};

const knockoutRounds = [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL];

export default async function AdminMatchesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const [{ error }, teams, matches] = await Promise.all([
    searchParams,
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.match.findMany({
      where: { round: { not: Round.GROUP_STAGE } },
      include: { homeTeam: true, awayTeam: true, result: true },
      orderBy: [{ matchNumber: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black">Partidos eliminatorios</h1>
            <p className="mt-2 text-sm text-slate-600">
              Primero asigna equipos reales al cruce; después carga marcador y clasificado. Al guardar resultado se recalcula esa ronda.
            </p>
          </div>
          <a className="btn-secondary" href="/admin">Volver al admin</a>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">No se pudo guardar: revisa que haya equipos asignados, marcador válido y clasificado correcto.</p>}
      </section>

      <details className="card">
        <summary className="cursor-pointer text-xl font-black">Agregar partido manualmente</summary>
        <form action={addMatch} className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <select className="input" name="round">
            <option value="ROUND_OF_32">Dieciseisavos</option>
            <option value="ROUND_OF_16">Octavos</option>
            <option value="QUARTER_FINALS">Cuartos</option>
            <option value="SEMI_FINALS">Semifinales</option>
            <option value="FINAL">Final</option>
          </select>
          <input className="input" name="homeSlot" placeholder="Slot local ej. Winner Group A" />
          <input className="input" name="awaySlot" placeholder="Slot visitante" />
          <select className="input" name="homeTeamId">
            <option value="">Equipo local real opcional</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.group} · {team.name}</option>)}
          </select>
          <select className="input" name="awayTeamId">
            <option value="">Equipo visitante real opcional</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.group} · {team.name}</option>)}
          </select>
          <button className="btn">Agregar</button>
        </form>
      </details>

      {knockoutRounds.map((round) => {
        const roundMatches = matches.filter((match) => match.round === round);
        if (roundMatches.length === 0) return null;

        return (
          <section key={round} className="card">
            <h2 className="text-2xl font-black">{roundName[round]}</h2>
            <div className="mt-4 space-y-3">
              {roundMatches.map((match) => {
                const homeLabel = match.homeTeam?.name || match.homeSlot || "Por definir";
                const awayLabel = match.awayTeam?.name || match.awaySlot || "Por definir";
                const teamsReady = Boolean(match.homeTeamId && match.awayTeamId);

                return (
                  <div key={match.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Partido #{match.matchNumber}</p>
                        <h3 className="text-lg font-black">{homeLabel} vs {awayLabel}</h3>
                        {match.stadium && <p className="mt-1 text-xs text-slate-500">{match.startsAt?.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })} · {match.stadium}</p>}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${match.result ? "bg-emerald-100 text-emerald-700" : teamsReady ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}>
                        {match.result ? "Resultado cargado" : teamsReady ? "Listo para resultado" : "Falta asignar equipos"}
                      </span>
                    </div>

                    <form action={assignTeams} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="matchId" value={match.id} />
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Local
                        <select className="input mt-1" name="homeTeamId" defaultValue={match.homeTeamId || ""}>
                          <option value="">{match.homeSlot || "Sin asignar"}</option>
                          {teams.map((team) => <option key={team.id} value={team.id}>{team.group} · {team.name}</option>)}
                        </select>
                      </label>
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Visitante
                        <select className="input mt-1" name="awayTeamId" defaultValue={match.awayTeamId || ""}>
                          <option value="">{match.awaySlot || "Sin asignar"}</option>
                          {teams.map((team) => <option key={team.id} value={team.id}>{team.group} · {team.name}</option>)}
                        </select>
                      </label>
                      <button className="btn-secondary self-end">Asignar equipos</button>
                    </form>

                    <form action={saveResult} className="mt-3 grid gap-3 md:grid-cols-[140px_140px_1fr_auto]">
                      <input type="hidden" name="matchId" value={match.id} />
                      <input type="hidden" name="round" value={match.round} />
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Goles local
                        <input className="input mt-1" disabled={!teamsReady} type="number" min="0" name="homeGoals" defaultValue={match.result?.homeGoals ?? ""} placeholder="0" required />
                      </label>
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Goles visitante
                        <input className="input mt-1" disabled={!teamsReady} type="number" min="0" name="awayGoals" defaultValue={match.result?.awayGoals ?? ""} placeholder="0" required />
                      </label>
                      <label className="block text-xs font-bold uppercase text-slate-500">
                        Clasificó
                        <select className="input mt-1" disabled={!teamsReady} name="qualifiedTeamId" defaultValue={match.result?.qualifiedTeamId || ""} required>
                          <option value="">Seleccionar...</option>
                          {match.homeTeamId && <option value={match.homeTeamId}>{homeLabel}</option>}
                          {match.awayTeamId && <option value={match.awayTeamId}>{awayLabel}</option>}
                        </select>
                      </label>
                      <button className="btn self-end" disabled={!teamsReady}>Guardar resultado</button>
                    </form>

                    {match.result && (
                      <form action={clearResult} className="mt-3 text-right">
                        <input type="hidden" name="matchId" value={match.id} />
                        <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" type="submit">
                          Borrar resultado y desbloquear
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
