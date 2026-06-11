import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
              PeruRail
            </span>
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-300">
            Mundial 2026
          </p>

          <h1 className="mb-4 text-4xl font-black tracking-tight text-white md:text-6xl">
            Polla Mundial 2026
          </h1>

          <p className="mb-8 max-w-2xl text-lg text-slate-200">
            Plataforma interna de pronósticos para colaboradores de PeruRail.
            Registra tus marcadores, compite con tus amigos y revisa el ranking
            en tiempo real.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/register" className="rounded-xl bg-cyan-400 px-5 py-3 text-center font-bold text-slate-950 hover:bg-cyan-300">
              Registrarme
            </Link>
            <Link href="/login" className="rounded-xl bg-white px-5 py-3 text-center font-bold text-slate-950 hover:bg-slate-100">
              Iniciar sesión
            </Link>
            <Link href="/fixture" className="rounded-xl border border-white/20 px-5 py-3 text-center font-bold text-white hover:bg-white/10">
              Ver fixture
            </Link>
            <Link href="/final" className="rounded-xl border border-cyan-300/40 px-5 py-3 text-center font-bold text-cyan-200 hover:bg-cyan-300/10">
              Predicción final
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
          <h2 className="mb-2 font-bold text-white">Pronósticos</h2>
          <p className="text-sm text-slate-300">Ingresa marcadores antes del inicio de cada partido.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
          <h2 className="mb-2 font-bold text-white">Ranking Top 10</h2>
          <p className="text-sm text-slate-300">Consulta quién va ganando la polla.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
          <h2 className="mb-2 font-bold text-white">Predicción final</h2>
          <p className="text-sm text-slate-300">Elige campeón, subcampeón y tercer lugar.</p>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
        <h2 className="mb-2 font-bold text-amber-100">Aviso importante</h2>
        <p className="text-sm text-amber-50/90">
          Esta plataforma es una actividad interna de entretenimiento para colaboradores
          de PeruRail. No procesa apuestas, pagos, depósitos, retiros ni premios dentro
          de la web.
        </p>
      </section>
    </main>
  )
}
