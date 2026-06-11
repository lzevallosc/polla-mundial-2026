'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import TeamSelector from '@/components/TeamSelector'
import { getTeamFlag } from '@/lib/teamMeta'

export default function AdminFinalPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [teams, setTeams] = useState<string[]>([])
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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/70 to-slate-900/80 p-6 shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
          Panel Admin
        </p>
        <h1 className="text-3xl font-black text-white md:text-5xl">
          Resultado Final del Mundial
        </h1>
        <p className="mt-2 text-slate-200">
          Carga el resultado final real para asignar automáticamente los puntos extra.
        </p>
      </section>

      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TeamSelector
            label="Campeón real"
            pointsLabel="+55 puntos"
            value={champion}
            teams={teams}
            onChange={setChampion}
            placeholder="Selecciona campeón"
          />

          <TeamSelector
            label="Subcampeón real"
            pointsLabel="+30 puntos"
            value={runnerUp}
            teams={teams}
            onChange={setRunnerUp}
            placeholder="Selecciona subcampeón"
          />

          <TeamSelector
            label="Tercer lugar real"
            pointsLabel="+25 puntos"
            value={thirdPlace}
            teams={teams}
            onChange={setThirdPlace}
            placeholder="Selecciona tercer lugar"
          />

          {champion && runnerUp && thirdPlace && (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Resultado a aplicar
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-sm text-slate-400">Campeón</p>
                  <p className="font-black">{getTeamFlag(champion)} {champion}</p>
                </div>
                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-sm text-slate-400">Subcampeón</p>
                  <p className="font-black">{getTeamFlag(runnerUp)} {runnerUp}</p>
                </div>
                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-sm text-slate-400">Tercer lugar</p>
                  <p className="font-black">{getTeamFlag(thirdPlace)} {thirdPlace}</p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
              {message}
            </div>
          )}

          <button
            disabled={saving}
            className="w-full rounded-2xl bg-cyan-400 p-4 font-black text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {saving ? 'Recalculando...' : 'Guardar resultado final'}
          </button>
        </form>
      </div>
    </main>
  )
}
