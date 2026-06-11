import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { ok: false, error: 'No autorizado' },
      { status: 401 }
    )
  }

  const origin = request.nextUrl.origin

  const response = await fetch(`${origin}/api/admin/sync-scores`, {
    headers: {
      'x-cron-secret': cronSecret,
    },
    cache: 'no-store',
  })

  const data = await response.json()

  return NextResponse.json({
    ok: response.ok,
    source: 'vercel-cron',
    status: response.status,
    data,
  }, {
    status: response.ok ? 200 : response.status,
  })
}
