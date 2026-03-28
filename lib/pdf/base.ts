// Shared PDF builder utilities for Live and Grieve™ reports
import PDFDocument from 'pdfkit';

export const C = {
  navy:       '#2D3142',
  gold:       '#B8942F',
  lightGold:  '#F0E4C0',
  cream:      '#FAFAF7',
  slate:      '#5A6070',
  lightGray:  '#EAEAEA',
  white:      '#FFFFFF',
  danger:     '#C0392B',
};

export const FONTS = {
  heading: 'Helvetica-Bold',    // PDFKit built-in; Playfair Display not embeddable without file
  body:    'Helvetica',
  bold:    'Helvetica-Bold',
  italic:  'Helvetica-Oblique',
};

export const FOOTER_TEXT = 'Tri-Pillars™ LLC  ·  Confidential Program Data  ·  tripillarstudio.com';

export function createDoc() {
  return new PDFDocument({
    size:    'LETTER',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info:    { Creator: 'Tri-Pillars LLC', Producer: 'Live and Grieve™' },
  });
}

export function drawCover(
  doc: PDFKit.PDFDocument,
  title: string,
  subtitle: string,
  meta: { label: string; value: string }[],
) {
  const W = doc.page.width;
  const H = doc.page.height;

  // Navy background
  doc.rect(0, 0, W, H).fill(C.navy);

  // Gold top band
  doc.rect(0, 0, W, 8).fill(C.gold);

  // Logo / org name
  doc.fillColor(C.gold).font(FONTS.heading).fontSize(11)
     .text('LIVE AND GRIEVE™', 60, 60, { align: 'left' });
  doc.fillColor(C.slate).font(FONTS.body).fontSize(9)
     .text('TRI-PILLARS™ LLC', 60, 76, { align: 'left' });

  // Decorative rule
  doc.moveTo(60, 110).lineTo(W - 60, 110).strokeColor(C.gold).lineWidth(1).stroke();

  // Title block
  doc.fillColor(C.white).font(FONTS.heading).fontSize(28)
     .text(title, 60, 140, { width: W - 120, align: 'left' });

  const titleHeight = doc.heightOfString(title, { width: W - 120 });
  const subtitleY = 140 + titleHeight + 16;

  doc.fillColor(C.gold).font(FONTS.italic).fontSize(14)
     .text(subtitle, 60, subtitleY, { width: W - 120 });

  // Meta box
  const metaY = subtitleY + 60;
  doc.roundedRect(60, metaY, W - 120, meta.length * 28 + 24, 4)
     .fillColor('#1A1F30').fill();

  meta.forEach((m, i) => {
    const y = metaY + 16 + i * 28;
    doc.fillColor(C.gold).font(FONTS.bold).fontSize(9)
       .text(m.label.toUpperCase(), 80, y, { continued: true })
       .fillColor(C.white).font(FONTS.body).fontSize(11)
       .text(`  ${m.value}`, { lineBreak: false });
  });

  // Footer
  doc.moveTo(60, H - 80).lineTo(W - 60, H - 80).strokeColor(C.gold).lineWidth(0.5).stroke();
  doc.fillColor(C.slate).font(FONTS.body).fontSize(8)
     .text(FOOTER_TEXT, 60, H - 64, { width: W - 120, align: 'center' });
}

export function drawPageHeader(
  doc: PDFKit.PDFDocument,
  section: string,
  pageNum: number,
  totalPages?: number,
) {
  const W = doc.page.width;
  doc.rect(0, 0, W, 40).fill(C.navy);
  doc.fillColor(C.gold).font(FONTS.bold).fontSize(9)
     .text('LIVE AND GRIEVE™', 60, 14);
  doc.fillColor(C.lightGray).font(FONTS.body).fontSize(9)
     .text(section, 0, 14, { width: W - 60, align: 'right' });
  doc.y = 60;
}

export function drawFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  const W = doc.page.width;
  const H = doc.page.height;
  doc.moveTo(60, H - 48).lineTo(W - 60, H - 48).strokeColor(C.lightGray).lineWidth(0.5).stroke();
  doc.fillColor(C.slate).font(FONTS.body).fontSize(7.5)
     .text(FOOTER_TEXT, 60, H - 36, { width: W - 120, align: 'center' });
  doc.fillColor(C.slate).font(FONTS.body).fontSize(7.5)
     .text(`${pageNum}`, W - 60, H - 36, { align: 'right' });
}

export function sectionHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.moveDown(0.5);
  doc.fillColor(C.navy).font(FONTS.heading).fontSize(14).text(text);
  doc.moveTo(doc.page.margins.left, doc.y + 4)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
     .strokeColor(C.gold).lineWidth(1).stroke();
  doc.moveDown(0.8);
}

export function kv(doc: PDFKit.PDFDocument, label: string, value: string | number | null, opts?: { indent?: number }) {
  const indent = opts?.indent ?? 0;
  doc.fillColor(C.slate).font(FONTS.bold).fontSize(9)
     .text(`${label}:`, doc.page.margins.left + indent, doc.y, { continued: true, width: 150 });
  doc.fillColor(C.navy).font(FONTS.body).fontSize(10)
     .text(`  ${value ?? '—'}`, { lineBreak: true });
}

export function ratingBar(
  doc: PDFKit.PDFDocument,
  label: string,
  value: number | null,
  max = 5,
) {
  const x = doc.page.margins.left;
  const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;
  doc.fillColor(C.navy).font(FONTS.body).fontSize(9).text(label, x, y, { width: 160 });
  const barX = x + 170;
  const barW = W - 175;
  const filled = value ? (value / max) * barW : 0;
  doc.rect(barX, y + 1, barW, 10).fillColor(C.lightGray).fill();
  doc.rect(barX, y + 1, filled, 10).fillColor(C.gold).fill();
  doc.fillColor(C.slate).font(FONTS.bold).fontSize(9)
     .text(value ? `${value} / ${max}` : '—', barX + barW + 8, y);
  doc.y = y + 18;
}

/** Convert a PDFDocument stream to a Buffer */
export function docToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}
