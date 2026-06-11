'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type FinalPrediction = {
  champion_points: number
  runner_up_points: number
  third_place_points: number
}

export default function ScoreBadge() {
  const [total, setTotal] = useState<number | null>(null)
  const [matchPoints, setMatchPoints] = useState(0)
  const [extraPoints, setExtraPoints] = useState(0)

  useEffect(() => {
    loadScore()

    const { data } = supabase.auth.onAuthStateChange(() => {
      loadScore()
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  async function loadScore() {
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session?.user) {
      setTotal(null)
      return
    }

    const userId = sessionData.session.user.id

    const { data: predictions } = await supabase
      .from('predictions')
      .select('points')
      .eq('user_id', userId)

    const { data: finalPrediction } = await supabase
      .from('final_predictions')
      .select('champion_points, runner_up_points, third_place_points')
      .eq('user_id', userId)
      .maybeSingle()

    const pointsByMatches = (predictions || []).reduce(
      (sum, item) => sum + (item.points || 0),
      0
    )

    const finalPoints = finalPrediction
      ? (finalPrediction as FinalPrediction).champion_points +
        (finalPrediction as FinalPrediction).runner_up_points +
        (finalPrediction as FinalPrediction).third_place_points
      : 0

    setMatchPoints(pointsByMatches)
    setExtraPoints(finalPoints)
    setTotal(pointsByMatches + finalPoints)
  }

  if (total === null) return null

  return (
    <Link
      href="/mis-puntos"
      className="rounded-2xl border border-cyan-300/30 bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950 shadow hover:bg-cyan-300"
      title={`Partidos: ${matchPoints} · Extras: ${extraPoints}`}
    >
      Score: {total}
    </Link>
  )
}
