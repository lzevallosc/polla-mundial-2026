'use client'

import { useMemo, useState } from 'react'
import { getTeamCode, getTeamFlagUrl, hasImageFlag } from '@/lib/teamMeta'

type TeamSelectorProps = {
  label: string
  value: string
  teams: string[]
  onChange: (team: string) => void
  placeholder?: string
  pointsLabel?: string
}

function TeamAvatar({ team }: { team: string }) {
  const flagUrl = getTeamFlagUrl(team)
  const code = getTeamCode(team)

  if (hasImageFlag(team) && flagUrl) {
    return (
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-200">
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
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 font-black text-[11px] text-slate-950 shadow-sm">
      {code}
    </div>
  )
}

export default function TeamSelector({
  label,
  value,
  teams,
  onChange,
  placeholder = 'Selecciona equipo',
  pointsLabel,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return teams

    return teams.filter((team) => {
      const code = getTeamCode(team).toLowerCase()
      return team.toLowerCase().includes(query) || code.includes(query)
    })
  }, [teams, search])

  function selectTeam(team: string) {
    onChange(team)
    setSearch('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-bold text-slate-100">
          {label}
        </label>

        {pointsLabel && (
          <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
            {pointsLabel}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white px-4 py-3 text-left text-slate-950 shadow-sm transition hover:bg-slate-50"
      >
        {value ? (
          <span className="flex items-center gap-3">
            <TeamAvatar team={value} />
            <span>
              <span className="block font-black">{value}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {getTeamCode(value)}
              </span>
            </span>
          </span>
        ) : (
          <span className="text-slate-500">{placeholder}</span>
        )}

        <span className="text-lg font-black text-slate-500">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
          <div className="border-b border-white/10 bg-slate-900 p-3">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white p-3 text-slate-950 outline-none"
              placeholder="Buscar equipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredTeams.length === 0 && (
              <div className="p-4 text-sm text-slate-300">
                No se encontraron equipos.
              </div>
            )}

            {filteredTeams.map((team) => {
              const selected = team === value

              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => selectTeam(team)}
                  className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    selected
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <TeamAvatar team={team} />

                  <span className="flex-1">
                    <span className="block font-black">{team}</span>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${
                        selected ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {getTeamCode(team)}
                    </span>
                  </span>

                  {selected && (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-cyan-300">
                      Elegido
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
