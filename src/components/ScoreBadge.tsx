'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ActiveEntry = {
  id: string
  name: string
  category: string
}

export default function ScoreBadge() {
  const [score, setScore] = useState(0)
  const [entry, setEntry] = useState<ActiveEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScore()

    const interval = window.setInterval(() => {
      loadScore()
    }, 30000)

    const onFocus = () => loadScore()
    const onVisibilityChange = () => {
      if (!document.hidden) loadScore()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  async function loadScore() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      setScore(0)
      setEntry(null)
      setLoading(false)
      return
    }

    const userId = sessionData.session.user.id

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_entry_id')
      .eq('id', userId)
      .single()

    let activeEntryId = profile?.active_entry_id || null

    const { data: entriesData } = await supabase
      .from('entries')
      .select('id, name, category')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    const entries = (entriesData || []) as ActiveEntry[]

    if (!activeEntryId && entries.length > 0) {
      activeEntryId = entries[0].id
    }

    const activeEntry =
      entries.find((item) => item.id === activeEntryId) ||
      entries[0] ||
      null

    if (!activeEntry) {
      setScore(0)
      setEntry(null)
      setLoading(false)
      return
    }

    const { data: predictionsData } = await supabase
      .from('predictions')
      .select('points')
      .eq('entry_id', activeEntry.id)

    const matchPoints = (predictionsData || []).reduce(
      (sum, item) => sum + Number(item.points || 0),
      0
    )

    const { data: finalData } = await supabase
      .from('final_predictions')
      .select('champion_points, runner_up_points, third_place_points')
      .eq('entry_id', activeEntry.id)
      .maybeSingle()

    const finalPoints =
      Number(finalData?.champion_points || 0) +
      Number(finalData?.runner_up_points || 0) +
      Number(finalData?.third_place_points || 0)

    setScore(matchPoints + finalPoints)
    setEntry(activeEntry)
    setLoading(false)
  }

  if (loading) {
    return (
      <span className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">
        Score: ...
      </span>
    )
  }

  if (!entry) {
    return (
      <span className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950">
        Score: {score}
      </span>
    )
  }

  return (
    <span
      title={`${entry.name} · ${entry.category}`}
      className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950"
    >
      {entry.category}: {score}
    </span>
  )
}
