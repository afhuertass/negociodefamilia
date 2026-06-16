import Link from "next/link";
import { prisma } from "@/lib/db";

const CALENDAR_TIME_ZONE = "America/Mexico_City";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const matchDateFormatter = new Intl.DateTimeFormat("es", {
  timeZone: CALENDAR_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

function teamName(match: { homeTeam?: { name: string } | null; awayTeam?: { name: string } | null; homeSlot?: string | null; awaySlot?: string | null }) {
  return `${match.homeTeam?.name || match.homeSlot || "Por definir"} vs ${match.awayTeam?.name || match.awaySlot || "Por definir"}`;
}

export default async function Home() {
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true, result: true },
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
  });
  const todayKey = dayFormatter.format(new Date());
  const todayMatches = matches.filter((match) => match.startsAt && dayFormatter.format(match.startsAt) === todayKey);
  const finalizedMatches = matches
    .filter((match) => match.finished && match.result)
    .sort((a, b) => (b.startsAt?.getTime() ?? 0) - (a.startsAt?.getTime() ?? 0));

  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <section className="card bg-gradient-to-br from-emerald-600 to-sky-700 p-8 text-white">
        <p className="text-sm font-bold uppercase tracking-widest opacity-80">MVP familiar</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Polla Mundialista Familiar</h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-50">
          Entra con tu nombre y un código simple, llena tus predicciones y revisa la tabla de posiciones después de cada ronda.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn bg-white text-emerald-700 hover:bg-emerald-50" href="/entrar">Entrar / registrarme</Link>
          <Link className="btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20" href="/predicciones">Llenar predicciones</Link>
          <Link className="btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20" href="/tabla">Ver tabla</Link>
        </div>
      </section>

      <div className="space-y-6">
        <section className="card border-emerald-200 bg-emerald-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Hoy</p>
              <h2 className="text-2xl font-black">Partidos de hoy</h2>
            </div>
            <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" href="/calendario">
              Ver calendario
            </Link>
          </div>

          {todayMatches.length > 0 ? (
            <div className="mt-4 space-y-3">
              {todayMatches.map((match) => (
                <div key={match.id} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span className="font-black text-emerald-700">Partido #{match.matchNumber}</span>
                    <span>{match.startsAt ? matchDateFormatter.format(match.startsAt) : "Hora por definir"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-lg font-black">{teamName(match)}</p>
                    {match.result ? (
                      <span className={`rounded-full px-3 py-1 text-sm font-black ring-1 ${match.finished ? 'bg-emerald-100 text-emerald-800 ring-emerald-300' : 'bg-sky-100 text-sky-800 ring-sky-300 animate-pulse'}`}>
                        {match.result.homeGoals} - {match.result.awayGoals} {!match.finished && "• En vivo"}
                      </span>
                    ) : null}
                  </div>
                  {match.stadium ? <p className="mt-1 text-sm text-slate-600">{match.stadium}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600">
              No hay partidos programados para hoy.
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="text-2xl font-black">Partidos finalizados</h2>
          {finalizedMatches.length > 0 ? (
            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {finalizedMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-sm transition hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-500 text-xs">Partido #{match.matchNumber}</span>
                    <p className="font-bold text-slate-900">{teamName(match)}</p>
                  </div>
                  {match.result && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                      {match.result.homeGoals} - {match.result.awayGoals}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              No hay partidos finalizados aún.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
