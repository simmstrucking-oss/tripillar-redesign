import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Migration status check — run manually in Supabase SQL editor if column is missing:
// ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS dismissed_trainer_orientation boolean DEFAULT false;

const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await supabase
    .from('facilitator_profiles')
    .select('dismissed_trainer_orientation')
    .limit(1);

  const exists = !error;
  return NextResponse.json({
    dismissed_trainer_orientation_column_exists: exists,
    sql_to_run_if_missing: exists ? null :
      'ALTER TABLE facilitator_profiles ADD COLUMN IF NOT EXISTS dismissed_trainer_orientation boolean DEFAULT false;',
  });
}
