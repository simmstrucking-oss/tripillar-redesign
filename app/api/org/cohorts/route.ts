import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'org_contact') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = user.user_metadata?.org_id as string
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Get facilitators for this org
  const { data: facilitators } = await sb
    .from('facilitator_profiles')
    .select('id, full_name')
    .eq('organization_id', orgId)

  const facMap: Record<string, string> = {}
  for (const f of facilitators ?? []) {
    facMap[f.id] = f.full_name
  }
  const facIds = Object.keys(facMap)

  if (facIds.length === 0) {
    return NextResponse.json({ cohorts: [] })
  }

  const { data: cohorts, error } = await sb
    .from('cohorts')
    .select('id, facilitator_id, book_module, start_date, status, total_enrolled, total_completed')
    .in('facilitator_id', facIds)
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (cohorts ?? []).map(c => ({
    ...c,
    facilitator_name: facMap[c.facilitator_id] ?? 'Unknown',
    completion_rate: c.total_enrolled > 0
      ? Math.round((c.total_completed / c.total_enrolled) * 100)
      : 0,
  }))

  return NextResponse.json({ cohorts: result })
}
