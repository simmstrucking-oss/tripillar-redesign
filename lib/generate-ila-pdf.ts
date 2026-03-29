import PDFDocument from 'pdfkit';
import { ILAData, SCHEDULE_A } from './ila-template';

export async function generateILAPdf(data: ILAData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    const doc = new PDFDocument({
      size: 'Letter',
      margin: 72,
    });

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const NAVY = '#2D3142';
    const GOLD = '#B8942F';
    const PAGE_WIDTH = doc.page.width;
    const LEFT_MARGIN = 72;
    const RIGHT_MARGIN = 72;
    const TEXT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;

    // Helper: format font and size
    const setHeading = () => doc.font('Helvetica-Bold').fontSize(14).fillColor(NAVY);
    const setSubheading = () =>
      doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD);
    const setBody = () => doc.font('Helvetica').fontSize(10).fillColor('black');

    // Format books licensed as bulleted list
    const booksFormatted = data.books_licensed
      .map((book) => `• ${book}`)
      .join('\n');

    // Look up tier description
    const tierDesc = SCHEDULE_A[data.license_tier]?.description || '';

    // Full ILA text with placeholders replaced
    const ilaText = `INSTITUTIONAL LICENSE AGREEMENT
Live and Grieve™ Grief Education Program
Tri-Pillars™ LLC

This Institutional License Agreement ("Agreement") is entered into as of ${data.execution_date} ("Execution Date") by and between:

LICENSOR: Tri-Pillars™ LLC, a Kentucky limited liability company ("Tri-Pillars"), and

LICENSEE: ${data.org_name}, a ${data.org_state} organization, with its principal place of business at ${data.org_address} ("Licensee").

RECITALS

WHEREAS, Tri-Pillars has developed and owns the Live and Grieve™ grief education program, including all curriculum materials, facilitator training, participant workbooks, and associated intellectual property (collectively, the "Program"); and

WHEREAS, Licensee desires to obtain a license to use the Program within its organization for the purpose of providing structured grief education services to participants; and

WHEREAS, Tri-Pillars is willing to grant such a license on the terms and conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

ARTICLE 1 — GRANT OF LICENSE

1.1 License Grant. Subject to the terms and conditions of this Agreement, Tri-Pillars hereby grants to Licensee a non-exclusive, non-transferable, non-sublicensable license to use the Program materials licensed hereunder solely for the purpose of providing Live and Grieve™ grief education groups to participants within Licensee's organizational community during the License Term.

1.2 Licensed Materials. The license granted hereunder covers the following Program books and associated facilitator materials:
${booksFormatted}

1.3 License Tier. This Agreement is issued under the ${data.license_tier} tier, as described in Schedule A attached hereto and incorporated by reference.

1.4 Restrictions. Licensee shall not: (a) reproduce, distribute, or publicly display Program materials except as expressly authorized herein; (b) modify, adapt, translate, or create derivative works based on the Program materials; (c) sublicense, sell, resell, transfer, assign, or otherwise dispose of the Program or any rights therein; (d) use the Program for commercial resale or to compete with Tri-Pillars; (e) remove or obscure any proprietary notices, trademarks, or branding from Program materials; (f) use the Program in any manner that misrepresents its origin or suggests clinical therapeutic services.

ARTICLE 2 — FACILITATOR CERTIFICATION

2.1 Certification Requirement. All individuals who facilitate Live and Grieve™ groups under this license must complete and maintain current Facilitator Certification through Tri-Pillars' approved certification program prior to facilitating any groups.

2.2 Certification Maintenance. Facilitators must renew certification as required by Tri-Pillars' then-current certification requirements. Tri-Pillars reserves the right to revoke certification for cause, including but not limited to facilitating groups outside the scope of the Program or misrepresenting the Program.

2.3 Certification Records. Licensee shall maintain accurate records of all certified facilitators operating under this Agreement and shall provide such records to Tri-Pillars upon request.

ARTICLE 3 — FEES AND PAYMENT

3.1 License Fee. In consideration of the license granted hereunder, Licensee shall pay to Tri-Pillars the annual license fee of $${data.license_fee}.00 USD, as set forth in Schedule A.

3.2 Payment Terms. The license fee is due and payable upon execution of this Agreement and annually thereafter on the renewal date.

3.3 Late Payment. Any amounts not paid within thirty (30) days of the due date shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by applicable law, whichever is less.

ARTICLE 4 — TERM AND RENEWAL

4.1 Initial Term. This Agreement commences on ${data.license_start_date} ("License Start Date") and continues through ${data.license_renewal_date} ("License Renewal Date"), unless earlier terminated as provided herein ("License Term").

4.2 Renewal. This Agreement may be renewed for successive one-year terms upon mutual written agreement of the parties and payment of the then-current annual license fee.

4.3 Non-Renewal. Either party may elect not to renew this Agreement by providing written notice to the other party no less than thirty (30) days prior to the License Renewal Date.

ARTICLE 5 — INTELLECTUAL PROPERTY

5.1 Ownership. Licensee acknowledges that Tri-Pillars owns all right, title, and interest in and to the Program, including all intellectual property rights therein. This Agreement does not convey to Licensee any ownership interest in the Program.

5.2 Trademarks. Licensee may use the "Live and Grieve™" and "Tri-Pillars™" marks solely in connection with authorized use of the Program under this Agreement and in accordance with Tri-Pillars' then-current trademark usage guidelines. Licensee shall not register or attempt to register any mark confusingly similar to Tri-Pillars' marks.

5.3 Feedback. Any suggestions, ideas, or feedback provided by Licensee regarding the Program shall be owned by Tri-Pillars and may be used by Tri-Pillars without obligation to Licensee.

ARTICLE 6 — PROGRAM INTEGRITY

6.1 Fidelity. Licensee shall implement the Program in accordance with Tri-Pillars' facilitator training and program guidelines. Licensee shall not market the Program as clinical therapy, counseling, or any licensed mental health service.

6.2 Participant Appropriateness. Licensee is responsible for screening potential participants using the Participant Appropriateness Guide provided by Tri-Pillars and ensuring the Program is appropriate for each participant.

6.3 Quality Standards. Licensee shall maintain the quality and integrity of the Program as presented by Tri-Pillars. Tri-Pillars reserves the right to conduct reasonable audits of Program implementation upon reasonable notice.

ARTICLE 7 — CONFIDENTIALITY

7.1 Confidential Information. Each party agrees to maintain in confidence all proprietary or confidential information of the other party disclosed in connection with this Agreement, including Program materials, pricing, and business information.

7.2 Exceptions. The confidentiality obligations shall not apply to information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was known to the receiving party prior to disclosure; (c) is independently developed by the receiving party; or (d) is required to be disclosed by applicable law.

ARTICLE 8 — LIMITATION OF LIABILITY; DISCLAIMER

8.1 Disclaimer. THE PROGRAM IS PROVIDED "AS IS." TRI-PILLARS MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE OR NON-INFRINGEMENT.

8.2 Limitation. IN NO EVENT SHALL TRI-PILLARS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. TRI-PILLARS' TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID BY LICENSEE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

8.3 Indemnification. Licensee shall indemnify, defend, and hold harmless Tri-Pillars and its officers, members, employees, and agents from and against any claims, damages, or expenses arising from Licensee's use of the Program, breach of this Agreement, or negligence or willful misconduct.

ARTICLE 9 — TERMINATION

9.1 Termination for Cause. Either party may terminate this Agreement upon written notice if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days after receipt of written notice.

9.2 Effect of Termination. Upon termination or expiration of this Agreement, Licensee shall: (a) immediately cease all use of the Program and Program materials; (b) return or destroy all Program materials in its possession; and (c) ensure all facilitators are notified of the termination.

ARTICLE 10 — GENERAL PROVISIONS

10.1 Governing Law. This Agreement shall be governed by the laws of the Commonwealth of Kentucky, without regard to its conflict of law provisions.

10.2 Dispute Resolution. Any dispute arising under this Agreement shall be resolved by binding arbitration administered by the American Arbitration Association under its Commercial Arbitration Rules, with arbitration conducted in Louisville, Kentucky.

10.3 Entire Agreement. This Agreement, together with Schedule A, constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior and contemporaneous agreements.

10.4 Amendment. This Agreement may only be amended by a written instrument signed by authorized representatives of both parties.

10.5 Severability. If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

10.6 Waiver. Failure to enforce any provision of this Agreement shall not constitute a waiver of that provision.

10.7 Notices. All notices under this Agreement shall be in writing and delivered by email to the addresses set forth herein.

10.8 Electronic Signatures. The parties agree that electronic signatures applied to this Agreement are legally binding under the Electronic Signatures in Global and National Commerce Act (E-SIGN), 15 U.S.C. § 7001 et seq., and the Uniform Electronic Transactions Act (UETA).

SCHEDULE A — FEE SCHEDULE

License Tier: ${data.license_tier}
Annual License Fee: $${data.license_fee}.00 USD
Description: ${tierDesc}

SIGNATURE PAGE

By signing below, each party agrees to be bound by the terms of this Institutional License Agreement.

LICENSOR:
Tri-Pillars™ LLC
Name: Wayne Simms
Title: Co-Founder
Signature: ${data.wayne_signature ? data.wayne_signature : '[Pending co-signature]'}
Date: ${data.wayne_date ? data.wayne_date : '[Pending]'}

LICENSEE:
${data.org_name}
Contact: ${data.contact_name}
Title: ${data.contact_title}
Email: ${data.contact_email}
Signature: ${data.org_signature ? data.org_signature : '[Pending organization signature]'}
Date: ${data.org_date ? data.org_date : '[Pending]'}

Agreement Reference: ${data.agreement_token}`;

    // Title
    setHeading();
    doc.fontSize(16).text('INSTITUTIONAL LICENSE AGREEMENT', {
      align: 'center',
      width: TEXT_WIDTH,
    });
    doc.fontSize(12).text('Live and Grieve™ Grief Education Program', {
      align: 'center',
      width: TEXT_WIDTH,
    });
    doc.text('Tri-Pillars™ LLC', { align: 'center', width: TEXT_WIDTH });
    doc.moveDown(0.5);

    // Body text
    setBody();

    // Split and render text, handling section headers
    const lines = ilaText.split('\n');
    let inSignatureSection = false;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Detect signature section
      if (trimmed.includes('SIGNATURE PAGE')) {
        inSignatureSection = true;
      }

      // Check if this is a section header
      const isArticleHeader =
        trimmed.startsWith('ARTICLE') ||
        trimmed === 'RECITALS' ||
        trimmed === 'NOW, THEREFORE' ||
        trimmed.includes('SCHEDULE A') ||
        trimmed.includes('SIGNATURE PAGE');

      if (isArticleHeader && !inSignatureSection) {
        setSubheading();
        doc.text(trimmed, { width: TEXT_WIDTH });
        setBody();
      } else if (
        (trimmed.startsWith('WHEREAS') ||
          trimmed.startsWith('LICENSOR') ||
          trimmed.startsWith('LICENSEE:') ||
          /^[0-9.]+\s/.test(trimmed)) &&
        !inSignatureSection
      ) {
        // Numbered provisions and recitals
        doc.text(trimmed, { width: TEXT_WIDTH });
      } else if (trimmed.startsWith('•')) {
        // Bulleted items
        doc.text(trimmed, { width: TEXT_WIDTH });
      } else if (trimmed) {
        // Regular text
        doc.text(trimmed, { width: TEXT_WIDTH });
      } else {
        // Empty line
        doc.moveDown(0.3);
      }
    });

    doc.end();
  });
}
