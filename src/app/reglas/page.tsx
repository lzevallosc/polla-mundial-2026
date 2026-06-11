export default function RulesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Actividad privada
        </p>

        <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
          Reglas de la Polla Mundial 2026
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
          Esta plataforma es una dinámica social de pronósticos para el Mundial 2026.
          El objetivo es participar, competir sanamente y seguir el ranking por
          participaciones y categorías.
        </p>
      </section>

      <section className="mb-8 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-black text-white">Participaciones</h2>

        <div className="space-y-3 text-sm leading-6 text-cyan-50/90">
          <p>
            Cada usuario puede tener una o varias <b>participaciones</b>. Cada participación
            funciona como una polla independiente, con sus propios pronósticos, su propia
            predicción final y su propio puntaje.
          </p>

          <p>
            Por ejemplo, un mismo usuario puede tener:
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p><b>Luis 1</b> → Junior</p>
            <p><b>Luis Arriesgado</b> → Experto</p>
            <p><b>Luis Favoritos</b> → Amateur</p>
          </div>

          <p>
            En el ranking, cada participación aparece como una fila independiente.
          </p>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Junior
          </p>
          <h3 className="mb-2 text-xl font-black text-white">Categoría inicial</h3>
          <p className="text-sm leading-6 text-slate-300">
            Pensada para participantes casuales o quienes quieren jugar de forma simple.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Amateur
          </p>
          <h3 className="mb-2 text-xl font-black text-white">Categoría intermedia</h3>
          <p className="text-sm leading-6 text-slate-300">
            Pensada para participantes que quieren competir con un nivel medio.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Experto
          </p>
          <h3 className="mb-2 text-xl font-black text-white">Categoría avanzada</h3>
          <p className="text-sm leading-6 text-slate-300">
            Pensada para participantes que quieren competir en una categoría más exigente.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-black text-white">Reglas de categorías</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-200">
              Un usuario puede crear varias participaciones dentro de la misma categoría.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-200">
              No es obligatorio tener una participación en Junior. El usuario puede elegir
              Amateur o Experto desde el registro.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-200">
              El límite por defecto es de <b>3 participaciones por usuario</b>.
              Este límite es configurable por el administrador.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-sm text-slate-200">
              El ranking puede verse general o filtrado por categoría:
              Junior, Amateur o Experto.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-amber-100">
          Cierre de participaciones
        </h2>

        <div className="space-y-3 text-sm leading-6 text-amber-50/90">
          <p>
            Las participaciones solo pueden crearse, editarse o desactivarse antes del
            inicio del Mundial 2026.
          </p>

          <p>
            Después del cierre ya no se podrá crear una nueva participación, cambiar su
            nombre, cambiar su categoría ni desactivarla.
          </p>

          <p>
            Sí estará permitido cambiar cuál es la participación activa para revisar
            puntajes o consultar pronósticos ya guardados.
          </p>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-black text-white">Puntaje por partido</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p><b className="text-cyan-300">+3 puntos</b> por acertar ganador o empate.</p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p><b className="text-cyan-300">+1 punto</b> por acertar goles del equipo local.</p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p><b className="text-cyan-300">+1 punto</b> por acertar goles del equipo visitante.</p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p><b className="text-cyan-300">+5 puntos</b> por marcador exacto.</p>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/20 p-4 md:col-span-2">
            <p><b>Máximo por partido:</b> 10 puntos.</p>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-black text-white">Puntos extra</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Campeón</p>
            <p className="mt-2 text-2xl font-black text-cyan-300">+55</p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Subcampeón</p>
            <p className="mt-2 text-2xl font-black text-cyan-300">+30</p>
          </div>

          <div className="rounded-2xl bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Tercer lugar</p>
            <p className="mt-2 text-2xl font-black text-cyan-300">+25</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-300">
          La predicción final también pertenece a una participación. Si tienes varias
          participaciones, cada una puede tener campeón, subcampeón y tercer lugar distintos.
        </p>
      </section>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
        <h2 className="mb-4 text-2xl font-black text-white">Ejemplo de puntaje</h2>

        <p className="mb-4 text-slate-200">
          Resultado real: <b>Perú 2 - 1 Brasil</b>
        </p>

        <div className="space-y-3 text-sm text-slate-300">
          <div className="rounded-2xl bg-slate-950/40 p-4">
            Perú 0 - 0 Brasil: <b>0 puntos</b>
          </div>
          <div className="rounded-2xl bg-slate-950/40 p-4">
            Perú 0 - 1 Brasil: <b>1 punto</b>
          </div>
          <div className="rounded-2xl bg-slate-950/40 p-4">
            Perú 1 - 0 Brasil: <b>3 puntos</b>
          </div>
          <div className="rounded-2xl bg-slate-950/40 p-4">
            Perú 2 - 0 Brasil: <b>4 puntos</b>
          </div>
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/20 p-4">
            Perú 2 - 1 Brasil: <b>10 puntos</b>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-red-300/20 bg-red-400/10 p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-black text-red-100">Aviso importante</h2>

        <p className="text-sm leading-6 text-red-50/90">
          Esta web es únicamente para registrar pronósticos y calcular un ranking.
          No administra apuestas, pagos, depósitos, retiros ni premios económicos.
        </p>
      </section>
    </main>
  )
}
