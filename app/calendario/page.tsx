import { Round } from "@prisma/client";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { calculateGroupStandings, calculateBestThirds } from "@/lib/standings";
import { getLastSyncTime, updateLastSyncTime } from "@/lib/sync-tracker";
import { runBackgroundSync } from "@/lib/background-sync";

const CALENDAR_TIME_ZONE = "America/Mexico_City";

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const todayDisplayFormatter = new Intl.DateTimeFormat("es", {
  timeZone: CALENDAR_TIME_ZONE,
  dateStyle: "full",
});

const matchDateFormatter = new Intl.DateTimeFormat("es", {
  timeZone: CALENDAR_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

function teamName(match: { homeTeam?: { name: string } | null; awayTeam?: { name: string } | null; homeSlot?: string | null; awaySlot?: string | null }) {
  return `${match.homeTeam?.name || match.homeSlot || "Por definir"} vs ${match.awayTeam?.name || match.awaySlot || "Por definir"}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const currentTab = params.tab === "posiciones" ? "posiciones" : "partidos";

  const lastSync = getLastSyncTime();
  const COOLDOWN = 3 * 60 * 1000; // 3 minutes

  if (Date.now() - lastSync > COOLDOWN) {
    updateLastSyncTime();
    void runBackgroundSync();
  }

  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.match.findMany({
      where: { round: Round.GROUP_STAGE },
      include: { homeTeam: true, awayTeam: true, result: true },
      orderBy: [{ matchNumber: "asc" }],
    }),
  ]);
  const groups = [...new Set(teams.map((t) => t.group || "Sin grupo"))];
  const todayKey = dayFormatter.format(new Date());
  const todayMatches = matches.filter((match) => match.startsAt && dayFormatter.format(match.startsAt) === todayKey);

  const standings = calculateGroupStandings(teams, matches);
  const bestThirds = calculateBestThirds(standings);

  return (
    <div className="space-y-6">
      <section className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Grupos y calendario</h1>
          <p className="mt-2 text-sm text-slate-600">
            Equipos, partidos y tablas de posiciones actualizadas para la fase de grupos.
          </p>
        </div>
        
        <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5 max-w-sm self-start sm:self-auto shadow-inner">
          <Link
            href="/calendario?tab=partidos"
            className={`flex-1 text-center py-2 px-4 rounded-xl text-xs font-black transition-all ${
              currentTab === "partidos"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📅 Partidos
          </Link>
          <Link
            href="/calendario?tab=posiciones"
            className={`flex-1 text-center py-2 px-4 rounded-xl text-xs font-black transition-all ${
              currentTab === "posiciones"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏆 Posiciones
          </Link>
        </div>
      </section>

      {currentTab === "partidos" ? (
        <>
          <section className="card border-emerald-200 bg-emerald-50">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Hoy</p>
                <h2 className="text-2xl font-black">Partidos de hoy</h2>
              </div>
              <p className="text-sm font-semibold text-emerald-800">{todayDisplayFormatter.format(new Date())}</p>
            </div>

            {todayMatches.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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

          <section className="card overflow-x-auto">
            <h2 className="text-2xl font-black">Partidos fase de grupos</h2>
            <table className="mt-4 w-full min-w-[760px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Partido</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3">Estadio</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id} className="border-b last:border-0">
                    <td className="p-3 font-black">{match.matchNumber}</td>
                    <td className="p-3">{match.startsAt ? matchDateFormatter.format(match.startsAt) : "Por definir"}</td>
                    <td className="p-3 font-bold">{teamName(match)}</td>
                    <td className="p-3">
                      {match.result ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ring-1 ${match.finished ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-sky-50 text-sky-700 ring-sky-200 animate-pulse'}`}>
                          {match.result.homeGoals} - {match.result.awayGoals} {!match.finished && "• En vivo"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{match.stadium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const groupStandings = standings[group] || [];
              return (
                <div key={group} className="card overflow-hidden">
                  <h3 className="text-lg font-black pb-3 border-b border-slate-100">Grupo {group}</h3>
                  <table className="w-full text-left text-xs mt-3">
                    <thead>
                      <tr className="text-slate-500 font-bold border-b border-slate-100">
                        <th className="pb-2 w-8">#</th>
                        <th className="pb-2">Selección</th>
                        <th className="pb-2 text-center w-8">PJ</th>
                        <th className="pb-2 text-center w-10">DG</th>
                        <th className="pb-2 text-right w-10">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {groupStandings.map((team, idx) => {
                        const isQualifying = idx < 2;
                        const isThird = idx === 2;
                        const borderStyle = isQualifying 
                          ? "border-l-4 border-l-emerald-500 pl-2" 
                          : isThird 
                          ? "border-l-4 border-l-sky-400 pl-2" 
                          : "pl-3";
                        return (
                          <tr key={team.teamId} className="hover:bg-slate-50/50">
                            <td className="py-2.5 font-bold text-slate-500">{idx + 1}</td>
                            <td className={`py-2.5 font-bold text-slate-950 ${borderStyle}`}>{team.name}</td>
                            <td className="py-2.5 text-center text-slate-600">{team.played}</td>
                            <td className={`py-2.5 text-center font-semibold ${team.goalDifference > 0 ? "text-emerald-600" : team.goalDifference < 0 ? "text-red-500" : "text-slate-500"}`}>
                              {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                            </td>
                            <td className="py-2.5 text-right font-black text-emerald-700">{team.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>

          {bestThirds.length > 0 && (
            <section className="card max-w-2xl overflow-x-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black">Tabla de mejores terceros</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Clasifican a dieciseisavos los mejores 8 de los 12 terceros de grupo.</p>
                </div>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 ring-1 ring-sky-200 self-start sm:self-auto">
                  8 clasificados
                </span>
              </div>
              <table className="w-full text-left text-xs mt-4 min-w-[500px]">
                <thead>
                  <tr className="text-slate-500 font-bold border-b border-slate-100">
                    <th className="pb-2 w-12 pl-2">Pos</th>
                    <th className="pb-2 w-24">Grupo</th>
                    <th className="pb-2">Selección</th>
                    <th className="pb-2 text-center w-12">PJ</th>
                    <th className="pb-2 text-center w-16">DG</th>
                    <th className="pb-2 text-right w-16 pr-2">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bestThirds.map((team, idx) => {
                    const isQualifying = idx < 8;
                    const rowClass = isQualifying 
                      ? "bg-emerald-50/30 hover:bg-emerald-50/50" 
                      : "opacity-60 hover:bg-slate-50/50";
                    return (
                      <tr key={team.teamId} className={rowClass}>
                        <td className="py-3 pl-2">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${isQualifying ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 font-black text-slate-500 uppercase">Grupo {team.group}</td>
                        <td className="py-3 font-bold text-slate-900">{team.name}</td>
                        <td className="py-3 text-center text-slate-600">{team.played}</td>
                        <td className={`py-3 text-center font-semibold ${team.goalDifference > 0 ? "text-emerald-600" : team.goalDifference < 0 ? "text-red-500" : "text-slate-500"}`}>
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </td>
                        <td className="py-3 text-right font-black text-emerald-700 pr-2">{team.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
}
