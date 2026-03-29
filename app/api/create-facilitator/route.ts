import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Sequence IDs (Part 5) ─────────────────────────────────────────────────────
const KIT_SEQUENCES = {
  facilitatorWelcome:        2701285,
  firstSessionMilestone:     2701289,
  weeklyCheckIn:             2701291,
  monthlyCheckIn:            2701292,
  quarterlyDataRequest:      2701294,
  book1CohortCompletion:     2701295,
  renewalReminder60:         2701296,
  renewalReminder30:         2701298,
  renewalFinalNotice7:       2701299,
  oneYearAnniversary:        2701300,
};

// ── Kit tag IDs ───────────────────────────────────────────────────────────────
const KIT_TAGS = {
  facilitatorActive:         'facilitator-active',       // created during Part 5 setup
  facilitatorPending:        'facilitator-pending',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateCertId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `LG-${year}-${rand}`;
}

function getRenewalDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

async function kitRequest(path: string, body: Record<string, unknown>): Promise<Response> {
  const apiSecret = process.env.KIT_API_SECRET!;
  return fetch(`https://api.convertkit.com/v3${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_secret: apiSecret, ...body }),
  });
}

async function kitGet(path: string): Promise<Response> {
  const apiSecret = process.env.KIT_API_SECRET!;
  return fetch(`https://api.convertkit.com/v3${path}?api_secret=${encodeURIComponent(apiSecret)}`);
}

async function getOrCreateKitTag(tagName: string): Promise<number | null> {
  // List tags and find by name
  const listRes = await kitGet('/tags');
  if (!listRes.ok) return null;
  const { tags } = await listRes.json();
  const existing = tags?.find((t: { name: string; id: number }) => t.name === tagName);
  if (existing) return existing.id;

  // Create it
  const createRes = await kitRequest('/tags', { tag: { name: tagName } });
  if (!createRes.ok) return null;
  const data = await createRes.json();
  return data.id ?? null;
}

async function kitSubscribeToSequence(sequenceId: number, email: string, firstName: string, fields?: Record<string, string>): Promise<{ ok: boolean; subscriberId?: string }> {
  const res = await kitRequest(`/sequences/${sequenceId}/subscribe`, {
    email,
    first_name: firstName,
    fields: fields ?? {},
  });
  if (!res.ok) return { ok: false };
  const data = await res.json();
  const subscriberId = data?.subscription?.subscriber?.id?.toString() ?? data?.subscriber?.id?.toString();
  return { ok: true, subscriberId };
}

async function kitTagSubscriber(tagId: number, email: string, firstName: string): Promise<boolean> {
  const res = await kitRequest(`/tags/${tagId}/subscribe`, {
    email,
    first_name: firstName,
  });
  return res.ok;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth guard — admin secret header
  const adminSecret = req.headers.get('x-admin-secret');
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body
  let body: {
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    org_id?: string;
    track?: string;      // community | professional | ministry
    temp_password: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, first_name, last_name, phone, org_id, track, temp_password, books_certified, books_authorized_to_train } = body as typeof body & { books_certified?: number[]; books_authorized_to_train?: number[] };

  if (!email || !first_name || !last_name || !temp_password) {
    return NextResponse.json(
      { error: 'Required fields: email, first_name, last_name, temp_password' },
      { status: 400 }
    );
  }

  // Supabase admin client (service role — bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const steps: Record<string, unknown> = {};
  let authUserId: string;
  let certId: string;

  // ── Sub-step 1: Create Supabase auth user ────────────────────────────────────
  {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,   // pre-confirm — they log in with the temp password
      user_metadata: { first_name, last_name, role: 'facilitator' },
    });

    if (error || !data?.user) {
      return NextResponse.json(
        { error: 'Auth user creation failed', detail: error?.message, steps },
        { status: 500 }
      );
    }

    authUserId = data.user.id;
    steps.auth_user = { status: 'ok', user_id: authUserId };
  }

  // ── Sub-step 2: Create facilitator_profiles row ──────────────────────────────
  certId = generateCertId();
  const renewalDate = getRenewalDate();

  {
    const { error } = await supabase.from('facilitator_profiles').insert({
      user_id:         authUserId,
      email,
      full_name:       `${first_name} ${last_name}`,
      phone:           phone ?? null,
      organization_id: org_id ?? null,
      role:            track ?? 'community',
      books_certified: books_certified ?? [],
      cert_id:         certId,
      cert_status:     'active',
      cert_issued:     new Date().toISOString().split('T')[0],
      cert_renewal:    renewalDate,
      created_at:      new Date().toISOString(),
      ...(track === 'trainer' ? {
        books_authorized_to_train: books_authorized_to_train ?? [],
        trainer_status: 'active',
        trainer_cert_id: certId,
        trainer_cert_issued: new Date().toISOString().split('T')[0],
        trainer_cert_renewal: renewalDate,
      } : {}),
    });

    if (error) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { error: 'facilitator_profiles insert failed', detail: error.message, steps },
        { status: 500 }
      );
    }

    steps.facilitator_profile = { status: 'ok', cert_id: certId, cert_renewal: renewalDate };
  }

  // ── Sub-step 3: Cert ID already generated above — confirm it ─────────────────
  steps.cert_id = { status: 'ok', cert_id: certId };

  // ── Sub-step 4: Kit subscription + Welcome sequence enrollment ───────────────
  let kitSubscriberId: string | undefined;
  {
    const result = await kitSubscribeToSequence(
      KIT_SEQUENCES.facilitatorWelcome,
      email,
      first_name,
      {
        cert_id:       certId,
        cert_renewal:  renewalDate,
        track:         track ?? 'community',
        temp_password,   // included so welcome email can show it
      }
    );

    if (!result.ok) {
      // Non-fatal — log but don't roll back
      steps.kit_sequence = { status: 'warning', detail: 'Kit enrollment failed — retry manually' };
    } else {
      kitSubscriberId = result.subscriberId;
      steps.kit_sequence = { status: 'ok', sequence_id: KIT_SEQUENCES.facilitatorWelcome, subscriber_id: kitSubscriberId };

      // Store Kit subscriber ID back on the profile (best effort)
      if (kitSubscriberId) {
        await supabase.from('facilitator_profiles')
          .update({ kit_subscriber_id: kitSubscriberId })
          .eq('user_id', authUserId);
      }
    }
  }

  // ── Sub-step 5: Kit tagging (facilitator-active + facilitator-[track]) ────────
  {
    const tagResults: Record<string, string> = {};

    // Tag: facilitator-active
    const activeTagId = await getOrCreateKitTag('facilitator-active');
    if (activeTagId) {
      const ok = await kitTagSubscriber(activeTagId, email, first_name);
      tagResults['facilitator-active'] = ok ? 'ok' : 'failed';
    } else {
      tagResults['facilitator-active'] = 'tag-not-found';
    }

    // Tag: facilitator-[track]
    const trackTag = `facilitator-${track ?? 'community'}`;
    const trackTagId = await getOrCreateKitTag(trackTag);
    if (trackTagId) {
      const ok = await kitTagSubscriber(trackTagId, email, first_name);
      tagResults[trackTag] = ok ? 'ok' : 'failed';
    } else {
      tagResults[trackTag] = 'tag-not-found';
    }

    steps.kit_tags = { status: 'ok', tags: tagResults };
  }

  // ── Done ─────────────────────────────────────────────────────────────────────
  return NextResponse.json({
    ok: true,
    facilitator: {
      user_id:      authUserId,
      email,
      first_name,
      last_name,
      cert_id:      certId,
      cert_renewal: renewalDate,
      track:        track ?? 'community',
    },
    steps,
  });
}
