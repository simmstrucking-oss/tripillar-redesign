import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_SECRET_HASH = '0b75d805165cac96a294a87f68d5b9dbc85dd1d5058cb445563d15647bd530b2';

function verifyAdminSecret(secret: string): boolean {
  const hash = crypto.createHash('sha256').update(secret).digest('hex');
  return hash === ADMIN_SECRET_HASH;
}

async function getAdminSecret(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin-secret');
  return session?.value ?? null;
}

function generateUniqueCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function codeExists(code: string): Promise<boolean> {
  const { data } = await supabase
    .from('prospect_codes')
    .select('id')
    .eq('code', code)
    .single();
  return !!data;
}

async function generateUniqueProspectCode(): Promise<string> {
  let code: string;
  let exists = true;
  while (exists) {
    code = generateUniqueCode(8);
    exists = await codeExists(code);
  }
  return code!;
}

export async function GET(req: Request) {
  const secret = await getAdminSecret();
  if (!secret || !verifyAdminSecret(secret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data: prospects, error: err1 } = await supabase
    .from('prospects')
    .select('*')
    .order('created_at', { ascending: false });

  if (err1) return new Response(JSON.stringify({ error: err1.message }), { status: 500 });

  // Enrich with latest code and activity
  const enriched = await Promise.all(
    (prospects || []).map(async (p) => {
      const { data: codes } = await supabase
        .from('prospect_codes')
        .select('*')
        .eq('prospect_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: activity } = await supabase
        .from('prospect_activity')
        .select('created_at')
        .eq('prospect_id', p.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: callReqs } = await supabase
        .from('prospect_call_requests')
        .select('id')
        .eq('prospect_id', p.id)
        .limit(1);

      return {
        ...p,
        latest_code: codes?.[0] ?? null,
        last_activity: activity?.[0]?.created_at ?? null,
        call_requested: !!callReqs?.[0],
      };
    })
  );

  return new Response(JSON.stringify({ data: enriched }), { status: 200 });
}

export async function POST(req: Request) {
  const secret = await getAdminSecret();
  if (!secret || !verifyAdminSecret(secret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await req.json();
  const { org_name, contact_name, contact_email, contact_phone, sector, notes, expiry_days } = body;

  if (!org_name || !contact_name || !contact_email || !sector) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  // Create prospect
  const { data: prospect, error: prospectErr } = await supabase
    .from('prospects')
    .insert([
      {
        org_name,
        contact_name,
        contact_email,
        contact_phone: contact_phone || null,
        sector,
        notes: notes || null,
        status: 'active',
        created_by: contact_email,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (prospectErr || !prospect) {
    return new Response(JSON.stringify({ error: prospectErr?.message || 'Failed to create prospect' }), {
      status: 500,
    });
  }

  // Generate unique code
  const code = await generateUniqueProspectCode();

  // Calculate expires_at if expiry_days provided
  let expiresAt = null;
  if (expiry_days) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiry_days);
    expiresAt = expiryDate.toISOString();
  }

  // Create code record
  const { data: codeRecord, error: codeErr } = await supabase
    .from('prospect_codes')
    .insert([
      {
        prospect_id: prospect.id,
        code,
        sector,
        expiry_days: expiry_days || null,
        expires_at: expiresAt,
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (codeErr) {
    return new Response(JSON.stringify({ error: codeErr.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ prospect, code: codeRecord }),
    { status: 201 }
  );
}
