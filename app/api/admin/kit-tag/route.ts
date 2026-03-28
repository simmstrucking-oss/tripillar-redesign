import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

const KIT_MILESTONE_TAGS: Record<string, string> = {
  'facilitator-milestone-first-session':  'facilitator-milestone-first-session',
  'facilitator-milestone-book1-complete': 'facilitator-milestone-book1-complete',
};

const KIT_MILESTONE_SEQUENCES: Record<string, number> = {
  'facilitator-milestone-first-session':  2701289,  // First Session Milestone sequence
  'facilitator-milestone-book1-complete': 2701295,  // Book 1 Cohort Completion sequence
};

async function kitGetOrCreateTag(tagName: string): Promise<number | null> {
  const secret = process.env.KIT_API_SECRET!;
  const listRes = await fetch(`https://api.convertkit.com/v3/tags?api_secret=${encodeURIComponent(secret)}`);
  if (!listRes.ok) return null;
  const { tags } = await listRes.json();
  const existing = tags?.find((t: { name: string; id: number }) => t.name === tagName);
  if (existing) return existing.id;

  const createRes = await fetch('https://api.convertkit.com/v3/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_secret: secret, tag: { name: tagName } }),
  });
  if (!createRes.ok) return null;
  const data = await createRes.json();
  return data.id ?? null;
}

// POST /api/admin/kit-tag
// Body: { user_id, tag_key }  — tag_key is one of the KIT_MILESTONE_TAGS keys
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user_id, tag_key } = await req.json().catch(() => ({}));
  if (!user_id || !tag_key) {
    return NextResponse.json({ error: 'user_id and tag_key required' }, { status: 400 });
  }
  if (!KIT_MILESTONE_TAGS[tag_key]) {
    return NextResponse.json({ error: `Unknown tag_key. Valid: ${Object.keys(KIT_MILESTONE_TAGS).join(', ')}` }, { status: 400 });
  }

  // Get facilitator email from profile
  const supabase = getSupabaseServer();
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('email, full_name')
    .eq('user_id', user_id)
    .single();

  if (!profile) return NextResponse.json({ error: 'Facilitator not found' }, { status: 404 });

  const firstName = profile.full_name?.split(' ')[0] ?? '';
  const secret    = process.env.KIT_API_SECRET!;

  // Apply tag
  const tagId = await kitGetOrCreateTag(KIT_MILESTONE_TAGS[tag_key]);
  if (!tagId) return NextResponse.json({ error: 'Failed to get/create Kit tag' }, { status: 500 });

  const tagRes = await fetch(`https://api.convertkit.com/v3/tags/${tagId}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_secret: secret, email: profile.email, first_name: firstName }),
  });
  if (!tagRes.ok) return NextResponse.json({ error: 'Kit tag application failed' }, { status: 500 });

  // Enroll in milestone sequence
  const seqId = KIT_MILESTONE_SEQUENCES[tag_key];
  if (seqId) {
    await fetch(`https://api.convertkit.com/v3/sequences/${seqId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_secret: secret, email: profile.email, first_name: firstName }),
    });
  }

  return NextResponse.json({ ok: true, tag: KIT_MILESTONE_TAGS[tag_key], sequence_id: seqId ?? null });
}
