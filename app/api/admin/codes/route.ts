import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

// GET /api/admin/codes?org=&book=&status=&facilitator=&format=csv
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const orgFilter   = searchParams.get('org')         ?? '';
  const bookFilter  = searchParams.get('book')        ?? '';
  const statusFilter= searchParams.get('status')      ?? '';
  const facFilter   = searchParams.get('facilitator') ?? '';
  const format      = searchParams.get('format')      ?? 'json';

  const supabase = getSupabaseServer();

  // Fetch codes with batch + facilitator + org
  let query = supabase
    .from('access_codes')
    .select(`
      id, code, status, book_number, expires_at, redeemed_at, redeemed_by_email, created_at, batch_id,
      access_code_batches(
        id, facilitator_id, notes, created_at,
        facilitator_profiles(
          id, full_name, email, organization_id,
          organizations(id, name)
        )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(2000);

  const { data: codes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = new Date();

  // Flatten + filter
  let rows = (codes ?? []).map((c: any) => {
    const batch = c.access_code_batches;
    const fac   = batch?.facilitator_profiles;
    const org   = fac?.organizations;
    const computedStatus = c.status === 'revoked' ? 'revoked'
      : c.status === 'redeemed' ? 'redeemed'
      : c.expires_at && new Date(c.expires_at) < now ? 'expired'
      : c.status;
    return {
      id:             c.id,
      code:           c.code,
      book_number:    c.book_number,
      status:         computedStatus,
      raw_status:     c.status,
      expires_at:     c.expires_at,
      redeemed_at:    c.redeemed_at,
      redeemed_by_email: c.redeemed_by_email,
      created_at:     c.created_at,
      batch_id:       c.batch_id,
      batch_notes:    batch?.notes,
      facilitator_id: fac?.id,
      facilitator_name: fac?.full_name,
      facilitator_email: fac?.email,
      organization_id: org?.id,
      organization_name: org?.name,
    };
  });

  // Apply filters
  if (orgFilter)    rows = rows.filter(r => r.organization_id === orgFilter);
  if (bookFilter)   rows = rows.filter(r => String(r.book_number) === bookFilter);
  if (statusFilter) rows = rows.filter(r => r.status === statusFilter);
  if (facFilter)    rows = rows.filter(r => r.facilitator_id === facFilter);

  // CSV export
  if (format === 'csv') {
    const headers = [
      'Code', 'Book', 'Facilitator Name', 'Facilitator Email',
      'Organization', 'Generated Date', 'Expiry Date',
      'Status', 'Redeemed Date', 'Redeemed By Email',
    ];
    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.join(','),
      ...rows.map(r => [
        escape(r.code),
        escape(r.book_number ? `Book ${r.book_number}` : ''),
        escape(r.facilitator_name),
        escape(r.facilitator_email),
        escape(r.organization_name),
        escape(r.created_at ? new Date(r.created_at).toLocaleDateString() : ''),
        escape(r.expires_at ? new Date(r.expires_at).toLocaleDateString() : ''),
        escape(r.status),
        escape(r.redeemed_at ? new Date(r.redeemed_at).toLocaleDateString() : ''),
        escape(r.redeemed_by_email),
      ].join(',')),
    ];
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="code-activity-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ data: rows, total: rows.length });
}

// POST /api/admin/codes — revoke a batch
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batch_id, action } = await req.json();
  if (!batch_id || action !== 'revoke_batch') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Revoke all active codes in this batch
  const { error } = await supabase
    .from('access_codes')
    .update({ status: 'revoked' })
    .eq('batch_id', batch_id)
    .eq('status', 'active');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
