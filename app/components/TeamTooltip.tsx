"use client";

import { useState, useRef, useEffect } from "react";

type MatchHistory = {
  matchNumber: number | null;
  round: string;
  startsAt: string | null;
  stadium: string | null;
  homeTeamName: string;
  awayTeamName: string;
  result: { homeGoals: number; awayGoals: number } | null;
};

const roundLabels: Record<string, string> = {
  GROUP_STAGE: "Grupos",
  ROUND_OF_32: "16avos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  FINAL: "Final",
};

export function TeamTooltip({
  teamName,
  history,
  children,
}: {
  teamName: string;
  history: MatchHistory[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!history || history.length === 0) return <>{children}</>;

  return (
    <span
      ref={ref}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="cursor-help underline decoration-dotted decoration-slate-300 underline-offset-2">
        {children}
      </span>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-xl">
          <span className="block font-black text-slate-800 mb-2">
            Partidos de {teamName}
          </span>
          {history.map((m, i) => {
            const isHome = m.homeTeamName === teamName;
            const opponent = isHome ? m.awayTeamName : m.homeTeamName;
            const score = m.result
              ? `${m.result.homeGoals} - ${m.result.awayGoals}`
              : "Pendiente";
            const label = m.matchNumber
              ? `#${m.matchNumber} ${roundLabels[m.round] || m.round}`
              : roundLabels[m.round] || m.round;
            return (
              <span
                key={i}
                className="flex items-center justify-between gap-2 py-1 border-b border-slate-100 last:border-0"
              >
                <span className="text-slate-500 truncate">{label}</span>
                <span className="text-slate-700 truncate">
                  {isHome ? "vs" : "@"} {opponent}
                </span>
                <span className="font-bold text-slate-900 whitespace-nowrap">
                  {score}
                </span>
              </span>
            );
          })}
        </span>
      )}
    </span>
  );
}