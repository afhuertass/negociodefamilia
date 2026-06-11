import Link from "next/link";

const links = [
  ["Clasificados fase de grupos", "/predicciones/grupos", "Elige 24 primeros/segundos y 8 mejores terceros."],
  ["Marcadores fase de grupos", "/predicciones/partidos", "Opcional: guarda marcadores de partidos de grupos."],
  ["Dieciseisavos", "/predicciones/dieciseisavos", "Predice marcador y clasificado."],
  ["Octavos", "/predicciones/octavos", "Predice marcador y clasificado."],
  ["Cuartos", "/predicciones/cuartos", "Predice marcador y clasificado."],
  ["Semifinales", "/predicciones/semifinales", "Predice marcador y clasificado."],
  ["Final", "/predicciones/final", "Predice marcador y campeón."],
];

export default function PredictionsIndexPage() {
  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-3xl font-black">Predicciones</h1>
        <p className="mt-2 text-sm text-slate-600">Elige la fase que quieres llenar o revisar.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map(([title, href, description]) => (
          <Link key={href} href={href} className="card block transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
