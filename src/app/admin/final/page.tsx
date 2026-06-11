'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import TeamSelector from '@/components/TeamSelector'
import { getTeamFlag } from '@/lib/teamMeta'

type FinalPrediction = {
  id: number
  user_id: string
  entry_id: string | null
  champion: string | null
  runner_up: string | null
  third_place: string | null
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

type Entry = {
  id: string
  user_id: string
  name: string
  category: string
  is_active: boolean
}

export default function AdminFinalPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [teams, setTeams] = useState<string[]>([])
  const [predictions, setPredictions] = useState<FinalPrediction[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [champion, setChampion] = useState('')
  const [runnerUp, setRunnerUp] = useState('')
  const [thirdPlace, setThirdPlace] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const entryById = useMemo(() => {
    return entries.reduce<Record<string, Entry>>((acc, entry) => {
      acc[entry.id] = entry
      return acc
    }, {})
  }, [entries])

  const stats = useMemo(() => {
    const total = predictions.length
    const withEntry = predictions.filter((item) => item.entry_id).length
    const withoutEntry = total - withEntry

    const championHits = predictions.filter((item) => item.champion === champion && champion).length
    const runnerUpHits = predictions.filter((item) => item.runner_up === runnerUp && runnerUp).length
    const thirdPlaceHits = predictions.filter((item) => item.third_place === thirdPlace && thirdPlace).length

    return {
      total,
      withEntry,
      withoutEntry,
      championHits,
      runnerUpHits,
      thirdPlaceHits,
    }
  }, [predictions, champion, runnerUp, thirdPlace])

  async function checkAdmin() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login?next=/admin/final')
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
    await loadData()
  }

  async function loadData() {
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

    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('id, user_id, name, category, is_active')
      .eq('is_active', true)

    if (entriesError) {
      setMessage(entriesError.message)
      return
    }

    const { data: finalData, error: finalError } = await supabase
      .from('final_predictions')
      .select('id, user_id, entry_id, champion, runner_up, third_place, champion_points, runner_up_points, third_place_points')
      .order('updated_at', { ascending: false })

    if (finalError) {
      setMessage(finalError.message)
      return
    }

    setEntries((entriesData || []) as Entry[])
    setPredictions((finalData || []) as FinalPrediction[])
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

    const { data: finalPredictions, error: readError } = await supabase
      .from('final_predictions')
      .select('id, entry_id, champion, runner_up, third_place')

    if (readError) {
      setMessage(readError.message)
      setSaving(false)
      return
    }

    let recalculated = 0
    let failed = 0
    let skippedWithoutEntry = 0

    for (const prediction of (finalPredictions || []) as FinalPrediction[]) {
      if (!prediction.entry_id) {
        skippedWithoutEntry += 1
        continue
      }

      const championPoints = prediction.champion === champion ? 55 : 0
      const runnerUpPoints = prediction.runner_up === runnerUp ? 30 : 0
      const thirdPlacePoints = prediction.third_place === thirdPlace ? 25 : 0

      const { error } = await supabase
        .from('final_predictions')
        .update({
          champion_points: championPoints,
          runner_up_points: runnerUpPoints,
          third_place_points: thirdPlacePoints,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prediction.id)

      if (error) {
        failed += 1
      } else {
        recalculated += 1
      }
    }

    setSaving(false)
    await loadData()

    if (failed > 0) {
      setMessage(`Resultado final guardado. Recalculados: ${recalculated}. Fallidos: ${failed}. Sin participación: ${skippedWithoutEntry}.`)
    } else {
      setMessage(`Resultado final guardado. Puntos extra recalculados por participación: ${recalculated}.`)
    }
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
      <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/70 to-slate-900/80 p-6 shadow-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
          Panel Admin
        </p>

        <h1 className="text-3xl font-black text-white md:text-5xl">
          Resultado Final del Mundial
        </h1>

        <p className="mt-2 text-slate-200">
          Carga campeón, subcampeón y tercer lugar real. Los puntos extra se recalculan por participación.
        </p>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400 p-5 text-slate-950 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest">Predicciones finales</p>
          <p className="mt-2 text-5xl font-black">{stats.total}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Con participación</p>
          <p className="mt-2 text-4xl font-black text-white">{stats.withEntry}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Campeón elegido</p>
          <p className="mt-2 text-4xl font-black text-white">{stats.championHits}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin entry_id</p>
          <p className="mt-2 text-4xl font-black text-white">{stats.withoutEntry}</p>
        </div>
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
                  <p className="text-xs text-cyan-200">{stats.championHits} aciertos actuales</p>
                </div>

                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-sm text-slate-400">Subcampeón</p>
                  <p className="font-black">{getTeamFlag(runnerUp)} {runnerUp}</p>
                  <p className="text-xs text-cyan-200">{stats.runnerUpHits} aciertos actuales</p>
                </div>

                <div className="rounded-xl bg-slate-950/40 p-3">
                  <p className="text-sm text-slate-400">Tercer lugar</p>
                  <p className="font-black">{getTeamFlag(thirdPlace)} {thirdPlace}</p>
                  <p className="text-xs text-cyan-200">{stats.thirdPlaceHits} aciertos actuales</p>
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

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <h2 className="mb-4 text-xl font-black text-white">Predicciones por participación</h2>

        <div className="space-y-3">
          {predictions.length === 0 && (
            <div className="rounded-2xl bg-slate-950/40 p-4 text-slate-300">
              Todavía no hay predicciones finales registradas.
            </div>
          )}

          {predictions.slice(0, 20).map((prediction) => {
            const entry = prediction.entry_id ? entryById[prediction.entry_id] : null

            return (
              <div
                key={prediction.id}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-white">
                      {entry ? entry.name : 'Sin participación'}
                      {entry && (
                        <span className="ml-2 rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                          {entry.category}
                        </span>
                      )}
                    </p>

                    <p className="mt-2 text-sm text-slate-300">
                      Campeón: <b>{prediction.champion || '-'}</b> · Subcampeón:{' '}
                      <b>{prediction.runner_up || '-'}</b> · Tercer lugar:{' '}
                      <b>{prediction.third_place || '-'}</b>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Extras
                    </p>
                    <p className="text-2xl font-black text-white">
                      {(prediction.champion_points || 0) +
                        (prediction.runner_up_points || 0) +
                        (prediction.third_place_points || 0)}
                    </p>
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
