import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

/* ── Types ── */
interface Document {
  name: string;
  url: string | null;
  confidential: boolean;
  bucket: string;
  path: string;
}

interface Section {
  title: string;
  documents: Document[];
}

const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

/* ── Facilitator-level document definitions (mirrors /api/hub/documents) ── */
const FACILITATOR_BUCKET = 'facilitator-documents';

interface FacDocDef {
  name: string;
  path: string;
  requiresBook?: number; // trainers bypass this
}

interface FacSectionDef {
  title: string;
  docs: FacDocDef[];
}

const FACILITATOR_SECTIONS: FacSectionDef[] = [
  {
    title: 'Program Overview',
    docs: [
      { name: 'Participant Appropriateness Guide', path: '01_PROGRAM/LG_Participant_Appropriateness_Guide.docx' },
      { name: 'Program Overview', path: '01_PROGRAM/LG_Program_Overview.docx' },
      { name: 'Specialized Populations Supplement', path: '01_PROGRAM/LG_Specialized_Populations_Supplement.docx' },
    ],
  },
  {
    title: 'Certified Facilitator Reference Guides',
    docs: [
      { name: 'Certified Facilitator Reference Guide — Book 1', path: '02_FACILITATOR/CFRG/LG_Certified_Facilitator_Reference_Guide_Book1_FINAL.docx' },
      { name: 'Certified Facilitator Reference Guide — Book 2', path: '02_FACILITATOR/CFRG/LG_Certified_Facilitator_Reference_Guide_Book2_FINAL.docx' },
      { name: 'Certified Facilitator Reference Guide — Book 3', path: '02_FACILITATOR/CFRG/LG_Certified_Facilitator_Reference_Guide_Book3_FINAL.docx' },
      { name: 'Certified Facilitator Reference Guide — Book 4', path: '02_FACILITATOR/CFRG/LG_Certified_Facilitator_Reference_Guide_Book4_FINAL.docx' },
    ],
  },
  {
    title: 'Master Facilitator Manuals',
    docs: [
      { name: 'Master Facilitator Manual — Book 1', path: '02_FACILITATOR/FM/LG_Master_Facilitator_Manual_Book1_FINAL.docx' },
      { name: 'Master Facilitator Manual — Book 2', path: '02_FACILITATOR/FM/LG_Master_Facilitator_Manual_Book2_FINAL.docx' },
      { name: 'Master Facilitator Manual — Book 3', path: '02_FACILITATOR/FM/LG_Master_Facilitator_Manual_Book3_FINAL.docx' },
      { name: 'Master Facilitator Manual — Book 4', path: '02_FACILITATOR/FM/LG_Master_Facilitator_Manual_Book4_FINAL.docx' },
    ],
  },
  {
    title: 'Facilitator Resources',
    docs: [
      { name: 'Facilitator Code of Conduct', path: '02_FACILITATOR/LG_Facilitator_Code_of_Conduct.docx' },
      { name: 'Facilitator Corrective Action Process', path: '02_FACILITATOR/LG_Facilitator_Corrective_Action_Process.docx' },
      { name: 'Facilitator Inner Work Guide', path: '02_FACILITATOR/LG_Facilitator_Inner_Work_Guide.docx' },
      { name: 'Facilitator Supervision Framework', path: '02_FACILITATOR/LG_Facilitator_Supervision_Framework.docx' },
      { name: 'Virtual Facilitation Addendum', path: '02_FACILITATOR/LG_Virtual_Facilitation_Addendum.docx' },
      { name: 'Trainer Certification Pathway', path: '02_FACILITATOR/LG_Trainer_Certification_Pathway.docx' },
    ],
  },
  {
    title: 'Certification & Assessment',
    docs: [
      { name: 'Certification Acknowledgment Form', path: '03_CERTIFICATION/LG_Certification_Acknowledgment_Form.docx' },
      { name: 'Assessment Participant Copy — Book 1', path: '03_CERTIFICATION/LG_Assessment_Book1_Participant_Copy.docx' },
      { name: 'Assessment Participant Copy — Book 2', path: '03_CERTIFICATION/LG_Assessment_Book2_Participant_Copy.docx' },
      { name: 'Assessment Participant Copy — Book 3', path: '03_CERTIFICATION/LG_Assessment_Book3_Participant_Copy.docx' },
      { name: 'Assessment Participant Copy — Book 4', path: '03_CERTIFICATION/LG_Assessment_Book4_Participant_Copy.docx' },
    ],
  },
  {
    title: 'Outcome Tracking',
    docs: [
      { name: 'Outcome Tracking Form — Book 1', path: '04_OUTCOMES/LG_Outcome_Tracking_Form_Book1.docx' },
      { name: 'Outcome Tracking Form — Book 2', path: '04_OUTCOMES/LG_Outcome_Tracking_Form_Book2.docx' },
      { name: 'Outcome Tracking Form — Book 3', path: '04_OUTCOMES/LG_Outcome_Tracking_Form_Book3.docx' },
      { name: 'Outcome Tracking Form — Book 4', path: '04_OUTCOMES/LG_Outcome_Tracking_Form_Book4.docx' },
      { name: 'Outcome Tracking Dashboard Guide', path: '04_OUTCOMES/LG_Outcome_Tracking_Dashboard_Guide.docx' },
    ],
  },
  {
    title: 'Forms & Templates',
    docs: [
      { name: 'Crisis Resources Sheet', path: '05_FORMS/LG_Crisis_Resources_Sheet.docx' },
      { name: 'Group Agreements', path: '05_FORMS/LG_Group_Agreements.docx' },
      { name: 'Session Attendance Log', path: '05_FORMS/LG_Session_Attendance_Log.docx' },
      { name: 'Session Feedback Form', path: '05_FORMS/LG_Session_Feedback_Form.docx' },
      { name: 'Facilitator Reflection Log', path: '05_FORMS/LG_Facilitator_Reflection_Log.docx' },
      { name: 'Critical Incident Report', path: '05_FORMS/LG_Critical_Incident_Report.docx' },
    ],
  },
];

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role, books_authorized_to_train')
    .eq('user_id', user.id)
    .single();

  const isOwner = OWNER_EMAILS.includes(user.email ?? '');
  if (!isOwner && (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const booksAuthorized: number[] = isOwner ? [1, 2, 3, 4] : (profile?.books_authorized_to_train ?? []);

  /* ── Helper: signed URL ── */
  async function signedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    return data?.signedUrl ?? null;
  }

  /* ════════════════════════════════════
     SECTION 1 — Trainer Resources
  ═════════════════════════════════════*/
  const trainerSections: Section[] = [];

  // Per-book trainer docs (filtered by authorized books)
  for (const bookNum of booksAuthorized.sort((a, b) => a - b)) {
    const bookDocs: Document[] = [];

    // Training Manual
    const tmUrl = await signedUrl(
      FACILITATOR_BUCKET,
      `03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book${bookNum}_FINAL.docx`
    );
    bookDocs.push({
      name: `Facilitator Certification Training Manual — Book ${bookNum}`,
      url: tmUrl,
      confidential: false,
      bucket: FACILITATOR_BUCKET,
      path: `03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book${bookNum}_FINAL.docx`,
    });

    // Assessment Participant Copy
    const assessUrl = await signedUrl(
      FACILITATOR_BUCKET,
      `03_CERTIFICATION/LG_Assessment_Book${bookNum}_Participant_Copy.docx`
    );
    bookDocs.push({
      name: `Assessment Participant Copy — Book ${bookNum}`,
      url: assessUrl,
      confidential: false,
      bucket: FACILITATOR_BUCKET,
      path: `03_CERTIFICATION/LG_Assessment_Book${bookNum}_Participant_Copy.docx`,
    });

    // Answer Key (confidential, restricted-documents bucket, 60s URL, logged separately)
    const akUrl = await signedUrl('restricted-documents', `answer-keys/LG_Book${bookNum}_Answer_Key.pdf`, 60);
    bookDocs.push({
      name: `Trainer Answer Key — Book ${bookNum}`,
      url: akUrl,
      confidential: true,
      bucket: 'restricted-documents',
      path: `answer-keys/LG_Book${bookNum}_Answer_Key.pdf`,
    });

    trainerSections.push({ title: `Book ${bookNum} Trainer Documents`, documents: bookDocs });
  }

  // General trainer docs (not book-specific)
  const { data: trainerCert } = await supabase
    .from('trainer_certifications')
    .select('id')
    .eq('trainer_id', profile?.id)
    .limit(1)
    .single();

  const trainerGeneralDocs: Document[] = [];

  const certTemplateUrl = await signedUrl('trainer-documents', 'templates/LG_Certification_Record_Template.csv');
  trainerGeneralDocs.push({
    name: 'Certification Record Submission Template (CSV)',
    url: certTemplateUrl,
    confidential: false,
    bucket: 'trainer-documents',
    path: 'templates/LG_Certification_Record_Template.csv',
  });

  if (trainerCert?.id) {
    const agreementUrl = await signedUrl('trainer-documents', `agreements/${trainerCert.id}_agreement.pdf`);
    trainerGeneralDocs.push({
      name: 'Your Signed Trainer Agreement',
      url: agreementUrl,
      confidential: false,
      bucket: 'trainer-documents',
      path: `agreements/${trainerCert.id}_agreement.pdf`,
    });
  }

  if (trainerGeneralDocs.length > 0) {
    trainerSections.push({ title: 'General Trainer Documents', documents: trainerGeneralDocs });
  }

  /* ════════════════════════════════════
     SECTION 2 — Facilitator Resources
     Trainers get all books (no cert gate)
  ═════════════════════════════════════*/
  const facilitatorSections: Section[] = [];

  for (const secDef of FACILITATOR_SECTIONS) {
    const docs: Document[] = [];
    for (const docDef of secDef.docs) {
      const url = await signedUrl(FACILITATOR_BUCKET, docDef.path);
      docs.push({
        name: docDef.name,
        url,
        confidential: false,
        bucket: FACILITATOR_BUCKET,
        path: docDef.path,
      });
    }
    if (docs.length > 0) {
      facilitatorSections.push({ title: secDef.title, documents: docs });
    }
  }

  return NextResponse.json({
    sections: [
      {
        groupTitle: 'Trainer Resources',
        groupDesc: 'Documents specific to your role as a Certified Trainer. Answer Keys are confidential — handle with care.',
        sections: trainerSections,
      },
      {
        groupTitle: 'Facilitator Resources',
        groupDesc: 'Full facilitator curriculum and support documents. Trainers have access to all books.',
        sections: facilitatorSections,
      },
    ],
  });
}

/* ── POST: log a document download ── */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single();

  const isOwner = OWNER_EMAILS.includes(user.email ?? '');
  if (!isOwner && (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { document_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.document_name) {
    return NextResponse.json({ error: 'Missing document_name' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  await supabase.from('trainer_document_downloads').insert({
    trainer_id: profile?.id ?? null,
    document_name: body.document_name,
    ip_address: ip,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
