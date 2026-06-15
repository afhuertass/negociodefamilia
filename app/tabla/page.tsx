import Link from "next/link";
import { prisma } from "@/lib/db";
import Avatar from "@/app/components/Avatar";

const podiumStyles = [
  {
    medal: "🥇",
    label: "Líder",
    card: "from-amber-400 via-yellow-300 to-orange-400 text-amber-950",
    ring: "ring-amber-200",
  },
  {
    medal: "🥈",
    label: "Segundo",
    card: "from-slate-200 via-white to-slate-300 text-slate-800",
    ring: "ring-slate-200",
  },
  {
    medal: "🥉",
    label: "Tercero",
    card: "from-orange-300 via-amber-200 to-yellow-100 text-orange-950",
    ring: "ring-orange-200",
  },
];

function rankBadge(index: number) {
  if (index === 0) return "bg-amber-100 text-amber-800 ring-amber-200";
  if (index === 1) return "bg-slate-100 text-slate-700 ring-slate-200";
  if (index === 2) return "bg-orange-100 text-orange-800 ring-orange-200";
  return "bg-white text-slate-600 ring-slate-200";
}

export default async function LeaderboardPage() {
  const participants = await prisma.participant.findMany({
    include: { scores: true },
    orderBy: { name: "asc" },
  });

  const rows = participants
    .map((p) => ({
      id: p.id,
      name: p.name,
      points: p.scores.reduce((sum, s) => sum + s.points, 0),
      qualifiedHits: p.scores.reduce((sum, s) => sum + s.qualifiedHits, 0),
    }))
    .sort((a, b) =>
      b.points - a.points || b.qualifiedHits - a.qualifiedHits || a.name.localeCompare(b.name),
    );

  const leader = rows[0];
  const maxPoints = Math.max(...rows.map((row) => row.points), 0);
  const totalPoints = rows.reduce((sum, row) => sum + row.points, 0);
  const averagePoints = rows.length ? Math.round((totalPoints / rows.length) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-sky-700 to-indigo-800 p-6 text-white shadow-xl shadow-emerald-950/10 md:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-100">Ranking familiar</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Tabla de posiciones</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-sky-50 md:text-base">
              Mira quién va arriba, desempates por marcadores exactos y aciertos de clasificados.
            </p>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/15 p-4 text-right backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Participantes</p>
            <p className="text-4xl font-black">{rows.length}</p>
          </div>
        </div>
      </section>

      {rows.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-3">
          {rows.slice(0, 3).map((row, index) => {
            const style = podiumStyles[index];
            return (
              <Link
                key={row.id}
                href={`/tabla/${row.id}`}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${style.card} p-5 shadow-sm ring-1 ${style.ring} transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl transition group-hover:scale-125" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-75">{style.label}</p>
                    <h2 className="mt-2 text-xl font-black">{row.name}</h2>
                  </div>
                  <span className="text-4xl drop-shadow-sm">{style.medal}</span>
                </div>
                <div className="relative mt-6 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-5xl font-black leading-none">{row.points}</p>
                    <p className="mt-1 text-sm font-bold opacity-80">puntos</p>
                  </div>
                  <div className="text-right text-sm font-bold opacity-80">
                    <p>{row.qualifiedHits} clasificados</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card bg-gradient-to-br from-white to-emerald-50">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Puntaje líder</p>
          <p className="mt-2 text-3xl font-black text-emerald-700">{leader?.points ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600">{leader ? leader.name : "Sin participantes"}</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-sky-50">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Promedio</p>
          <p className="mt-2 text-3xl font-black text-sky-700">{averagePoints}</p>
          <p className="mt-1 text-sm text-slate-600">puntos por participante</p>
        </div>
        <div className="card bg-gradient-to-br from-white to-indigo-50">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Puntos totales</p>
          <p className="mt-2 text-3xl font-black text-indigo-700">{totalPoints}</p>
          <p className="mt-1 text-sm text-slate-600">sumados en la polla</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5">
          <div>
            <h2 className="text-2xl font-black">Clasificación general</h2>
            <p className="mt-1 text-sm text-slate-600">Toca un participante para ver el detalle de sus predicciones.</p>
          </div>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200">
            {rows.length} jugadores
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-white text-xs uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-5 py-4">Posición</th>
                <th className="px-5 py-4">Participante</th>
                <th className="px-5 py-4 text-right">Puntos</th>
                <th className="px-5 py-4 text-right">Clasificados</th>
                <th className="px-5 py-4">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const progress = maxPoints > 0 ? Math.round((row.points / maxPoints) * 100) : 0;
                return (
                  <tr key={row.id} className="group border-t border-slate-100 transition hover:bg-emerald-50/50">
                    <td className="border-t border-slate-100 px-5 py-4">
                      <span className={`inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 font-black ring-1 ${rankBadge(index)}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="border-t border-slate-100 px-5 py-4">
                      <Link className="flex items-center gap-3" href={`/tabla/${row.id}`}>
                        <Avatar participantId={row.id} name={row.name} />
                        <span>
                          <span className="block font-black text-slate-900 group-hover:text-emerald-800">{row.name}</span>
                          <span className="text-xs font-semibold text-slate-500">Ver detalle →</span>
                        </span>
                      </Link>
                    </td>
                    <td className="border-t border-slate-100 px-5 py-4 text-right text-2xl font-black text-emerald-700">{row.points}</td>
                    <td className="border-t border-slate-100 px-5 py-4 text-right font-bold text-slate-700">{row.qualifiedHits}</td>
                    <td className="border-t border-slate-100 px-5 py-4">
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">{progress}% del líder</p>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td className="p-6 text-slate-500" colSpan={5}>Aún no hay participantes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
