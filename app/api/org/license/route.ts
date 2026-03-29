import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const getOrgUser = (req: NextRequest) => getUserFromRequest(req);


// Owner override: wayne@ and jamie@ bypass all role/permission checks
function isOwnerEmail(email: string | undefined): boolean {
  return email === 'wayne@tripillarstudio.com' || email === 'jamie@tripillarstudio.com';
}

export async function GET(req: NextRequest) {
  const user = await getOrgUser(req);
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const orgId = user.user_metadata?.org_id as string;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: org, error } = await supabase
    .from('organizations')
    .select('license_type, license_status, license_start, license_renewal, contact_name, contact_email')
    .eq('id', orgId)
    .single();

  if (error || !org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });

  let ilaUrl = null;
  const { data: legalFiles } = await supabase.storage
    .from('admin-documents')
    .list('05_LEGAL', { limit: 50 });
  if (legalFiles) {
    const ilaFile = legalFiles.find(f => f.name.includes('License_Agreement') || f.name.includes('ILA'));
    if (ilaFile) {
      const { data: signed } = await supabase.storage
        .from('admin-documents')
        .createSignedUrl(`05_LEGAL/${ilaFile.name}`, 60);
      ilaUrl = signed?.signedUrl ?? null;
    }
  }

  return NextResponse.json({ ...org, ila_url: ilaUrl });
}
