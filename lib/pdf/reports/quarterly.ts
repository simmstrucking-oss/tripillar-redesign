/**
 * Report Type 3: Quarterly Program Report
 * Auto-generates on schedule + on-demand by Wayne.
 */
import { createDoc, drawCover, drawPageHeader, drawFooter, sectionHeading, kv, ratingBar, docToBuffer, C, FONTS } from '../base';

interface QuarterMonth { month: string; cohorts_started: number; cohorts_completed: number; participants_enrolled: number; }

export interface QuarterlyReportData {
  quarter:              string;   // e.g. "Q1 2026"
  start_date:           string;
  end_date:             string;
  orgs_active:          number;
  facs_active:          number;
  facs_new:             number;
  cohorts_started:      number;
  cohorts_completed:    number;
  cohorts_active:       number;
  participants_enrolled:  number;
  participants_completed: number;
  completion_rate:      number | null;
  avg_outcome_rating:   number | null;
  critical_incidents:   number;
  monthly_breakdown:    QuarterMonth[];
  top_loss_types:       { loss_type: string; count: number }[];
  setting_distribution: { type: string; count: number }[];
  solo_companion: {
    new_users:          number;
    completions:        number;
    avg_week_reached:   number | null;
  } | null;
  prev_quarter_comparison: {
    cohorts_delta:      number | null;
    participants_delta: number | null;
    rating_delta:       number | null;
  } | null;
  generated_at: string;
}

export async function buildQuarterlyPDF(d: QuarterlyReportData): Promise<Buffer> {
  const doc = createDoc();
  let pageNum = 1;
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Cover
  drawCover(doc, `Quarterly Program\nReport`, d.quarter, [
    { label: 'Period',     value: `${d.start_date} – ${d.end_date}` },
    { label: 'Quarter',    value: d.quarter },
    { label: 'Generated',  value: d.generated_at },
  ]);
  drawFooter(doc, pageNum++);

  // Page 2: Quarter overview
  doc.addPage();
  drawPageHeader(doc, 'Quarter Overview', pageNum);
  sectionHeading(doc, `${d.quarter} Program Overview`);

  kv(doc, 'Active Organizations',   d.orgs_active);
  kv(doc, 'Active Facilitators',    d.facs_active);
  kv(doc, 'New Facilitators',       d.facs_new);
  doc.moveDown(1);
  kv(doc, 'Cohorts Started',        d.cohorts_started);
  kv(doc, 'Cohorts Completed',      d.cohorts_completed);
  kv(doc, 'Cohorts Active',         d.cohorts_active);
  doc.moveDown(1);
  kv(doc, 'Participants Enrolled',  d.participants_enrolled);
  kv(doc, 'Participants Completed', d.participants_completed);
  kv(doc, 'Completion Rate',        d.completion_rate ? `${d.completion_rate}%` : '—');
  kv(doc, 'Avg Outcome Rating',     d.avg_outcome_rating ? `${d.avg_outcome_rating} / 5.0` : '—');
  kv(doc, 'Critical Incidents',     d.critical_incidents);
  doc.moveDown(1.2);

  if (d.prev_quarter_comparison) {
    sectionHeading(doc, 'Quarter-over-Quarter Change');
    const { cohorts_delta, participants_delta, rating_delta } = d.prev_quarter_comparison;
    const sign = (n: number | null) => n == null ? '—' : n >= 0 ? `+${n}` : `${n}`;
    kv(doc, 'Cohorts Δ',      sign(cohorts_delta));
    kv(doc, 'Participants Δ', sign(participants_delta));
    kv(doc, 'Outcome Rating Δ', rating_delta != null ? sign(Number(rating_delta.toFixed(1))) : '—');
  }
  drawFooter(doc, pageNum++);

  // Page 3: Monthly breakdown
  doc.addPage();
  drawPageHeader(doc, 'Monthly Breakdown', pageNum);
  sectionHeading(doc, 'Monthly Activity');

  if (d.monthly_breakdown.length === 0) {
    doc.fillColor(C.slate).font(FONTS.italic).fontSize(10).text('No monthly data available for this quarter.');
  } else {
    const colW = [120, 100, 120, 140];
    const headers = ['Month', 'Cohorts Started', 'Cohorts Completed', 'Participants Enrolled'];
    const hY = doc.y;
    doc.rect(doc.page.margins.left, hY, W, 18).fill(C.navy);
    let cx = doc.page.margins.left + 4;
    headers.forEach((h, i) => {
      doc.fillColor(C.gold).font(FONTS.bold).fontSize(8).text(h, cx, hY + 5, { width: colW[i] - 4 });
      cx += colW[i];
    });
    doc.y = hY + 22;
    d.monthly_breakdown.forEach((m, idx) => {
      const ry = doc.y;
      if (idx % 2 === 1) doc.rect(doc.page.margins.left, ry - 2, W, 16).fill('#F4F4F2');
      let rx = doc.page.margins.left + 4;
      [m.month, String(m.cohorts_started), String(m.cohorts_completed), String(m.participants_enrolled)].forEach((val, i) => {
        doc.fillColor(C.navy).font(FONTS.body).fontSize(9).text(val, rx, ry, { width: colW[i] - 4, lineBreak: false });
        rx += colW[i];
      });
      doc.y = ry + 16;
    });
  }
  doc.moveDown(1.5);

  sectionHeading(doc, 'Loss Type Distribution');
  if (!d.top_loss_types.length) {
    doc.fillColor(C.slate).font(FONTS.italic).fontSize(9).text('No loss type data recorded this quarter.');
  } else {
    d.top_loss_types.slice(0, 8).forEach(lt => {
      kv(doc, lt.loss_type, `${lt.count} participant${lt.count !== 1 ? 's' : ''}`);
    });
  }
  drawFooter(doc, pageNum++);

  // Page 4: Outcomes + Solo Companion
  doc.addPage();
  drawPageHeader(doc, 'Outcomes & Solo Companion', pageNum);
  sectionHeading(doc, 'Outcome Ratings Summary');
  kv(doc, 'Avg Outcome Rating', d.avg_outcome_rating ? `${d.avg_outcome_rating} / 5.0` : '—');
  doc.moveDown(0.5);
  doc.fillColor(C.slate).font(FONTS.italic).fontSize(9)
     .text('Aggregate average across all completed cohorts this quarter with submitted outcome data.', { width: W });
  doc.moveDown(1.5);

  sectionHeading(doc, 'Setting Distribution');
  if (!d.setting_distribution.length) {
    doc.fillColor(C.slate).font(FONTS.italic).fontSize(9).text('No setting data recorded this quarter.');
  } else {
    d.setting_distribution.forEach(s => kv(doc, s.type, `${s.count} cohort${s.count !== 1 ? 's' : ''}`));
  }
  doc.moveDown(1.5);

  if (d.solo_companion) {
    sectionHeading(doc, 'Solo Companion');
    kv(doc, 'New Users',           d.solo_companion.new_users);
    kv(doc, 'Program Completions', d.solo_companion.completions);
    kv(doc, 'Avg Week Reached',    d.solo_companion.avg_week_reached ?? '—');
  }
  drawFooter(doc, pageNum++);

  return docToBuffer(doc);
}
