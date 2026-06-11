'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  points: number
}

export default function FixturePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login')
      return
    }

    const uid = sessionData.session.user.id
    setUserId(uid)

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .order('match_datetime', { ascending: true })

    const { data: predictionsData } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', uid)

    setMatches((matchesData || []) as Match[])

    const predMap: Record<number, Prediction> = {}
    const scoreMap: Record<number, { home: string; away: string }> = {}

    ;(predictionsData || []).forEach((p) => {
      predMap[p.match_id] = p
      scoreMap[p.match_id] = {
        home: String(p.predicted_home_score),
        away: String(p.predicted_away_score),
      }
    })

    setPredictions(predMap)
    setScores(scoreMap)
  }

  async function savePrediction(match: Match) {
    if (!userId) return

    const home = Number(scores[match.id]?.home)
    const away = Number(scores[match.id]?.away)

    if (Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
      setMessage('Ingresa marcadores válidos.')
      return
    }

    const now = new Date()
    const matchDate = new Date(match.match_datetime)

    if (match.status !== 'open' || now >= matchDate) {
      setMessage('Este partido ya está cerrado.')
      return
    }

    const { error } = await supabase.from('predictions').upsert({
      user_id: userId,
      match_id: match.id,
      predicted_home_score: home,
      predicted_away_score: away,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,match_id',
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage('Pronóstico guardado.')
    await loadData()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Fixture</h1>
          <p className="text-slate-300">Ingresa tus pronósticos antes del inicio de cada partido.</p>
        </div>
        <button onClick={logout} className="rounded-xl border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
          Salir
        </button>
      </div>

      {message && <p className="mb-4 rounded-xl bg-white/10 p-3 text-sm">{message}</p>}

      <div className="space-y-4">
        {matches.map((match) => {
          const isClosed = match.status !== 'open' || new Date() >= new Date(match.match_datetime)
          const pred = predictions[match.id]

          return (
            <div key={match.id} className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <div className="mb-4 flex flex-col gap-1 text-sm text-slate-300">
                <span>Partido #{match.match_number} · {match.stage} {match.group_name ? `· ${match.group_name}` : ''}</span>
                <span>{new Date(match.match_datetime).toLocaleString()} · {match.venue}</span>
                <span>Estado: {isClosed ? 'Cerrado' : 'Abierto'}</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right font-bold">{match.home_team}</div>
                <div className="text-slate-300">vs</div>
                <div className="font-bold">{match.away_team}</div>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <input
                  disabled={isClosed}
                  className="w-full rounded-xl p-3 text-center"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={scores[match.id]?.home || ''}
                  onChange={(e) => setScores({ ...scores, [match.id]: { home: e.target.value, away: scores[match.id]?.away || '' } })}
                />
                <span className="font-bold">-</span>
                <input
                  disabled={isClosed}
                  className="w-full rounded-xl p-3 text-center"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={scores[match.id]?.away || ''}
                  onChange={(e) => setScores({ ...scores, [match.id]: { home: scores[match.id]?.home || '', away: e.target.value } })}
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  {pred ? `Guardado: ${pred.predicted_home_score} - ${pred.predicted_away_score} · Puntos: ${pred.points}` : 'Sin pronóstico'}
                </p>
                <button
                  disabled={isClosed}
                  onClick={() => savePrediction(match)}
                  className="rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  Guardar
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
