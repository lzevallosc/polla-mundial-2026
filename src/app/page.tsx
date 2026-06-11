import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] shadow-2xl">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%)]" />

        <div className="relative grid gap-8 p-7 md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 shadow-xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">
                PM
              </div>
              <div>
                <p className="text-sm font-black text-white">Polla Mundial 2026</p>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-300">
                  Actividad privada
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
              Mundial 2026
            </p>

            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white md:text-7xl">
              Polla Mundial 2026
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              Plataforma de pronósticos para el Mundial 2026. Registra tus marcadores,
              compite con otros participantes y revisa el ranking en tiempo real.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="rounded-2xl bg-cyan-400 px-6 py-3 text-center font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                Registrarme
              </Link>

              <Link
                href="/login"
                className="rounded-2xl bg-white px-6 py-3 text-center font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Iniciar sesión
              </Link>

              <Link
                href="/fixture"
                className="rounded-2xl border border-white/20 bg-white/[0.03] px-6 py-3 text-center font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Ver fixture
              </Link>

              <Link
                href="/final"
                className="rounded-2xl border border-cyan-300/40 bg-cyan-300/[0.03] px-6 py-3 text-center font-black text-cyan-200 transition hover:-translate-y-0.5 hover:bg-cyan-300/10"
              >
                Predicción final
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div className="ml-auto inline-flex w-fit items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                Actividad privada
              </span>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-5 shadow-xl backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Cómo participar
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">
                    1
                  </span>
                  <div>
                    <p className="font-black text-white">Regístrate</p>
                    <p className="text-sm text-slate-300">Crea tu usuario para participar.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">
                    2
                  </span>
                  <div>
                    <p className="font-black text-white">Pronostica</p>
                    <p className="text-sm text-slate-300">Ingresa marcadores antes de cada partido.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950">
                    3
                  </span>
                  <div>
                    <p className="font-black text-white">Compite</p>
                    <p className="text-sm text-slate-300">Suma puntos y revisa el ranking.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/fixture"
          className="group rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.14]"
        >
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Pronósticos
          </p>
          <h2 className="mb-2 text-lg font-black text-white group-hover:text-cyan-200">
            Marca tus resultados
          </h2>
          <p className="text-sm text-slate-300">
            Ingresa marcadores antes del inicio de cada partido.
          </p>
        </Link>

        <Link
          href="/ranking"
          className="group rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.14]"
        >
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Ranking
          </p>
          <h2 className="mb-2 text-lg font-black text-white group-hover:text-cyan-200">
            Tabla general
          </h2>
          <p className="text-sm text-slate-300">
            Consulta quién va ganando la polla y cuántos puntos tiene.
          </p>
        </Link>

        <Link
          href="/final"
          className="group rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.14]"
        >
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Final
          </p>
          <h2 className="mb-2 text-lg font-black text-white group-hover:text-cyan-200">
            Puntos extra
          </h2>
          <p className="text-sm text-slate-300">
            Elige campeón, subcampeón y tercer lugar.
          </p>
        </Link>
      </section>

      <section className="mt-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-xl">
        <h2 className="mb-2 font-black text-amber-100">Aviso importante</h2>
        <p className="text-sm leading-6 text-amber-50/90">
          Esta plataforma es una actividad privada de entretenimiento. No procesa apuestas,
          pagos, depósitos, retiros ni premios dentro de la web.
        </p>
      </section>
    </main>
  )
}
