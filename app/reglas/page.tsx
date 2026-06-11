const knockoutRows = [
  ["Marcador exacto", "3 puntos"],
  ["Acierto del equipo clasificado", "1 punto"],
  ["Sin aciertos", "0 puntos"],
];

const drawRows = [
  ["Marcador exacto de empate + clasificado correcto", "3 puntos"],
  ["Empate correcto + clasificado correcto", "2 puntos"],
  ["Solo empate correcto", "1 punto"],
  ["Solo clasificado correcto", "1 punto"],
  ["Sin aciertos", "0 puntos"],
];

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-sky-700 to-indigo-800 p-8 text-white shadow-sm">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-100">Reglamento oficial</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
          Polla Mundialista Familia Huertas & Páez
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-sky-50">
          Predicciones del Mundial 2026 por fases. Los puntos se acumulan durante todo el torneo y la tabla se actualiza después de cada cierre.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-bold uppercase text-slate-500">Fase 1</p>
          <h2 className="mt-1 text-2xl font-black">Grupos</h2>
          <p className="mt-2 text-sm text-slate-600">32 selecciones por participante.</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold uppercase text-slate-500">Fase 2+</p>
          <h2 className="mt-1 text-2xl font-black">Eliminatorias</h2>
          <p className="mt-2 text-sm text-slate-600">Marcador + equipo clasificado.</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold uppercase text-slate-500">Premios</p>
          <h2 className="mt-1 text-2xl font-black">80% / 20%</h2>
          <p className="mt-2 text-sm text-slate-600">Primer y segundo lugar.</p>
        </div>
      </section>

      <section className="card">
        <h2 className="text-3xl font-black">1. Clasificación a la siguiente ronda</h2>
        <p className="mt-3 text-slate-600">Cada participante debe elegir:</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-4xl font-black text-emerald-700">24</p>
            <p className="mt-1 font-bold">Equipos como primero o segundo de grupo</p>
            <p className="mt-1 text-sm text-slate-600">Los dos primeros de cada uno de los 12 grupos.</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
            <p className="text-4xl font-black text-sky-700">8</p>
            <p className="mt-1 font-bold">Mejores terceros</p>
            <p className="mt-1 text-sm text-slate-600">Los 8 terceros que lograrán avanzar.</p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
          Cada selección acertada otorga <span className="text-emerald-700">1 punto</span>.
        </div>
      </section>

      <section className="card">
        <h2 className="text-3xl font-black">2. Eliminatorias</h2>
        <p className="mt-3 text-slate-600">Aplica para dieciseisavos, octavos, cuartos y semifinales.</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <tbody>
              {knockoutRows.map(([label, points]) => (
                <tr key={label} className="border-b last:border-0">
                  <td className="p-4 font-semibold">{label}</td>
                  <td className="p-4 text-right font-black text-emerald-700">{points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-8 text-2xl font-black">En caso de empate pronosticado</h3>
        <p className="mt-2 text-slate-600">Si el participante pronostica empate en tiempo reglamentario, debe indicar quién avanza por penales.</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <tbody>
              {drawRows.map(([label, points]) => (
                <tr key={label} className="border-b last:border-0">
                  <td className="p-4 font-semibold">{label}</td>
                  <td className="p-4 text-right font-black text-sky-700">{points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="text-3xl font-black">3. Gran final</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-amber-50 p-5">
            <p className="text-3xl font-black text-amber-700">5 puntos</p>
            <p className="mt-1 font-bold">Marcador exacto y campeón correcto.</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-5">
            <p className="text-3xl font-black text-emerald-700">3 puntos</p>
            <p className="mt-1 font-bold">Campeón correcto.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-600">Si se pronostica empate, también debe indicarse el campeón.</p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-3xl font-black">Desempates</h2>
          <ol className="mt-5 space-y-3 text-sm text-slate-700">
            <li className="rounded-xl bg-slate-50 p-3"><b>1.</b> Mayor cantidad de marcadores exactos acertados.</li>
            <li className="rounded-xl bg-slate-50 p-3"><b>2.</b> Mayor cantidad de aciertos de equipos clasificados.</li>
            <li className="rounded-xl bg-slate-50 p-3"><b>3.</b> Si persiste el empate, el premio se divide en partes iguales.</li>
          </ol>
        </div>

        <div className="card">
          <h2 className="text-3xl font-black">Premiación</h2>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-yellow-50 p-4">
              <p className="text-lg font-black">🥇 Primer lugar</p>
              <p className="text-3xl font-black text-yellow-700">80%</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4">
              <p className="text-lg font-black">🥈 Segundo lugar</p>
              <p className="text-3xl font-black text-slate-700">20%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
