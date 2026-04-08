import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronRequest } from '@/lib/cron-auth';
import { sendMail, brandedHtml } from '@/lib/mailer';

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = sb();

  // Find cohorts completed 83–97 days ago that haven't had followup reminder sent
  const now = new Date();
  const d97 = new Date(now.getTime() - 97 * 86400000).toISOString();
  const d83 = new Date(now.getTime() - 83 * 86400000).toISOString();

  const { data: cohorts, error } = await supabase
    .from('cohorts')
    .select('id, facilitator_id, end_date')
    .eq('status', 'completed')
    .eq('followup_reminder_sent', false)
    .gte('end_date', d97)
    .lte('end_date', d83);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!cohorts || cohorts.length === 0) {
    return NextResponse.json({ ok: true, message: 'No cohorts due for followup reminder' });
  }

  let sent = 0;
  for (const cohort of cohorts) {
    const { data: profile } = await supabase
      .from('facilitator_profiles')
      .select('email, full_name')
      .eq('id', cohort.facilitator_id)
      .single();

    if (!profile?.email) continue;

    const followupUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tripillarstudio.com'}/outcomes/followup?cohort=${cohort.id}`;

    await sendMail({
      to: profile.email,
      subject: 'Live and Grieve\u2122 \u2014 90-Day Follow-Up Reminder',
      html: brandedHtml('90-Day Follow-Up Reminder', `
        <p style="font-size:15px;color:#2D3142;line-height:1.7;">
          Hi ${profile.full_name ?? 'there'},
        </p>
        <p style="font-size:15px;color:#2D3142;line-height:1.7;">
          Approximately 90 days have passed since your cohort completed the Live and Grieve\u2122 program.
          If any participants consented to a follow-up contact, you may now send them the link below.
        </p>
        <p style="font-size:15px;color:#2D3142;line-height:1.7;">
          <strong>Follow-up form link:</strong><br>
          <a href="${followupUrl}" style="color:#2D5016;word-break:break-all;">${followupUrl}</a>
        </p>
        <p style="font-size:14px;color:#6B7280;line-height:1.7;">
          Only send this to participants who checked the consent box on their post-program form.
          The form asks one brief question about how they are doing.
        </p>
      `),
    });

    await supabase.from('cohorts')
      .update({ followup_reminder_sent: true })
      .eq('id', cohort.id);

    sent++;
  }

  return NextResponse.json({ ok: true, message: `Sent ${sent} followup reminder(s)` });
}
