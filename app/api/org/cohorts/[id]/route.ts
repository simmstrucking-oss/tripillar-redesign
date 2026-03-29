import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
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

  const { data: cohort, error } = await supabase
    .from('cohorts')
    .select(`
      *,
      facilitator_profiles (name)
    `)
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!cohort) {
    return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
  }

  // Get session feedback if available
  const { data: feedback } = await supabase
    .from('session_feedback')
    .select('score')
    .eq('cohort_id', id)

  const stats: any = {}
  if (feedback && feedback.length > 0) {
    const scores = feedback.map(f => f.score)
    stats.avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
    stats.feedbackCount = scores.length
  }

  return NextResponse.json({
    ...cohort,
    facilitator: (cohort.facilitator_profiles as any)?.name || 'Unknown',
    feedbackStats: stats
  })
}
