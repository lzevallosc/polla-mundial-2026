'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Setting = {
  key: string
  value: string
  description: string | null
}

export default function AdminConfigPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [maxEntries, setMaxEntries] = useState('3')
  const [entriesLockAt, setEntriesLockAt] = useState('2026-06-11T19:00')
  const [finalPredictionsLockAt, setFinalPredictionsLockAt] = useState('2026-06-11T19:00')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    setLoading(true)
    setMessage('')

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login?next=/admin/config')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', sessionData.session.user.id)
      .single()

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    if (!profile || profile.role !== 'admin') {
      setMessage('No tienes permiso para acceder a configuración.')
      setLoading(false)
      return
    }

    setAuthorized(true)
    await loadSettings()
    setLoading(false)
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, description')
      .in('key', ['max_entries_per_user', 'entries_lock_at', 'final_predictions_lock_at'])

    if (error) {
      setMessage(error.message)
      return
    }

    const settings = Object.fromEntries(
      ((data || []) as Setting[]).map((item) => [item.key, item.value])
    ) as Record<string, string>

    setMaxEntries(settings.max_entries_per_user || '3')

    const lockValue = settings.entries_lock_at || '2026-06-11T19:00:00Z'
    setEntriesLockAt(lockValue.replace('Z', '').slice(0, 16))

    const finalLockValue = settings.final_predictions_lock_at || '2026-06-11T19:00:00Z'
    setFinalPredictionsLockAt(finalLockValue.replace('Z', '').slice(0, 16))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    const maxEntriesNumber = Number(maxEntries)

    if (!Number.isInteger(maxEntriesNumber) || maxEntriesNumber < 1 || maxEntriesNumber > 50) {
      setMessage('El máximo de participaciones debe ser un número entero entre 1 y 50.')
      return
    }

    if (!entriesLockAt) {
      setMessage('Debes ingresar una fecha/hora de cierre de participaciones.')
      return
    }

    if (!finalPredictionsLockAt) {
      setMessage('Debes ingresar una fecha/hora de cierre para finales.')
      return
    }

    setSaving(true)

    const lockIso = new Date(entriesLockAt).toISOString()
    const finalLockIso = new Date(finalPredictionsLockAt).toISOString()

    const { error: maxError } = await supabase
      .from('app_settings')
      .update({
        value: String(maxEntriesNumber),
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'max_entries_per_user')

    if (maxError) {
      setMessage(maxError.message)
      setSaving(false)
      return
    }

    const { error: lockError } = await supabase
      .from('app_settings')
      .update({
        value: lockIso,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'entries_lock_at')

    if (lockError) {
      setMessage(lockError.message)
      setSaving(false)
      return
    }

    const { error: finalLockError } = await supabase
      .from('app_settings')
      .update({
        value: finalLockIso,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'final_predictions_lock_at')

    if (finalLockError) {
      setMessage(finalLockError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    setMessage('Configuración guardada correctamente.')
    await loadSettings()
  }

  if (loading || !authorized) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-white">
          {message || 'Validando permisos...'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Panel Admin
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Configuración
            </h1>

            <p className="mt-3 max-w-3xl text-slate-200">
              Administra límites, cierre de participaciones y cierre de predicciones finales.
            </p>
          </div>

          <button
            onClick={() => router.push('/admin')}
            className="w-fit rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 font-black text-white hover:bg-white/10"
          >
            Volver al admin
          </button>
        </div>
      </section>

      {message && (
        <section className="mb-6 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm font-semibold text-cyan-50">
          {message}
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Máximo de participaciones por usuario
            </label>

            <input
              type="number"
              min="1"
              max="50"
              value={maxEntries}
              onChange={(event) => setMaxEntries(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            />

            <p className="mt-2 text-sm text-slate-300">
              Valor recomendado: 3. Este límite aplica al crear nuevas participaciones.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Fecha/hora de cierre de participaciones
            </label>

            <input
              type="datetime-local"
              value={entriesLockAt}
              onChange={(event) => setEntriesLockAt(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            />

            <p className="mt-2 text-sm text-slate-300">
              Después de esta fecha ya no se podrá crear, editar ni eliminar participaciones.
              Seleccionar participación activa seguirá permitido.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
              Fecha/hora de cierre de Finales
            </label>

            <input
              type="datetime-local"
              value={finalPredictionsLockAt}
              onChange={(event) => setFinalPredictionsLockAt(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none"
            />

            <p className="mt-2 text-sm text-slate-300">
              Después de esta fecha ya no se podrá crear ni editar campeón, subcampeón y tercer lugar.
              Recomendado: misma hora del inicio del Mundial.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-cyan-400 p-4 font-black text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      </section>
    </main>
  )
}
