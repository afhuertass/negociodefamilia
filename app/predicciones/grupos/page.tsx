import { PredictionType, Round } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isPhaseLocked } from "@/lib/locks";
import { scoreGroupStage } from "@/lib/scoring";
import { getParticipantId } from "@/lib/session";

async function saveGroupPredictions(formData: FormData) {
  "use server";
  const participantId = await getParticipantId();
  if (!participantId) redirect("/entrar");

  if (await isPhaseLocked(Round.GROUP_STAGE)) redirect("/predicciones/grupos?error=locked");

  const topTwo = [...new Set(formData.getAll("topTwo").map(String))];
  const topTwoSet = new Set(topTwo);
  const bestThird = [...new Set(formData.getAll("bestThird").map(String))].filter((teamId) => !topTwoSet.has(teamId));

  if (topTwo.length > 24 || bestThird.length > 8) redirect("/predicciones/grupos?error=limit");

  await prisma.$transaction([
    prisma.groupPrediction.deleteMany({ where: { participantId } }),
    ...topTwo.map((teamId) =>
      prisma.groupPrediction.create({ data: { participantId, teamId, type: PredictionType.TOP_TWO } }),
    ),
    ...bestThird.map((teamId) =>
      prisma.groupPrediction.create({ data: { participantId, teamId, type: PredictionType.BEST_THIRD } }),
    ),
  ]);

  await scoreGroupStage();

  redirect("/predicciones/grupos?ok=1");
}

export default async function GroupPredictionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const participantId = await getParticipantId();
  if (!participantId) redirect("/entrar");

  const [{ ok, error }, participant, teams, predictions, locked] = await Promise.all([
    searchParams,
    prisma.participant.findUnique({ where: { id: participantId } }),
    prisma.team.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.groupPrediction.findMany({ where: { participantId } }),
    isPhaseLocked(Round.GROUP_STAGE),
  ]);

  const topSelected = new Set(predictions.filter((p) => p.type === PredictionType.TOP_TWO).map((p) => p.teamId));
  const thirdSelected = new Set(predictions.filter((p) => p.type === PredictionType.BEST_THIRD).map((p) => p.teamId));
  const groups = [...new Set(teams.map((t) => t.group || "Sin grupo"))];

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-3xl font-black">Predicciones fase de grupos</h1>
        <p className="mt-2 text-sm text-slate-600">Hola, <b>{participant?.name}</b>. Puedes guardar avances parciales. Al final deben quedar 24 equipos como primero/segundo y 8 mejores terceros.</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">Seleccionados ahora: {topSelected.size}/24 primero-segundo · {thirdSelected.size}/8 mejores terceros.</p>
        {ok && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Predicciones guardadas y puntajes recalculados.</p>}
        {locked && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">Esta fase está bloqueada. Puedes revisar tus predicciones, pero no editarlas.</p>}
        {error === "limit" && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Máximo 24 primero/segundo y 8 mejores terceros. Un equipo no puede estar en ambos.</p>}
        {error === "locked" && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">La fase está bloqueada por el admin.</p>}
        {error && !["limit", "locked"].includes(error) && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Hubo un problema guardando tus predicciones.</p>}
        {teams.length === 0 && <p className="mt-4 text-sm">Aún no hay equipos. Pídele al admin que cargue equipos en <Link className="underline" href="/admin">Admin</Link>.</p>}
      </div>

      {teams.length > 0 && (
        <form action={saveGroupPredictions} className="space-y-6">
          {!locked && (
            <div className="sticky top-4 z-10 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-sm backdrop-blur">
              <button className="btn">Guardar avance</button>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <section key={group} className="card">
                <h2 className="text-xl font-black">Grupo {group}</h2>
                <div className="mt-4 space-y-3">
                  {teams.filter((t) => (t.group || "Sin grupo") === group).map((team) => (
                    <div key={team.id} className="rounded-xl border p-3">
                      <p className="font-bold">{team.name}</p>
                      <label className="mt-2 flex gap-2 text-sm"><input disabled={locked} type="checkbox" name="topTwo" value={team.id} defaultChecked={topSelected.has(team.id)} /> 1º/2º del grupo</label>
                      <label className="mt-1 flex gap-2 text-sm"><input disabled={locked} type="checkbox" name="bestThird" value={team.id} defaultChecked={thirdSelected.has(team.id)} /> Mejor tercero</label>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}
