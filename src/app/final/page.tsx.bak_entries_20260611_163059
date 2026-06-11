'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import TeamSelector from '@/components/TeamSelector'
import { getTeamFlag } from '@/lib/teamMeta'

const FINAL_PREDICTION_DEADLINE = new Date('2026-06-11T19:00:00Z')

type FinalPrediction = {
  champion: string | null
  runner_up: string | null
  third_place: string | null
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

export default function FinalPredictionPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [teams, setTeams] = useState<string[]>([])
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [thirdPlace, setThirdPlace] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPrediction, setCurrentPrediction] = useState<FinalPrediction | null>(null)
  const isFinalPredictionClosed = new Date() >= FINAL_PREDICTION_DEADLINE

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
      .select('home_team, away_team')

    const uniqueTeams = Array.from(
      new Set(
        (matchesData || [])
          .flatMap((match) => [match.home_team, match.away_team])
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b))

    setTeams(uniqueTeams)

    const { data } = await supabase
      .from('final_predictions')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle()

    if (data) {
      setCurrentPrediction(data as FinalPrediction)
      setChampion(data.champion || '')
      setRunnerUp(data.runner_up || '')
      setThirdPlace(data.third_place || '')
    }

    setLoading(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!userId) return

    if (isFinalPredictionClosed) {
      setMessage('La predicción final ya está cerrada porque el torneo ya empezó.')
      return
    }

    if (!champion || !runnerUp || !thirdPlace) {
      setMessage('Debes seleccionar campeón, subcampeón y tercer lugar.')
      return
    }

    if (champion === runnerUp || champion === thirdPlace || runnerUp === thirdPlace) {
      setMessage('No puedes repetir el mismo equipo en más de una posición.')
      return
    }

    setSaving(true)

    const { error } = await supabase.from('final_predictions').upsert(
      {
        user_id: userId,
        champion,
        runner_up: runnerUp,
        third_place: thirdPlace,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Predicción final guardada correctamente.')
    setSaving(false)
    await loadData()
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          Cargando predicción final...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/70 to-slate-900/80 p-6 shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
          Mundial 2026
        </p>
        <h1 className="text-3xl font-black text-white md:text-5xl">
          Predicción Final
        </h1>
        <p className="mt-2 text-slate-200">
          Elige tu campeón, subcampeón y tercer lugar. Estos puntos pueden cambiar todo el ranking.
        </p>
      </section>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <div className={`mb-6 rounded-2xl border p-4 text-sm font-semibold ${
          isFinalPredictionClosed
            ? 'border-red-300/20 bg-red-400/10 text-red-100'
            : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
        }`}>
          {isFinalPredictionClosed
            ? 'Predicción final cerrada. Ya no se puede modificar.'
            : 'Predicción final abierta. Puedes modificarla hasta antes del inicio del Mundial.'}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TeamSelector
            label="Campeón"
            pointsLabel="+55 puntos"
            value={champion}
            teams={teams}
            onChange={setChampion}
            placeholder="Selecciona campeón"
          />

          <TeamSelector
            label="Subcampeón"
            pointsLabel="+30 puntos"
            value={runnerUp}
            teams={teams}
            onChange={setRunnerUp}
            placeholder="Selecciona subcampeón"
          />

          <TeamSelector
            label="Tercer lugar"
            pointsLabel="+25 puntos"
            value={thirdPlace}
            teams={teams}
            onChange={setThirdPlace}
            placeholder="Selecciona tercer lugar"
          />

          {message && (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
              {message}
            </div>
          )}

          <button
            disabled={saving || isFinalPredictionClosed}
            className="w-full rounded-2xl bg-cyan-400 p-4 font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar predicción final'}
          </button>
        </form>
      </div>

      {currentPrediction && (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6">
          <h2 className="mb-4 text-xl font-black">Tu predicción actual</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Campeón</p>
              <p className="mt-2 text-lg font-black">
                {getTeamFlag(currentPrediction.champion || '')} {currentPrediction.champion}
              </p>
              <p className="mt-1 text-sm text-cyan-200">{currentPrediction.champion_points} puntos</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Subcampeón</p>
              <p className="mt-2 text-lg font-black">
                {getTeamFlag(currentPrediction.runner_up || '')} {currentPrediction.runner_up}
              </p>
              <p className="mt-1 text-sm text-cyan-200">{currentPrediction.runner_up_points} puntos</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Tercer lugar</p>
              <p className="mt-2 text-lg font-black">
                {getTeamFlag(currentPrediction.third_place || '')} {currentPrediction.third_place}
              </p>
              <p className="mt-1 text-sm text-cyan-200">{currentPrediction.third_place_points} puntos</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
