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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const secret = await getAdminSecret();
  if (!secret || !verifyAdminSecret(secret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;

  // Get prospect
  const { data: prospect, error: prospectErr } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single();

  if (prospectErr || !prospect) {
    return new Response(JSON.stringify({ error: 'Prospect not found' }), { status: 404 });
  }

  // Get all codes
  const { data: codes } = await supabase
    .from('prospect_codes')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false });

  // Get all activity
  const { data: activity } = await supabase
    .from('prospect_activity')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false });

  // Get all call requests
  const { data: callRequests } = await supabase
    .from('prospect_call_requests')
    .select('*')
    .eq('prospect_id', id)
    .order('created_at', { ascending: false });

  return new Response(
    JSON.stringify({ prospect, codes, activity, callRequests }),
    { status: 200 }
  );
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const secret = await getAdminSecret();
  if (!secret || !verifyAdminSecret(secret)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { org_name, contact_name, contact_email, contact_phone, sector, notes, status } = body;

  const updates: Record<string, any> = {};
  if (org_name !== undefined) updates.org_name = org_name;
  if (contact_name !== undefined) updates.contact_name = contact_name;
  if (contact_email !== undefined) updates.contact_email = contact_email;
  if (contact_phone !== undefined) updates.contact_phone = contact_phone;
  if (sector !== undefined) updates.sector = sector;
  if (notes !== undefined) updates.notes = notes;
  if (status !== undefined) updates.status = status;

  const { data: prospect, error } = await supabase
    .from('prospects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ prospect }), { status: 200 });
}
