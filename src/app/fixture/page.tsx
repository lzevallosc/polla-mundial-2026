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
  venue: string | null
  home_team: string
  away_team: string
  status: string
  home_score: number | null
  away_score: number | null
}

type Prediction = {
  id: number
  entry_id: string | null
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  points: number
}


type Entry = {
  id: string
  user_id: string
  name: string
  category: string
  is_active: boolean
}

type ScoreDraft = {
  home: string
  away: string
}


const LIMA_TIME_ZONE = 'America/Lima'

function getLimaParts(dateValue: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(dateValue))

  const year = parts.find((part) => part.type === 'year')?.value || ''
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''

  return { year, month, day }
}

function getLimaDateKey(dateValue: string) {
  const { year, month, day } = getLimaParts(dateValue)
  return `${year}-${month}-${day}`
}

function getLimaMonthKey(dateValue: string) {
  const { year, month } = getLimaParts(dateValue)
  return `${year}-${month}`
}

function formatLimaDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    weekday: 'short',
    day: '2-digit',
    month: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)))
}

function formatLimaMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)

  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1, 12, 0, 0)))
}


function TeamFlag({ team, size = 'md' }: { team: string; size?: 'sm' | 'md' | 'lg' }) {
  const flagUrl = getTeamFlagUrl(team)
  const code = getTeamCode(team)

  const sizeClass = {
    sm: 'h-8 w-8 text-[10px]',
    md: 'h-12 w-12 text-xs',
    lg: 'h-16 w-16 text-sm',
  }[size]

  if (hasImageFlag(team) && flagUrl) {
    return (
      <div className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow ring-2 ring-white/20`}>
        <img
          src={flagUrl}
          alt={team}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-cyan-400 font-black text-slate-950 shadow ring-2 ring-white/20`}>
      {code}
    </div>
  )
}

function TeamCard({ team, align = 'left' }: { team: string; align?: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {align === 'left' && <TeamFlag team={team} />}
      <div className="min-w-0">
        <p className="truncate text-base font-black text-white">{team}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-200">{getTeamCode(team)}</p>
      </div>
      {align === 'right' && <TeamFlag team={team} />}
    </div>
  )
}

function getStatusLabel(match: Match, isClosed: boolean) {
  if (match.status === 'finished') return 'Finalizado'
  if (isClosed) return 'Cerrado'
  return 'Abierto'
}

function getStatusClass(label: string) {
  if (label === 'Abierto') return 'bg-emerald-400/20 text-emerald-100 border-emerald-300/20'
  if (label === 'Finalizado') return 'bg-blue-400/20 text-blue-100 border-blue-300/20'
  return 'bg-amber-400/20 text-amber-100 border-amber-300/20'
}

function getPredictionPointLabel(match: Match, pred?: Prediction) {
  if (!pred) return 'Sin pronóstico'
  if (match.home_score === null || match.away_score === null) return 'Pendiente de resultado'
  if (match.status !== 'finished') return 'Marcador en vivo, puntos pendientes'

  if (
    match.home_score === pred.predicted_home_score &&
    match.away_score === pred.predicted_away_score
  ) {
    return 'Marcador exacto'
  }

  if (pred.points > 0) return 'Sumaste puntos'
  return 'Sin puntos'
}

function getPredictionPointClass(match: Match, pred?: Prediction) {
  if (!pred) return 'border-white/10 bg-white/10 text-slate-300'
  if (match.status !== 'finished') return 'border-amber-300/20 bg-amber-400/10 text-amber-100'
  if (pred.points >= 10) return 'border-emerald-300/30 bg-emerald-400 text-slate-950'
  if (pred.points > 0) return 'border-cyan-300/30 bg-cyan-400 text-slate-950'
  return 'border-red-300/20 bg-red-400/10 text-red-100'
}


function getCloseText(match: Match) {
  if (match.status === 'finished') return 'Resultado cargado'

  const now = new Date()
  const matchDate = new Date(match.match_datetime)
  const diffMs = matchDate.getTime() - now.getTime()

  if (diffMs <= 0) return 'Partido iniciado'

  const diffMinutes = Math.floor(diffMs / 60000)
  const days = Math.floor(diffMinutes / 1440)
  const hours = Math.floor((diffMinutes % 1440) / 60)
  const minutes = diffMinutes % 60

  if (days > 0) return `Cierra en ${days} día${days === 1 ? '' : 's'} ${hours} h`
  if (hours > 0) return `Cierra en ${hours} h ${minutes} min`
  return `Cierra en ${minutes} min`
}


export default function FixturePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<number, Prediction>>({})
  const [scores, setScores] = useState<Record<number, ScoreDraft>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [activeDayFilter, setActiveDayFilter] = useState('Todos')
  const [activeMonthFilter, setActiveMonthFilter] = useState('Todos')
  const [searchText, setSearchText] = useState('')



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
    return getLimaDateKey(dateValue)
  }

  function getMatchDayLabel(dateValueOrKey: string) {
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(dateValueOrKey)
      ? dateValueOrKey
      : getLimaDateKey(dateValueOrKey)

    return formatLimaDateLabel(dateKey)
  }

  function getMatchMonthKey(dateValue: string) {
    return getLimaMonthKey(dateValue)
  }

  function getMatchMonthLabel(monthKey: string) {
    return formatLimaMonthLabel(monthKey)
  }

  function normalizeText(value: string | null | undefined) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  useEffect(() => {
    loadData()
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


  const monthFilters = useMemo(() => {
    const months = Array.from(
      new Set(matches.map((match) => getMatchMonthKey(match.match_datetime)))
    ).sort()

    return ['Todos', ...months]
  }, [matches])

  const dayFilters = useMemo(() => {
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
    const search = normalizeText(searchText.trim())

    return matches.filter((match) => {
      const matchDay = getMatchDayKey(match.match_datetime)
      const matchMonth = getMatchMonthKey(match.match_datetime)

      const matchesGroupOrStage =
        activeFilter === 'Todos' ||
        match.group_name === activeFilter ||
        match.stage === activeFilter

      const matchesMonth =
        activeMonthFilter === 'Todos' ||
        matchMonth === activeMonthFilter

      const matchesDay =
        activeDayFilter === 'Todos' ||
        matchDay === activeDayFilter

      const searchableText = normalizeText(
        [
          match.home_team,
          match.away_team,
          match.stage,
          match.group_name,
          match.venue,
          `partido ${match.match_number}`,
          getMatchDayLabel(match.match_datetime),
        ].join(' ')
      )

      const matchesSearch = !search || searchableText.includes(search)

      return matchesGroupOrStage && matchesMonth && matchesDay && matchesSearch
    })
  }, [matches, activeFilter, activeMonthFilter, activeDayFilter, searchText])

  const groupedMatches = useMemo(() => {
    return filteredMatches.reduce<Record<string, Match[]>>((groups, match) => {
      const key = match.group_name || match.stage || 'Otros'
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
      return groups
    }, {})
  }, [filteredMatches])

  function clearFilters() {
    setSearchText('')
    setActiveMonthFilter('Todos')
    setActiveDayFilter('Todos')
    setActiveFilter('Todos')
  }

  async function loadData() {
    setLoading(true)
    setMessage('')

    const { data: sessionData } = await supabase.auth.getSession()
    const currentUserId = sessionData.session?.user?.id || null
    setUserId(currentUserId)

    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('match_datetime', { ascending: true })

    if (matchesError) {
      setMessage(matchesError.message)
      setLoading(false)
      return
    }

    let activeEntryId: string | null = null
    let nextActiveEntry: Entry | null = null
    let predictionsData: Prediction[] = []

    if (currentUserId) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('active_entry_id')
        .eq('id', currentUserId)
        .single()

      if (profileError) {
        setMessage(profileError.message)
        setLoading(false)
        return
      }

      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select('id, user_id, name, category, is_active')
        .eq('user_id', currentUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (entriesError) {
        setMessage(entriesError.message)
        setLoading(false)
        return
      }

      const userEntries = (entriesData || []) as Entry[]

      nextActiveEntry =
        userEntries.find((entry) => entry.id === profileData?.active_entry_id) ||
        userEntries[0] ||
        null

      activeEntryId = nextActiveEntry?.id || null

      if (activeEntryId && profileData?.active_entry_id !== activeEntryId) {
        await supabase
          .from('profiles')
          .update({ active_entry_id: activeEntryId })
          .eq('id', currentUserId)
      }

      if (activeEntryId) {
        const { data, error } = await supabase
          .from('predictions')
          .select('id, entry_id, match_id, predicted_home_score, predicted_away_score, points')
          .eq('entry_id', activeEntryId)

        if (error) {
          setMessage(error.message)
          setLoading(false)
          return
        }

        predictionsData = (data || []) as Prediction[]
      }
    }

    const predictionsByMatch: Record<number, Prediction> = {}
    const nextScores: Record<number, ScoreDraft> = {}

    ;((matchesData || []) as Match[]).forEach((match) => {
      const existingPrediction = predictionsData.find(
        (prediction) => prediction.match_id === match.id
      )

      if (existingPrediction) {
        predictionsByMatch[match.id] = existingPrediction
      }

      nextScores[match.id] = {
        home: existingPrediction?.predicted_home_score?.toString() || '',
        away: existingPrediction?.predicted_away_score?.toString() || '',
      }
    })

    setMatches((matchesData || []) as Match[])
    setActiveEntry(nextActiveEntry)
    setPredictions(predictionsByMatch)
    setScores(nextScores)
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
    if (!userId) {
      router.push('/register?next=/fixture')
      return
    }

    if (!activeEntry) {
      router.push('/mis-participaciones')
      return
    }

    const matchDate = new Date(match.match_datetime)
    const isClosed = match.status !== 'open' || matchDate.getTime() <= Date.now()

    if (isClosed) {
      setMessage('Este partido ya está cerrado. No puedes registrar ni modificar el pronóstico.')
      return
    }

    const values = scores[match.id] || {
      home: '',
      away: '',
    }

    const home = Number(values.home)
    const away = Number(values.away)

    if (
      values.home === '' ||
      values.away === '' ||
      !Number.isInteger(home) ||
      !Number.isInteger(away) ||
      home < 0 ||
      away < 0
    ) {
      setMessage('Ingresa marcadores válidos. Los goles deben ser números enteros mayores o iguales a 0.')
      return
    }

    setSavingMatchId(match.id)
    setMessage('')

    const existingPrediction = predictions[match.id]

    const payload = {
      user_id: userId,
      entry_id: activeEntry.id,
      match_id: match.id,
      predicted_home_score: home,
      predicted_away_score: away,
      points: existingPrediction?.points || 0,
    }

    const result = existingPrediction?.id
      ? await supabase
          .from('predictions')
          .update(payload)
          .eq('id', existingPrediction.id)
      : await supabase
          .from('predictions')
          .insert(payload)

    if (result.error) {
      setMessage(result.error.message)
      setSavingMatchId(null)
      return
    }

    setMessage(`Pronóstico guardado para ${activeEntry.name}: ${match.home_team} ${home} - ${away} ${match.away_team}`)
    setSavingMatchId(null)
    await loadData()
  }

  async function logout() {
    await supabase.auth.signOut()
    setUserId(null)
    setPredictions({})
    setActiveEntry(null)
    setMessage('Sesión cerrada. Puedes seguir viendo el fixture.')
    await loadData()
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
          Cargando fixture...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-900/80 via-slate-900 to-slate-950 shadow-2xl">
        <div className="relative p-6 md:p-8">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Mundial 2026
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                Fixture
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Ingresa tus marcadores antes del inicio de cada partido. Los encuentros están agrupados por grupo y muestran banderas reales.
              </p>
            </div>

            {userId ? (
              <button
                onClick={logout}
                className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push('/login?next=/fixture')}
                  className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Iniciar sesión
                </button>

                <button
                  onClick={() => router.push('/register?next=/fixture')}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  Registrarme
                </button>
              </div>
            )}
          </div>
        </div>
      </section>


      {!userId && (
        <section className="mb-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                Participación abierta
              </p>
              <p className="mt-2 text-sm leading-6 text-cyan-50/90">
                Puedes revisar todo el fixture sin cuenta. Para guardar tus marcadores y participar en el ranking,
                debes iniciar sesión o registrarte.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <button
                onClick={() => router.push('/login?next=/fixture')}
                className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                Iniciar sesión
              </button>

              <button
                onClick={() => router.push('/register?next=/fixture')}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                Registrarme
              </button>
            </div>
          </div>
        </section>
      )}


      {userId && activeEntry && (
        <section className="mb-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                Participación activa
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {activeEntry.name}
                <span className="ml-2 rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                  {activeEntry.category}
                </span>
              </p>
              <p className="mt-1 text-sm text-cyan-50/80">
                Los pronósticos que guardes se asociarán a esta participación.
              </p>
            </div>

            <button
              onClick={() => router.push('/mis-participaciones')}
              className="w-fit rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
            >
              Cambiar participación
            </button>
          </div>
        </section>
      )}

      {userId && !activeEntry && (
        <section className="mb-6 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-200">
                Necesitas una participación
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">
                Para guardar pronósticos debes crear o seleccionar una participación.
              </p>
            </div>

            <button
              onClick={() => router.push('/mis-participaciones')}
              className="w-fit rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200"
            >
              Crear participación
            </button>
          </div>
        </section>
      )}

      {message && (
        <div className="mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
          {message}
        </div>
      )}

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Panel de búsqueda
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">Buscar partidos</h2>
            <p className="mt-1 text-sm text-slate-300">
              Encuentra partidos por equipo, estadio, grupo, fase o fecha.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="w-fit rounded-2xl border border-white/15 bg-slate-950/40 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Buscar
            </span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Ej.: México, octavos, final, Guadalajara..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Mes
            </span>
            <select
              value={activeMonthFilter}
              onChange={(event) => {
                setActiveMonthFilter(event.target.value)
                setActiveDayFilter('Todos')
              }}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-black text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
            >
              {monthFilters.map((month) => (
                <option key={month} value={month} className="bg-slate-950 text-white">
                  {month === 'Todos' ? 'Todos los meses' : getMatchMonthLabel(month)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Día
            </span>
            <select
              value={activeDayFilter}
              onChange={(event) => setActiveDayFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-black text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
            >
              {dayFilters.map((day) => (
                <option key={day} value={day} className="bg-slate-950 text-white">
                  {day === 'Todos' ? 'Todos los días' : getMatchDayLabel(day)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              Grupo / fase
            </span>
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm font-black text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
            >
              {filterOptions.map((option) => (
                <option key={option} value={option} className="bg-slate-950 text-white">
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Mostrando
            </p>
            <p className="mt-1 text-3xl font-black text-white">
              {filteredMatches.length}
              <span className="text-base font-bold text-slate-300"> / {matches.length}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
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

          <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Grupo / fase
            </p>
            <p className="mt-1 text-sm font-black text-white">
              {activeFilter}
            </p>
          </div>
        </div>
      </section>

      {filteredMatches.length === 0 && (
        <section className="mb-10 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 text-amber-50 shadow-xl">
          <h2 className="text-xl font-black">No hay partidos con esos filtros</h2>
          <p className="mt-2 text-sm leading-6">
            Prueba limpiando filtros o buscando por otro equipo, fecha, grupo o fase.
          </p>
        </section>
      )}

      {Object.entries(groupedMatches).map(([groupName, groupMatches]) => (
        <section key={groupName} className="mb-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-6 py-2 text-center text-sm font-black uppercase tracking-[0.2em] text-cyan-100 shadow-lg">
              {groupName}
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {groupMatches.map((match) => {
              const matchDate = new Date(match.match_datetime)
              const isClosed = match.status !== 'open' || new Date() >= matchDate
              const pred = predictions[match.id]
              const statusLabel = getStatusLabel(match, isClosed)

              return (
                <article
                  key={match.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-xl ring-1 ring-white/5"
                >
                  <div className="border-b border-white/10 bg-gradient-to-r from-blue-950/90 to-slate-900 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                          Partido #{match.match_number}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {matchDate.toLocaleDateString('es-PE', { timeZone: LIMA_TIME_ZONE })} · {matchDate.toLocaleTimeString('es-PE', { timeZone: LIMA_TIME_ZONE, hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {match.stage}
                          {match.venue ? ` · ${match.venue}` : ''}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(statusLabel)}`}>
                          {statusLabel}
                        </span>
                        <span className="text-right text-[11px] font-semibold text-slate-400">
                          {getCloseText(match)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <TeamCard team={match.home_team} align="right" />

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400 text-sm font-black text-slate-950 shadow-lg">
                        VS
                      </div>

                      <TeamCard team={match.away_team} align="left" />
                    </div>

                    {match.home_score !== null && match.away_score !== null && (
                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                          Resultado real
                        </p>
                        <p className="mt-1 text-3xl font-black text-white">
                          {match.home_score} - {match.away_score}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                        Tu pronóstico
                      </p>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <input
                          disabled={isClosed}
                          className="w-full rounded-2xl p-4 text-center text-xl font-black"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={scores[match.id]?.home || ''}
                          onChange={(e) => setHomeScore(match.id, e.target.value)}
                        />
                        <span className="text-xl font-black text-white">-</span>
                        <input
                          disabled={isClosed}
                          className="w-full rounded-2xl p-4 text-center text-xl font-black"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={scores[match.id]?.away || ''}
                          onChange={(e) => setAwayScore(match.id, e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                            Resumen del partido
                          </p>

                          {pred ? (
                            <div className="mt-2 space-y-1 text-sm text-slate-200">
                              <p>
                                Tu pronóstico:{' '}
                                <span className="font-black text-white">
                                  {pred.predicted_home_score} - {pred.predicted_away_score}
                                </span>
                              </p>

                              {match.home_score !== null && match.away_score !== null ? (
                                <p>
                                  Resultado real:{' '}
                                  <span className="font-black text-white">
                                    {match.home_score} - {match.away_score}
                                  </span>
                                </p>
                              ) : (
                                <p className="text-slate-400">
                                  Resultado real pendiente.
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-300">
                              Todavía no guardaste pronóstico para este partido.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className={`min-w-36 rounded-2xl border px-5 py-3 text-center shadow ${getPredictionPointClass(match, pred)}`}>
                            <p className="text-xs font-black uppercase tracking-widest">
                              Puntos
                            </p>
                            <p className="text-4xl font-black">
                              {pred ? pred.points : 0}
                            </p>
                            <p className="text-xs font-bold">
                              {getPredictionPointLabel(match, pred)}
                            </p>
                          </div>

                          <button
                            disabled={isClosed || savingMatchId === match.id}
                            onClick={() => savePrediction(match)}
                            className="rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 shadow-lg hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                          >
                            {savingMatchId === match.id ? 'Guardando...' : isClosed ? 'Cerrado' : !userId ? 'Registrarme para guardar' : pred ? 'Actualizar' : 'Guardar'}
                          </button>
                        </div>
                      </div>
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