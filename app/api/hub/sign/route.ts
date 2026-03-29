/**
 * POST /api/hub/sign — digital signature: record, generate PDF, email Wayne
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const WAYNE_EMAIL = 'wayne@tripillarstudio.com';

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;
  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch { /* */ }
  if (!token) {
    try { token = JSON.parse(Buffer.from(tokenMatch[1], 'base64').toString())?.access_token; } catch { /* */ }
  }
  if (!token) return null;
  const { data, error } = await sb().auth.getUser(token);
  return (error || !data?.user) ? null : data.user;
}

function docToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { document_name, document_version, signature_text } = body;

  if (!document_name || typeof document_name !== 'string') {
    return NextResponse.json({ error: 'document_name is required' }, { status: 400 });
  }
  if (!signature_text || typeof signature_text !== 'string' || signature_text.trim().length < 2) {
    return NextResponse.json({ error: 'A valid signature (full legal name) is required' }, { status: 400 });
  }

  const supabase = sb();

  const { data: profile, error: pErr } = await supabase
    .from('facilitator_profiles')
    .select('id, full_name, email')
    .eq('user_id', user.id)
    .single();

  if (pErr || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  const signedAt = new Date();
  const version = document_version || '1.0';

  // 1. Insert signature record
  const { data: sig, error: sigErr } = await supabase
    .from('facilitator_signatures')
    .insert({
      facilitator_id: profile.id,
      document_name,
      document_version: version,
      signed_at: signedAt.toISOString(),
      ip_address: ip,
      signature_text: signature_text.trim(),
    })
    .select('id')
    .single();

  if (sigErr || !sig) return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 });

  // 2. Generate PDF
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: { Creator: 'Tri-Pillars LLC', Producer: 'Live and Grieve™' },
  });

  const W = doc.page.width;

  // Header
  doc.rect(0, 0, W, 8).fill('#B8942F');
  doc.fillColor('#2D3142').font('Helvetica-Bold').fontSize(20)
    .text('Digital Signature Confirmation', 60, 50, { width: W - 120 });
  doc.moveTo(60, 80).lineTo(W - 60, 80).strokeColor('#B8942F').lineWidth(1).stroke();

  doc.moveDown(1.5);

  const fields: [string, string][] = [
    ['Document', document_name],
    ['Version', version],
    ['Facilitator', profile.full_name],
    ['Email', profile.email],
    ['IP Address', ip],
    ['Signed At (UTC)', signedAt.toISOString()],
    ['Signed At (Human)', signedAt.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'long' })],
  ];

  for (const [label, value] of fields) {
    doc.fillColor('#5A6070').font('Helvetica-Bold').fontSize(10)
      .text(`${label}:`, 60, doc.y, { continued: true, width: 160 });
    doc.fillColor('#2D3142').font('Helvetica').fontSize(11)
      .text(`  ${value}`, { lineBreak: true });
    doc.moveDown(0.3);
  }

  doc.moveDown(1);
  doc.fillColor('#5A6070').font('Helvetica-Bold').fontSize(10).text('Digital Signature:', 60);
  doc.moveDown(0.3);
  doc.fillColor('#2D3142').font('Helvetica-Oblique').fontSize(18)
    .text(signature_text.trim(), 60, doc.y, { width: W - 120 });

  doc.moveDown(2);
  doc.moveTo(60, doc.y).lineTo(W - 60, doc.y).strokeColor('#EAEAEA').lineWidth(0.5).stroke();
  doc.moveDown(0.5);
  doc.fillColor('#5A6070').font('Helvetica').fontSize(8)
    .text(
      'This document constitutes a legally binding digital signature under applicable electronic signature laws.',
      60, doc.y, { width: W - 120, align: 'center' }
    );
  doc.moveDown(0.3);
  doc.fillColor('#5A6070').font('Helvetica').fontSize(7)
    .text('Tri-Pillars™ LLC  ·  Confidential  ·  tripillarstudio.com', 60, doc.y, { width: W - 120, align: 'center' });

  const pdfBuffer = await docToBuffer(doc);

  // 3. Upload PDF to admin-documents bucket
  const ts = signedAt.toISOString().replace(/[:.]/g, '-');
  const slug = document_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const storagePath = `signatures/${profile.id}/${slug}-${ts}.pdf`;

  const { error: upErr } = await supabase.storage
    .from('admin-documents')
    .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false });

  let pdfUrl: string | null = null;
  if (!upErr) {
    const { data: urlData } = await supabase.storage
      .from('admin-documents')
      .createSignedUrl(storagePath, 60);
    pdfUrl = urlData?.signedUrl ?? null;

    // 4. Update signature record
    await supabase.from('facilitator_signatures')
      .update({ pdf_generated: true, pdf_url: pdfUrl })
      .eq('id', sig.id);
  }

  // 5. Email Wayne
  if (RESEND_API_KEY) {
    const humanDate = signedAt.toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'long' });
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Ember <ember@tripillarstudio.com>',
        to: [WAYNE_EMAIL],
        subject: `${document_name} signed — ${profile.full_name} — ${humanDate}`,
        text: [
          `Document: ${document_name} (v${version})`,
          `Facilitator: ${profile.full_name} (${profile.email})`,
          `Signature: ${signature_text.trim()}`,
          `Signed at: ${signedAt.toISOString()}`,
          `IP: ${ip}`,
          pdfUrl ? `PDF: ${pdfUrl}` : 'PDF upload failed',
        ].join('\n'),
      }),
    }).catch(() => { /* non-fatal */ });
  }

  return NextResponse.json({
    success: true,
    pdf_url: pdfUrl,
    signed_at: signedAt.toISOString(),
  });
}
