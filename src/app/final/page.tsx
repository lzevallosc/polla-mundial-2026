'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type FinalPrediction = {
  champion: string | null
  runner_up: string | null
  third_place: string | null
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

const teams = [
  'Argentina',
  'Brasil',
  'Francia',
  'España',
  'Inglaterra',
  'Alemania',
  'Portugal',
  'Italia',
  'Países Bajos',
  'Bélgica',
  'Uruguay',
  'Colombia',
  'México',
  'Estados Unidos',
  'Canadá',
  'Japón',
  'Corea del Sur',
  'Marruecos',
  'Croacia',
  'Suiza',
  'Dinamarca',
  'Senegal',
  'Australia',
  'Sudáfrica',
  'Chequia',
  'Perú',
]

export default function FinalPredictionPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [thirdPlace, setThirdPlace] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPrediction, setCurrentPrediction] = useState<FinalPrediction | null>(null)

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
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
          Cargando...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-black text-white">Predicción Final</h1>
      <p className="mb-6 text-slate-300">
        Elige tu campeón, subcampeón y tercer lugar del Mundial 2026.
      </p>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Campeón +55 puntos
            </label>
            <select
              className="w-full rounded-xl p-3"
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              required
            >
              <option value="">Selecciona campeón</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Subcampeón +30 puntos
            </label>
            <select
              className="w-full rounded-xl p-3"
              value={runnerUp}
              onChange={(e) => setRunnerUp(e.target.value)}
              required
            >
              <option value="">Selecciona subcampeón</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Tercer lugar +25 puntos
            </label>
            <select
              className="w-full rounded-xl p-3"
              value={thirdPlace}
              onChange={(e) => setThirdPlace(e.target.value)}
              required
            >
              <option value="">Selecciona tercer lugar</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>

          {message && (
            <div className="rounded-xl bg-white/10 p-3 text-sm text-slate-100">
              {message}
            </div>
          )}

          <button
            disabled={saving}
            className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar predicción final'}
          </button>
        </form>
      </div>

      {currentPrediction && (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6">
          <h2 className="mb-4 text-xl font-bold">Tu predicción actual</h2>
          <div className="space-y-2 text-slate-200">
            <p>Campeón: <b>{currentPrediction.champion}</b></p>
            <p>Subcampeón: <b>{currentPrediction.runner_up}</b></p>
            <p>Tercer lugar: <b>{currentPrediction.third_place}</b></p>
            <p className="pt-2 text-sm text-slate-300">
              Puntos actuales: campeón {currentPrediction.champion_points}, subcampeón {currentPrediction.runner_up_points}, tercer lugar {currentPrediction.third_place_points}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
