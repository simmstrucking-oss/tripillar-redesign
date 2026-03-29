import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

async function getOrgUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;

  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch {}
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch {}
  }
  if (!token) return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  if (data.user.user_metadata?.role !== 'org_contact') return null;
  return data.user;
}

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const supabase = sb();

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const { data: facilitators } = await supabase
    .from('facilitator_profiles')
    .select('id')
    .eq('organization_id', orgId);

  const facIds = (facilitators ?? []).map(f => f.id);

  let cohorts: Array<{ book_number?: number; total_enrolled?: number; total_completed?: number; participant_count?: number }> = [];
  if (facIds.length >= 0) {
    const { data } = await supabase
      .from('cohorts')
      .select('book_number, total_enrolled, total_completed, participant_count')
      .eq('organization_id', orgId);
    cohorts = data ?? [];
  }

  const totalParticipants = cohorts.reduce((s, c) => s + (c.total_enrolled ?? c.participant_count ?? 0), 0);
  const totalCompleted = cohorts.reduce((s, c) => s + (c.total_completed ?? 0), 0);
  const avgCompletion = totalParticipants > 0
    ? Math.round((totalCompleted / totalParticipants) * 100)
    : 0;
  const books = [...new Set(cohorts.map((c: any) => c.book_number ? `Book ${c.book_number}` : null).filter(Boolean))];

  const doc = new PDFDocument({ size: 'LETTER', margin: 60 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const pdfDone = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(22).fillColor('#2D3142')
    .text('Live and Grieve Impact Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).fillColor('#B8942F')
    .text(org?.name ?? 'Organization', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#7A7264')
    .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

  doc.moveDown(1);
  doc.moveTo(60, doc.y).lineTo(552, doc.y).strokeColor('#B8942F').lineWidth(1).stroke();
  doc.moveDown(1);

  doc.fontSize(13).fillColor('#2D3142').text('Program Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#3d4155');
  doc.text(`Total Participants Served: ${totalParticipants}`);
  doc.text(`Average Completion Rate: ${avgCompletion}%`);
  doc.text(`Cohorts Run: ${cohorts.length}`);
  doc.text(`Books Covered: ${books.length > 0 ? books.join(', ') : 'None yet'}`);

  doc.moveDown(1.5);
  doc.fontSize(9).fillColor('#7A7264')
    .text('This report was generated from the Live and Grieve Partner Hub.', { align: 'center' });

  doc.end();
  const pdfBuffer = await pdfDone;

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="impact-report-${Date.now()}.pdf"`,
    },
  });
}
