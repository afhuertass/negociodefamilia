"use client";

import { useState } from "react";
import { TeamTooltip } from "./TeamTooltip";

type MatchHistory = {
  matchNumber: number | null;
  round: string;
  startsAt: string | null;
  stadium: string | null;
  homeTeamName: string;
  awayTeamName: string;
  result: { homeGoals: number; awayGoals: number } | null;
};

type AllPrediction = {
  participantId: string;
  participantName: string;
  homeGoals: number;
  awayGoals: number;
  qualifiedTeamName: string;
  points: number | null;
};

type PredictionRow = {
  id: string;
  homeGoals: number;
  awayGoals: number;
  qualifiedTeam: { name: string };
  match: {
    matchNumber: number | null;
    homeSlot: string | null;
    awaySlot: string | null;
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeTeam: { id: string; name: string } | null;
    awayTeam: { id: string; name: string } | null;
    result: { homeGoals: number; awayGoals: number; qualifiedTeam: { name: string } } | null;
  };
};

export function MatchPredictionRow({
  prediction,
  allPredictions,
  teamHistory,
  currentParticipantId,
  awarded,
}: {
  prediction: PredictionRow;
  allPredictions: AllPrediction[];
  teamHistory: MatchHistory[];
  currentParticipantId: string;
  awarded: number | null;
}) {
  const [open, setOpen] = useState(false);

  const match = prediction.match;
  const homeName = match.homeTeam?.name || match.homeSlot || "Por definir";
  const awayName = match.awayTeam?.name || match.awaySlot || "Por definir";
  const result = match.result;

  const sorted = [...allPredictions].sort((a, b) => {
    const pa = a.points ?? -1;
    const pb = b.points ?? -1;
    if (pb !== pa) return pb - pa;
    return a.participantName.localeCompare(b.participantName);
  });

  return (
    <>
      <tr className="border-b last:border-0">
        <td className="p-3 font-semibold">
          <span className="inline-flex items-center gap-1">
            #{match.matchNumber ?? ""} ·{" "}
            {match.homeTeamId ? (
              <TeamTooltip teamName={homeName} history={teamHistory}>
                {homeName}
              </TeamTooltip>
            ) : homeName}
            {" vs "}
            {match.awayTeamId ? (
              <TeamTooltip teamName={awayName} history={teamHistory}>
                {awayName}
              </TeamTooltip>
            ) : awayName}
          </span>
        </td>
        <td className="p-3 font-black">{prediction.homeGoals} - {prediction.awayGoals}</td>
        <td className="p-3">{prediction.qualifiedTeam.name}</td>
        <td className="p-3 text-slate-600">
          {result
            ? `${result.homeGoals} - ${result.awayGoals}, clasifica ${result.qualifiedTeam.name}`
            : "Pendiente"}
        </td>
        <td className="p-3 text-right font-black text-emerald-700">
          {awarded === null ? "—" : awarded}
        </td>
        <td className="p-3 text-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            aria-expanded={open}
            aria-label={open ? "Ocultar predicciones" : "Ver predicciones de todos"}
          >
            {open ? "▲" : "▼"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6} className="bg-slate-50 px-6 py-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Predicciones de todos · #{match.matchNumber} {homeName} vs {awayName}
            </p>
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-slate-500">
                  <tr>
                    <th className="pb-2 text-left font-bold">Participante</th>
                    <th className="pb-2 text-left font-bold">Predicción</th>
                    <th className="pb-2 text-left font-bold">Clasifica</th>
                    <th className="pb-2 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => {
                    const isCurrent = p.participantId === currentParticipantId;
                    return (
                      <tr
                        key={p.participantId}
                        className={`border-t border-slate-100 ${isCurrent ? "bg-emerald-50" : ""}`}
                      >
                        <td className={`py-1.5 ${isCurrent ? "font-black text-emerald-800" : "font-semibold"}`}>
                          {p.participantName}
                        </td>
                        <td className="py-1.5 font-bold">{p.homeGoals} - {p.awayGoals}</td>
                        <td className="py-1.5">{p.qualifiedTeamName}</td>
                        <td className="py-1.5 text-right font-bold text-emerald-700">
                          {p.points === null ? "—" : p.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}