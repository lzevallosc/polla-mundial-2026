'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { calculateMatchPoints } from '@/lib/scoring'

type Match = {
  id: number
  match_number: number
  stage: string
  group_name: string | null
  match_datetime: string
  venue: string | null
  home_team: string
  away_team: string
  status: string
  home_score: number | null
  away_score: number | null
}

type Prediction = {
  id: number
  predicted_home_score: number
  predicted_away_score: number
}

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      setMessage('No tienes permiso para acceder al panel admin.')
      return
    }

    setAuthorized(true)
    await loadMatches()
  }

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('match_datetime', { ascending: true })

    setMatches((data || []) as Match[])

    const scoreMap: Record<number, { home: string; away: string }> = {}
    ;((data || []) as Match[]).forEach((m) => {
      scoreMap[m.id] = {
        home: m.home_score === null ? '' : String(m.home_score),
        away: m.away_score === null ? '' : String(m.away_score),
      }
    })
    setScores(scoreMap)
  }

  async function saveResult(match: Match) {
    const home = Number(scores[match.id]?.home)
    const away = Number(scores[match.id]?.away)

    if (Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
      setMessage('Ingresa resultado válido.')
      return
    }

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        home_score: home,
        away_score: away,
        status: 'finished',
      })
      .eq('id', match.id)

    if (matchError) {
      setMessage(matchError.message)
      return
    }

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id, predicted_home_score, predicted_away_score')
      .eq('match_id', match.id)

    if (predError) {
      setMessage(predError.message)
      return
    }

    for (const p of (predictions || []) as Prediction[]) {
      const points = calculateMatchPoints({
        predictedHome: p.predicted_home_score,
        predictedAway: p.predicted_away_score,
        realHome: home,
        realAway: away,
      })

      await supabase.from('predictions').update({ points }).eq('id', p.id)
    }

    setMessage('Resultado guardado y puntos recalculados.')
    await loadMatches()
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          {message || 'Validando permisos...'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-black">Panel Admin</h1>

      {message && <p className="mb-4 rounded-xl bg-white/10 p-3 text-sm">{message}</p>}

      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <div className="mb-3 text-sm text-slate-300">
              #{match.match_number} · {match.stage} · {match.group_name} · Estado: {match.status}
            </div>

            <div className="mb-4 font-bold">
              {match.home_team} vs {match.away_team}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <input
                className="rounded-xl p-3 text-center"
                type="number"
                min="0"
                placeholder="Local"
                value={scores[match.id]?.home || ''}
                onChange={(e) => setScores({ ...scores, [match.id]: { home: e.target.value, away: scores[match.id]?.away || '' } })}
              />
              <span>-</span>
              <input
                className="rounded-xl p-3 text-center"
                type="number"
                min="0"
                placeholder="Visita"
                value={scores[match.id]?.away || ''}
                onChange={(e) => setScores({ ...scores, [match.id]: { home: scores[match.id]?.home || '', away: e.target.value } })}
              />
            </div>

            <button onClick={() => saveResult(match)} className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950">
              Guardar resultado
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
