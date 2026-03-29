import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0].trim() || realIp || 'unknown';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const body = await request.json();
    const { event_type, event_data, code_id, prospect_id } = body;

    const ip_address = getClientIp(request);

    // If first code_viewed event, update used_at
    if (event_type === 'code_viewed' && code_id) {
      const { data: codeData } = await supabase
        .from('prospect_codes')
        .select('used_at')
        .eq('id', code_id)
        .single();

      if (codeData && !codeData.used_at) {
        await supabase
          .from('prospect_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', code_id);
      }
    }

    // Log activity
    const { error } = await supabase
      .from('prospect_activity')
      .insert([
        {
          prospect_id,
          code_id,
          event_type,
          event_data: event_data || {},
          ip_address,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error logging activity:', error);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Error in activity route:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
