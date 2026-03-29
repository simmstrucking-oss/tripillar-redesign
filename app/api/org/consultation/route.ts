import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const getOrgUser = (req: NextRequest) => getUserFromRequest(req);

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function POST(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const body = await req.json();
  const supabase = sb();

  const { error } = await supabase
    .from('consultation_requests')
    .insert({
      org_id: orgId,
      request_type: body.request_type ?? 'General inquiry',
      description: body.description ?? '',
      submitted_by_name: body.submitted_by_name ?? user.user_metadata?.name ?? '',
      submitted_by_email: body.submitted_by_email ?? user.email ?? '',
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_aDy5YJGb_ML9LLRsnH5PD7Np5W6BeKrk3',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ember <ember@tripillarstudio.com>',
        to: 'wayne@tripillarstudio.com',
        subject: `New consultation request: ${body.request_type ?? 'General'}`,
        text: `From: ${body.submitted_by_name ?? 'Org contact'} (${body.submitted_by_email ?? user.email})\n\nType: ${body.request_type}\n\nDescription:\n${body.description ?? 'No description'}`,
      }),
    });
  } catch { /* non-blocking */ }

  return NextResponse.json({ success: true });
}
