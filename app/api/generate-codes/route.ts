import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// ── Code alphabet — no ambiguous chars (0,O,1,I,B,S,Z,2) ────────────────────
const ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY';
const CODE_SUFFIX_LEN = 5;
const CODE_PREFIX = 'LGS-';
const MAX_BATCH = 20;
const DEFAULT_BATCH = 15;
const DEFAULT_WEEKS = 19;       // 13-week program + 6-week buffer
const COHORT_BUFFER_WEEKS = 6;

// ── Auth helper (same pattern as hub routes) ─────────────────────────────────
async function getUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const tokenMatch   = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
  if (!tokenMatch) return null;

  let token: string | undefined;
  try { token = JSON.parse(decodeURIComponent(tokenMatch[1]))?.access_token; } catch { /* ignore */ }
  if (!token) {
    try { token = JSON.parse(atob(tokenMatch[1]))?.access_token; } catch { /* ignore */ }
  }
  if (!token) return null;

  const sb = getServiceClient();
  const { data, error } = await sb.auth.getUser(token);
  return (error || !data?.user) ? null : data.user;
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSuffix(): string {
  const arr = new Uint8Array(CODE_SUFFIX_LEN * 3);
  crypto.getRandomValues(arr);
  let s = '';
  let i = 0;
  while (s.length < CODE_SUFFIX_LEN && i < arr.length) {
    s += ALPHABET[arr[i] % ALPHABET.length];
    i++;
  }
  return s;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

// ── Route ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Parse body
  let body: {
    book_number?: number;
    batch_size?: number;
    cohort_id?: string;
    cohort_end_date?: string;
    notes?: string;
  };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { book_number, cohort_id, cohort_end_date, notes } = body;
  const batch_size = Math.min(Math.max(1, Number(body.batch_size ?? DEFAULT_BATCH)), MAX_BATCH);

  if (!book_number || ![1, 2, 3, 4].includes(Number(book_number))) {
    return NextResponse.json({ error: 'book_number must be 1–4' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Load facilitator profile
  const { data: profile, error: profErr } = await supabase
    .from('facilitator_profiles')
    .select('id, books_certified, organization_id, cert_status')
    .eq('user_id', user.id)
    .single();

  if (profErr || !profile) {
    return NextResponse.json({ error: 'Facilitator profile not found' }, { status: 403 });
  }
  if (profile.cert_status !== 'active') {
    return NextResponse.json({ error: 'Your certification is not active' }, { status: 403 });
  }

  // Enforce book certification
  const certified: number[] = profile.books_certified ?? [];
  if (!certified.includes(Number(book_number))) {
    return NextResponse.json(
      { error: `Not certified for Book ${book_number}. Your certified books: ${certified.join(', ') || 'none'}` },
      { status: 403 }
    );
  }

  // Resolve expiry
  let expiresAt: Date;
  if (cohort_end_date) {
    expiresAt = addWeeks(new Date(cohort_end_date), COHORT_BUFFER_WEEKS);
  } else if (cohort_id) {
    const { data: cohort } = await supabase
      .from('cohorts')
      .select('end_date')
      .eq('id', cohort_id)
      .eq('facilitator_id', profile.id)
      .single();
    expiresAt = cohort?.end_date
      ? addWeeks(new Date(cohort.end_date), COHORT_BUFFER_WEEKS)
      : addWeeks(new Date(), DEFAULT_WEEKS);
  } else {
    expiresAt = addWeeks(new Date(), DEFAULT_WEEKS);
  }

  // Load existing codes for collision check (past year)
  const { data: existingRows } = await supabase
    .from('access_codes')
    .select('code')
    .gte('created_at', new Date(Date.now() - 365 * 86400 * 1000).toISOString());

  const existingCodes = new Set<string>((existingRows ?? []).map((r: { code: string }) => r.code));

  // Generate unique codes
  const codes: string[] = [];
  let attempts = 0;
  while (codes.length < batch_size && attempts < batch_size * 20) {
    const candidate = CODE_PREFIX + generateSuffix();
    if (!existingCodes.has(candidate) && !codes.includes(candidate)) {
      codes.push(candidate);
    }
    attempts++;
  }

  if (codes.length < batch_size) {
    return NextResponse.json({ error: 'Could not generate enough unique codes — try again' }, { status: 500 });
  }

  // Insert batch
  const { data: batch, error: batchErr } = await supabase
    .from('access_code_batches')
    .insert({
      facilitator_id:  profile.id,
      organization_id: profile.organization_id ?? null,
      cohort_id:       cohort_id ?? null,
      book_number:     Number(book_number),
      batch_size,
      expires_at:      expiresAt.toISOString(),
      notes:           notes ?? null,
    })
    .select()
    .single();

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Failed to create batch', detail: batchErr?.message }, { status: 500 });
  }

  // Insert codes
  const codeRows = codes.map(code => ({
    batch_id:        batch.id,
    code,
    book_number:     Number(book_number),
    organization_id: profile.organization_id ?? null,
    facilitator_id:  profile.id,
    expires_at:      expiresAt.toISOString(),
    status:          'active',
  }));

  const { error: codesErr } = await supabase.from('access_codes').insert(codeRows);

  if (codesErr) {
    await supabase.from('access_code_batches').delete().eq('id', batch.id);
    return NextResponse.json({ error: 'Failed to insert codes', detail: codesErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    batch: {
      id:          batch.id,
      book_number: Number(book_number),
      batch_size,
      expires_at:  expiresAt.toISOString(),
      created_at:  batch.created_at,
      notes:       notes ?? null,
    },
    codes,
  });
}
