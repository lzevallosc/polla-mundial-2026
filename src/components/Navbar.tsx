import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          Polla Mundial 2026
        </Link>

        <nav className="flex flex-wrap justify-end gap-3 text-sm text-slate-300">
          <Link className="hover:text-white" href="/fixture">Fixture</Link>
          <Link className="hover:text-white" href="/final">Final</Link>
          <Link className="hover:text-white" href="/ranking">Ranking</Link>
          <Link className="hover:text-white" href="/reglas">Reglas</Link>
          <Link className="hover:text-white" href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  )
}
