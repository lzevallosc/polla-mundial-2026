'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function AdminScoresPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    setLoading(true)
    setMessage('')

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login?next=/admin/scores')
      return
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single()

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (profile?.role !== 'admin') {
      setMessage('No tienes permiso para acceder a esta página.')
      setLoading(false)
      return
    }

    setAuthorized(true)
    setLoading(false)
  }

  async function runSync(dryRun: boolean) {
    setRunning(true)
    setMessage('')
    setResult(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    if (!token) {
      setMessage('Sesión no válida.')
      setRunning(false)
      return
    }

    const response = await fetch(`/api/admin/sync-scores${dryRun ? '?dryRun=1' : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    setResult(data)

    if (!response.ok) {
      setMessage(data.error || 'Error ejecutando sincronización.')
    } else if (dryRun) {
      setMessage('Simulación ejecutada correctamente. No se modificó la base de datos.')
    } else {
      setMessage('Sincronización real ejecutada correctamente.')
    }

    setRunning(false)
  }

  if (loading || !authorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
          {message || 'Validando permisos...'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Panel Admin
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Scores automáticos
            </h1>

            <p className="mt-3 max-w-3xl text-slate-200">
              Sincroniza resultados desde football-data.org, actualiza partidos y recalcula puntos cuando un partido finaliza.
            </p>
          </div>

          <button
            onClick={() => router.push('/admin')}
            className="w-fit rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 font-black text-white hover:bg-white/10"
          >
            Volver al admin
          </button>
        </div>
      </section>

      {message && (
        <section className="mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
          {message}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <button
          onClick={() => runSync(true)}
          disabled={running}
          className="rounded-3xl border border-white/10 bg-white/10 p-6 text-left shadow-xl transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            Modo seguro
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Simular sincronización
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Consulta la API y muestra qué partidos detecta, pero no modifica la base.
          </p>
        </button>

        <button
          onClick={() => runSync(false)}
          disabled={running}
          className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-6 text-left shadow-xl transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
            Ejecución real
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Sincronizar scores ahora
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Actualiza marcadores y recalcula puntos si hay partidos finalizados.
          </p>
        </button>
      </section>

      {running && (
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/10 p-5 text-white">
          Ejecutando sincronización...
        </section>
      )}

      {result && (
        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-xl">
          <div className="mb-4 grid gap-4 md:grid-cols-5">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">API</p>
              <p className="text-3xl font-black text-white">{result.apiMatches ?? 0}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">En juego/final</p>
              <p className="text-3xl font-black text-white">{result.interestingApiMatches ?? 0}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Mapeados</p>
              <p className="text-3xl font-black text-white">{result.mapped ?? 0}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Actualizados</p>
              <p className="text-3xl font-black text-white">{result.updatedMatches ?? 0}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Predicciones</p>
              <p className="text-3xl font-black text-white">{result.recalculatedPredictions ?? 0}</p>
            </div>
          </div>

          <h2 className="mb-3 text-xl font-black text-white">
            Resultado técnico
          </h2>

          <pre className="max-h-[600px] overflow-auto rounded-2xl bg-black/50 p-4 text-xs text-cyan-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </main>
  )
}
