import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

// ONE-SHOT: Add dismissed_trainer_orientation column
// Will be removed from codebase after confirmed applied
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  const isAdminSecret = secret === process.env.ADMIN_SECRET;

  const user = await getUserFromRequest(req).catch(() => null);
  const isOwner = user && OWNER_EMAILS.includes(user.email ?? '');

  if (!isAdminSecret && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if column already exists
  const { error: checkErr } = await supabase
    .from('facilitator_profiles')
    .select('dismissed_trainer_orientation')
    .limit(1);

  if (!checkErr) {
    return NextResponse.json({ ok: true, note: 'Column already exists' });
  }

  // Column does not exist — add it via raw SQL through pg_net or direct Supabase SQL API
  const sqlReq = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS dismissed_trainer_orientation boolean DEFAULT false;'
      }),
    }
  );

  if (!sqlReq.ok) {
    const body = await sqlReq.text();
    return NextResponse.json({ error: `SQL failed: ${body}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, applied: true });
}
