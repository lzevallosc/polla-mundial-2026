'use client'

import { useEffect, useMemo, useState } from 'react'
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

const filterOrder = [
  'Todos',
  'Grupo A',
  'Grupo B',
  'Grupo C',
  'Grupo D',
  'Grupo E',
  'Grupo F',
  'Grupo G',
  'Grupo H',
  'Grupo I',
  'Grupo J',
  'Grupo K',
  'Grupo L',
  'Ronda de 32',
  'Octavos de final',
  'Cuartos de final',
  'Semifinal',
  'Tercer lugar',
  'Final',
]

function sortFixtureFilters(values: string[]) {
  return values.sort((a, b) => {
    const indexA = filterOrder.indexOf(a)
    const indexB = filterOrder.indexOf(b)

    if (indexA !== -1 && indexB !== -1) return indexA - indexB
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    return a.localeCompare(b)
  })
}

function getMatchDayKey(dateValue: string) {
  return dateValue.slice(0, 10)
}

function getMatchMonthKey(dateValue: string) {
  return dateValue.slice(0, 7)
}

function getMatchDayLabel(dateValue: string) {
  const [year, month, day] = dateValue.slice(0, 10).split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getMatchMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)

  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getStatusLabel(status: string) {
  if (status === 'finished') return 'Finalizado'
  if (status === 'open') return 'Abierto'
  return status
}

function getStatusClass(status: string) {
  if (status === 'finished') return 'border-blue-300/20 bg-blue-400/20 text-blue-100'
  if (status === 'open') return 'border-emerald-300/20 bg-emerald-400/20 text-emerald-100'
  return 'border-amber-300/20 bg-amber-400/20 text-amber-100'
}

export default function AdminPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [matches, setMatches] = useState<Match[]>([])
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [message, setMessage] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [activeMonthFilter, setActiveMonthFilter] = useState('Todos')
  const [activeDayFilter, setActiveDayFilter] = useState('Todos')
  const [searchText, setSearchText] = useState('')
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  const filterOptions = useMemo(() => {
    const groups = Array.from(
      new Set(matches.map((match) => match.group_name).filter(Boolean))
    ) as string[]

    const stages = Array.from(
      new Set(
        matches
          .filter((match) => match.stage !== 'Fase de grupos')
          .map((match) => match.stage)
      )
    )

    return sortFixtureFilters(['Todos', ...groups, ...stages])
  }, [matches])

  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set(matches.map((match) => getMatchMonthKey(match.match_datetime)))
    ).sort()

    return ['Todos', ...months]
  }, [matches])

  const dayOptions = useMemo(() => {
    const baseMatches =
      activeMonthFilter === 'Todos'
        ? matches
        : matches.filter((match) => getMatchMonthKey(match.match_datetime) === activeMonthFilter)

    const days = Array.from(
      new Set(baseMatches.map((match) => getMatchDayKey(match.match_datetime)))
    ).sort()

    return ['Todos', ...days]
  }, [matches, activeMonthFilter])

  const filteredMatches = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return matches.filter((match) => {
      const matchMonth = getMatchMonthKey(match.match_datetime)
      const matchDay = getMatchDayKey(match.match_datetime)

      const matchesMonth =
        activeMonthFilter === 'Todos' ||
        matchMonth === activeMonthFilter

      const matchesDay =
        activeDayFilter === 'Todos' ||
        matchDay === activeDayFilter

      const matchesGroupOrStage =
        activeFilter === 'Todos' ||
        match.group_name === activeFilter ||
        match.stage === activeFilter

      const searchBase = [
        match.match_number,
        match.home_team,
        match.away_team,
        match.stage,
        match.group_name || '',
        match.venue || '',
        getMatchDayLabel(match.match_datetime),
        getMatchMonthLabel(matchMonth),
        match.status,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        normalizedSearch === '' ||
        searchBase.includes(normalizedSearch)

      return matchesMonth && matchesDay && matchesGroupOrStage && matchesSearch
    })
  }, [matches, activeMonthFilter, activeDayFilter, activeFilter, searchText])

  const finishedCount = useMemo(
    () => matches.filter((match) => match.status === 'finished').length,
    [matches]
  )

  const openCount = useMemo(
    () => matches.filter((match) => match.status !== 'finished').length,
    [matches]
  )

  async function checkAdmin() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login?next=/admin')
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
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_datetime', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    setMatches((data || []) as Match[])

    const scoreMap: Record<number, { home: string; away: string }> = {}

    ;((data || []) as Match[]).forEach((match) => {
      scoreMap[match.id] = {
        home: match.home_score === null ? '' : String(match.home_score),
        away: match.away_score === null ? '' : String(match.away_score),
      }
    })

    setScores(scoreMap)
  }

  function clearFilters() {
    setSearchText('')
    setActiveMonthFilter('Todos')
    setActiveDayFilter('Todos')
    setActiveFilter('Todos')
  }

  function updateHomeScore(matchId: number, value: string) {
    setScores((current) => ({
      ...current,
      [matchId]: {
        home: value,
        away: current[matchId]?.away || '',
      },
    }))
  }

  function updateAwayScore(matchId: number, value: string) {
    setScores((current) => ({
      ...current,
      [matchId]: {
        home: current[matchId]?.home || '',
        away: value,
      },
    }))
  }

  async function saveResult(match: Match) {
    const rawHome = scores[match.id]?.home || ''
    const rawAway = scores[match.id]?.away || ''

    const home = Number(rawHome)
    const away = Number(rawAway)

    if (
      rawHome === '' ||
      rawAway === '' ||
      Number.isNaN(home) ||
      Number.isNaN(away) ||
      !Number.isInteger(home) ||
      !Number.isInteger(away) ||
      home < 0 ||
      away < 0
    ) {
      setMessage('Ingresa resultado válido. Los goles deben ser números enteros mayores o iguales a 0.')
      return
    }

    setSavingMatchId(match.id)
    setMessage('')

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
      setSavingMatchId(null)
      return
    }

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id, predicted_home_score, predicted_away_score')
      .eq('match_id', match.id)

    if (predError) {
      setMessage(predError.message)
      setSavingMatchId(null)
      return
    }

    let recalculated = 0
    let failedUpdates = 0

    for (const prediction of (predictions || []) as Prediction[]) {
      const points = calculateMatchPoints({
        predictedHome: prediction.predicted_home_score,
        predictedAway: prediction.predicted_away_score,
        realHome: home,
        realAway: away,
      })

      const { error: updateError } = await supabase
        .from('predictions')
        .update({ points })
        .eq('id', prediction.id)

      if (updateError) {
        failedUpdates += 1
      } else {
        recalculated += 1
      }
    }

    if (failedUpdates > 0) {
      setMessage(`Resultado guardado. Recalculados: ${recalculated}. Fallidos: ${failedUpdates}.`)
    } else {
      setMessage(`Resultado guardado. Pronósticos recalculados: ${recalculated}.`)
    }

    setSavingMatchId(null)
    await loadMatches()
  }

  if (!authorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
          {message || 'Validando permisos...'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
              Administración
            </p>

            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Panel Admin
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 md:text-base">
              Carga resultados reales, recalcula puntos automáticamente y administra los partidos por fecha, fase o equipo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/final"
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-300"
            >
              Resultado final
            </a>

            <a
              href="/fixture"
              className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
            >
              Ver fixture
            </a>
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400 p-5 text-slate-950">
            <p className="text-xs font-black uppercase tracking-widest">Total partidos</p>
            <p className="mt-2 text-5xl font-black">{matches.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Finalizados</p>
            <p className="mt-2 text-4xl font-black text-white">{finishedCount}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pendientes</p>
            <p className="mt-2 text-4xl font-black text-white">{openCount}</p>
          </div>
        </div>
      </section>

      {message && (
        <section className="mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
          {message}
        </section>
      )}

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Buscar y filtrar
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">
              Partidos del fixture
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Encuentra partidos por equipo, estadio, grupo, fase, fecha o número de partido.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="w-fit rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Buscar
            </label>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Ej.: México, octavos, final, Guadalajara..."
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Mes
            </label>
            <select
              value={activeMonthFilter}
              onChange={(event) => {
                setActiveMonthFilter(event.target.value)
                setActiveDayFilter('Todos')
              }}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month === 'Todos' ? 'Todos los meses' : getMatchMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Día
            </label>
            <select
              value={activeDayFilter}
              onChange={(event) => setActiveDayFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day === 'Todos' ? 'Todos los días' : getMatchDayLabel(day)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Grupo / Fase
            </label>
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            >
              {filterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Mostrando
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {filteredMatches.length}
              <span className="text-base text-slate-300"> / {matches.length}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Fecha
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {activeDayFilter !== 'Todos'
                ? getMatchDayLabel(activeDayFilter)
                : activeMonthFilter !== 'Todos'
                  ? getMatchMonthLabel(activeMonthFilter)
                  : 'Todas las fechas'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Grupo / Fase
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {activeFilter}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {filteredMatches.length === 0 && (
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50">
            No hay partidos con los filtros seleccionados.
          </div>
        )}

        {filteredMatches.map((match) => {
          const matchDate = new Date(match.match_datetime)
          const currentHomeScore = scores[match.id]?.home || ''
          const currentAwayScore = scores[match.id]?.away || ''

          return (
            <article
              key={match.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-xl"
            >
              <div className="border-b border-white/10 bg-slate-950/40 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                        Partido #{match.match_number}
                      </span>

                      <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(match.status)}`}>
                        {getStatusLabel(match.status)}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
                        {match.group_name || match.stage}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-white">
                      {match.home_team} vs {match.away_team}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      {getMatchDayLabel(match.match_datetime)} ·{' '}
                      {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·{' '}
                      {match.stage}
                      {match.venue ? ` · ${match.venue}` : ''}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                    Resultado actual:{' '}
                    <span className="font-black text-white">
                      {match.home_score === null || match.away_score === null
                        ? 'Sin cargar'
                        : `${match.home_score} - ${match.away_score}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    Cargar resultado real
                  </p>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-300">
                        {match.home_team}
                      </label>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 text-center text-2xl font-black text-slate-950 outline-none"
                        type="number"
                        min="0"
                        placeholder="Local"
                        value={currentHomeScore}
                        onChange={(event) => updateHomeScore(match.id, event.target.value)}
                      />
                    </div>

                    <span className="mt-7 text-2xl font-black text-white">-</span>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-300">
                        {match.away_team}
                      </label>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 text-center text-2xl font-black text-slate-950 outline-none"
                        type="number"
                        min="0"
                        placeholder="Visita"
                        value={currentAwayScore}
                        onChange={(event) => updateAwayScore(match.id, event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => saveResult(match)}
                  disabled={savingMatchId === match.id}
                  className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-slate-950 shadow-lg transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {savingMatchId === match.id ? 'Guardando...' : 'Guardar resultado'}
                </button>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
