/**
 * GET /api/cron/content-calendar
 * Schedule: every Sunday 8:00 AM ET (13:00 UTC)
 *
 * Generates a content calendar for the coming week and emails Wayne.
 * Includes:
 *   - Mon/Wed/Fri blog draft topic suggestions (seasonal/awareness-based)
 *   - TikTok/YouTube videos posting this week (from DB cohort milestones)
 *   - Program milestones worth posting about
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';
import { getSupabaseServer } from '@/lib/supabase-server';
import { sendMail, brandedHtml } from '@/lib/mailer';

export const dynamic  = 'force-dynamic';
export const maxDuration = 30;

// ── Seasonal/awareness topic bank ─────────────────────────────────────────────
// Indexed by [month][week 1-4]. Topics are specific and grounded in real
// grief-adjacent awareness dates rather than generic suggestions.
type TopicSet = { mon: string; wed: string; fri: string; context: string };

function getWeekTopics(weekOf: Date): TopicSet {
  const month = weekOf.getMonth() + 1;
  const week  = Math.ceil(weekOf.getDate() / 7); // 1–4

  const topics: Record<number, Record<number, TopicSet>> = {
    1: { // January
      1: { context: 'New Year, grief resolutions', mon: 'Grief in the New Year: Why January Hits Different', wed: 'How to Set Grief-Aware Intentions (Not Resolutions)', fri: 'The First Year Without Them — and Every Year After' },
      2: { context: 'Martin Luther King Jr. Day', mon: 'Collective Grief and the Ongoing Work of Healing', wed: 'Community Loss vs. Personal Loss: Both Are Real', fri: 'What Dr. King Taught Us About Carrying Grief Forward' },
      3: { context: 'Winter isolation, grief anniversaries', mon: 'Why Winter Is the Hardest Season for Grievers', wed: 'Grief Anniversaries: How to Prepare and Get Through Them', fri: 'What I Wish I Had Known in the Depths of Winter Grief' },
      4: { context: 'End of January, mental health check-in', mon: 'Grief and Depression: How to Tell the Difference', wed: 'A Month Into the New Year — How Are Your Grievers Doing?', fri: 'You Don\'t Have to Be Okay Right Now' },
    },
    2: { // February
      1: { context: 'Black History Month begins, Heart Disease Awareness', mon: 'Sudden Loss and Cardiac Death: Supporting Families in Shock', wed: 'Black Grief: The Weight of Loss Inside a Larger Loss', fri: 'What February Teaches Us About the Heart' },
      2: { context: 'Valentine\'s Day approach, widowhood grief', mon: 'Valentine\'s Day After Loss: Navigating Love and Grief Together', wed: 'Widowhood at Any Age: What Facilitators Need to Know', fri: 'A Love Letter to Those Facing February Alone' },
      3: { context: 'President\'s Day, mid-winter', mon: 'Historical Grief: How We Process National and Collective Loss', wed: 'The Dual Process Model in Practice: Oscillation Is Normal', fri: 'What Getting Through February Teaches You About Resilience' },
      4: { context: 'End of February, rare disease day', mon: 'Grief After a Long Illness: The Relief That Comes With Guilt', wed: 'Anticipatory Grief: Mourning Someone Who Is Still Here', fri: 'The Long Goodbye: One Family\'s Experience With Illness and Loss' },
    },
    3: { // March
      1: { context: 'National Social Worker Month, Women\'s History Month', mon: 'The Role of Social Workers in Grief Support — and Where Live and Grieve™ Fits', wed: 'Women and Grief: The Labor of Carrying Everyone\'s Loss', fri: 'She Carried It Quietly: Stories of Women Who Grieved' },
      2: { context: 'Spring begins, St. Patrick\'s Day', mon: 'Spring and the Complicated Feelings of New Beginnings After Loss', wed: 'Grief and Cultural Traditions: Honoring Heritage in Mourning', fri: 'When the World Blooms and You Still Can\'t' },
      3: { context: 'International Day of Happiness (Mar 20), equinox', mon: 'Can You Be Happy and Grieving at the Same Time? Yes.', wed: 'Meaning Reconstruction: Finding Purpose Without Forgetting', fri: 'The Day I Laughed Again — and Why It Scared Me' },
      4: { context: 'End of March, Holy Week possible', mon: 'Faith, Doubt, and Grief: What Happens to Belief After Loss', wed: 'How Facilitators Can Hold Space for Faith and Grief Together', fri: 'What Easter (and Spring) Means When Someone You Love Is Gone' },
    },
    4: { // April
      1: { context: 'Minority Health Month, Sexual Assault Awareness Month, Palm Sunday/Holy Week', mon: 'Grief in Communities of Color: Why Culturally Responsive Support Matters', wed: 'How Live and Grieve™ Centers Every Grief Story', fri: 'What Faith Communities Can Do When Someone Is Grieving' },
      2: { context: 'National Sibling Day (Apr 10), Tax Day stress', mon: 'Sibling Loss: The Grief That Often Goes Unacknowledged', wed: 'Why Spring Can Be One of the Hardest Seasons for Grievers', fri: 'Your Grief Doesn\'t Need a Season — It Just Needs Space' },
      3: { context: 'National Infertility Awareness Week', mon: 'Grief Without a Body: Understanding Pregnancy and Infertility Loss', wed: 'The Hidden Grief of What Never Happened', fri: 'When Your Loss Doesn\'t Have a Funeral' },
      4: { context: 'Administrative Professionals Week, late April', mon: 'Grief in the Workplace: What Leaders and Coworkers Need to Know', wed: 'Returning to Work After a Loss — What No One Tells You', fri: 'Grief Doesn\'t Take a Day Off' },
    },
    5: { // May
      1: { context: 'Mental Health Awareness Month begins', mon: 'The Link Between Grief and Mental Health: What the Research Says', wed: 'Grief Is Not a Mental Illness — But It Can Become One Without Support', fri: 'Taking Care of Your Mental Health While You Grieve' },
      2: { context: "Mother's Day (2nd Sunday of May)", mon: "Mother's Day When Your Mother Is Gone", wed: "Holding Space for Everyone on Mother's Day", fri: "To the Mothers Who Are Grieving This Sunday" },
      3: { context: 'National Police Week, Military Appreciation Month', mon: 'Grief in First Responder Communities: What Families Carry', wed: 'Honoring Those Who Serve — and the Families Left Behind', fri: 'The Silence of Service: When Heroes Can\'t Talk About Their Grief' },
      4: { context: "Memorial Day week, National Missing Children's Day", mon: 'Memorial Day and the Grief That Never Ends: A Note for Military Families', wed: 'Creating Meaningful Rituals When No Grave Exists', fri: 'How to Honor the Living Grief of a Missing Loved One' },
    },
    6: { // June
      1: { context: 'LGBTQ+ Pride Month, Alzheimer\'s & Brain Awareness Month', mon: 'LGBTQ+ Grief: Disenfranchised Loss and Found Family', wed: 'Dementia and the Long Goodbye: Supporting Alzheimer\'s Families', fri: 'Grief Has No Borders — Honoring Every Identity' },
      2: { context: "Father's Day (3rd Sunday of June)", mon: "Father's Day When Your Father Is Gone", wed: "Fatherhood, Loss, and the Men Who Grieve Quietly", fri: "To the Dads Who Are Grieving Too" },
      3: { context: 'Juneteenth, end of school year', mon: 'Grief and the School Year: How Kids Process Loss Over the Summer', wed: 'Juneteenth and the Grief of Generational Trauma', fri: 'Summer Doesn\'t Feel Like Summer Anymore' },
      4: { context: 'Late June, summer solstice grief', mon: 'The Longest Day: Grief and the Summer Solstice', wed: 'When Vacations and Family Gatherings Trigger Grief', fri: 'The Empty Chair at Every Summer Table' },
    },
    7: { // July — Bereaved Parents Awareness Month
      1: { context: 'Bereaved Parents Awareness Month begins', mon: 'July Is Bereaved Parents Month: What Parents Who Have Lost a Child Need You to Know', wed: 'No Hierarchy of Grief — But Losing a Child Is Its Own World', fri: 'A Letter to the Parents Who Are Spending July Without Their Child' },
      2: { context: 'Mid-summer, heat and isolation', mon: 'Summer Isolation and Grief: When Everyone Else Is Celebrating', wed: 'How Grief Groups Stay Connected in the Summer Months', fri: 'What the Heat of Summer Taught Me About Sitting With Pain' },
      3: { context: 'Late July, anticipating August', mon: 'Back-to-School Grief: When September Feels Impossible', wed: 'Facilitator Burnout in Summer: Caring for Yourself Too', fri: 'The Things That Still Make Me Think of You in Summer' },
      4: { context: 'End of Bereaved Parents Month', mon: 'What Bereaved Parents Want You to Stop Saying', wed: 'How the Live and Grieve™ Framework Supports Bereaved Parents', fri: 'The Month Is Ending — The Grief Is Not' },
    },
    8: { // August
      1: { context: 'Back-to-school season, grief re-entry', mon: 'Grief and Back-to-School: What Parents and Teachers Should Know', wed: 'Supporting Grieving Children When School Starts Again', fri: 'The Empty Backpack: A Parent\'s Grief Letter' },
      2: { context: 'National Grief Awareness Day (Aug 30) approaching', mon: 'What Grief Awareness Day Actually Means — and Why It\'s Not Enough', wed: 'How to Observe Grief Awareness Day in Your Organization', fri: 'What I Want People to Know on August 30th' },
      3: { context: 'Late summer, anticipatory fall grief', mon: 'Why September Is One of the Hardest Months for Grievers', wed: 'Preparing Your Grief Group for Fall: A Facilitator\'s Guide', fri: 'The Last Summer Without You' },
      4: { context: 'National Grief Awareness Day (Aug 30)', mon: 'National Grief Awareness Day: 5 Things Everyone Should Understand About Grief', wed: 'Building a Grief-Aware Organization — Starting This Week', fri: 'Dear Grief: A Letter on August 30th' },
    },
    9: { // September — Suicide Prevention Month, Childhood Cancer Awareness Month
      1: { context: 'Suicide Prevention Month, Childhood Cancer Awareness Month', mon: 'Suicide Loss Grief: What Survivors of Suicide Loss Need From Us', wed: 'Childhood Cancer Grief: Supporting Families Before, During, and After', fri: 'The Grief No One Wants to Talk About — But Should' },
      2: { context: 'September 11 anniversary', mon: 'Twenty Years of Collective Grief: What 9/11 Still Teaches Us', wed: 'Grief and National Trauma: How Communities Heal Together', fri: 'Where Were You — and What Did You Lose?' },
      3: { context: 'World Suicide Prevention Day (Sept 10) aftermath', mon: 'After Suicide Prevention Month: What Grief Support Looks Like for Loss Survivors', wed: 'How Facilitators Can Navigate Suicide Grief in a Group Setting', fri: 'To Those Who Are Grieving a Death by Suicide' },
      4: { context: 'Fall equinox, Disenfranchised Grief Awareness Week', mon: 'Disenfranchised Grief: The Losses Society Doesn\'t Validate', wed: 'Pet Loss, Estrangement, and Miscarriage: Holding Space for Hidden Grief', fri: 'Your Grief Counts — Even If No One Gave You a Card' },
    },
    10: { // October — SIDS Awareness Month, Breast Cancer Awareness
      1: { context: 'SIDS and Infant Loss Awareness Month, Breast Cancer Awareness Month', mon: 'Infant Loss and SIDS: Supporting the Silence That Follows', wed: 'Cancer Grief: The Before, During, and After', fri: 'The Grief of a Diagnosis — Even Before the Loss' },
      2: { context: 'National Depression Screening Day (Oct 10)', mon: 'Complicated Grief vs. Depression: Helping Facilitators Know the Signs', wed: 'When Grief Becomes Something More: A Resource Guide for Facilitators', fri: 'I Thought I Was Just Sad. I Didn\'t Know I Was Grieving.' },
      3: { context: 'Pregnancy and Infant Loss Remembrance Day (Oct 15)', mon: 'October 15 Is Pregnancy and Infant Loss Day: What You Need to Know', wed: 'Creating Space in Your Community for Pregnancy Loss', fri: 'The Due Date That Came and Went' },
      4: { context: 'Late October, Día de los Muertos approaching, Halloween', mon: 'Honoring the Dead: Grief Rituals Across Cultures', wed: 'How Facilitators Can Use Ritual and Ceremony in Grief Groups', fri: 'Why I Started Celebrating Día de los Muertos' },
    },
    11: { // November — National Hospice and Palliative Care Month
      1: { context: 'National Hospice and Palliative Care Month, Día de los Muertos', mon: 'Hospice Grief: What Happens to Families After the Caregiving Ends', wed: 'Palliative Care and Anticipatory Grief: A Facilitator\'s Overview', fri: 'The Grief That Starts Before Death' },
      2: { context: 'Veterans Day (Nov 11)', mon: 'Veterans Day and Military Grief: Beyond the Yellow Ribbon', wed: 'Supporting Veterans and Military Families in Your Grief Program', fri: 'He Came Home. But Part of Him Didn\'t.' },
      3: { context: 'Thanksgiving week, family grief dynamics', mon: 'Thanksgiving When Someone Is Missing From the Table', wed: 'How to Help Grieving Participants Navigate the Holiday Season', fri: 'The Traditions That Hurt Now — and How to Make New Ones' },
      4: { context: 'End of November, holiday grief season begins', mon: 'Preparing for the Holiday Grief Season: A Facilitator\'s Checklist', wed: 'What Grievers Need From Their Community in December', fri: 'The First Holiday Season Is the Hardest. Here\'s What Helped.' },
    },
    12: { // December — holiday grief
      1: { context: 'Holiday grief season, December 1 (World AIDS Day)', mon: 'World AIDS Day and the Grief of an Epidemic That Never Ended', wed: 'Holiday Grief Is Real: How to Support Your Community This Month', fri: 'The December That Changed Everything' },
      2: { context: 'Holiday season peak, year-end reflection', mon: 'Why the Holidays Are the Hardest — and How to Get Through Them', wed: 'Creating a Grief-Aware Holiday Event for Your Community', fri: 'What I Want for Christmas Is to Have You Back' },
      3: { context: 'Winter solstice, longest night grief rituals', mon: 'The Longest Night: Grief Rituals for the Winter Solstice', wed: 'Holding Space for Grief During the Most Wonderful Time of the Year', fri: 'A Candle for the Ones Who Aren\'t Here' },
      4: { context: 'Year-end reflection, New Year grief anticipation', mon: 'Year in Review: What Grief Taught Us in 2026', wed: 'Closing Out the Year With Your Grief Group: A Facilitator\'s Guide', fri: 'Dear Old Year: What I\'m Leaving With You' },
    },
  };

  const monthTopics = topics[month];
  if (!monthTopics) return {
    context: 'General grief education week',
    mon: 'Understanding the Tasks of Mourning — A Framework for Healing',
    wed: 'What Grief Groups Do That Therapy Cannot',
    fri: 'You Don\'t Have to Explain Your Grief to Anyone',
  };

  return monthTopics[Math.min(week, 4)] ?? monthTopics[4] ?? monthTopics[1];
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb  = getSupabaseServer();
  const now = new Date();

  // Coming week: Monday through Sunday
  const daysUntilMon = (8 - now.getDay()) % 7 || 7;
  const monday    = new Date(now); monday.setDate(now.getDate() + daysUntilMon); monday.setHours(0,0,0,0);
  const sunday    = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);
  const friday    = new Date(monday); friday.setDate(monday.getDate() + 4);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dateRange = `${fmt(monday)} – ${fmt(sunday)}`;

  // Topics
  const topics = getWeekTopics(monday);

  // Milestones: cohorts completing this week, new facilitators certified this week
  const weekStartISO = monday.toISOString().split('T')[0];
  const weekEndISO   = sunday.toISOString().split('T')[0];

  const { data: completingCohorts } = await sb
    .from('cohorts')
    .select('id, book_number, organization_id, facilitator_profiles!facilitator_id(full_name), organizations!organization_id(name)')
    .gte('summary_submitted_at', weekStartISO)
    .lte('summary_submitted_at', weekEndISO)
    .eq('status', 'completed');

  const { data: newlyActiveFacs } = await sb
    .from('facilitator_profiles')
    .select('full_name, cert_status')
    .gte('created_at', monday.toISOString())
    .lte('created_at', sunday.toISOString())
    .eq('cert_status', 'certified');

  const milestones: string[] = [];
  if ((completingCohorts ?? []).length > 0) {
    for (const c of (completingCohorts ?? [])) {
      const orgName = (c as any)?.organizations?.name ?? 'a partner organization';
      milestones.push(`Book ${c.book_number} cohort completed at ${orgName}`);
    }
  }
  if ((newlyActiveFacs ?? []).length > 0) {
    milestones.push(`${(newlyActiveFacs ?? []).length} new facilitator(s) certified this week`);
  }

  // Build email HTML
  const milestoneBlock = milestones.length > 0
    ? `
      <tr>
        <td style="padding:0 0 20px;">
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:14px 16px;">
            <div style="font-weight:700;font-size:13px;color:#b45309;margin-bottom:8px;">🏆 Program Milestones This Week</div>
            <ul style="margin:0;padding-left:16px;">${milestones.map(m => `<li style="font-size:13px;color:#374151;line-height:1.7;">${m} — <em>worth a social post!</em></li>`).join('')}</ul>
          </div>
        </td>
      </tr>`
    : '';

  const bodyHtml = `
    <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Week of ${dateRange}</p>
    <p style="color:#9ca3af;font-size:12px;margin:0 0 24px;font-style:italic;">${topics.context}</p>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${milestoneBlock}

      <!-- Blog Drafts -->
      <tr>
        <td style="padding:0 0 6px;">
          <div style="font-weight:700;font-size:14px;color:#1c3028;border-bottom:2px solid #B8942F;padding-bottom:6px;margin-bottom:14px;">
            📝 Blog Drafts — Auto-Generated (Approve by Email)
          </div>
        </td>
      </tr>

      ${[
        { day: 'Monday', date: fmt(monday),    topic: topics.mon,  label: 'Awareness / Education' },
        { day: 'Wednesday', date: fmt(wednesday), topic: topics.wed, label: 'Program / Community' },
        { day: 'Friday',  date: fmt(friday),   topic: topics.fri, label: 'Personal / Story' },
      ].map(({ day, date, topic, label }) => `
      <tr>
        <td style="padding:0 0 16px;">
          <div style="background:#f9f7f4;border-radius:6px;padding:14px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-weight:700;font-size:13px;color:#1c3028;">${day}</span>
              <span style="font-size:11px;color:#9ca3af;">${date} · ${label}</span>
            </div>
            <div style="font-size:14px;color:#374151;line-height:1.6;">${topic}</div>
          </div>
        </td>
      </tr>`).join('')}

      <!-- TikTok & YouTube -->
      <tr>
        <td style="padding:8px 0 6px;">
          <div style="font-weight:700;font-size:14px;color:#1c3028;border-bottom:2px solid #B8942F;padding-bottom:6px;margin-bottom:14px;">
            📱 TikTok & YouTube This Week
          </div>
          <div style="background:#f9f7f4;border-radius:6px;padding:14px 16px;font-size:13px;color:#374151;line-height:1.8;">
            TikTok: Wayne uploads manually on Friday — check schedule<br>
            YouTube Shorts: All 60 live · Full lessons: All 60 live<br>
            Buffer: Not yet activated — send tokens to Ember to schedule
          </div>
        </td>
      </tr>

      <!-- Action Links -->
      <tr>
        <td style="padding:24px 0 0;">
          <div style="padding:14px 18px;background:#f9f7f4;border-left:3px solid #B8942F;border-radius:0 6px 6px 0;font-size:13px;">
            <a href="https://www.tripillarstudio.com/admin/content" style="color:#B8942F;font-weight:600;text-decoration:none;">→ Review and publish blog drafts</a>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <a href="https://www.tripillarstudio.com/admin/dashboard" style="color:#B8942F;text-decoration:none;">→ Dashboard</a>
          </div>
        </td>
      </tr>
    </table>
  `;

  const subject = `Content Calendar — Week of ${fmt(monday)}`;

  await sendMail({
    to: 'wayne@tripillarstudio.com',
    subject,
    html: brandedHtml(subject, bodyHtml),
  });

  return NextResponse.json({
    ok: true,
    week: dateRange,
    topics: { mon: topics.mon, wed: topics.wed, fri: topics.fri },
    milestones,
  });
}
