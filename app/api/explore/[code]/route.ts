import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: rawCode } = await params;
    const code = rawCode.toUpperCase();

    const { data: codeData, error: codeError } = await supabase
      .from('prospect_codes')
      .select('id, code, sector, expires_at, used_at, prospect_id, status')
      .eq('code', code)
      .single();

    if (codeError || !codeData) {
      return NextResponse.json(
        { error: 'invalid' },
        { status: 404 }
      );
    }

    // Check if expired
    if (codeData.expires_at) {
      const expiresAt = new Date(codeData.expires_at);
      if (expiresAt < new Date()) {
        // Update status to expired
        await supabase
          .from('prospect_codes')
          .update({ status: 'expired' })
          .eq('id', codeData.id);

        return NextResponse.json(
          { error: 'expired' },
          { status: 410 }
        );
      }
    }

    // Get prospect data
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('org_name, sector')
      .eq('id', codeData.prospect_id)
      .single();

    if (prospectError || !prospect) {
      return NextResponse.json(
        { error: 'invalid' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prospect: {
        org_name: prospect.org_name,
        sector: prospect.sector
      },
      code: {
        id: codeData.id,
        code: codeData.code,
        sector: codeData.sector,
        expires_at: codeData.expires_at,
        used_at: codeData.used_at,
        prospect_id: codeData.prospect_id
      }
    });

  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json(
      { error: 'server_error' },
      { status: 500 }
    );
  }
}
