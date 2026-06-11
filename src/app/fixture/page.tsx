'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getTeamFlag } from '@/lib/teamMeta'

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

type ScoreDraft = {
  home: string
  away: string
}

function TeamPill({ team, align = 'left' }: { team: string; align?: 'left' | 'right' }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white shadow-sm ${
        align === 'right' ? 'justify-end text-right' : 'justify-start'
      }`}
    >
      {align === 'right' && <span className="font-bold">{team}</span>}
      <span className="text-2xl leading-none">{getTeamFlag(team)}</span>
      {align === 'left' && <span className="font-bold">{team}</span>}
    </div>
  )
}

function getStatusLabel(match: Match, isClosed: boolean) {
  if (match.status === 'finished') return 'Finalizado'
  if (isClosed) return 'Cerrado'
  return 'Abierto'
}

export default function FixturePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [scores, setScores] = useState<Record<number, ScoreDraft>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const groupedMatches = useMemo(() => {
    return matches.reduce<Record<string, Match[]>>((groups, match) => {
      const key = match.group_name || match.stage || 'Otros'
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
      return groups
    }, {})
  }, [matches])

  async function loadData() {
    setLoading(true)

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login')
      return
    }

    const uid = sessionData.session.user.id
    setUserId(uid)

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('match_datetime', { ascending: true })

    if (matchesError) {
      setMessage(matchesError.message)
      setLoading(false)
      return
    }

    const { data: predictionsData, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', uid)

    if (predictionsError) {
      setMessage(predictionsError.message)
      setLoading(false)
      return
    }

    setMatches((matchesData || []) as Match[])

    const predMap: Record<number, Prediction> = {}
    const scoreMap: Record<number, ScoreDraft> = {}

    ;(predictionsData || []).forEach((p) => {
      predMap[p.match_id] = p
      scoreMap[p.match_id] = {
        home: String(p.predicted_home_score),
        away: String(p.predicted_away_score),
      }
    })

    setPredictions(predMap)
    setScores(scoreMap)
    setLoading(false)
  }

  function setHomeScore(matchId: number, value: string) {
    setScores((current) => ({
      ...current,
      [matchId]: {
        home: value,
        away: current[matchId]?.away || '',
      },
    }))
  }

  function setAwayScore(matchId: number, value: string) {
    setScores((current) => ({
      ...current,
      [matchId]: {
        home: current[matchId]?.home || '',
        away: value,
      },
    }))
  }

  async function savePrediction(match: Match) {
    if (!userId) return

    setMessage('')
    setSavingMatchId(match.id)

    const homeValue = scores[match.id]?.home
    const awayValue = scores[match.id]?.away

    const home = Number(homeValue)
    const away = Number(awayValue)

    if (
      homeValue === undefined ||
      awayValue === undefined ||
      homeValue === '' ||
      awayValue === '' ||
      Number.isNaN(home) ||
      Number.isNaN(away) ||
      home < 0 ||
      away < 0
    ) {
      setMessage('Ingresa marcadores válidos.')
      setSavingMatchId(null)
      return
    }

    const now = new Date()
    const matchDate = new Date(match.match_datetime)

    if (match.status !== 'open' || now >= matchDate) {
      setMessage('Este partido ya está cerrado.')
      setSavingMatchId(null)
      return
    }

    const { error } = await supabase.from('predictions').upsert(
      {
        user_id: userId,
        match_id: match.id,
        predicted_home_score: home,
        predicted_away_score: away,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,match_id',
      }
    )

    if (error) {
      setMessage(error.message)
      setSavingMatchId(null)
      return
    }

    setMessage(`Pronóstico guardado: ${getTeamFlag(match.home_team)} ${match.home_team} ${home} - ${away} ${getTeamFlag(match.away_team)} ${match.away_team}`)
    setSavingMatchId(null)
    await loadData()
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          Cargando fixture...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/70 to-slate-900/80 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
              Mundial 2026
            </p>
            <h1 className="text-3xl font-black text-white md:text-5xl">Fixture</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
              Ingresa tus pronósticos antes del inicio de cada partido. Las tarjetas están agrupadas por grupo para que sea más fácil jugar desde el celular.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
          >
            Salir
          </button>
        </div>
      </section>

      {message && (
        <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
          {message}
        </div>
      )}

      {Object.entries(groupedMatches).map(([groupName, groupMatches]) => (
        <section key={groupName} className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-center text-sm font-black uppercase tracking-widest text-cyan-100">
              {groupName}
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {groupMatches.map((match) => {
              const matchDate = new Date(match.match_datetime)
              const isClosed = match.status !== 'open' || new Date() >= matchDate
              const pred = predictions[match.id]
              const statusLabel = getStatusLabel(match, isClosed)

              return (
                <article
                  key={match.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-xl"
                >
                  <div className="border-b border-white/10 bg-blue-950/60 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                          Partido #{match.match_number}
                        </p>
                        <p className="mt-1 text-sm text-slate-200">
                          {match.stage} · {matchDate.toLocaleDateString()} · {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          statusLabel === 'Abierto'
                            ? 'bg-emerald-400/20 text-emerald-100'
                            : statusLabel === 'Finalizado'
                              ? 'bg-blue-400/20 text-blue-100'
                              : 'bg-amber-400/20 text-amber-100'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {match.venue && (
                      <p className="mt-2 text-xs text-slate-400">
                        Sede: {match.venue}
                      </p>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <TeamPill team={match.home_team} align="right" />
                      <div className="rounded-full bg-cyan-400 px-3 py-1 text-sm font-black text-slate-950">
                        VS
                      </div>
                      <TeamPill team={match.away_team} align="left" />
                    </div>

                    {match.status === 'finished' && match.home_score !== null && match.away_score !== null && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 text-center">
                        <p className="text-xs uppercase tracking-widest text-slate-400">Resultado real</p>
                        <p className="text-2xl font-black text-white">
                          {match.home_score} - {match.away_score}
                        </p>
                      </div>
                    )}

                    <div className="mt-5">
                      <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                        Tu pronóstico
                      </p>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <input
                          disabled={isClosed}
                          className="w-full rounded-xl p-3 text-center text-lg font-black"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={scores[match.id]?.home || ''}
                          onChange={(e) => setHomeScore(match.id, e.target.value)}
                        />
                        <span className="text-xl font-black text-white">-</span>
                        <input
                          disabled={isClosed}
                          className="w-full rounded-xl p-3 text-center text-lg font-black"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={scores[match.id]?.away || ''}
                          onChange={(e) => setAwayScore(match.id, e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-300">
                        {pred
                          ? `Guardado: ${getTeamFlag(match.home_team)} ${pred.predicted_home_score} - ${pred.predicted_away_score} ${getTeamFlag(match.away_team)} · Puntos: ${pred.points}`
                          : 'Sin pronóstico'}
                      </p>

                      <button
                        disabled={isClosed || savingMatchId === match.id}
                        onClick={() => savePrediction(match)}
                        className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                      >
                        {savingMatchId === match.id ? 'Guardando...' : isClosed ? 'Cerrado' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </main>
  )
}
