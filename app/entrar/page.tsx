import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

async function enter(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const accessCode = String(formData.get("accessCode") || "").trim();
  if (!name || !accessCode) throw new Error("Nombre y código son requeridos");

  const existing = await prisma.participant.findUnique({ where: { name } });
  if (existing && existing.accessCode !== accessCode) {
    redirect("/entrar?error=1");
  }

  const participant = existing ?? (await prisma.participant.create({ data: { name, accessCode } }));
  (await cookies()).set("participantId", participant.id, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/predicciones/grupos");
}

export default async function EnterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-md card">
      <h1 className="text-3xl font-black">Entrar</h1>
      <p className="mt-2 text-sm text-slate-600">Usa tu nombre y un código simple. Si es tu primera vez, se crea automáticamente.</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Código incorrecto para ese nombre.</p>}
      <form action={enter} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">Nombre
          <input className="input mt-1" name="name" placeholder="Ej: Tía Marta" required />
        </label>
        <label className="block text-sm font-bold">Código
          <input className="input mt-1" name="accessCode" placeholder="Ej: 1234" required />
        </label>
        <button className="btn w-full">Continuar</button>
      </form>
    </div>
  );
}
