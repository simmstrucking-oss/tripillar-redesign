import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  /* ── 1. Verify webhook secret ─────────────────────────── */
  const secret = process.env.KIT_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[kit-webhook] KIT_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  const sig = req.headers.get('x-kit-signature');
  const qsSecret = req.nextUrl.searchParams.get('secret');
  if (sig !== secret && qsSecret !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  /* ── 2. Parse body ────────────────────────────────────── */
  const body = await req.json();
  const subscriber = body?.subscriber;
  if (!subscriber?.email_address) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const email: string = subscriber.email_address.toLowerCase().trim();
  const firstName: string = subscriber.first_name ?? '';
  const lastName: string = subscriber.last_name ?? '';
  const tags: { name: string }[] = subscriber.tags ?? [];

  /* ── 3. Only act on facilitator-active tag ─────────────── */
  const hasFacilitatorTag = tags.some((t) => t.name === 'facilitator-active');
  if (!hasFacilitatorTag) {
    return NextResponse.json({ ok: true, action: 'ignored' });
  }

  const supabase = getSupabaseServer();

  /* ── 4a. Check if auth user already exists ────────────── */
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === email,
  );

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    /* ── 4b. Create auth user ─────────────────────────── */
    const { data: newUser, error: createErr } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });

    if (createErr || !newUser.user) {
      console.error('[kit-webhook] createUser failed:', createErr);
      return NextResponse.json(
        { error: 'user creation failed' },
        { status: 500 },
      );
    }
    userId = newUser.user.id;
  }

  /* ── 4c. Upsert facilitator_profiles ───────────────── */
  const { error: upsertErr } = await supabase
    .from('facilitator_profiles')
    .upsert(
      {
        user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'community',
        cert_status: 'active',
        onboarding_complete: false,
        onboarding_step: 0,
      },
      { onConflict: 'user_id' },
    );

  if (upsertErr) {
    console.error('[kit-webhook] upsert facilitator_profiles:', upsertErr);
    return NextResponse.json(
      { error: 'profile upsert failed' },
      { status: 500 },
    );
  }

  /* ── 4d. Generate magic link ───────────────────────── */
  const { data: linkData, error: linkErr } =
    await supabase.auth.admin.generateLink({ type: 'magiclink', email });

  if (linkErr || !linkData?.properties?.action_link) {
    console.error('[kit-webhook] generateLink failed:', linkErr);
    return NextResponse.json(
      { error: 'magic link generation failed' },
      { status: 500 },
    );
  }

  const magicLink = linkData.properties.action_link;

  /* ── 4e. Send welcome email via Resend ─────────────── */
  const displayName = firstName || 'there';

  await sendMail({
    to: email,
    subject: 'Your Live and Grieve™ Hub access is ready',
    html: brandedHtml(
      'Your Hub Access Is Ready',
      `<p style="font-size:15px;color:#2D3142;line-height:1.7;">
        Hi ${displayName},
      </p>
      <p style="font-size:15px;color:#2D3142;line-height:1.7;">
        Your Live and Grieve™ facilitator hub access is ready. Click the button
        below to set your password and access your training materials.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${magicLink}"
           style="display:inline-block;padding:14px 32px;background:#1c3028;color:#B8942F;
                  font-weight:bold;text-decoration:none;border-radius:6px;font-size:15px;">
          Access Your Hub
        </a>
      </p>
      <p style="font-size:13px;color:#706a62;line-height:1.6;">
        This link expires in 24 hours. If you have any questions, contact
        <a href="mailto:wayne@tripillarstudio.com" style="color:#1c3028;">wayne@tripillarstudio.com</a>.
      </p>
      <p style="font-size:15px;color:#2D3142;line-height:1.7;margin-top:24px;">
        — Live and Grieve™ Team, Tri-Pillars™ LLC
      </p>`,
    ),
  });

  return NextResponse.json({ ok: true, action: 'provisioned', userId });
}
