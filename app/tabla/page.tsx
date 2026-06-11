import Link from "next/link";
import { prisma } from "@/lib/db";

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
      exactScores: p.scores.reduce((sum, s) => sum + s.exactScores, 0),
      qualifiedHits: p.scores.reduce((sum, s) => sum + s.qualifiedHits, 0),
    }))
    .sort((a, b) =>
      b.points - a.points || b.exactScores - a.exactScores || b.qualifiedHits - a.qualifiedHits || a.name.localeCompare(b.name),
    );

  return (
    <div className="card overflow-x-auto">
      <h1 className="text-3xl font-black">Tabla de posiciones</h1>
      <table className="mt-6 w-full min-w-[640px] text-left text-sm">
        <thead className="border-b bg-slate-50 text-slate-600">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Participante</th>
            <th className="p-3 text-right">Puntos</th>
            <th className="p-3 text-right">Marcadores exactos</th>
            <th className="p-3 text-right">Clasificados acertados</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="p-3 font-black">{index + 1}</td>
              <td className="p-3 font-bold">
                <Link className="text-emerald-700 underline-offset-4 hover:underline" href={`/tabla/${row.id}`}>
                  {row.name}
                </Link>
              </td>
              <td className="p-3 text-right font-black">{row.points}</td>
              <td className="p-3 text-right">{row.exactScores}</td>
              <td className="p-3 text-right">{row.qualifiedHits}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td className="p-3 text-slate-500" colSpan={5}>Aún no hay participantes.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
