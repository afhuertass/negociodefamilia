import { Round } from "@prisma/client";
import { prisma } from "@/lib/db";

export default async function CalendarPage() {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.match.findMany({
      where: { round: Round.GROUP_STAGE },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ matchNumber: "asc" }],
    }),
  ]);
  const groups = [...new Set(teams.map((t) => t.group || "Sin grupo"))];

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-3xl font-black">Grupos y calendario</h1>
        <p className="mt-2 text-sm text-slate-600">
          Equipos y partidos cargados para la fase de grupos. Por ahora se incluyó lo que se pegó: grupos A-K y partidos A-J.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group} className="card">
            <h2 className="text-xl font-black">Grupo {group}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {teams.filter((t) => (t.group || "Sin grupo") === group).map((team) => (
                <li key={team.id} className="rounded-xl bg-slate-50 px-3 py-2 font-semibold">{team.name}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="text-2xl font-black">Partidos fase de grupos</h2>
        <table className="mt-4 w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Partido</th>
              <th className="p-3">Estadio</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b last:border-0">
                <td className="p-3 font-black">{match.matchNumber}</td>
                <td className="p-3">{match.startsAt?.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="p-3 font-bold">{match.homeTeam?.name || match.homeSlot || "Por definir"} vs {match.awayTeam?.name || match.awaySlot || "Por definir"}</td>
                <td className="p-3 text-slate-600">{match.stadium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
