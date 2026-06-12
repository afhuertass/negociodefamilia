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
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ startsAt: "asc" }, { matchNumber: "asc" }],
  });
  const todayKey = dayFormatter.format(new Date());
  const todayMatches = matches.filter((match) => match.startsAt && dayFormatter.format(match.startsAt) === todayKey);

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
                  <p className="mt-2 text-lg font-black">{teamName(match)}</p>
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
          <h2 className="text-2xl font-black">¿Cómo funciona?</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-700">
            <li><b>1.</b> Cada participante entra con nombre + código.</li>
            <li><b>2.</b> Predice 24 clasificados de grupos y 8 mejores terceros.</li>
            <li><b>3.</b> En eliminatorias predice marcador y equipo clasificado.</li>
            <li><b>4.</b> El admin carga resultados y el sistema calcula puntos.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
