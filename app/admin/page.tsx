import { PredictionType, Round } from "@prisma/client";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPhaseLocks, phaseLabels, setPhaseLocked } from "@/lib/locks";
import { isAdmin } from "@/lib/session";
import { scoreGroupStage, scoreRound } from "@/lib/scoring";

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

  await recalculateScores();
  redirect("/admin?scored=1");
}

async function clearQualified() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  await prisma.actualQualifiedTeam.deleteMany();
  await scoreGroupStage();
  redirect("/admin?cleared=1");
}

async function recalculateScores() {
  await scoreGroupStage();
  for (const round of [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL]) {
    await scoreRound(round);
  }
}

async function calculateAll() {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  await recalculateScores();
  redirect("/admin?scored=1");
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

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string; scored?: string; cleared?: string; locks?: string }> }) {
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
          {params.cleared && <p className="mt-2 text-sm font-semibold text-amber-700">Resultados reales limpiados.</p>}
          {params.locks && <p className="mt-2 text-sm font-semibold text-emerald-700">Bloqueos actualizados.</p>}
          {params.error === "qualified-limit" && <p className="mt-2 text-sm font-semibold text-red-700">Máximo 24 clasificados 1º/2º y 8 mejores terceros.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
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
