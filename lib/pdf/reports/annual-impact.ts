/**
 * Report Type 4: Annual Impact Report
 * Auto-generates January 1 + on-demand by Wayne.
 * Includes a narrative section Wayne fills in before finalizing.
 */
import { createDoc, drawCover, drawPageHeader, drawFooter, sectionHeading, kv, ratingBar, docToBuffer, C, FONTS } from '../base';

interface QuarterSummary { quarter: string; cohorts: number; participants: number; avg_rating: number | null; }

export interface AnnualImpactData {
  year:                   number;
  // Narrative (Wayne fills in — can be empty strings for draft)
  narrative_intro:        string;
  narrative_impact:       string;
  narrative_forward:      string;
  // Program totals
  orgs_total:             number;
  orgs_new:               number;
  facs_total:             number;
  facs_new:               number;
  cohorts_total:          number;
  cohorts_completed:      number;
  participants_served:    number;
  participants_enrolled:  number;
  completion_rate:        number | null;
  avg_outcome_rating:     number | null;
  total_incidents:        number;
  // Breakdowns
  quarterly_breakdown:    QuarterSummary[];
  top_loss_types:         { loss_type: string; count: number }[];
  geographic_states:      number;
  top_states:             { state: string; participants: number }[];
  setting_distribution:   { type: string; count: number }[];
  book_progression:       { book_number: number; cohorts_started: number; cohorts_completed: number }[];
  solo_companion: {
    total_users:          number;
    completions:          number;
    completion_rate:      number | null;
    avg_week_reached:     number | null;
  } | null;
  is_draft:               boolean;
  generated_at:           string;
}

export async function buildAnnualImpactPDF(d: AnnualImpactData): Promise<Buffer> {
  const doc = createDoc();
  let pageNum = 1;
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Cover
  drawCover(doc, `${d.year} Annual\nImpact Report`, 'Live and Grieve™ Program', [
    { label: 'Year',      value: String(d.year) },
    { label: 'Status',    value: d.is_draft ? 'DRAFT — Pending Wayne Review' : 'Final' },
    { label: 'Generated', value: d.generated_at },
  ]);
  if (d.is_draft) {
    doc.fillColor('#C0392B').font(FONTS.heading).fontSize(48).opacity(0.15)
       .text('DRAFT', 100, 300, { width: 400, align: 'center' });
    doc.opacity(1);
  }
  drawFooter(doc, pageNum++);

  // Page 2: Year in Review (Wayne narrative)
  doc.addPage();
  drawPageHeader(doc, 'Year in Review', pageNum);
  sectionHeading(doc, `${d.year}: Year in Review`);

  const intro = d.narrative_intro?.trim() ||
    '[Wayne: Add your introduction for this annual report here — reflecting on the year\'s work and what it meant for grieving people in your communities.]';

  doc.fillColor(d.narrative_intro?.trim() ? C.navy : C.slate)
     .font(FONTS.body).fontSize(10.5)
     .text(intro, { width: W });
  doc.moveDown(1.5);

  sectionHeading(doc, 'Program Impact');
  const impact = d.narrative_impact?.trim() ||
    '[Wayne: Describe the program\'s impact this year — participant stories (aggregated, no names), facilitator growth, community reach.]';
  doc.fillColor(d.narrative_impact?.trim() ? C.navy : C.slate)
     .font(FONTS.body).fontSize(10.5)
     .text(impact, { width: W });
  doc.moveDown(1.5);

  sectionHeading(doc, 'Looking Forward');
  const fwd = d.narrative_forward?.trim() ||
    '[Wayne: Share your vision for the coming year — new markets, program expansion, certification goals.]';
  doc.fillColor(d.narrative_forward?.trim() ? C.navy : C.slate)
     .font(FONTS.body).fontSize(10.5)
     .text(fwd, { width: W });
  drawFooter(doc, pageNum++);

  // Page 3: Program by the numbers
  doc.addPage();
  drawPageHeader(doc, 'Program by the Numbers', pageNum);
  sectionHeading(doc, `${d.year} by the Numbers`);

  // Stats grid
  const stats = [
    { label: 'Organizations', value: String(d.orgs_total), sub: `${d.orgs_new} new this year` },
    { label: 'Certified Facilitators', value: String(d.facs_total), sub: `${d.facs_new} new this year` },
    { label: 'Cohorts Completed', value: String(d.cohorts_completed), sub: `${d.cohorts_total} total run` },
    { label: 'Participants Served', value: String(d.participants_served), sub: `of ${d.participants_enrolled} enrolled` },
    { label: 'Completion Rate', value: d.completion_rate ? `${d.completion_rate}%` : '—', sub: 'program-wide average' },
    { label: 'Avg Outcome Rating', value: d.avg_outcome_rating ? `${d.avg_outcome_rating}/5` : '—', sub: 'post-program assessment' },
  ];

  const gridCols = 3;
  const cellW = W / gridCols;
  const cellH = 72;
  stats.forEach((s, i) => {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const cx = doc.page.margins.left + col * cellW;
    const cy = doc.y + row * (cellH + 8);
    doc.rect(cx + 4, cy, cellW - 8, cellH).fill(i % 2 === 0 ? '#F0EAD8' : '#EAF0F8');
    doc.fillColor(C.gold).font(FONTS.heading).fontSize(28)
       .text(s.value, cx + 4, cy + 8, { width: cellW - 8, align: 'center' });
    doc.fillColor(C.navy).font(FONTS.bold).fontSize(8.5)
       .text(s.label, cx + 4, cy + 42, { width: cellW - 8, align: 'center' });
    doc.fillColor(C.slate).font(FONTS.italic).fontSize(7.5)
       .text(s.sub, cx + 4, cy + 54, { width: cellW - 8, align: 'center' });
  });
  doc.y += Math.ceil(stats.length / gridCols) * (cellH + 8) + 16;
  drawFooter(doc, pageNum++);

  // Page 4: Quarterly breakdown + geography
  doc.addPage();
  drawPageHeader(doc, 'Quarterly Breakdown', pageNum);
  sectionHeading(doc, 'Quarterly Activity');

  if (d.quarterly_breakdown.length === 0) {
    doc.fillColor(C.slate).font(FONTS.italic).fontSize(9).text('No quarterly data available.');
  } else {
    const colW = [100, 100, 140, 130];
    const headers = ['Quarter', 'Cohorts', 'Participants', 'Avg Outcome'];
    const hY = doc.y;
    doc.rect(doc.page.margins.left, hY, W, 18).fill(C.navy);
    let cx = doc.page.margins.left + 4;
    headers.forEach((h, i) => {
      doc.fillColor(C.gold).font(FONTS.bold).fontSize(8).text(h, cx, hY + 5, { width: colW[i] - 4 });
      cx += colW[i];
    });
    doc.y = hY + 22;
    d.quarterly_breakdown.forEach((q, idx) => {
      const ry = doc.y;
      if (idx % 2 === 1) doc.rect(doc.page.margins.left, ry - 2, W, 16).fill('#F4F4F2');
      let rx = doc.page.margins.left + 4;
      [q.quarter, String(q.cohorts), String(q.participants), q.avg_rating ? `${q.avg_rating}/5` : '—'].forEach((v, i) => {
        doc.fillColor(C.navy).font(FONTS.body).fontSize(9).text(v, rx, ry, { width: colW[i] - 4, lineBreak: false });
        rx += colW[i];
      });
      doc.y = ry + 16;
    });
  }
  doc.moveDown(1.5);

  sectionHeading(doc, 'Geographic Reach');
  kv(doc, 'States Served', d.geographic_states);
  if (d.top_states.length) {
    doc.moveDown(0.5);
    doc.fillColor(C.slate).font(FONTS.bold).fontSize(9).text('Top Regions:');
    d.top_states.slice(0, 5).forEach(s => {
      doc.fillColor(C.navy).font(FONTS.body).fontSize(9)
         .text(`  ${s.state}: ${s.participants} participants`, doc.page.margins.left + 12, doc.y);
    });
  }
  drawFooter(doc, pageNum++);

  // Page 5: Book progression + loss types + Solo Companion
  doc.addPage();
  drawPageHeader(doc, 'Book Progression & Solo Companion', pageNum);
  sectionHeading(doc, 'Book Progression Rates');
  d.book_progression.forEach(b => {
    const rate = b.cohorts_started > 0 ? Math.round((b.cohorts_completed / b.cohorts_started) * 100) : null;
    kv(doc, `Book ${b.book_number}`, `${b.cohorts_completed} completed of ${b.cohorts_started} started${rate ? ` (${rate}%)` : ''}`);
  });
  doc.moveDown(1.2);

  sectionHeading(doc, 'Loss Type Distribution');
  d.top_loss_types.slice(0, 6).forEach(lt => kv(doc, lt.loss_type, `${lt.count} participants`));
  doc.moveDown(1.2);

  if (d.solo_companion) {
    sectionHeading(doc, 'Solo Companion Program');
    kv(doc, 'Total Users',           d.solo_companion.total_users);
    kv(doc, 'Program Completions',   d.solo_companion.completions);
    kv(doc, 'Completion Rate',       d.solo_companion.completion_rate ? `${d.solo_companion.completion_rate}%` : '—');
    kv(doc, 'Avg Week Reached',      d.solo_companion.avg_week_reached ?? '—');
  }
  drawFooter(doc, pageNum++);

  return docToBuffer(doc);
}
