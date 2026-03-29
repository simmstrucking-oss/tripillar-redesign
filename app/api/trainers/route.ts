import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/trainers — public list of trainers who opted into public listing
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase
    .from('facilitator_profiles')
    .select(
      'id, full_name, books_authorized_to_train, trainer_cert_id, trainer_cert_issued, trainer_cert_renewal, trainer_status, organization_id'
    )
    .eq('role', 'trainer')
    .eq('is_publicly_listed', true)
    .eq('trainer_status', 'active')
    .order('full_name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Strip internal IDs — only expose what's needed for public display
  const trainers = (data ?? []).map((t) => ({
    id: t.id,
    full_name: t.full_name,
    trainer_cert_id: t.trainer_cert_id,
    cert_issued: t.trainer_cert_issued,
    cert_renewal: t.trainer_cert_renewal,
    books_authorized: t.books_authorized_to_train ?? [],
  }));

  return NextResponse.json({ trainers });
}
