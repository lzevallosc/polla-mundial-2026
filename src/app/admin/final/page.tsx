'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const teams = [
  'México',
  'Sudáfrica',
  'Corea del Sur',
  'Chequia',
  'Canadá',
  'Bosnia y Herzegovina',
  'Estados Unidos',
  'Paraguay',
  'Haití',
  'Escocia',
  'Australia',
  'Türkiye',
  'Brasil',
  'Marruecos',
  'Qatar',
  'Suiza',
  'Alemania',
  'Curazao',
  'Países Bajos',
  'Japón',
  'Costa de Marfil',
  'Ecuador',
  'Túnez',
  'Nueva Zelanda',
  'Bélgica',
  'Egipto',
  'España',
  'Cabo Verde',
  'Irán',
  'Uzbekistán',
  'Arabia Saudita',
  'Uruguay',
  'Argentina',
  'Francia',
  'Portugal',
  'Inglaterra',
  'Colombia',
  'Croacia',
  'Dinamarca',
  'Senegal',
  'Perú',
]

export default function AdminFinalPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [thirdPlace, setThirdPlace] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

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
      setMessage('No tienes permiso para acceder a esta página.')
      return
    }

    setAuthorized(true)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage('')

    if (!champion || !runnerUp || !thirdPlace) {
      setMessage('Debes seleccionar campeón, subcampeón y tercer lugar.')
      return
    }

    if (champion === runnerUp || champion === thirdPlace || runnerUp === thirdPlace) {
      setMessage('No puedes repetir el mismo equipo en más de una posición.')
      return
    }

    setSaving(true)

    const { data: predictions, error: readError } = await supabase
      .from('final_predictions')
      .select('id, champion, runner_up, third_place')

    if (readError) {
      setMessage(readError.message)
      setSaving(false)
      return
    }

    for (const prediction of predictions || []) {
      const championPoints = prediction.champion === champion ? 55 : 0
      const runnerUpPoints = prediction.runner_up === runnerUp ? 30 : 0
      const thirdPlacePoints = prediction.third_place === thirdPlace ? 25 : 0

      await supabase
        .from('final_predictions')
        .update({
          champion_points: championPoints,
          runner_up_points: runnerUpPoints,
          third_place_points: thirdPlacePoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prediction.id)
    }

    setMessage('Resultado final guardado y puntos extra recalculados.')
    setSaving(false)
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-black text-white">Resultado Final del Mundial</h1>
      <p className="mb-6 text-slate-300">
        Carga el campeón, subcampeón y tercer lugar real para asignar puntos extra.
      </p>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">
              Campeón real
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
              Subcampeón real
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
              Tercer lugar real
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
            {saving ? 'Recalculando...' : 'Guardar resultado final'}
          </button>
        </form>
      </div>
    </main>
  )
}
