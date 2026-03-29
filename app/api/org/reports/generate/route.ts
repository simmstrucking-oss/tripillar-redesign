import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

export async function POST(request: Request) {
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

  // Fetch org data
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  // Fetch cohorts data
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('total_enrolled, total_completed, book_module')
    .eq('org_id', orgId)

  // Calculate stats
  const totalParticipants = (cohorts || []).reduce((sum, c) => sum + c.total_enrolled, 0)
  const totalCompleted = (cohorts || []).reduce((sum, c) => sum + c.total_completed, 0)
  const avgCompletionRate = cohorts && cohorts.length > 0 
    ? Math.round((totalCompleted / totalParticipants) * 100)
    : 0
  const cohortsCount = cohorts?.length || 0
  const booksCovered = new Set((cohorts || []).map(c => c.book_module)).size

  // Create PDF
  const doc = new PDFDocument()
  const buffers: Buffer[] = []

  doc.on('data', (chunk: Buffer) => buffers.push(chunk))
  doc.on('end', () => {})

  doc.fontSize(24).font('Helvetica-Bold').text(`${org?.name || 'Organization'} Impact Report`, 50, 50)
  doc.fontSize(12).font('Helvetica').text(`Report Date: ${new Date().toLocaleDateString()}`, 50, 90)

  doc.fontSize(14).font('Helvetica-Bold').text('Impact Summary', 50, 130)
  doc.fontSize(12).font('Helvetica')
  doc.text(`Total Participants Served: ${totalParticipants}`, 50, 160)
  doc.text(`Average Completion Rate: ${avgCompletionRate}%`, 50, 180)
  doc.text(`Cohorts Run: ${cohortsCount}`, 50, 200)
  doc.text(`Books Covered: ${booksCovered}`, 50, 220)

  doc.end()

  return new Promise((resolve) => {
    doc.on('finish', () => {
      const buffer = Buffer.concat(buffers)
      resolve(
        new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="impact-report.pdf"'
          }
        })
      )
    })
  })
}
