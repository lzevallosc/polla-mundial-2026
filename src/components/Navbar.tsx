import Link from 'next/link'
import ScoreBadge from '@/components/ScoreBadge'
import UsersBadge from '@/components/UsersBadge'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05091c]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-sm font-black text-slate-950 shadow-lg">
            PM
          </div>

          <div className="leading-tight">
            <p className="text-sm font-black text-white">Polla Mundial 2026</p>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
              Actividad privada
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300 sm:gap-4">
          <Link className="transition hover:text-cyan-300" href="/fixture">Fixture</Link>
          <Link className="transition hover:text-cyan-300" href="/mis-participaciones">Participaciones</Link>
          <Link className="transition hover:text-cyan-300" href="/final">Final</Link>
          <Link className="transition hover:text-cyan-300" href="/mis-puntos">Mis puntos</Link>
          <Link className="transition hover:text-cyan-300" href="/ranking">Ranking</Link>
          <Link className="transition hover:text-cyan-300" href="/reglas">Reglas</Link>
          <Link className="transition hover:text-cyan-300" href="/admin">Admin</Link>
          <UsersBadge />
          <ScoreBadge />
        </nav>
      </div>
    </header>
  )
}
