/**
 * Report Type 2: Organization Program Report
 * On-demand. Individual facilitator breakdowns + combined org totals.
 */
import { createDoc, drawCover, drawPageHeader, drawFooter, sectionHeading, kv, ratingBar, docToBuffer, C, FONTS } from '../base';

export interface OrgFacilitator {
  name:                 string;
  cert_id:              string;
  cert_status:          string;
  cohorts_completed:    number;
  cohorts_active:       number;
  participants_enrolled:  number;
  participants_completed: number;
  completion_rate:      number | null;
  avg_outcome_rating:   number | null;
  critical_incidents:   number;
  books_certified:      number[];
}

export interface OrgProgramData {
  org_name:             string;
  org_type:             string | null;
  location:             string | null;
  license_start:        string | null;
  license_end:          string | null;
  renewal_count:        number;
  active_facilitators:  number;
  max_facilitators:     number | null;
  facilitators:         OrgFacilitator[];
  // Org totals
  total_cohorts:        number;
  active_cohorts:       number;
  completed_cohorts:    number;
  total_enrolled:       number;
  total_completed:      number;
  org_completion_rate:  number | null;
  avg_outcome_rating:   number | null;
  total_incidents:      number;
  generated_at:         string;
}

export async function buildOrgProgramPDF(d: OrgProgramData): Promise<Buffer> {
  const doc = createDoc();
  let pageNum = 1;
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Cover
  drawCover(doc, 'Organization\nProgram Report', d.org_name, [
    { label: 'Organization',  value: d.org_name },
    { label: 'Type',          value: d.org_type ?? '—' },
    { label: 'Location',      value: d.location ?? '—' },
    { label: 'License Period', value: `${d.license_start ?? '—'} – ${d.license_end ?? '—'}` },
    { label: 'Generated',     value: d.generated_at },
  ]);
  drawFooter(doc, pageNum++);

  // Page 2: Org summary totals
  doc.addPage();
  drawPageHeader(doc, 'Organization Summary', pageNum);
  sectionHeading(doc, 'Organization Overview');
  kv(doc, 'Organization',          d.org_name);
  kv(doc, 'Type',                   d.org_type ?? '—');
  kv(doc, 'Location',               d.location ?? '—');
  kv(doc, 'License Start',          d.license_start ?? '—');
  kv(doc, 'License End',            d.license_end ?? '—');
  kv(doc, 'Renewals',               d.renewal_count);
  kv(doc, 'Active Facilitators',    `${d.active_facilitators}${d.max_facilitators ? ` / ${d.max_facilitators} licensed` : ''}`);
  doc.moveDown(1.2);

  sectionHeading(doc, 'Program Totals');
  kv(doc, 'Total Cohorts',          d.total_cohorts);
  kv(doc, 'Active Cohorts',         d.active_cohorts);
  kv(doc, 'Completed Cohorts',      d.completed_cohorts);
  kv(doc, 'Participants Enrolled',  d.total_enrolled);
  kv(doc, 'Participants Completed', d.total_completed);
  kv(doc, 'Overall Completion Rate', d.org_completion_rate ? `${d.org_completion_rate}%` : '—');
  kv(doc, 'Critical Incidents',     d.total_incidents);
  doc.moveDown(1.2);

  sectionHeading(doc, 'Aggregate Outcome Ratings');
  doc.fillColor(C.slate).font(FONTS.italic).fontSize(9)
     .text('Averaged across all completed cohorts with submitted outcomes.', doc.page.margins.left, doc.y, { width: W });
  doc.moveDown(0.8);
  kv(doc, 'Average Outcome Rating', d.avg_outcome_rating ? `${d.avg_outcome_rating} / 5.0` : '—');
  drawFooter(doc, pageNum++);

  // Page 3+: Per-facilitator breakdowns
  d.facilitators.forEach((f, i) => {
    doc.addPage();
    drawPageHeader(doc, `Facilitator ${i + 1} of ${d.facilitators.length}`, pageNum);
    sectionHeading(doc, `Facilitator: ${f.name}`);

    kv(doc, 'Cert ID',    f.cert_id);
    kv(doc, 'Status',     f.cert_status);
    kv(doc, 'Books Certified', f.books_certified.length ? f.books_certified.map(b => `Book ${b}`).join(', ') : '—');
    doc.moveDown(0.8);

    sectionHeading(doc, 'Cohort Activity');
    kv(doc, 'Active Cohorts',     f.cohorts_active);
    kv(doc, 'Completed Cohorts',  f.cohorts_completed);
    kv(doc, 'Enrolled',           f.participants_enrolled);
    kv(doc, 'Completed',          f.participants_completed);
    kv(doc, 'Completion Rate',    f.completion_rate ? `${f.completion_rate}%` : '—');
    kv(doc, 'Avg Outcome Rating', f.avg_outcome_rating ? `${f.avg_outcome_rating} / 5.0` : '—');
    kv(doc, 'Critical Incidents', f.critical_incidents);
    drawFooter(doc, pageNum++);
  });

  return docToBuffer(doc);
}
