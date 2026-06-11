'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  full_name: string | null
  alias: string | null
  role: string | null
}

type Entry = {
  id: string
  user_id: string
  name: string
  category: string
  is_active: boolean
  created_at: string
}

type Category = {
  id: number
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

type Prediction = {
  entry_id: string | null
  points: number
}

type FinalPrediction = {
  entry_id: string | null
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

type RankingRow = {
  id: string
  entryName: string
  category: string
  userName: string
  userAlias: string
  matchPoints: number
  extraPoints: number
  total: number
  predictionsCount: number
}

export default function RankingPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>([])
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadRanking()
  }, [])

  const ranking = useMemo<RankingRow[]>(() => {
    const profileById: Record<string, Profile> = {}
    const pointsByEntry: Record<string, number> = {}
    const predictionsCountByEntry: Record<string, number> = {}
    const extraByEntry: Record<string, number> = {}

    profiles.forEach((profile) => {
      profileById[profile.id] = profile
    })

    predictions.forEach((prediction) => {
      if (!prediction.entry_id) return

      pointsByEntry[prediction.entry_id] =
        (pointsByEntry[prediction.entry_id] || 0) + (prediction.points || 0)

      predictionsCountByEntry[prediction.entry_id] =
        (predictionsCountByEntry[prediction.entry_id] || 0) + 1
    })

    finalPredictions.forEach((prediction) => {
      if (!prediction.entry_id) return

      extraByEntry[prediction.entry_id] =
        (prediction.champion_points || 0) +
        (prediction.runner_up_points || 0) +
        (prediction.third_place_points || 0)
    })

    return entries
      .filter((entry) => entry.is_active)
      .filter((entry) => activeCategory === 'Todos' || entry.category === activeCategory)
      .map((entry) => {
        const profile = profileById[entry.user_id]
        const matchPoints = pointsByEntry[entry.id] || 0
        const extraPoints = extraByEntry[entry.id] || 0
        const total = matchPoints + extraPoints

        return {
          id: entry.id,
          entryName: entry.name,
          category: entry.category,
          userName: profile?.full_name || profile?.alias || 'Sin nombre',
          userAlias: profile?.alias || profile?.full_name || 'Participante',
          matchPoints,
          extraPoints,
          total,
          predictionsCount: predictionsCountByEntry[entry.id] || 0,
        }
      })
      .sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints
        if (b.extraPoints !== a.extraPoints) return b.extraPoints - a.extraPoints
        return a.entryName.localeCompare(b.entryName)
      })
  }, [profiles, entries, predictions, finalPredictions, activeCategory])

  const categoryStats = useMemo(() => {
    return categories.map((category) => {
      const categoryEntries = entries.filter(
        (entry) => entry.is_active && entry.category === category.name
      )

      const categoryRanking = ranking.filter((row) => row.category === category.name)

      const leader = categoryRanking[0]

      return {
        name: category.name,
        count: categoryEntries.length,
        leaderName: leader?.entryName || '-',
        leaderPoints: leader?.total || 0,
      }
    })
  }, [categories, entries, ranking])

  const totalUsers = profiles.length
  const totalEntries = entries.filter((entry) => entry.is_active).length
  const entriesWithPredictions = ranking.filter((row) => row.predictionsCount > 0).length
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

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('entry_categories')
      .select('id, name, description, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      setMessage(categoriesError.message)
      setLoading(false)
      return
    }

    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('id, user_id, name, category, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (entriesError) {
      setMessage(entriesError.message)
      setLoading(false)
      return
    }

    const { data: predictionsData, error: predictionsError } = await supabase
      .from('predictions')
      .select('entry_id, points')

    if (predictionsError) {
      setMessage(predictionsError.message)
      setLoading(false)
      return
    }

    const { data: finalData, error: finalError } = await supabase
      .from('final_predictions')
      .select('entry_id, champion_points, runner_up_points, third_place_points')

    if (finalError) {
      setMessage(finalError.message)
      setLoading(false)
      return
    }

    setProfiles((profilesData || []) as Profile[])
    setCategories((categoriesData || []) as Category[])
    setEntries((entriesData || []) as Entry[])
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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Polla Mundial 2026
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Ranking por participaciones
            </h1>
            <p className="mt-3 max-w-3xl text-slate-200">
              Cada participación compite de forma independiente. Puedes filtrar por categoría y ver cuántos compiten en Junior, Amateur o Experto.
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
          <p className="text-xs font-black uppercase tracking-widest">Usuarios</p>
          <p className="mt-2 text-5xl font-black">{totalUsers}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Participaciones
          </p>
          <p className="mt-2 text-4xl font-black text-white">{totalEntries}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Con pronósticos
          </p>
          <p className="mt-2 text-4xl font-black text-white">{entriesWithPredictions}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Líder actual
          </p>
          <p className="mt-2 truncate text-2xl font-black text-white">
            {leader ? leader.entryName : '-'}
          </p>
          <p className="text-cyan-200">{leader ? `${leader.total} puntos` : 'Sin datos'}</p>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {categoryStats.map((stat) => (
          <button
            key={stat.name}
            onClick={() => setActiveCategory(stat.name)}
            className={`rounded-3xl border p-5 text-left shadow-xl transition hover:-translate-y-0.5 ${
              activeCategory === stat.name
                ? 'border-cyan-300 bg-cyan-400 text-slate-950'
                : 'border-white/10 bg-white/10 text-white hover:bg-white/[0.14]'
            }`}
          >
            <p className={`text-xs font-black uppercase tracking-widest ${
              activeCategory === stat.name ? 'text-slate-800' : 'text-cyan-300'
            }`}>
              {stat.name}
            </p>
            <p className="mt-2 text-4xl font-black">{stat.count}</p>
            <p className={`mt-1 text-sm ${
              activeCategory === stat.name ? 'text-slate-800' : 'text-slate-300'
            }`}>
              participaciones activas
            </p>
            <p className={`mt-3 truncate text-sm font-bold ${
              activeCategory === stat.name ? 'text-slate-900' : 'text-cyan-100'
            }`}>
              Líder: {stat.leaderName} · {stat.leaderPoints} pts
            </p>
          </button>
        ))}
      </section>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Filtro de ranking
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              {activeCategory === 'Todos' ? 'Todas las categorías' : activeCategory}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Mostrando {ranking.length} participaciones.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('Todos')}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                activeCategory === 'Todos'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10'
              }`}
            >
              Todos
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.name)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeCategory === category.name
                    ? 'bg-cyan-400 text-slate-950'
                    : 'border border-white/10 bg-slate-950/40 text-slate-200 hover:bg-white/10'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl">
        <div className="border-b border-white/10 bg-slate-950/40 p-5">
          <h2 className="text-xl font-black text-white">Tabla de posiciones</h2>
          <p className="text-sm text-slate-300">
            Ordenado por puntaje total. Cada fila representa una participación.
          </p>
        </div>

        <div className="divide-y divide-white/10">
          {ranking.length === 0 && (
            <div className="p-5 text-slate-300">
              Todavía no hay participaciones en esta categoría.
            </div>
          )}

          {ranking.map((row, index) => {
            const position = index + 1

            return (
              <div
                key={row.id}
                className={`grid gap-4 p-5 md:grid-cols-[80px_1.3fr_1fr_130px_130px_140px] md:items-center ${
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
                    {row.entryName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                      {row.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      Pronósticos: {row.predictionsCount}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Usuario
                  </p>
                  <p className="truncate text-sm font-black text-white">
                    {row.userAlias}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {row.userName}
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
