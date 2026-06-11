import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <section className="card bg-gradient-to-br from-emerald-600 to-sky-700 p-8 text-white">
        <p className="text-sm font-bold uppercase tracking-widest opacity-80">MVP familiar</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Polla Mundialista Familia Huertas & Páez</h1>
        <p className="mt-4 max-w-2xl text-lg text-emerald-50">
          Entra con tu nombre y un código simple, llena tus predicciones y revisa la tabla de posiciones después de cada ronda.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn bg-white text-emerald-700 hover:bg-emerald-50" href="/entrar">Entrar / registrarme</Link>
          <Link className="btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20" href="/predicciones">Llenar predicciones</Link>
          <Link className="btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20" href="/tabla">Ver tabla</Link>
        </div>
      </section>

      <section className="card">
        <h2 className="text-2xl font-black">¿Cómo funciona?</h2>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <li><b>1.</b> Cada participante entra con nombre + código.</li>
          <li><b>2.</b> Predice 24 clasificados de grupos y 8 mejores terceros.</li>
          <li><b>3.</b> En eliminatorias predice marcador y equipo clasificado.</li>
          <li><b>4.</b> El admin carga resultados y el sistema calcula puntos.</li>
        </ol>
      </section>
    </div>
  );
}
