import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];
const SIGNED_URL_EXPIRES = 60;
const BUCKET = 'facilitator-documents';

// Access matrix per LGY_Hub_Access_Matrix.md
// Shared docs — all certified LGY facilitators
const SHARED_DOCS = [
  'lgy/LGY_Youth_Participant_Appropriateness_Guide.docx',
  'lgy/LGY_GOV007_NACG_Alignment_Statement.docx',
  'lgy/LGY_Caregiver_Enrollment_Packet.docx',
  'lgy/LGY_ENR003_PreEnrollment_Conversation_Guide.docx',
  'lgy/LGY_Certificate_of_Completion.docx',
];

// Elementary Facilitator Guides — gated to lgy_certified_tracks includes 'elementary'
const ELEMENTARY_GUIDES = [
  'lgy/LGY_E_S1_Facilitator_Guide.docx',
  'lgy/LGY_E_S2_Facilitator_Guide.docx',
  'lgy/LGY_E_S3_Facilitator_Guide.docx',
  'lgy/LGY_E_S4_Facilitator_Guide.docx',
  'lgy/LGY_E_S5_Facilitator_Guide.docx',
  'lgy/LGY_E_S6_Facilitator_Guide.docx',
  'lgy/LGY_E_S7_Facilitator_Guide.docx',
  'lgy/LGY_E_S8_Facilitator_Guide.docx',
  'lgy/LGY_E_S9_Facilitator_Guide.docx',
  'lgy/LGY_E_S10_Facilitator_Guide.docx',
  'lgy/LGY_E_S11_Facilitator_Guide.docx',
  'lgy/LGY_E_S12_Facilitator_Guide.docx',
  'lgy/LGY_E_S13_Facilitator_Guide.docx',
];

// Middle/High Facilitator Guides — gated to lgy_certified_tracks includes 'middle_high'
const MH_GUIDES = [
  'lgy/LGY_MH_S1_Facilitator_Guide.docx',
  'lgy/LGY_MH_S2_Facilitator_Guide.docx',
  'lgy/LGY_MH_S3_Facilitator_Guide.docx',
  'lgy/LGY_MH_S4_Facilitator_Guide.docx',
  'lgy/LGY_MH_S5_Facilitator_Guide.docx',
  'lgy/LGY_MH_S6_Facilitator_Guide.docx',
  'lgy/LGY_MH_S7_Facilitator_Guide.docx',
  'lgy/LGY_MH_S8_Facilitator_Guide.docx',
  'lgy/LGY_MH_S9_Facilitator_Guide.docx',
  'lgy/LGY_MH_S10_Facilitator_Guide.docx',
  'lgy/LGY_MH_S11_Facilitator_Guide.docx',
  'lgy/LGY_MH_S12_Facilitator_Guide.docx',
  'lgy/LGY_MH_S13_Facilitator_Guide.docx',
];

function docLabel(path: string): string {
  const name = path.split('/').pop()?.replace('.docx', '').replace(/_/g, ' ') ?? path;
  return name;
}

async function getSignedUrl(
  supabase: ReturnType<typeof createClient>,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function buildSection(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  paths: string[],
  category: string,
  programType: string = 'youth'
) {
  const docs = [];
  for (const path of paths) {
    if (path.endsWith('.keep')) continue;
    const url = await getSignedUrl(supabase, path);
    if (!url) continue; // silently omit — file not yet uploaded

    // Log access
    await supabase.from('document_access_log').insert({
      user_id: userId,
      document_name: path.split('/').pop(),
      bucket: BUCKET,
      role: 'lgy_facilitator',
      program_type: programType,
    });

    docs.push({ path, label: docLabel(path), url, category });
  }
  return docs;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const isOwner = OWNER_EMAILS.includes(user.email ?? '');

  // Load facilitator profile for LGY track gating
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

  // Must have at least one LGY track (or be owner)
  if (!isOwner && tracks.length === 0) {
    return NextResponse.json({ error: 'No LGY certification on file' }, { status: 403 });
  }

  const sections: Record<string, { label: string; docs: { path: string; label: string; url: string; category: string }[] }> = {};

  // Shared documents — all certified LGY facilitators
  const sharedDocs = await buildSection(supabase, user.id, SHARED_DOCS, 'Shared Resources');
  if (sharedDocs.length > 0) {
    sections.shared = { label: 'Shared Resources', docs: sharedDocs };
  }

  // Elementary track docs
  if (tracks.includes('elementary')) {
    const eDocs = await buildSection(supabase, user.id, ELEMENTARY_GUIDES, 'Elementary Facilitator Guides');
    if (eDocs.length > 0) {
      sections.elementary = { label: 'Elementary Track (Ages 8–12)', docs: eDocs };
    }
  }

  // Middle/High track docs
  if (tracks.includes('middle_high')) {
    const mhDocs = await buildSection(supabase, user.id, MH_GUIDES, 'Middle/High Facilitator Guides');
    if (mhDocs.length > 0) {
      sections.middle_high = { label: 'Middle/High Track (Ages 13–17)', docs: mhDocs };
    }
  }

  return NextResponse.json({ tracks, sections });
}
