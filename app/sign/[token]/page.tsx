'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SCHEDULE_A } from '@/lib/ila-template';

interface AgreementData {
  id: string;
  token: string;
  org_name: string;
  contact_name: string;
  contact_email: string;
  contact_title: string;
  org_address: string;
  org_state: string;
  license_tier: string;
  license_fee: number;
  license_start_date: string;
  license_renewal_date: string;
  books_licensed: string[];
  execution_date?: string;
}

export default function SignAgreement() {
  const params = useParams();
  const token = params.token as string;

  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchAgreement() {
      try {
        const res = await fetch(`/api/sign/${token}`);
        const data = await res.json();

        if (data.error === 'invalid') {
          setError(
            'This agreement link is not valid. Please contact wayne@tripillarstudio.com.'
          );
        } else if (data.error === 'expired') {
          setError(
            'This agreement link has expired. Please contact wayne@tripillarstudio.com.'
          );
        } else if (data.error === 'already_signed') {
          setError(
            'This agreement has already been signed. You will receive the fully executed copy by email once Wayne co-signs.'
          );
        } else if (data.agreement) {
          setAgreement(data.agreement);
        }
      } catch (err) {
        setError('Failed to load agreement. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAgreement();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/sign/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_text: signature,
          signer_name: signature,
          signer_email: agreement?.contact_email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit signature');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE' }}>
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <p>Loading agreement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE' }}>
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#F4F1EC',
              padding: '40px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <h1 style={{ color: '#2D3142', marginBottom: '20px' }}>
              Live and Grieve™
            </h1>
            <p style={{ fontSize: '16px', color: '#7A7264', lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE' }}>
        <div
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#F4F1EC',
              padding: '40px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <h1 style={{ color: '#2E7D50', marginBottom: '20px' }}>
              Signature Received
            </h1>
            <p style={{ fontSize: '16px', color: '#333', lineHeight: 1.6 }}>
              Your signature has been received. Wayne will co-sign and you will
              receive a fully executed copy by email within 1 business day.
            </p>
            <p style={{ marginTop: '30px' }}>
              <a
                href="https://tripillarstudio.com"
                style={{
                  color: '#B8942F',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                }}
              >
                Visit tripillarstudio.com to learn more while you wait.
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!agreement) {
    return null;
  }

  const tierDesc = SCHEDULE_A[agreement.license_tier]?.description || '';
  const today = new Date().toISOString().split('T')[0];

  // Build full ILA text
  const booksFormatted = agreement.books_licensed
    .map((book) => `• ${book}`)
    .join('\n');

  const ilaText = `INSTITUTIONAL LICENSE AGREEMENT
Live and Grieve™ Grief Education Program
Tri-Pillars™ LLC

This Institutional License Agreement ("Agreement") is entered into as of ${today} ("Execution Date") by and between:

LICENSOR: Tri-Pillars™ LLC, a Kentucky limited liability company ("Tri-Pillars"), and

LICENSEE: ${agreement.org_name}, a ${agreement.org_state} organization, with its principal place of business at ${agreement.org_address} ("Licensee").

RECITALS

WHEREAS, Tri-Pillars has developed and owns the Live and Grieve™ grief education program, including all curriculum materials, facilitator training, participant workbooks, and associated intellectual property (collectively, the "Program"); and

WHEREAS, Licensee desires to obtain a license to use the Program within its organization for the purpose of providing structured grief education services to participants; and

WHEREAS, Tri-Pillars is willing to grant such a license on the terms and conditions set forth herein.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

ARTICLE 1 — GRANT OF LICENSE

1.1 License Grant. Subject to the terms and conditions of this Agreement, Tri-Pillars hereby grants to Licensee a non-exclusive, non-transferable, non-sublicensable license to use the Program materials licensed hereunder solely for the purpose of providing Live and Grieve™ grief education groups to participants within Licensee's organizational community during the License Term.

1.2 Licensed Materials. The license granted hereunder covers the following Program books and associated facilitator materials:
${booksFormatted}

1.3 License Tier. This Agreement is issued under the ${agreement.license_tier} tier, as described in Schedule A attached hereto and incorporated by reference.

1.4 Restrictions. Licensee shall not: (a) reproduce, distribute, or publicly display Program materials except as expressly authorized herein; (b) modify, adapt, translate, or create derivative works based on the Program materials; (c) sublicense, sell, resell, transfer, assign, or otherwise dispose of the Program or any rights therein; (d) use the Program for commercial resale or to compete with Tri-Pillars; (e) remove or obscure any proprietary notices, trademarks, or branding from Program materials; (f) use the Program in any manner that misrepresents its origin or suggests clinical therapeutic services.

ARTICLE 2 — FACILITATOR CERTIFICATION

2.1 Certification Requirement. All individuals who facilitate Live and Grieve™ groups under this license must complete and maintain current Facilitator Certification through Tri-Pillars' approved certification program prior to facilitating any groups.

2.2 Certification Maintenance. Facilitators must renew certification as required by Tri-Pillars' then-current certification requirements. Tri-Pillars reserves the right to revoke certification for cause, including but not limited to facilitating groups outside the scope of the Program or misrepresenting the Program.

2.3 Certification Records. Licensee shall maintain accurate records of all certified facilitators operating under this Agreement and shall provide such records to Tri-Pillars upon request.

ARTICLE 3 — FEES AND PAYMENT

3.1 License Fee. In consideration of the license granted hereunder, Licensee shall pay to Tri-Pillars the annual license fee of $${agreement.license_fee}.00 USD, as set forth in Schedule A.

3.2 Payment Terms. The license fee is due and payable upon execution of this Agreement and annually thereafter on the renewal date.

3.3 Late Payment. Any amounts not paid within thirty (30) days of the due date shall accrue interest at the rate of 1.5% per month or the maximum rate permitted by applicable law, whichever is less.

ARTICLE 4 — TERM AND RENEWAL

4.1 Initial Term. This Agreement commences on ${agreement.license_start_date} ("License Start Date") and continues through ${agreement.license_renewal_date} ("License Renewal Date"), unless earlier terminated as provided herein ("License Term").

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

License Tier: ${agreement.license_tier}
Annual License Fee: $${agreement.license_fee}.00 USD
Description: ${tierDesc}`;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF8EE' }}>
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '40px 20px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#2D3142', fontSize: '24px', marginBottom: '8px' }}>
            Live and Grieve™
          </h1>
          <p style={{ color: '#7A7264', fontSize: '16px' }}>
            Institutional License Agreement
          </p>
        </div>

        {/* Document */}
        <div
          style={{
            backgroundColor: 'white',
            border: `1px solid #E2DDD7`,
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px',
            maxHeight: '60vh',
            overflowY: 'auto',
            lineHeight: 1.6,
            fontSize: '14px',
            color: '#333',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {ilaText}
        </div>

        {/* E-SIGN Notice */}
        <div
          style={{
            border: `2px solid #B8942F`,
            backgroundColor: '#FDF8EE',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '30px',
            fontSize: '13px',
            color: '#333',
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>E-SIGN Notice</p>
          <p style={{ margin: 0 }}>
            By typing your full legal name below, you are signing this agreement
            electronically. Your name, timestamp, and IP address will be recorded.
            This constitutes a legally binding signature under the Electronic
            Signatures in Global and National Commerce Act (E-SIGN), 15 U.S.C. §
            7001 et seq.
          </p>
        </div>

        {/* Signature Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#2D3142',
              }}
            >
              Type your full legal name to sign
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your Full Legal Name"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid #E2DDD7`,
                borderRadius: '4px',
                fontSize: '14px',
                fontStyle: signature ? 'italic' : 'normal',
                boxSizing: 'border-box',
              }}
              disabled={submitting}
            />
            <p
              style={{
                marginTop: '8px',
                fontSize: '13px',
                color: '#7A7264',
              }}
            >
              Signing as: <strong>{agreement.contact_name}</strong> on behalf of{' '}
              <strong>{agreement.org_name}</strong>
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '20px',
                color: '#856404',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={signature.length < 3 || submitting}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor:
                signature.length < 3 || submitting ? '#ccc' : '#B8942F',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: signature.length < 3 || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Signing...' : 'Sign Agreement'}
          </button>
        </form>
      </div>
    </div>
  );
}
