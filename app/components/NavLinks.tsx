"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, MouseEvent, useEffect, useState } from "react";

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
  { href: "/predicciones", label: "Predicciones", icon: "🎯", match: "exact" },
  { href: "/predicciones/grupos", label: "Clasificados", icon: "🏆", match: "startsWith" },
  { href: "/predicciones/dieciseisavos", label: "Eliminatorias", icon: "⚽", match: "startsWith" },
  { href: "/tabla", label: "Tabla", icon: "📊", match: "startsWith" },
  { href: "/calendario", label: "Calendario", icon: "🗓️", match: "startsWith" },
  { href: "/reglas", label: "Reglas", icon: "📜", match: "startsWith" },
  { href: "/admin", label: "Admin", icon: "🔒", match: "startsWith" },
];

const mobilePrimaryItems: NavItem[] = [
  { href: "/", label: "Inicio", icon: "🏠", match: "exact" },
  { href: "/predicciones", label: "Predicciones", icon: "🎯", match: "startsWith" },
  { href: "/tabla", label: "Tabla", icon: "📊", match: "startsWith" },
  { href: "/calendario", label: "Calendario", icon: "🗓️", match: "startsWith" },
];

const mobileMoreItems: NavItem[] = [
  { href: "/entrar", label: "Entrar", icon: "👋", match: "startsWith" },
  { href: "/predicciones/grupos", label: "Clasificados", icon: "🏆", match: "startsWith" },
  { href: "/predicciones/dieciseisavos", label: "Eliminatorias", icon: "⚽", match: "startsWith" },
  { href: "/reglas", label: "Reglas", icon: "📜", match: "startsWith" },
  { href: "/admin", label: "Admin", icon: "🔒", match: "startsWith" },
];

const confettiColors = ["#10b981", "#38bdf8", "#f59e0b", "#f43f5e", "#8b5cf6", "#22c55e"];

function isActive(pathname: string, item: NavItem) {
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (pieces.length === 0) return;
    const timeout = window.setTimeout(() => setPieces([]), 900);
    return () => window.clearTimeout(timeout);
  }, [pieces]);

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
      <div className="hidden flex-wrap items-center justify-end gap-2 text-sm font-semibold text-slate-700 md:flex">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={popConfetti}
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

      <div className="md:hidden">
        {moreOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/20" onClick={() => setMoreOpen(false)}>
            <div className="absolute bottom-24 right-4 w-64 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <p className="px-3 pb-2 text-xs font-black uppercase tracking-widest text-slate-500">Más opciones</p>
              <div className="space-y-1">
                {mobileMoreItems.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(event) => {
                        popConfetti(event);
                        setMoreOpen(false);
                      }}
                      className={[
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold",
                        active ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <span aria-hidden="true">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
          aria-label="Navegación móvil"
        >
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
            {mobilePrimaryItems.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    popConfetti(event);
                    setMoreOpen(false);
                  }}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition",
                    active ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800",
                  ].join(" ")}
                >
                  <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
                  <span className="leading-none">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition",
                moreOpen ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800",
              ].join(" ")}
            >
              <span className="text-lg leading-none" aria-hidden="true">•••</span>
              <span className="leading-none">Más</span>
            </button>
          </div>
        </nav>
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
