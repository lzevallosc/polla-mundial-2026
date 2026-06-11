'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type UserStatus = {
  user_id: string
  email: string | null
  alias: string | null
  full_name: string | null
  role: string | null
  registered_at: string
  active_entry_id: string | null
  entries_count: number
  active_entries_count: number
  registered_after_entries_lock: boolean
}

export default function UsersWithoutEntriesPage() {
  const router = useRouter()

  const [authorized, setAuthorized] = useState(false)
  const [users, setUsers] = useState<UserStatus[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdmin()
  }, [])

  const usersWithoutEntries = useMemo(() => {
    return users.filter((user) => Number(user.active_entries_count || 0) === 0)
  }, [users])

  const usersAfterLock = useMemo(() => {
    return users.filter((user) => user.registered_after_entries_lock)
  }, [users])

  const usersAfterLockWithoutEntries = useMemo(() => {
    return users.filter(
      (user) => user.registered_after_entries_lock && Number(user.active_entries_count || 0) === 0
    )
  }, [users])

  async function checkAdmin() {
    setLoading(true)
    setMessage('')

    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      router.push('/login?next=/admin/usuarios-sin-participacion')
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
      setMessage('No tienes permiso para acceder a esta página.')
      setLoading(false)
      return
    }

    setAuthorized(true)
    await loadUsers()
    setLoading(false)
  }

  async function loadUsers() {
    setMessage('')

    const { data, error } = await supabase.rpc('admin_users_participation_status')

    if (error) {
      setMessage(error.message)
      return
    }

    setUsers((data || []) as UserStatus[])
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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#16265f] via-[#111a3a] to-[#05091c] p-7 shadow-2xl">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
          Panel Admin
        </p>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              Usuarios sin participación
            </h1>

            <p className="mt-3 max-w-3xl text-slate-200">
              Revisa quién se registró, quién no tiene participación activa y quién se registró después del cierre.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadUsers}
              className="rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
            >
              Actualizar
            </button>

            <button
              onClick={() => router.push('/admin/config')}
              className="rounded-2xl border border-white/15 bg-white/[0.03] px-5 py-3 font-black text-white hover:bg-white/10"
            >
              Abrir configuración
            </button>
          </div>
        </div>
      </section>

      {message && (
        <section className="mb-6 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
          {message}
        </section>
      )}

      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400 p-5 text-slate-950 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest">Usuarios</p>
          <p className="mt-2 text-5xl font-black">{users.length}</p>
        </div>

        <div className="rounded-3xl border border-red-300/20 bg-red-400/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-red-200">
            Sin participación
          </p>
          <p className="mt-2 text-4xl font-black text-white">{usersWithoutEntries.length}</p>
        </div>

        <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-amber-200">
            Después del cierre
          </p>
          <p className="mt-2 text-4xl font-black text-white">{usersAfterLock.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Post-cierre sin participación
          </p>
          <p className="mt-2 text-4xl font-black text-white">{usersAfterLockWithoutEntries.length}</p>
        </div>
      </section>

      {usersWithoutEntries.length > 0 && (
        <section className="mb-8 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 shadow-xl">
          <h2 className="mb-3 text-xl font-black text-amber-100">
            Acción de contingencia
          </h2>

          <p className="text-sm leading-6 text-amber-50/90">
            Hay usuarios sin participación activa. Si el cierre ya pasó y deseas permitirles participar,
            entra a Configuración y extiende temporalmente el cierre de participaciones.
            Igual no podrán pronosticar partidos que ya empezaron.
          </p>

          <button
            onClick={() => router.push('/admin/config')}
            className="mt-4 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-200"
          >
            Ir a configuración
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl">
        <div className="border-b border-white/10 bg-slate-950/40 p-5">
          <h2 className="text-xl font-black text-white">Detalle de usuarios</h2>
          <p className="text-sm text-slate-300">
            Ordenado por fecha de registro, más recientes primero.
          </p>
        </div>

        <div className="divide-y divide-white/10">
          {users.length === 0 && (
            <div className="p-5 text-slate-300">
              No hay usuarios registrados.
            </div>
          )}

          {users.map((user) => {
            const hasActiveEntries = Number(user.active_entries_count || 0) > 0

            return (
              <div
                key={user.user_id}
                className={`grid gap-4 p-5 lg:grid-cols-[1.2fr_1fr_150px_150px_180px] lg:items-center ${
                  !hasActiveEntries ? 'bg-red-400/5' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">
                    {user.alias || user.full_name || 'Sin nombre'}
                  </p>
                  <p className="truncate text-sm text-slate-400">
                    {user.email || 'Sin correo'}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.full_name || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Registro
                  </p>
                  <p className="text-sm font-bold text-white">
                    {new Date(user.registered_at).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/40 p-3 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Activas
                  </p>
                  <p className="text-2xl font-black text-white">
                    {user.active_entries_count}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/40 p-3 text-center">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Total
                  </p>
                  <p className="text-2xl font-black text-white">
                    {user.entries_count}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!hasActiveEntries && (
                    <span className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-black text-red-100">
                      Sin participación
                    </span>
                  )}

                  {user.registered_after_entries_lock && (
                    <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">
                      Post-cierre
                    </span>
                  )}

                  {hasActiveEntries && !user.registered_after_entries_lock && (
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">
                      OK
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
