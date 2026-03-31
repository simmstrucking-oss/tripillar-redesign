/**
 * lib/generate-cohort-pdf.ts
 * Generates a cohort completion summary PDF using PDFKit.
 * Returns a Buffer ready to upload to Supabase storage.
 */
import PDFDocument from 'pdfkit';

export interface CohortSummaryData {
  cohort_id:              string;
  cohort_name:            string;  // e.g. "Spring 2026 — Book 1"
  book_number:            number;
  facilitator_name:       string;
  organization_name:      string;
  start_date:             string | null;
  end_date:               string | null;
  total_enrolled:         number;
  total_completed:        number;
  dropout_reasons:        string | null;
  facilitator_assessment: string;  // Strong | Moderate | Challenging
  notable_outcomes:       string | null;
  curriculum_feedback:    string | null;
  avg_satisfaction:       number | null;
  summary_submitted_at:   string;
}

const NAVY = '#1c3028';
const GOLD = '#B8942F';
const GRAY = '#6b7280';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export async function generateCohortPdf(data: CohortSummaryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    const doc = new PDFDocument({ size: 'Letter', margin: 60 });

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const PAGE_W    = doc.page.width;
    const MARGIN    = 60;
    const TEXT_W    = PAGE_W - MARGIN * 2;
    const completionRate = data.total_enrolled > 0
      ? Math.round((data.total_completed / data.total_enrolled) * 100)
      : 0;

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.rect(MARGIN, MARGIN, TEXT_W, 56).fill(NAVY);
    doc.fillColor('#ffffff')
       .font('Helvetica-Bold').fontSize(16)
       .text('Tri-Pillars™ LLC', MARGIN + 16, MARGIN + 10, { width: TEXT_W - 32 });
    doc.font('Helvetica').fontSize(10).fillColor('#a8bfb4')
       .text('Live and Grieve™  ·  Cohort Completion Summary', MARGIN + 16, MARGIN + 32, { width: TEXT_W - 32 });

    let y = MARGIN + 72;

    // ── Title ────────────────────────────────────────────────────────────────
    doc.font('Helvetica-Bold').fontSize(18).fillColor(NAVY)
       .text(data.cohort_name, MARGIN, y, { width: TEXT_W });
    y += 28;
    doc.font('Helvetica').fontSize(10).fillColor(GRAY)
       .text(`Generated ${formatDate(data.summary_submitted_at)}`, MARGIN, y);
    y += 22;

    // ── Divider ──────────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(MARGIN + TEXT_W, y).strokeColor(GOLD).lineWidth(1.5).stroke();
    y += 18;

    // ── Section helper ────────────────────────────────────────────────────────
    function sectionHeader(title: string) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD)
         .text(title.toUpperCase(), MARGIN, y, { width: TEXT_W, characterSpacing: 0.8 });
      y += 18;
    }

    function row(label: string, value: string) {
      const LABEL_W = 180;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
         .text(label, MARGIN, y, { width: LABEL_W });
      doc.font('Helvetica').fontSize(10).fillColor('#374151')
         .text(value || '—', MARGIN + LABEL_W, y, { width: TEXT_W - LABEL_W });
      y += 16;
    }

    function multiRow(label: string, value: string | null) {
      if (!value) return;
      doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY)
         .text(label, MARGIN, y, { width: TEXT_W });
      y += 14;
      doc.font('Helvetica').fontSize(10).fillColor('#374151')
         .text(value, MARGIN + 12, y, { width: TEXT_W - 12 });
      y += doc.heightOfString(value, { width: TEXT_W - 12 }) + 10;
    }

    // ── Overview ─────────────────────────────────────────────────────────────
    sectionHeader('Overview');
    row('Facilitator',      data.facilitator_name);
    row('Organization',     data.organization_name);
    row('Book',             `Book ${data.book_number}`);
    row('Start Date',       formatDate(data.start_date));
    row('End Date',         formatDate(data.end_date));
    y += 8;

    // ── Enrollment ───────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(MARGIN + TEXT_W, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    y += 16;
    sectionHeader('Enrollment & Completion');
    row('Total Enrolled',   String(data.total_enrolled));
    row('Total Completed',  String(data.total_completed));
    row('Completion Rate',  `${completionRate}%`);
    if (data.avg_satisfaction != null) {
      row('Avg Satisfaction', `${data.avg_satisfaction.toFixed(1)} / 5.0`);
    }
    y += 8;

    // ── Assessment ───────────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(MARGIN + TEXT_W, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    y += 16;
    sectionHeader('Facilitator Assessment');
    row('Overall Rating',   data.facilitator_assessment);
    y += 4;

    multiRow('Dropout Reasons',    data.dropout_reasons);
    multiRow('Notable Outcomes',   data.notable_outcomes);
    multiRow('Curriculum Feedback', data.curriculum_feedback);

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 48;
    doc.moveTo(MARGIN, footerY).lineTo(MARGIN + TEXT_W, footerY).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(9).fillColor(GRAY)
       .text(
         `Tri-Pillars™ LLC  ·  tripillarstudio.com  ·  Cohort ID: ${data.cohort_id.slice(0, 8)}…`,
         MARGIN, footerY + 10, { width: TEXT_W, align: 'center' }
       );

    doc.end();
  });
}
