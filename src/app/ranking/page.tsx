'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  full_name: string
  alias: string | null
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
  user_id: string
  name: string
  matchPoints: number
  extraPoints: number
  total: number
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingRow[]>([])

  useEffect(() => {
    loadRanking()
  }, [])

  async function loadRanking() {
    const { data: profiles } = await supabase.from('profiles').select('*')
    const { data: predictions } = await supabase.from('predictions').select('user_id, points')
    const { data: finals } = await supabase.from('final_predictions').select('*')

    const rows: Record<string, RankingRow> = {}

    ;((profiles || []) as Profile[]).forEach((p) => {
      rows[p.id] = {
        user_id: p.id,
        name: p.alias || p.full_name,
        matchPoints: 0,
        extraPoints: 0,
        total: 0,
      }
    })

    ;((predictions || []) as Prediction[]).forEach((p) => {
      if (!rows[p.user_id]) return
      rows[p.user_id].matchPoints += p.points || 0
    })

    ;((finals || []) as FinalPrediction[]).forEach((f) => {
      if (!rows[f.user_id]) return
      rows[f.user_id].extraPoints +=
        (f.champion_points || 0) +
        (f.runner_up_points || 0) +
        (f.third_place_points || 0)
    })

    const sorted = Object.values(rows)
      .map((r) => ({ ...r, total: r.matchPoints + r.extraPoints }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    setRanking(sorted)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black">Ranking Top 10</h1>

      <div className="space-y-3">
        {ranking.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-slate-300">
            Todavía no hay usuarios registrados.
          </div>
        )}

        {ranking.map((row, index) => (
          <div key={row.user_id} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950">
              {index + 1}
            </div>
            <div>
              <div className="font-bold">{row.name}</div>
              <div className="text-sm text-slate-300">
                Partidos: {row.matchPoints} · Extras: {row.extraPoints}
              </div>
            </div>
            <div className="text-2xl font-black">{row.total}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
