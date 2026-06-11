'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Entry = {
  id: string
  user_id: string
  name: string
  category: string
  is_active: boolean
  created_at: string
}

type Category = {
  id: number
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

type Profile = {
  id: string
  full_name: string | null
  alias: string | null
  active_entry_id: string | null
}

export default function MyEntriesPage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [allEntries, setAllEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [maxEntries, setMaxEntries] = useState(3)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Junior')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const count = allEntries.filter((entry) => entry.category === cat.name && entry.is_active).length

      return {
        name: cat.name,
        description: cat.description,
        count,
      }
    })
  }, [categories, allEntries])

  const activeEntry = useMemo(() => {
    return entries.find((entry) => entry.id === profile?.active_entry_id) || entries[0] || null
  }, [entries, profile])

  async function loadData() {
    setLoading(true)
    setMessage('')

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login?next=/mis-participaciones')
      return
    }

    const currentUserId = sessionData.session.user.id
    setUserId(currentUserId)

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, alias, active_entry_id')
      .eq('id', currentUserId)
      .single()

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    const { data: categoriesData, error: categoriesError } = await supabase
      .from('entry_categories')
      .select('id, name, description, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      setMessage(categoriesError.message)
      setLoading(false)
      return
    }

    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'max_entries_per_user')
      .single()

    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('id, user_id, name, category, is_active, created_at')
      .eq('user_id', currentUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (entriesError) {
      setMessage(entriesError.message)
      setLoading(false)
      return
    }

    const { data: allEntriesData, error: allEntriesError } = await supabase
      .from('entries')
      .select('id, user_id, name, category, is_active, created_at')
      .eq('is_active', true)

    if (allEntriesError) {
      setMessage(allEntriesError.message)
      setLoading(false)
      return
    }

    const nextCategories = (categoriesData || []) as Category[]
    const nextEntries = (entriesData || []) as Entry[]
    const nextProfile = profileData as Profile

    setProfile(nextProfile)
    setCategories(nextCategories)
    setEntries(nextEntries)
    setAllEntries((allEntriesData || []) as Entry[])
    setMaxEntries(Number(settingsData?.value || 3))

    if (nextCategories.length > 0) {
      setCategory(nextCategories[0].name)
    }

    if (!nextProfile.active_entry_id && nextEntries.length > 0) {
      await setActiveEntry(nextEntries[0].id, false)
    }

    setLoading(false)
  }

  async function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!userId) return

    const cleanName = name.trim()

    if (cleanName.length < 2) {
      setMessage('Ingresa un nombre válido para tu participación.')
      return
    }

    if (entries.length >= maxEntries) {
      setMessage(`Llegaste al límite de participaciones permitido: ${maxEntries}.`)
      return
    }

    setSaving(true)
    setMessage('')

    const { data, error } = await supabase
      .from('entries')
      .insert({
        user_id: userId,
        name: cleanName,
        category,
      })
      .select('id')
      .single()

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setName('')

    if (data?.id) {
      await setActiveEntry(data.id, false)
    }

    await loadData()
    setSaving(false)
    setMessage('Participación creada correctamente.')
  }

  async function setActiveEntry(entryId: string, reload = true) {
    if (!userId) return

    const { error } = await supabase
      .from('profiles')
      .update({
        active_entry_id: entryId,
      })
      .eq('id', userId)

    if (error) {
      setMessage(error.message)
      return
    }

    if (reload) {
      await loadData()
      setMessage('Participación activa actualizada.')
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
          Cargando participaciones...
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Categorías y participaciones
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Mis participaciones
            </h1>

            <p className="mt-3 max-w-3xl text-slate-200">
              Puedes crear varias participaciones y competir en Junior, Amateur o Experto.
              Cada participación tiene sus propios pronósticos y su propio puntaje.
            </p>
          </div>

          <button
            onClick={() => router.push('/fixture')}
            className="w-fit rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
          >
            Ir al fixture
          </button>
        </div>
      </section>

      {message && (
        <section className="mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
          {message}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400 p-5 text-slate-950 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest">Tus participaciones</p>
          <p className="mt-2 text-5xl font-black">{entries.length}</p>
          <p className="mt-1 text-sm font-bold">Límite: {maxEntries}</p>
        </div>

        {categoryStats.map((stat) => (
          <div key={stat.name} className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              {stat.name}
            </p>
            <p className="mt-2 text-4xl font-black text-white">{stat.count}</p>
            <p className="mt-1 text-xs text-slate-300">
              participaciones activas
            </p>
          </div>
        ))}
      </section>

      <section className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white">Crear nueva participación</h2>
          <p className="mt-1 text-sm text-slate-300">
            Puedes repetir categoría. El nombre debe ayudarte a distinguir tu estrategia.
          </p>
        </div>

        <form onSubmit={createEntry} className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Nombre
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej.: Luis arriesgado, Luis favoritos..."
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
              disabled={entries.length >= maxEntries}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Categoría
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
              disabled={entries.length >= maxEntries}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || entries.length >= maxEntries}
            className="rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
          >
            {saving ? 'Creando...' : 'Crear'}
          </button>
        </form>

        {entries.length >= maxEntries && (
          <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
            Llegaste al límite actual de participaciones. El límite puede modificarse desde configuración admin.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 shadow-xl">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-2xl font-black text-white">Tus participaciones</h2>
          <p className="mt-1 text-sm text-slate-300">
            Selecciona la participación activa para guardar pronósticos en Fixture y Final.
          </p>
        </div>

        <div className="divide-y divide-white/10">
          {entries.length === 0 && (
            <div className="p-5 text-slate-300">
              Todavía no tienes participaciones.
            </div>
          )}

          {entries.map((entry) => {
            const isActive = activeEntry?.id === entry.id

            return (
              <div
                key={entry.id}
                className={`grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center ${
                  isActive ? 'bg-cyan-300/10' : ''
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-white">{entry.name}</h3>

                    <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                      {entry.category}
                    </span>

                    {isActive && (
                      <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
                        Activa
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    Creada el {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => setActiveEntry(entry.id)}
                  disabled={isActive}
                  className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isActive ? 'Seleccionada' : 'Seleccionar'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
