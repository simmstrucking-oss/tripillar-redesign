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

  const { data, error } = await sb
    .from('facilitator_profiles')
    .select('id, full_name, cert_track, cert_status, cert_expiry, books_certified')
    .eq('organization_id', orgId)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const facilitators = (data ?? []).map(f => ({
    id: f.id,
    name: f.full_name,
    cert_track: f.cert_track,
    cert_status: f.cert_status,
    cert_expiry: f.cert_expiry,
    books_certified: f.books_certified,
  }))

  return NextResponse.json({ facilitators })
}
