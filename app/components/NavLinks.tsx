"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, MouseEvent, useEffect, useRef, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  match?: "exact" | "startsWith";
};

type ConfettiPiece = {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
};

const navItems: NavItem[] = [
  { href: "/entrar", label: "Entrar", icon: "👋", match: "startsWith" },
  { href: "/predicciones", label: "Predicciones", icon: "🎯", match: "startsWith" },
  { href: "/tabla", label: "Tabla", icon: "📊", match: "startsWith" },
  { href: "/calendario", label: "Calendario", icon: "🗓️", match: "startsWith" },
  { href: "/reglas", label: "Reglas", icon: "📜", match: "startsWith" },
  { href: "/admin", label: "Admin", icon: "🔒", match: "startsWith" },
];

const knockoutItems: NavItem[] = [
  { href: "/predicciones/dieciseisavos", label: "Dieciseisavos", icon: "⚽", match: "startsWith" },
  { href: "/predicciones/octavos", label: "Octavos", icon: "🎯", match: "startsWith" },
  { href: "/predicciones/cuartos", label: "Cuartos", icon: "🏟️", match: "startsWith" },
  { href: "/predicciones/semifinales", label: "Semifinales", icon: "🔥", match: "startsWith" },
  { href: "/predicciones/final", label: "Final", icon: "🏆", match: "startsWith" },
];

const confettiColors = ["#10b981", "#38bdf8", "#f59e0b", "#f43f5e", "#8b5cf6", "#22c55e"];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  const predictionsMenuRef = useRef<HTMLDivElement>(null);
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [predictionsOpen, setPredictionsOpen] = useState(false);

  useEffect(() => {
    if (pieces.length === 0) return;
    const timeout = window.setTimeout(() => setPieces([]), 900);
    return () => window.clearTimeout(timeout);
  }, [pieces]);

  useEffect(() => {
    if (!predictionsOpen) return;

    function closeOnOutsideClick(event: globalThis.MouseEvent | TouchEvent) {
      if (!predictionsMenuRef.current?.contains(event.target as Node)) {
        setPredictionsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPredictionsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("touchstart", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("touchstart", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [predictionsOpen]);

  function popConfetti(event: MouseEvent<HTMLAnchorElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const now = Date.now();

    setPieces(
      Array.from({ length: 14 }, (_, index) => ({
        id: now + index,
        x: originX,
        y: originY,
        dx: Math.cos((Math.PI * 2 * index) / 14) * (24 + Math.random() * 34),
        dy: Math.sin((Math.PI * 2 * index) / 14) * (20 + Math.random() * 30) - 14,
        rotate: Math.random() * 240 - 120,
        color: confettiColors[index % confettiColors.length],
      })),
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-semibold text-slate-700">
        {navItems.map((item) => {
          const active = isActive(pathname, item);

          if (item.href === "/predicciones") {
            return (
              <div key={item.href} ref={predictionsMenuRef} className="relative">
                <div
                  className={[
                    "group relative inline-flex items-center overflow-hidden rounded-full border shadow-sm transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2",
                    active
                      ? "border-emerald-200 bg-emerald-600 text-white shadow-emerald-100"
                      : "border-slate-200 bg-white/80 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
                  ].join(" ")}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  <button
                    type="button"
                    onClick={() => setPredictionsOpen((open) => !open)}
                    onMouseEnter={() => setPredictionsOpen(true)}
                    aria-expanded={predictionsOpen}
                    aria-current={active ? "page" : undefined}
                    className="relative inline-flex items-center gap-1.5 px-3 py-2 focus:outline-none"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="text-xs" aria-hidden="true">▾</span>
                  </button>
                </div>

                {predictionsOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <Link
                      href="/predicciones"
                      onClick={(event) => {
                        popConfetti(event);
                        setPredictionsOpen(false);
                      }}
                      className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800"
                    >
                      <span aria-hidden="true">🎯</span>
                      <span>Todas las predicciones</span>
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    {knockoutItems.map((knockoutItem) => {
                      const knockoutActive = isActive(pathname, knockoutItem);
                      return (
                        <Link
                          key={knockoutItem.href}
                          href={knockoutItem.href}
                          onClick={(event) => {
                            popConfetti(event);
                            setPredictionsOpen(false);
                          }}
                          aria-current={knockoutActive ? "page" : undefined}
                          className={[
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition",
                            knockoutActive ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50 hover:text-emerald-800",
                          ].join(" ")}
                        >
                          <span aria-hidden="true">{knockoutItem.icon}</span>
                          <span>{knockoutItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => {
                popConfetti(event);
                setPredictionsOpen(false);
              }}
              aria-current={active ? "page" : undefined}
              className={[
                "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-2 shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                active
                  ? "border-emerald-200 bg-emerald-600 text-white shadow-emerald-100"
                  : "border-slate-200 bg-white/80 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800",
              ].join(" ")}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <span className="relative" aria-hidden="true">{item.icon}</span>
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </div>


      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
        {pieces.map((piece) => (
          <span
            key={piece.id}
            className="nav-confetti-piece"
            style={
              {
                left: piece.x,
                top: piece.y,
                "--confetti-x": `${piece.dx}px`,
                "--confetti-y": `${piece.dy}px`,
                "--confetti-rotate": `${piece.rotate}deg`,
                backgroundColor: piece.color,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}
