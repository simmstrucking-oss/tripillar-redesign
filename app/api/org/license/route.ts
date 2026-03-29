import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

  const { data: org, error } = await supabase
    .from('organizations')
    .select('license_type, license_status, license_start, license_renewal, contact_name, contact_email')
    .eq('id', orgId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Get ILA signed URL
  let ilaUrl = null
  try {
    const ilaResponse = await fetch(
      `${request.url.split('/api/')[0]}/api/org/documents?file=ila`
    )
    if (ilaResponse.ok) {
      const { url } = await ilaResponse.json()
      ilaUrl = url
    }
  } catch (err) {
    console.error('Failed to get ILA URL:', err)
  }

  return NextResponse.json({
    ...org,
    ilaUrl
  })
}
