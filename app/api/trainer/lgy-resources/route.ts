import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];
const SIGNED_URL_EXPIRES = 60;
const BUCKET = 'admin-documents';

// Training manuals per access matrix — track-gated for LGY Trainers
const TRAIN_ELEMENTARY = 'lgy/LGY_TRAIN001_Facilitator_Manual_Elementary.docx';
const TRAIN_MH = 'lgy/LGY_TRAIN002_Facilitator_Manual_MH.docx';
const TRAIN_ASSESSMENT = 'lgy/LGY_TRAIN003_004_Certification_Assessment.docx';

function makeSupabase() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function getSignedUrl(path: string): Promise<string | null> {
  const sb = makeSupabase();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_EXPIRES);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function docLabel(path: string): string {
  return path.split('/').pop()?.replace('.docx', '').replace(/_/g, ' ') ?? path;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = makeSupabase();
  const isOwner = OWNER_EMAILS.includes(user.email ?? '');

  // Load trainer profile
  const { data: profile, error: profileError } = await supabase
    .from('facilitator_profiles')
    .select('lgy_trainer, lgy_authorized_tracks')
    .eq('user_id', user.id)
    .single();

  if (profileError && !isOwner) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const isLgyTrainer = isOwner || (profile?.lgy_trainer === true);
  if (!isLgyTrainer) {
    return NextResponse.json({ error: 'LGY Trainer authorization required' }, { status: 403 });
  }

  const authorizedTracks: string[] = isOwner
    ? ['elementary', 'middle_high']
    : (profile?.lgy_authorized_tracks ?? []);

  const docs: { path: string; label: string; url: string; track: string }[] = [];

  // Elementary manual — gated to elementary authorization
  if (authorizedTracks.includes('elementary')) {
    const url = await getSignedUrl(TRAIN_ELEMENTARY);
    if (url) {
      docs.push({ path: TRAIN_ELEMENTARY, label: docLabel(TRAIN_ELEMENTARY), url, track: 'elementary' });
      await supabase.from('trainer_document_downloads').insert({
        trainer_id: user.id,
        document_name: TRAIN_ELEMENTARY.split('/').pop(),
        program_type: 'youth',
      }).select();
    }
  }

  // Middle/High manual — gated to middle_high authorization
  if (authorizedTracks.includes('middle_high')) {
    const url = await getSignedUrl(TRAIN_MH);
    if (url) {
      docs.push({ path: TRAIN_MH, label: docLabel(TRAIN_MH), url, track: 'middle_high' });
      await supabase.from('trainer_document_downloads').insert({
        trainer_id: user.id,
        document_name: TRAIN_MH.split('/').pop(),
        program_type: 'youth',
      }).select();
    }
  }

  // Assessment — visible for any authorized track
  if (authorizedTracks.length > 0) {
    const url = await getSignedUrl(TRAIN_ASSESSMENT);
    if (url) {
      docs.push({ path: TRAIN_ASSESSMENT, label: docLabel(TRAIN_ASSESSMENT), url, track: 'both' });
      await supabase.from('trainer_document_downloads').insert({
        trainer_id: user.id,
        document_name: TRAIN_ASSESSMENT.split('/').pop(),
        program_type: 'youth',
      }).select();
    }
  }

  return NextResponse.json({ authorized_tracks: authorizedTracks, docs });
}
