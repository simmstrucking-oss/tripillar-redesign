import { createClient } from '@supabase/supabase-js'
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

  const url = new URL(request.url)
  const file = url.searchParams.get('file')

  if (!file || !['ila', 'program-overview', 'appropriateness-guide'].includes(file)) {
    return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 })
  }

  // Use service role for bucket access
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('admin-documents')
      .list()

    if (listError) throw listError

    let matchedFile: string | null = null

    if (file === 'ila') {
      matchedFile = files.find(f => f.name.includes('License_Agreement') || f.name.includes('ILA'))?.name || null
    } else if (file === 'program-overview') {
      matchedFile = files.find(f => f.name.includes('Program_Overview'))?.name || null
    } else if (file === 'appropriateness-guide') {
      matchedFile = files.find(f => f.name.includes('Appropriateness'))?.name || null
    }

    if (!matchedFile) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const { data: signedUrlData, error: signError } = await supabaseAdmin.storage
      .from('admin-documents')
      .createSignedUrl(matchedFile, 60)

    if (signError) throw signError

    return NextResponse.json({ url: signedUrlData.signedUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
