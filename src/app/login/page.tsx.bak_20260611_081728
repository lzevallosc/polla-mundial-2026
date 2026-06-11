'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    router.push('/fixture')
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
        <h1 className="mb-6 text-3xl font-black">Iniciar sesión</h1>

        <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
          <input className="w-full rounded-xl p-3" type="email" placeholder="Correo" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded-xl p-3" type="password" placeholder="Contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <p className="rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}

          <button disabled={loading} className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 hover:bg-cyan-300">
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}
