'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  full_name: string | null
  alias: string | null
  role: string | null
}

type Prediction = {
  user_id: string
  points: number
}

type FinalPrediction = {
  user_id: string
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

type RankingRow = {
  id: string
  name: string
  alias: string
  matchPoints: number
  extraPoints: number
  total: number
  predictionsCount: number
}

export default function RankingPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadRanking()
  }, [])

  const ranking = useMemo<RankingRow[]>(() => {
    const pointsByUser: Record<string, number> = {}
    const predictionsCountByUser: Record<string, number> = {}
    const extraByUser: Record<string, number> = {}

    predictions.forEach((prediction) => {
      pointsByUser[prediction.user_id] =
        (pointsByUser[prediction.user_id] || 0) + (prediction.points || 0)

      predictionsCountByUser[prediction.user_id] =
        (predictionsCountByUser[prediction.user_id] || 0) + 1
    })

    finalPredictions.forEach((prediction) => {
      extraByUser[prediction.user_id] =
        (prediction.champion_points || 0) +
        (prediction.runner_up_points || 0) +
        (prediction.third_place_points || 0)
    })

    return profiles
      .map((profile) => {
        const matchPoints = pointsByUser[profile.id] || 0
        const extraPoints = extraByUser[profile.id] || 0
        const total = matchPoints + extraPoints

        return {
          id: profile.id,
          name: profile.full_name || profile.alias || 'Sin nombre',
          alias: profile.alias || profile.full_name || 'Participante',
          matchPoints,
          extraPoints,
          total,
          predictionsCount: predictionsCountByUser[profile.id] || 0,
        }
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
        return a.alias.localeCompare(b.alias)
      })
  }, [profiles, predictions, finalPredictions])

  const registeredUsers = profiles.length
  const usersWithPredictions = ranking.filter((row) => row.predictionsCount > 0).length
  const leader = ranking[0]

  async function loadRanking() {
    setLoading(true)
    setMessage('')

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, alias, role')
      .order('created_at', { ascending: true })

    if (profilesError) {
      setMessage(profilesError.message)
      setLoading(false)
      return
    }

    const { data: predictionsData, error: predictionsError } = await supabase
      .from('predictions')
      .select('user_id, points')

    if (predictionsError) {
      setMessage(predictionsError.message)
      setLoading(false)
      return
    }

    const { data: finalData, error: finalError } = await supabase
      .from('final_predictions')
      .select('user_id, champion_points, runner_up_points, third_place_points')

    if (finalError) {
      setMessage(finalError.message)
      setLoading(false)
      return
    }

    setProfiles((profilesData || []) as Profile[])
    setPredictions((predictionsData || []) as Prediction[])
    setFinalPredictions((finalData || []) as FinalPrediction[])
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
          Cargando ranking...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          PeruRail · Mundial 2026
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Ranking general
            </h1>
            <p className="mt-3 max-w-2xl text-slate-200">
              Todos los participantes ordenados de mayor a menor puntaje.
            </p>
          </div>

          <button
            onClick={loadRanking}
            className="w-fit rounded-2xl border border-cyan-300/40 bg-cyan-300/10 px-5 py-3 font-black text-cyan-100 hover:bg-cyan-300/20"
          >
            Actualizar
          </button>
        </div>
      </section>

      {message && (
        <section className="mb-6 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
          {message}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400 p-5 text-slate-950 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest">Registrados</p>
          <p className="mt-2 text-5xl font-black">{registeredUsers}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Con pronósticos</p>
          <p className="mt-2 text-4xl font-black text-white">{usersWithPredictions}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Participantes</p>
          <p className="mt-2 text-4xl font-black text-white">{ranking.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Líder actual</p>
          <p className="mt-2 truncate text-2xl font-black text-white">
            {leader ? leader.alias : '-'}
          </p>
          <p className="text-cyan-200">{leader ? `${leader.total} puntos` : 'Sin datos'}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl">
        <div className="border-b border-white/10 bg-slate-950/40 p-5">
          <h2 className="text-xl font-black text-white">Tabla de posiciones</h2>
          <p className="text-sm text-slate-300">
            Ordenado por puntaje total. Incluye puntos de partidos y puntos extra.
          </p>
        </div>

        <div className="divide-y divide-white/10">
          {ranking.length === 0 && (
            <div className="p-5 text-slate-300">
              Todavía no hay usuarios registrados.
            </div>
          )}

          {ranking.map((row, index) => {
            const position = index + 1

            return (
              <div
                key={row.id}
                className={`grid gap-4 p-5 md:grid-cols-[80px_1fr_140px_140px_140px] md:items-center ${
                  position <= 3 ? 'bg-cyan-300/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-black ${
                      position === 1
                        ? 'bg-cyan-400 text-slate-950'
                        : position === 2
                          ? 'bg-white text-slate-950'
                          : position === 3
                            ? 'bg-amber-300 text-slate-950'
                            : 'bg-white/10 text-white'
                    }`}
                  >
                    {position}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">
                    {row.alias}
                  </p>
                  <p className="truncate text-sm text-slate-400">
                    {row.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Pronósticos guardados: {row.predictionsCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/40 p-3 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Partidos
                  </p>
                  <p className="text-2xl font-black text-white">{row.matchPoints}</p>
                </div>

                <div className="rounded-2xl bg-slate-950/40 p-3 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Extras
                  </p>
                  <p className="text-2xl font-black text-white">{row.extraPoints}</p>
                </div>

                <div className="rounded-2xl bg-cyan-400 p-3 text-center text-slate-950">
                  <p className="text-xs font-black uppercase tracking-widest">
                    Total
                  </p>
                  <p className="text-3xl font-black">{row.total}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
