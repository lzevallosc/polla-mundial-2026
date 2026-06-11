'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getTeamCode, getTeamFlagUrl, hasImageFlag } from '@/lib/teamMeta'

type Match = {
  id: number
  match_number: number
  stage: string
  group_name: string | null
  match_datetime: string
  home_team: string
  away_team: string
  status: string
  home_score: number | null
  away_score: number | null
}

type Prediction = {
  id: number
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  points: number
}

type FinalPrediction = {
  champion: string | null
  runner_up: string | null
  third_place: string | null
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

function TeamMini({ team }: { team: string }) {
  const flagUrl = getTeamFlagUrl(team)

  if (hasImageFlag(team) && flagUrl) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="flex h-7 w-7 overflow-hidden rounded-full bg-white ring-1 ring-white/20">
          <img src={flagUrl} alt={team} className="h-full w-full object-cover" />
        </span>
        <span>{team}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded-full bg-cyan-400 px-2 py-1 text-[10px] font-black text-slate-950">
        {getTeamCode(team)}
      </span>
      <span>{team}</span>
    </span>
  )
}

export default function MyPointsPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [finalPrediction, setFinalPrediction] = useState<FinalPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const matchById = useMemo(() => {
    return matches.reduce<Record<number, Match>>((acc, match) => {
      acc[match.id] = match
      return acc
    }, {})
  }, [matches])

  const matchPoints = predictions.reduce((sum, item) => sum + (item.points || 0), 0)
  const extraPoints = finalPrediction
    ? finalPrediction.champion_points +
      finalPrediction.runner_up_points +
      finalPrediction.third_place_points
    : 0
  const total = matchPoints + extraPoints

  async function loadData() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login')
      return
    }

    const userId = sessionData.session.user.id

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
      .eq('user_id', userId)
      .order('match_id', { ascending: true })

    if (predictionsError) {
      setMessage(predictionsError.message)
      setLoading(false)
      return
    }

    const { data: finalData } = await supabase
      .from('final_predictions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    setMatches((matchesData || []) as Match[])
    setPredictions((predictionsData || []) as Prediction[])
    setFinalPrediction((finalData || null) as FinalPrediction | null)
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          Cargando tus puntos...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/80 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
          Mi avance
        </p>
        <h1 className="text-4xl font-black text-white">Mis puntos</h1>
        <p className="mt-2 text-slate-300">
          Revisa tu score total y el detalle de puntos por cada partido.
        </p>
      </section>

      {message && (
        <div className="mb-6 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
          {message}
        </div>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400 p-5 text-slate-950 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest">Score total</p>
          <p className="mt-2 text-5xl font-black">{total}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Partidos</p>
          <p className="mt-2 text-4xl font-black text-white">{matchPoints}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Extras</p>
          <p className="mt-2 text-4xl font-black text-white">{extraPoints}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pronósticos</p>
          <p className="mt-2 text-4xl font-black text-white">{predictions.length}</p>
        </div>
      </section>

      {finalPrediction && (
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5">
          <h2 className="mb-4 text-xl font-black text-white">Puntos extra</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Campeón</p>
              <p className="mt-2 font-black text-white">{finalPrediction.champion || 'Sin elegir'}</p>
              <p className="text-cyan-200">{finalPrediction.champion_points} puntos</p>
            </div>
            <div className="rounded-2xl bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Subcampeón</p>
              <p className="mt-2 font-black text-white">{finalPrediction.runner_up || 'Sin elegir'}</p>
              <p className="text-cyan-200">{finalPrediction.runner_up_points} puntos</p>
            </div>
            <div className="rounded-2xl bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Tercer lugar</p>
              <p className="mt-2 font-black text-white">{finalPrediction.third_place || 'Sin elegir'}</p>
              <p className="text-cyan-200">{finalPrediction.third_place_points} puntos</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/10 p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Detalle por partido</h2>
            <p className="text-sm text-slate-300">
              Se muestran tus pronósticos guardados. Los puntos cambian cuando el admin carga el resultado real.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {predictions.length === 0 && (
            <div className="rounded-2xl bg-slate-950/40 p-4 text-slate-300">
              Todavía no tienes pronósticos guardados.
            </div>
          )}

          {predictions.map((prediction) => {
            const match = matchById[prediction.match_id]

            if (!match) return null

            return (
              <div
                key={prediction.id}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
                      Partido #{match.match_number} · {match.group_name || match.stage}
                    </p>

                    <p className="mt-2 font-black text-white">
                      <TeamMini team={match.home_team} /> vs <TeamMini team={match.away_team} />
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      Tu pronóstico: <b>{prediction.predicted_home_score} - {prediction.predicted_away_score}</b>
                      {match.status === 'finished' && match.home_score !== null && match.away_score !== null && (
                        <>
                          {' '}· Resultado real: <b>{match.home_score} - {match.away_score}</b>
                        </>
                      )}
                    </p>
                  </div>

                  <div className={`rounded-2xl px-5 py-3 text-center ${
                    prediction.points > 0
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/10 text-white'
                  }`}>
                    <p className="text-xs font-black uppercase tracking-widest">Puntos</p>
                    <p className="text-3xl font-black">{prediction.points}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
