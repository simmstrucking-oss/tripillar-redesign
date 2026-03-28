/**
 * Report Type 1: Cohort Summary Report
 * 6 pages: cover, cohort overview, session attendance, outcome ratings,
 * facilitator observations, program context.
 * Auto-triggered on post-program submission; also on-demand.
 */
import { createDoc, drawCover, drawPageHeader, drawFooter, sectionHeading, kv, ratingBar, docToBuffer, C, FONTS } from '../base';

export interface CohortSummaryData {
  // Facilitator
  facilitator_name:      string;
  facilitator_cert_id:   string;
  organization_name:     string | null;
  // Cohort
  cohort_id:             string;
  book_number:           number;
  start_date:            string | null;
  end_date:              string | null;
  // Pre-program
  pre_participant_count: number | null;
  pre_setting_type:      string | null;
  pre_community_type:    string | null;
  pre_primary_loss_types: Record<string, number> | null;
  pre_age_ranges:        Record<string, number> | null;
  pre_time_since_loss:   Record<string, number> | null;
  pre_prior_support:     Record<string, number> | null;
  // Session logs (weeks 1–13)
  session_logs: {
    week_number:          number;
    session_date:         string | null;
    session_duration_min: number | null;
    participants_attended: number | null;
    group_stable:         boolean | null;
    co_facilitated:       boolean | null;
    critical_incident:    boolean | null;
  }[];
  // Outcomes
  post_participant_count:      number | null;
  completion_rate:             number | null;
  post_grief_intensity_rating: number | null;
  post_connection_rating:      number | null;
  post_self_care_rating:       number | null;
  post_hope_rating:            number | null;
  facilitator_observations:    string | null;
  // Meta
  generated_at: string;
}

export async function buildCohortSummaryPDF(d: CohortSummaryData): Promise<Buffer> {
  const doc   = createDoc();
  const pages = 6;
  let pageNum = 1;

  // ── PAGE 1: Cover ────────────────────────────────────────────────────────
  drawCover(doc, 'Cohort Summary\nReport', `Book ${d.book_number} · ${d.organization_name ?? 'Independent Facilitator'}`, [
    { label: 'Facilitator',   value: d.facilitator_name },
    { label: 'Cert ID',       value: d.facilitator_cert_id },
    { label: 'Program',       value: `Live and Grieve™ Book ${d.book_number}` },
    { label: 'Cohort Period', value: `${d.start_date ?? '—'} – ${d.end_date ?? '—'}` },
    { label: 'Generated',     value: d.generated_at },
  ]);
  drawFooter(doc, pageNum++);

  // ── PAGE 2: Cohort Overview ──────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Cohort Overview', pageNum);
  sectionHeading(doc, 'Cohort Overview');

  kv(doc, 'Organization',      d.organization_name ?? 'Independent');
  kv(doc, 'Facilitator',       d.facilitator_name);
  kv(doc, 'Cert ID',           d.facilitator_cert_id);
  kv(doc, 'Book Number',       `Book ${d.book_number}`);
  kv(doc, 'Start Date',        d.start_date ?? '—');
  kv(doc, 'End Date',          d.end_date   ?? '—');
  kv(doc, 'Setting Type',      d.pre_setting_type   ?? '—');
  kv(doc, 'Community Type',    d.pre_community_type ?? '—');
  doc.moveDown(1);

  sectionHeading(doc, 'Participant Demographics');
  kv(doc, 'Enrolled',   d.pre_participant_count ?? 0);
  kv(doc, 'Completed',  d.post_participant_count ?? 0);
  kv(doc, 'Completion Rate', d.completion_rate ? `${d.completion_rate}%` : '—');

  if (d.pre_primary_loss_types && Object.keys(d.pre_primary_loss_types).length) {
    doc.moveDown(0.5);
    doc.fillColor(C.slate).font(FONTS.bold).fontSize(9).text('Primary Loss Types:');
    Object.entries(d.pre_primary_loss_types).forEach(([type, count]) => {
      doc.fillColor(C.navy).font(FONTS.body).fontSize(9)
         .text(`  ${type}: ${count} participant${count !== 1 ? 's' : ''}`,
               doc.page.margins.left + 12, doc.y);
    });
    doc.moveDown(0.3);
  }

  if (d.pre_age_ranges && Object.keys(d.pre_age_ranges).length) {
    doc.moveDown(0.5);
    doc.fillColor(C.slate).font(FONTS.bold).fontSize(9).text('Age Ranges:');
    Object.entries(d.pre_age_ranges).forEach(([range, count]) => {
      doc.fillColor(C.navy).font(FONTS.body).fontSize(9)
         .text(`  ${range}: ${count}`, doc.page.margins.left + 12, doc.y);
    });
  }
  drawFooter(doc, pageNum++);

  // ── PAGE 3: Session Attendance ───────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Session Attendance', pageNum);
  sectionHeading(doc, 'Weekly Session Attendance');

  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colW = [36, 80, 60, 70, 70, 70, 80];
  const headers = ['Wk', 'Date', 'Duration', 'Attended', 'Stable', 'Co-Fac', 'Incident'];
  const rowY = doc.y;

  // Table header
  doc.rect(doc.page.margins.left, rowY, W, 18).fill(C.navy);
  let cx = doc.page.margins.left + 4;
  headers.forEach((h, i) => {
    doc.fillColor(C.gold).font(FONTS.bold).fontSize(8).text(h, cx, rowY + 5, { width: colW[i] - 4 });
    cx += colW[i];
  });
  doc.y = rowY + 20;

  d.session_logs.forEach((log, idx) => {
    const ry = doc.y;
    if (idx % 2 === 1) {
      doc.rect(doc.page.margins.left, ry - 2, W, 16).fill('#F4F4F2');
    }
    let rx = doc.page.margins.left + 4;
    const row = [
      String(log.week_number),
      log.session_date ?? '—',
      log.session_duration_min ? `${log.session_duration_min}m` : '—',
      String(log.participants_attended ?? '—'),
      log.group_stable   === null ? '—' : log.group_stable   ? 'Yes' : 'No',
      log.co_facilitated === null ? '—' : log.co_facilitated ? 'Yes' : 'No',
      log.critical_incident ? '⚠ Yes' : 'No',
    ];
    row.forEach((val, i) => {
      const color = val === '⚠ Yes' ? C.danger : C.navy;
      doc.fillColor(color).font(FONTS.body).fontSize(8)
         .text(val, rx, ry, { width: colW[i] - 4, lineBreak: false });
      rx += colW[i];
    });
    doc.y = ry + 16;
  });

  const totalAttended = d.session_logs.reduce((s, l) => s + (l.participants_attended ?? 0), 0);
  const avgAttended   = d.session_logs.filter(l => l.participants_attended !== null).length > 0
    ? Math.round(totalAttended / d.session_logs.filter(l => l.participants_attended !== null).length)
    : null;

  doc.moveDown(1);
  kv(doc, 'Average Weekly Attendance', avgAttended ?? '—');
  kv(doc, 'Sessions Logged', `${d.session_logs.length} of 13`);
  kv(doc, 'Critical Incidents', String(d.session_logs.filter(l => l.critical_incident).length));
  drawFooter(doc, pageNum++);

  // ── PAGE 4: Outcome Ratings ──────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Outcome Ratings', pageNum);
  sectionHeading(doc, 'Post-Program Outcome Ratings');

  doc.fillColor(C.slate).font(FONTS.italic).fontSize(9)
     .text('Ratings reflect facilitator assessment of group progress on a 1–5 scale.', doc.page.margins.left, doc.y, { width: W });
  doc.moveDown(1.2);

  ratingBar(doc, 'Grief Intensity Management',      d.post_grief_intensity_rating);
  doc.moveDown(0.3);
  ratingBar(doc, 'Connection & Community',          d.post_connection_rating);
  doc.moveDown(0.3);
  ratingBar(doc, 'Self-Care Practices',             d.post_self_care_rating);
  doc.moveDown(0.3);
  ratingBar(doc, 'Hope & Forward Movement',         d.post_hope_rating);
  doc.moveDown(1.2);

  const rvals = [d.post_grief_intensity_rating, d.post_connection_rating, d.post_self_care_rating, d.post_hope_rating].filter(Boolean) as number[];
  const avg   = rvals.length ? (rvals.reduce((s, v) => s + v, 0) / rvals.length).toFixed(1) : null;
  kv(doc, 'Overall Average Rating', avg ? `${avg} / 5.0` : '—');
  doc.moveDown(1.5);

  // Scale reference box
  doc.rect(doc.page.margins.left, doc.y, W, 80).fill('#F4F0E8');
  doc.fillColor(C.navy).font(FONTS.bold).fontSize(9).text('Rating Scale Reference', doc.page.margins.left + 12, doc.y + 10);
  const scale = [
    '1 — Minimal progress; challenges persist',
    '2 — Some growth; significant challenges remain',
    '3 — Moderate progress; steady development observed',
    '4 — Strong progress; most participants demonstrating growth',
    '5 — Exceptional progress; group thriving',
  ];
  scale.forEach((s, i) => {
    doc.fillColor(C.slate).font(FONTS.body).fontSize(8)
       .text(s, doc.page.margins.left + 12, doc.y + (i === 0 ? 6 : 0));
  });
  doc.moveDown(0.5);
  drawFooter(doc, pageNum++);

  // ── PAGE 5: Facilitator Observations ────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Facilitator Observations', pageNum);
  sectionHeading(doc, 'Facilitator Observations');

  doc.fillColor(C.slate).font(FONTS.italic).fontSize(9)
     .text('Submitted by the facilitator at program completion. Included with consent.', doc.page.margins.left, doc.y, { width: W });
  doc.moveDown(1);

  const obsText = d.facilitator_observations?.trim() || '(No observations submitted)';
  doc.rect(doc.page.margins.left, doc.y, W, doc.heightOfString(obsText, { width: W - 24 }) + 24)
     .fill('#F9F8F5');
  doc.fillColor(C.navy).font(FONTS.body).fontSize(10.5)
     .text(obsText, doc.page.margins.left + 12, doc.y + 12, { width: W - 24 });
  doc.moveDown(2);

  sectionHeading(doc, 'Completion Summary');
  kv(doc, 'Participants Enrolled',  d.pre_participant_count ?? 0);
  kv(doc, 'Participants Completed', d.post_participant_count ?? 0);
  kv(doc, 'Completion Rate',        d.completion_rate ? `${d.completion_rate}%` : '—');
  drawFooter(doc, pageNum++);

  // ── PAGE 6: Program Context ──────────────────────────────────────────────
  doc.addPage();
  drawPageHeader(doc, 'Program Context', pageNum);
  sectionHeading(doc, 'About Live and Grieve™');

  doc.fillColor(C.navy).font(FONTS.body).fontSize(10).text(
    'Live and Grieve™ is a structured grief education program developed by Tri-Pillars™ LLC. ' +
    'The program provides a safe, supportive framework for individuals navigating grief and loss ' +
    'through evidence-informed approaches including the Dual Process Model, Tasks of Mourning, ' +
    'Continuing Bonds, and Self-Compassion practices.',
    { width: W }
  );
  doc.moveDown(1);

  sectionHeading(doc, 'Facilitator Certification');
  doc.fillColor(C.navy).font(FONTS.body).fontSize(10).text(
    'Facilitators are trained and certified through Tri-Pillars™ LLC to serve as companions ' +
    'and witnesses — not therapists or clinical professionals. This program is grief education, ' +
    'not therapy, and does not constitute clinical treatment.',
    { width: W }
  );
  doc.moveDown(1);

  sectionHeading(doc, 'Data Use Notice');
  doc.fillColor(C.slate).font(FONTS.italic).fontSize(9).text(
    'This report contains aggregate, non-identifying program data. No participant names, ' +
    'journal content, or personal identifiers are included. Data is used solely for program ' +
    'quality improvement and organizational reporting. Confidential — not for public distribution.',
    { width: W }
  );
  drawFooter(doc, pageNum++);

  return docToBuffer(doc);
}
