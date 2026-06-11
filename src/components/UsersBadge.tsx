'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function UsersBadge() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    loadUsersCount()
  }, [])

  async function loadUsersCount() {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) {
      setCount(null)
      return
    }

    setCount(count || 0)
  }

  if (count === null) return null

  return (
    <span
      className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white"
      title="Usuarios registrados"
    >
      Usuarios: {count}
    </span>
  )
}
