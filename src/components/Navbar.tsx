import Link from 'next/link'
import ScoreBadge from '@/components/ScoreBadge'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-lg font-bold text-white">
            Polla Mundial 2026
          </Link>

          <div className="sm:hidden">
            <ScoreBadge />
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Link className="hover:text-white" href="/fixture">Fixture</Link>
          <Link className="hover:text-white" href="/final">Final</Link>
          <Link className="hover:text-white" href="/mis-puntos">Mis puntos</Link>
          <Link className="hover:text-white" href="/ranking">Ranking</Link>
          <Link className="hover:text-white" href="/reglas">Reglas</Link>
          <Link className="hover:text-white" href="/admin">Admin</Link>

          <div className="hidden sm:block">
            <ScoreBadge />
          </div>
        </nav>
      </div>
    </header>
  )
}
