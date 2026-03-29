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

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const secret = await getAdminSecret();
  if (!secret || !verifyAdminSecret(secret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { expiry_days } = body;

  // Get prospect to fetch sector
  const { data: prospect, error: prospectErr } = await supabase
    .from('prospects')
    .select('sector')
    .eq('id', id)
    .single();

  if (prospectErr || !prospect) {
    return new Response(JSON.stringify({ error: 'Prospect not found' }), { status: 404 });
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
  const { data: codeRecord, error } = await supabase
    .from('prospect_codes')
    .insert([
      {
        prospect_id: id,
        code,
        sector: prospect.sector,
        expiry_days: expiry_days || null,
        expires_at: expiresAt,
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ code: codeRecord }), { status: 201 });
}
