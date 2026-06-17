import { prisma } from "@/lib/db";
import EntrarForm from "@/app/components/EntrarForm";

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
      <EntrarForm participants={participants} error={error} />
    </div>
  );
}
