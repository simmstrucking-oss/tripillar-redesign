import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];
const SIGNED_URL_EXPIRES = 60;
const BUCKET = 'facilitator-documents';

/* ─────────────────────────────────────────────────────────────────────────
   LGY SESSION GUIDES ARE NOT SERVED DIGITALLY THROUGH THE HUB.
   Elementary and Middle/High Facilitator Guides (S1–S13) are physical
   materials provided at certification training.
   This route serves ONLY the 5 LGY shared non-book documents.
──────────────────────────────────────────────────────────────────────────*/

const SHARED_DOCS = [
  'lgy/LGY_Youth_Participant_Appropriateness_Guide.docx',
  'lgy/LGY_GOV007_NACG_Alignment_Statement.docx',
  'lgy/LGY_Caregiver_Enrollment_Packet.docx',
  'lgy/LGY_ENR003_PreEnrollment_Conversation_Guide.docx',
  'lgy/LGY_Certificate_of_Completion.docx',
];

function docLabel(path: string): string {
  const name = path.split('/').pop()?.replace('.docx', '').replace(/_/g, ' ') ?? path;
  return name;
}

function makeSupabase() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getSignedUrl(path: string): Promise<string | null> {
  const sb = makeSupabase();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRES);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = makeSupabase();
  const isOwner = OWNER_EMAILS.includes(user.email ?? '');

  const { data: profile, error: profileError } = await supabase
    .from('facilitator_profiles')
    .select('lgy_certified_tracks, lgy_trainer')
    .eq('user_id', user.id)
    .single();

  if (profileError && !isOwner) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const tracks: string[] = isOwner
    ? ['elementary', 'middle_high']
    : (profile?.lgy_certified_tracks ?? []);

  if (!isOwner && tracks.length === 0) {
    return NextResponse.json({ error: 'No LGY certification on file' }, { status: 403 });
  }

  // Build shared docs section
  const sharedDocs = [];
  for (const path of SHARED_DOCS) {
    if (path.endsWith('.keep')) continue;
    const url = await getSignedUrl(path);
    if (!url) continue;

    await supabase.from('document_access_log').insert({
      user_id: user.id,
      document_name: path.split('/').pop(),
      bucket: BUCKET,
      role: 'lgy_facilitator',
      program_type: 'youth',
    });

    sharedDocs.push({ path, label: docLabel(path), url, category: 'Shared Resources' });
  }

  const sections: Record<string, { label: string; docs: typeof sharedDocs }> = {};
  if (sharedDocs.length > 0) {
    sections.shared = { label: 'Shared Resources', docs: sharedDocs };
  }

  return NextResponse.json({
    tracks,
    sections,
    physicalMaterialsNotice: 'Physical program materials are provided at certification training. Digital access coming soon.',
  });
}
