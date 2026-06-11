'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Category = {
  id: number
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

type Entry = {
  id: string
  user_id: string
  name: string
  category: string
  is_active: boolean
}

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [alias, setAlias] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [entryName, setEntryName] = useState('')
  const [entryCategory, setEntryCategory] = useState('Junior')
  const [categories, setCategories] = useState<Category[]>([])
  const [nextUrl, setNextUrl] = useState('/fixture')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNextUrl(params.get('next') || '/fixture')
    loadCategories()
  }, [])

  const suggestedEntryName = useMemo(() => {
    const base = alias.trim() || fullName.trim() || 'Mi participación'
    return `${base} 1`
  }, [alias, fullName])

  async function loadCategories() {
    const { data, error } = await supabase
      .from('entry_categories')
      .select('id, name, description, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    const nextCategories = (data || []) as Category[]
    setCategories(nextCategories)

    if (nextCategories.length > 0) {
      setEntryCategory(nextCategories[0].name)
    }
  }

  async function ensureInitialEntry(userId: string, cleanAlias: string, cleanFullName: string) {
    const finalEntryName = entryName.trim() || suggestedEntryName
    const finalCategory = entryCategory || 'Junior'

    const { data: entriesData, error: entriesError } = await supabase
      .from('entries')
      .select('id, user_id, name, category, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (entriesError) {
      throw new Error(entriesError.message)
    }

    const entries = (entriesData || []) as Entry[]
    let firstEntry = entries[0] || null

    if (!firstEntry) {
      const { data: insertedEntry, error: insertEntryError } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
          name: finalEntryName,
          category: finalCategory,
        })
        .select('id, user_id, name, category, is_active')
        .single()

      if (insertEntryError) {
        throw new Error(insertEntryError.message)
      }

      firstEntry = insertedEntry as Entry
    } else {
      const { data: updatedEntry, error: updateEntryError } = await supabase
        .from('entries')
        .update({
          name: finalEntryName,
          category: finalCategory,
        })
        .eq('id', firstEntry.id)
        .select('id, user_id, name, category, is_active')
        .single()

      if (updateEntryError) {
        throw new Error(updateEntryError.message)
      }

      firstEntry = updatedEntry as Entry
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        active_entry_id: firstEntry.id,
      })
      .eq('id', userId)

    if (profileUpdateError) {
      throw new Error(profileUpdateError.message)
    }

    return firstEntry
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const cleanFullName = fullName.trim()
    const cleanAlias = alias.trim()
    const cleanEntryName = entryName.trim() || suggestedEntryName

    if (!cleanFullName || !cleanAlias || !email.trim() || !password) {
      setMessage('Completa nombre, alias, correo y contraseña.')
      setLoading(false)
      return
    }

    if (cleanEntryName.length < 2) {
      setMessage('Ingresa un nombre válido para tu participación.')
      setLoading(false)
      return
    }

    if (!entryCategory) {
      setMessage('Selecciona una categoría para tu primera participación.')
      setLoading(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (signUpError) {
      setMessage(signUpError.message)
      setLoading(false)
      return
    }

    const userId = signUpData.user?.id

    if (!userId) {
      setMessage('No se pudo crear el usuario. Intenta nuevamente.')
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: cleanFullName,
          alias: cleanAlias,
          role: 'user',
        },
        {
          onConflict: 'id',
        }
      )

    if (profileError) {
      setMessage(profileError.message)
      setLoading(false)
      return
    }

    try {
      await ensureInitialEntry(userId, cleanAlias, cleanFullName)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
      setLoading(false)
      return
    }

    router.push(nextUrl)
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-start justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Crear cuenta
          </p>

          <h1 className="text-3xl font-black text-white md:text-4xl">
            Registrarme
          </h1>

          <p className="mt-2 text-sm text-slate-300">
            Crea tu usuario y define tu primera participación. Puedes elegir Junior,
            Amateur o Experto desde el inicio.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <h2 className="mb-4 text-lg font-black text-white">Datos del usuario</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
              />

              <input
                type="text"
                placeholder="Alias"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
              />

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
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4">
            <h2 className="mb-2 text-lg font-black text-white">Primera participación</h2>

            <p className="mb-4 text-sm text-cyan-50/90">
              Esta será tu participación activa inicial. Luego podrás crear más participaciones
              hasta el límite permitido.
            </p>

            <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                  Nombre de participación
                </label>

                <input
                  type="text"
                  placeholder={suggestedEntryName}
                  value={entryName}
                  onChange={(event) => setEntryName(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
                />

                <p className="mt-2 text-xs text-cyan-50/80">
                  Si lo dejas vacío se usará: <b>{suggestedEntryName}</b>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                  Categoría
                </label>

                <select
                  value={entryCategory}
                  onChange={(event) => setEntryCategory(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-slate-950 outline-none"
                >
                  {categories.length === 0 && (
                    <option value="Junior">Junior</option>
                  )}

                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-center text-sm text-slate-200">
            ¿Ya tienes cuenta?{' '}
            <Link
              href={`/login?next=${encodeURIComponent(nextUrl)}`}
              className="font-black text-cyan-300 hover:text-cyan-200"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}
