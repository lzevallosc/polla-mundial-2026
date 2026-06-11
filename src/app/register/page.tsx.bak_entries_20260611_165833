'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [alias, setAlias] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!fullName.trim()) {
        setError('Ingresa tu nombre completo.')
        setLoading(false)
        return
      }

      if (!email.trim()) {
        setError('Ingresa tu correo.')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('La contraseña debe tener mínimo 6 caracteres.')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        console.error('Supabase signUp error:', signUpError)
        setError(`Error creando usuario: ${signUpError.message}`)
        setLoading(false)
        return
      }

      if (!data.user) {
        console.error('Supabase signUp without user:', data)
        setError('Supabase no devolvió usuario. Revisa si el registro está habilitado en Authentication.')
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName.trim(),
        alias: alias.trim() || fullName.trim(),
        role: 'user',
      })

      if (profileError) {
        console.error('Profile insert error:', profileError)
        setError(`Usuario creado, pero falló profile: ${profileError.message}`)
        setLoading(false)
        return
      }

      setSuccess('Usuario creado correctamente. Redirigiendo al fixture...')
      setTimeout(() => {
        router.push('/fixture')
      }, 800)
    } catch (err) {
      console.error('Unexpected register error:', err)
      setError('Error inesperado registrando usuario. Revisa la consola del navegador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <h1 className="mb-6 text-3xl font-black text-white">Registro</h1>

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning autoComplete="off">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Nombre completo</label>
            <input
              className="w-full rounded-xl p-3"
              placeholder="Ejemplo: Luis Zevallos" autoComplete="off" data-lpignore="true"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Alias para ranking</label>
            <input
              className="w-full rounded-xl p-3"
              placeholder="Ejemplo: Luis" autoComplete="off" data-lpignore="true"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Correo</label>
            <input
              className="w-full rounded-xl p-3"
              type="email"
              placeholder="correo@dominio.com" autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-200">Contraseña</label>
            <input
              className="w-full rounded-xl p-3"
              type="password"
              placeholder="Mínimo 6 caracteres" autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/20 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 p-3 text-sm text-emerald-100">
              {success}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </main>
  )
}
