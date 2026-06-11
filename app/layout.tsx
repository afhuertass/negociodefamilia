import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Polla Familia Huertas & Páez",
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
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="text-xl font-black">Polla Familia Huertas & Páez</Link>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
              {participant?.name && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  Activo: {participant.name}
                </span>
              )}
              {participant?.name && (
                <form action={logout}>
                  <button className="text-slate-500 hover:text-red-700" type="submit">Salir</button>
                </form>
              )}
              <Link href="/entrar">Entrar</Link>
              <Link href="/predicciones">Predicciones</Link>
              <Link href="/predicciones/grupos">Clasificados</Link>
              <Link href="/predicciones/dieciseisavos">Eliminatorias</Link>
              <Link href="/tabla">Tabla</Link>
              <Link href="/calendario">Calendario</Link>
              <Link href="/reglas">Reglas</Link>
              <Link href="/admin">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
