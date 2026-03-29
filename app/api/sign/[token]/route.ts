import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { data, error } = await supabase
      .from('agreements')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'invalid' });
    }

    // Check if expired
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: 'expired' });
    }

    // Check status
    if (data.status === 'org_signed' || data.status === 'fully_executed') {
      return NextResponse.json({ error: 'already_signed' });
    }

    return NextResponse.json({ agreement: data });
  } catch (err) {
    console.error('Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
