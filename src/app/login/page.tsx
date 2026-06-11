'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nextUrl, setNextUrl] = useState('/fixture')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get('next') || '/fixture'
    setNextUrl(next)
  }, [])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    router.push(nextUrl)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-start justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <h1 className="mb-6 text-3xl font-black text-white">Iniciar sesión</h1>

        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
            />

            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Entrar'}
            </button>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
              {message}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-center text-sm text-slate-200">
            ¿No tienes cuenta?{' '}
            <Link
              href={`/register?next=${encodeURIComponent(nextUrl)}`}
              className="font-black text-cyan-300 hover:text-cyan-200"
            >
              Regístrate aquí
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
