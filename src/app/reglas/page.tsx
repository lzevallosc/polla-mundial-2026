export default function RulesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black text-white">Reglas de puntaje</h1>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-6">
        <div className="rounded-xl bg-white/10 p-4">
          <p><b>+3 puntos</b> por acertar ganador o empate.</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <p><b>+1 punto</b> por acertar goles del equipo local.</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <p><b>+1 punto</b> por acertar goles del equipo visitante.</p>
        </div>
        <div className="rounded-xl bg-white/10 p-4">
          <p><b>+5 puntos</b> por marcador exacto.</p>
        </div>
        <div className="rounded-xl bg-cyan-400/20 p-4">
          <p><b>Máximo por partido:</b> 10 puntos.</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-4 text-xl font-bold">Puntos extra</h2>
        <ul className="space-y-2 text-slate-200">
          <li>Campeón: <b>+55 puntos</b></li>
          <li>Subcampeón: <b>+30 puntos</b></li>
          <li>Tercer lugar: <b>+25 puntos</b></li>
        </ul>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6">
        <h2 className="mb-4 text-xl font-bold">Ejemplo</h2>
        <p className="mb-3 text-slate-200">Resultado real: Perú 2 - 1 Brasil</p>
        <ul className="space-y-2 text-slate-300">
          <li>Perú 0 - 0 Brasil: 0 puntos</li>
          <li>Perú 0 - 1 Brasil: 1 punto</li>
          <li>Perú 1 - 0 Brasil: 3 puntos</li>
          <li>Perú 2 - 0 Brasil: 4 puntos</li>
          <li>Perú 2 - 1 Brasil: 10 puntos</li>
        </ul>
      </div>
    
      <div className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
        <h2 className="mb-3 text-xl font-bold text-amber-100">Aviso</h2>
        <p className="text-sm text-amber-50/90">
          Esta web es únicamente para registrar pronósticos y calcular un ranking.
          No administra apuestas, pagos, depósitos, retiros ni premios económicos.
        </p>
      </div>

    </main>
  )
}
