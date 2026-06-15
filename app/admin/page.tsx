import { PredictionType, Round } from "@prisma/client";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPhaseLocks, phaseLabels, setPhaseLocked } from "@/lib/locks";
import { isAdmin } from "@/lib/session";
import { scoreGroupStage, scoreRound } from "@/lib/scoring";
import { calculateGroupStandings, calculateBestThirds } from "@/lib/standings";

async function loginAdmin(formData: FormData) {
  "use server";
  const key = String(formData.get("key") || "");
  if (key !== process.env.ADMIN_KEY) redirect("/admin?error=1");
  (await cookies()).set("admin", key, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/admin");
}

async function addTeam(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  await prisma.team.create({
    data: {
      name: String(formData.get("name") || "").trim(),
      group: String(formData.get("group") || "").trim().toUpperCase(),
    },
  });
  redirect("/admin");
}

async function deleteParticipant(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const participantId = String(formData.get("participantId") || "");
  if (!participantId) redirect("/admin?error=participant-delete");
  await prisma.participant.delete({ where: { id: participantId } });
  redirect("/admin?participantDeleted=1");
}

async function saveQualified(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");

  const topTwo = [...new Set(formData.getAll("topTwo").map(String))];
  const topTwoSet = new Set(topTwo);
  const bestThird = [...new Set(formData.getAll("bestThird").map(String))].filter(
    (teamId) => !topTwoSet.has(teamId),
  );

  if (topTwo.length > 24 || bestThird.length > 8) redirect("/admin?error=qualified-limit");

  await prisma.$transaction([
    prisma.actualQualifiedTeam.deleteMany(),
    ...topTwo.map((teamId) =>
      prisma.actualQualifiedTeam.create({ data: { teamId, type: PredictionType.TOP_TWO } }),
    ),
    ...bestThird.map((teamId) =>
      prisma.actualQualifiedTeam.create({ data: { teamId, type: PredictionType.BEST_THIRD } }),
    ),
  ]);

  await recalculateScores(prisma);
  redirect("/admin?scored=1");
}

async function clearQualified() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  await prisma.actualQualifiedTeam.deleteMany();
  await scoreGroupStage(prisma);
  redirect("/admin?cleared=1");
}

async function recalculateScores() {
  await scoreGroupStage(prisma);
  for (const round of [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL]) {
    await scoreRound(prisma, round);
  }
}

async function calculateAll() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  await recalculateScores(prisma);
  redirect("/admin?scored=1");
}

async function applyAllOfficial() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");

  const [teams, matches] = await prisma.$transaction([
    prisma.team.findMany(),
    prisma.match.findMany({
      where: { round: Round.GROUP_STAGE },
      include: { homeTeam: true, awayTeam: true, result: true },
    }),
  ]);

  const standings = calculateGroupStandings(teams, matches as any);
  const bestThirds = calculateBestThirds(standings);

  const topTwoTeams: string[] = [];
  for (const group of Object.keys(standings)) {
    standings[group].slice(0, 2).forEach((t: any) => topTwoTeams.push(t.teamId));
  }
  const bestThirdTeams = bestThirds.slice(0, 8).map((t: any) => t.teamId);

  await prisma.$transaction([
    prisma.actualQualifiedTeam.deleteMany(),
    ...topTwoTeams.map((teamId) =>
      prisma.actualQualifiedTeam.create({ data: { teamId, type: PredictionType.TOP_TWO } }),
    ),
    ...bestThirdTeams.map((teamId) =>
      prisma.actualQualifiedTeam.create({ data: { teamId, type: PredictionType.BEST_THIRD } }),
    ),
  ]);

  await recalculateScores(prisma);
  redirect("/admin?scored=1");
}

async function fetchLiveResults() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");

  const response = await fetch("https://worldcup26.ir/get/games");
  const data = await response.json();
  
  const games = Array.isArray(data) ? data : (data && Array.isArray(data.games) ? data.games : null);
  
  if (!games) {
    console.error("API did not return an array or games array");
    redirect("/admin?error=api-games");
  }

  const matches = await prisma.match.findMany({ include: { homeTeam: true, awayTeam: true } });
  
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
    
    // Skip if no matching API game found or if the game hasn't started yet (i.e. has no partial scores)
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

    await prisma.matchResult.upsert({
      where: { matchId: match.id },
      update: {
        homeGoals,
        awayGoals,
        qualifiedTeamId
      },
      create: {
        matchId: match.id,
        homeGoals,
        awayGoals,
        qualifiedTeamId
      }
    });
    
    const isFinished = apiMatch.finished === "TRUE";
    await prisma.match.update({
      where: { id: match.id },
      data: { finished: isFinished }
    });
  }
  
  await recalculateScores(prisma);
  redirect("/admin?resultsFetched=1");
}

async function updateLocks(formData: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const lockedPhases = new Set(formData.getAll("locked").map(String));
  for (const phase of Object.values(Round)) {
    await setPhaseLocked(phase, lockedPhases.has(phase));
  }
  redirect("/admin?locks=1");
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; scored?: string; cleared?: string; locks?: string; participantDeleted?: string; resultsFetched?: string }> }) {
  const params = await searchParams;
  const admin = await isAdmin();
  if (!admin) {
    return (
      <div className="mx-auto max-w-md card">
        <h1 className="text-3xl font-black">Admin</h1>
        {params.error && <p className="mt-4 text-sm font-semibold text-red-700">Clave incorrecta.</p>}
        <form action={loginAdmin} className="mt-6 space-y-4">
          <input className="input" name="key" placeholder="Clave admin" />
          <button className="btn w-full">Entrar</button>
        </form>
      </div>
    );
  }

  const [teams, actual, participants, locks] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.actualQualifiedTeam.findMany(),
    prisma.participant.findMany({ orderBy: { name: "asc" } }),
    getPhaseLocks(),
  ]);
  const actualTop = new Set(actual.filter((a) => a.type === PredictionType.TOP_TWO).map((a) => a.teamId));
  const actualThird = new Set(actual.filter((a) => a.type === PredictionType.BEST_THIRD).map((a) => a.teamId));
  const groups = [...new Set(teams.map((team) => team.group || "Sin grupo"))];
  const lockedSet = new Set(locks.filter((lock) => lock.isLocked).map((lock) => lock.phase));

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Panel admin</h1>
          <p className="text-sm text-slate-600">Equipos, clasificados reales y cálculo de puntajes.</p>
          {params.scored && <p className="mt-2 text-sm font-semibold text-emerald-700">Resultados guardados y puntajes recalculados.</p>}
          {params.resultsFetched && <p className="mt-2 text-sm font-semibold text-emerald-700">Resultados en vivo sincronizados y puntajes recalculados.</p>}
          {params.cleared && <p className="mt-2 text-sm font-semibold text-amber-700">Resultados reales limpiados.</p>}
          {params.locks && <p className="mt-2 text-sm font-semibold text-emerald-700">Bloqueos actualizados.</p>}
          {params.participantDeleted && <p className="mt-2 text-sm font-semibold text-emerald-700">Participante eliminado.</p>}
          {params.error === "qualified-limit" && <p className="mt-2 text-sm font-semibold text-red-700">Máximo 24 clasificados 1º/2º y 8 mejores terceros.</p>}
          {params.error === "participant-delete" && <p className="mt-2 text-sm font-semibold text-red-700">No se pudo eliminar el participante.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={applyAllOfficial}><button className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition hover:bg-emerald-700">Snapshot: Aplicar Clasificaciones</button></form>
          <form action={clearQualified}><button className="btn bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition hover:bg-red-700">Snapshot: Eliminar Clasificaciones</button></form>
          <form action={fetchLiveResults}><button className="btn bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition hover:bg-sky-700">Fetch resultados en vivo</button></form>
          <Link href="/admin/partidos" className="btn-secondary">Resultados eliminatorias</Link>
          <a href="/admin/backup" className="btn-secondary">Descargar backup JSON</a>
          <form action={calculateAll}><button className="btn-secondary">Recalcular con resultados guardados</button></form>
        </div>
      </div>

      <section className="card">
        <h2 className="text-xl font-black">Bloqueo de fases</h2>
        <p className="mt-2 text-sm text-slate-600">Cuando una fase está bloqueada, los participantes pueden ver sus predicciones pero no editarlas.</p>
        <form action={updateLocks} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.values(Round).map((phase) => (
              <label key={phase} className="flex items-center gap-3 rounded-2xl border bg-slate-50 p-4 text-sm font-bold">
                <input type="checkbox" name="locked" value={phase} defaultChecked={lockedSet.has(phase)} />
                {phaseLabels[phase]}
              </label>
            ))}
          </div>
          <button className="btn-secondary">Guardar bloqueos</button>
        </form>
      </section>

      <section className="card">
        <h2 className="text-xl font-black">Resumen</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Participantes</p><p className="text-2xl font-black">{participants.length}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Equipos</p><p className="text-2xl font-black">{teams.length}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">1º/2º reales</p><p className="text-2xl font-black">{actualTop.size}/24</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-500">Mejores terceros</p><p className="text-2xl font-black">{actualThird.size}/8</p></div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-black">Participantes</h2>
        <p className="mt-2 text-sm text-slate-600">Eliminar un participante borra también sus predicciones y puntajes.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Creado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id} className="border-b last:border-0">
                  <td className="p-3 font-bold">{participant.name}</td>
                  <td className="p-3 text-slate-600">{participant.createdAt.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3 text-right">
                    <form action={deleteParticipant}>
                      <input type="hidden" name="participantId" value={participant.id} />
                      <button className="rounded-xl border border-red-200 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-50" type="submit">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && <tr><td className="p-3 text-slate-500" colSpan={3}>No hay participantes registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-black">Agregar equipo manualmente</h2>
        <form action={addTeam} className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_auto]">
          <input className="input" name="name" placeholder="Nombre selección" required />
          <input className="input" name="group" placeholder="Grupo" />
          <button className="btn">Agregar</button>
        </form>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Resultados fase de grupos</h2>
            <p className="text-sm text-slate-600">
              Marca los clasificados reales. Al guardar se recalculan los puntajes usando estos resultados guardados.
              Si marcas un equipo como 1º/2º, no se guardará también como mejor tercero.
            </p>
          </div>
          <form action={clearQualified}>
            <button className="btn-secondary border-red-200 text-red-700 hover:bg-red-50">Limpiar resultados reales</button>
          </form>
        </div>

        <form action={saveQualified} className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const groupTeams = teams.filter((team) => (team.group || "Sin grupo") === group);
              const groupTopCount = groupTeams.filter((team) => actualTop.has(team.id)).length;
              const groupThirdCount = groupTeams.filter((team) => actualThird.has(team.id)).length;

              return (
                <section key={group} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black">Grupo {group}</h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">
                      {groupTopCount}/2 + {groupThirdCount} terceros
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {groupTeams.map((team) => (
                      <div key={team.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="font-bold">{team.name}</p>
                        <label className="mt-2 flex gap-2 text-sm">
                          <input type="checkbox" name="topTwo" value={team.id} defaultChecked={actualTop.has(team.id)} />
                          Clasificó 1º/2º
                        </label>
                        <label className="mt-1 flex gap-2 text-sm">
                          <input type="checkbox" name="bestThird" value={team.id} defaultChecked={actualThird.has(team.id)} />
                          Mejor tercero
                        </label>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="sticky bottom-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <button className="btn">Guardar resultados y recalcular puntajes</button>
          </div>
        </form>
      </section>
    </div>
  );
}
