import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Combobox from "@/app/components/Combobox";

async function enter(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const accessCode = String(formData.get("accessCode") || "").trim();
  if (!name || !accessCode) throw new Error("Nombre y código son requeridos");

  const participant = await prisma.participant.findUnique({ where: { name } });
  
  if (!participant || participant.accessCode !== accessCode) {
    redirect("/entrar?error=1");
  }

  (await cookies()).set("participantId", participant.id, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/predicciones/grupos");
}

export default async function EnterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const participants = await prisma.participant.findMany({ 
    select: { name: true }, 
    orderBy: { name: 'asc' } 
  });
  return (
    <div className="mx-auto max-w-md card">
      <h1 className="text-3xl font-black">Entrar</h1>
      <p className="mt-2 text-sm text-slate-600">Usa tu nombre y un código simple. Si es tu primera vez, se crea automáticamente.</p>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Código incorrecto para ese nombre.</p>}
      <form action={enter} className="mt-6 space-y-4">
        <label className="block text-sm font-bold">Nombre
          <Combobox options={participants} />
        </label>
        <label className="block text-sm font-bold">Código
          <input className="input mt-1" name="accessCode" placeholder="Ej: 1234" required />
        </label>
        <button className="btn w-full">Continuar</button>
      </form>
    </div>
  );
}
