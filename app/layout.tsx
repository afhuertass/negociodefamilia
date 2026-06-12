import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/app/components/NavLinks";
import { prisma } from "@/lib/db";
import { getParticipantId } from "@/lib/session";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

async function logout() {
  "use server";
  const { cookies } = await import("next/headers");
  (await cookies()).delete("participantId");
}

export const metadata: Metadata = {
  title: "Polla Mundialista Familiar",
  description: "Predicciones familiares para el Mundial 2026",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const participantId = await getParticipantId();
  const participant = participantId
    ? await prisma.participant.findUnique({ where: { id: participantId }, select: { name: true } })
    : null;

  return (
    <html lang="es" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-950">
        <header className="sticky top-0 z-40 border-b border-emerald-100/70 bg-white/85 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="group inline-flex items-center gap-3 rounded-full p-1 pr-4 transition hover:bg-emerald-50">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-600 text-lg shadow-lg shadow-emerald-500/20 transition group-hover:rotate-6 group-hover:scale-105">
                ⚽
              </span>
              <span className="leading-tight">
                <span className="block text-base font-black text-slate-950 md:text-lg">Polla Mundialista</span>
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Familiar</span>
              </span>
            </Link>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
              {participant?.name && (
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 shadow-sm">
                  Activo: {participant.name}
                </span>
              )}
              {participant?.name && (
                <form action={logout}>
                  <button className="rounded-full border border-red-100 bg-white px-3 py-2 text-sm font-bold text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-700" type="submit">Salir</button>
                </form>
              )}
              <NavLinks />
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
