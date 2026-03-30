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
const FAC_BUCKET = 'facilitator-documents';
const RESTRICTED_BUCKET = 'restricted-documents';

/* ─────────────────────────────────────────────────────────────
   EXACT paths verified against Supabase Storage 2026-03-29
   facilitator-documents/ folder structure:
     01_PROGRAM/
       LG_Participant_Appropriateness_Guide.docx
       LG_Program_Overview.docx
       LG_Self_Guided_Solo_Companion.docx
       LG_Specialized_Populations_Supplement.docx
     02_FACILITATOR/
       LG_Certified_Facilitator_Reference_Guide_Book1_FINAL.docx  (no CFRG/ subfolder)
       LG_Certified_Facilitator_Reference_Guide_Book2_FINAL.docx
       LG_Certified_Facilitator_Reference_Guide_Book3_FINAL.docx
       LG_Certified_Facilitator_Reference_Guide_Book4_FINAL.docx
       LG_Facilitator_Code_of_Conduct.docx
       LG_Facilitator_Corrective_Action_Process.docx
       LG_Facilitator_Inner_Work_Guide.docx
       LG_Facilitator_Supervision_Framework.docx
       LG_Master_Facilitator_Manual_Book1_FINAL.docx  (no FM/ subfolder)
       LG_Master_Facilitator_Manual_Book2_FINAL.docx
       LG_Master_Facilitator_Manual_Book3_FINAL.docx
       LG_Master_Facilitator_Manual_Book4_FINAL.docx
       LG_Virtual_Facilitation_Addendum.docx
     03_CERTIFICATION/
       LG_Assessment_Book1_Participant_Copy.docx
       LG_Assessment_Book2_Participant_Copy.docx
       LG_Assessment_Book3_Participant_Copy.docx
       LG_Assessment_Book4_Participant_Copy.docx
       LG_Certification_Acknowledgment_Form.docx
       LG_Trainer_Certification_Pathway.docx
     03_TRAINING/
       LG_Facilitator_Certification_Training_Manual_Book1_FINAL.docx
       LG_Facilitator_Certification_Training_Manual_Book2_FINAL.docx
       LG_Facilitator_Certification_Training_Manual_Book3_FINAL.docx
       LG_Facilitator_Certification_Training_Manual_Book4_FINAL.docx
     04_OUTCOMES/
       LG_Outcome_Facilitator_Cohort_Summary.docx
       LG_Outcome_Tracking_Book2_Post_Program.docx
       LG_Outcome_Tracking_Book2_Pre_Program.docx
       LG_Outcome_Tracking_Book3_Post_Program.docx
       LG_Outcome_Tracking_Book3_Pre_Program.docx
       LG_Outcome_Tracking_Book4_Post_Program.docx
       LG_Outcome_Tracking_Book4_Pre_Program.docx
       LG_Outcome_Tracking_Post_Program.docx     (Book 1 pre/post — no book number suffix)
       LG_Outcome_Tracking_Pre_Program.docx
       LG_Outcomes_Research_Brief.docx
       LG_Program_Evaluation_Summary_Template.docx
     05_FORMS/
       LG_Crisis_Resources_Sheet.docx
       LG_Critical_Incident_Report.docx
       LG_Facilitator_Reflection_Log.docx
       LG_Group_Agreements.docx
       LG_Scenario_Cards_Modules_8_9.docx
       LG_Session_Attendance_Log.docx
       LG_Session_Feedback_Form.docx

   restricted-documents/03_CERTIFICATION/
       LG_Assessment_Trainer_Answer_Key_Book2_CONFIDENTIAL.docx
       LG_Assessment_Trainer_Answer_Key_Book3_CONFIDENTIAL.docx
       LG_Assessment_Trainer_Answer_Key_Book4_CONFIDENTIAL.docx
    

   trainer-documents/ — empty bucket (templates not yet uploaded)
────────────────────────────────────────────────────────────── */

/* ── Facilitator section definitions — exact paths from storage ── */
interface FacDocDef { name: string; path: string; }
interface FacSectionDef { title: string; docs: FacDocDef[]; }

const FACILITATOR_SECTIONS: FacSectionDef[] = [
  {
    title: 'Program Overview',
    docs: [
      { name: 'Program Overview', path: '01_PROGRAM/LG_Program_Overview.docx' },
      { name: 'Participant Appropriateness Guide', path: '01_PROGRAM/LG_Participant_Appropriateness_Guide.docx' },
      { name: 'Specialized Populations Supplement', path: '01_PROGRAM/LG_Specialized_Populations_Supplement.docx' },
      { name: 'Self-Guided Solo Companion Guide', path: '01_PROGRAM/LG_Self_Guided_Solo_Companion.docx' },
    ],
  },
  {
    title: 'Certified Facilitator Reference Guides',
    docs: [
      { name: 'CFRG — Book 1: In The Quiet', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book1_FINAL.docx' },
      { name: 'CFRG — Book 2: Through The Weight', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book2_FINAL.docx' },
      { name: 'CFRG — Book 3: Toward the Light', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book3_FINAL.docx' },
      { name: 'CFRG — Book 4: With the Memory', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book4_FINAL.docx' },
    ],
  },
  {
    title: 'Master Facilitator Manuals',
    docs: [
      { name: 'Master Facilitator Manual — Book 1: In The Quiet', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book1_FINAL.docx' },
      { name: 'Master Facilitator Manual — Book 2: Through The Weight', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book2_FINAL.docx' },
      { name: 'Master Facilitator Manual — Book 3: Toward the Light', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book3_FINAL.docx' },
      { name: 'Master Facilitator Manual — Book 4: With the Memory', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book4_FINAL.docx' },
    ],
  },
  {
    title: 'Facilitator Resources',
    docs: [
      { name: 'Facilitator Inner Work Guide', path: '02_FACILITATOR/LG_Facilitator_Inner_Work_Guide.docx' },
      { name: 'Facilitator Code of Conduct', path: '02_FACILITATOR/LG_Facilitator_Code_of_Conduct.docx' },
      { name: 'Facilitator Supervision Framework', path: '02_FACILITATOR/LG_Facilitator_Supervision_Framework.docx' },
      { name: 'Facilitator Corrective Action Process', path: '02_FACILITATOR/LG_Facilitator_Corrective_Action_Process.docx' },
      { name: 'Virtual Facilitation Addendum', path: '02_FACILITATOR/LG_Virtual_Facilitation_Addendum.docx' },
    ],
  },
  {
    title: 'Certification & Trainer Pathway',
    docs: [
      { name: 'Trainer Certification Pathway', path: '03_CERTIFICATION/LG_Trainer_Certification_Pathway.docx' },
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
      // Book 1 has no book number suffix
      { name: 'Outcome Tracking — Pre-Program (Book 1)', path: '04_OUTCOMES/LG_Outcome_Tracking_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 1)', path: '04_OUTCOMES/LG_Outcome_Tracking_Post_Program.docx' },
      { name: 'Outcome Tracking — Pre-Program (Book 2)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book2_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 2)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book2_Post_Program.docx' },
      { name: 'Outcome Tracking — Pre-Program (Book 3)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book3_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 3)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book3_Post_Program.docx' },
      { name: 'Outcome Tracking — Pre-Program (Book 4)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book4_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 4)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book4_Post_Program.docx' },
      { name: 'Facilitator Cohort Summary', path: '04_OUTCOMES/LG_Outcome_Facilitator_Cohort_Summary.docx' },
      { name: 'Outcomes Research Brief', path: '04_OUTCOMES/LG_Outcomes_Research_Brief.docx' },
      { name: 'Program Evaluation Summary Template', path: '04_OUTCOMES/LG_Program_Evaluation_Summary_Template.docx' },
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
      // Trainer-only: confirmed at 05_FORMS/ (not 02_FACILITATOR/)
      { name: 'Scenario Cards — Modules 8 & 9', path: '05_FORMS/LG_Scenario_Cards_Modules_8_9.docx' },
    ],
  },
];

/* ── Training Manual definitions — exact paths from storage ── */
const TRAINING_MANUALS: Record<number, string> = {
  1: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book1_FINAL.docx',
  2: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book2_FINAL.docx',
  3: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book3_FINAL.docx',
  4: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book4_FINAL.docx',
};

/* ── Answer Key definitions — exact paths from restricted-documents bucket ── */
// Book 1 has NO answer key here — it is embedded in the Founders Only document (admin-only)
// Books 2-4 only
const ANSWER_KEYS: Record<number, string> = {
  2: '03_CERTIFICATION/LG_Assessment_Trainer_Answer_Key_Book2_CONFIDENTIAL.docx',
  3: '03_CERTIFICATION/LG_Assessment_Trainer_Answer_Key_Book3_CONFIDENTIAL.docx',
  4: '03_CERTIFICATION/LG_Assessment_Trainer_Answer_Key_Book4_CONFIDENTIAL.docx',
};

const BOOK_NAMES: Record<number, string> = {
  1: 'In The Quiet',
  2: 'Through The Weight',
  3: 'Toward the Light',
  4: 'With the Memory',
};

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

  /* ── Helper: generate signed URL, return null on any error ── */
  async function signedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  }

  /* ════════════════════════════════════
     GROUP 1 — Trainer-Specific Documents
  ═════════════════════════════════════*/
  const trainerSections: Section[] = [];

  for (const bookNum of booksAuthorized.sort((a, b) => a - b)) {
    const bookName = BOOK_NAMES[bookNum] ?? `Book ${bookNum}`;
    const bookDocs: Document[] = [];

    // Training Manual — facilitator-documents/03_TRAINING/
    const tmPath = TRAINING_MANUALS[bookNum];
    if (tmPath) {
      const tmUrl = await signedUrl(FAC_BUCKET, tmPath);
      bookDocs.push({
        name: `Facilitator Certification Training Manual — Book ${bookNum}: ${bookName}`,
        url: tmUrl,
        confidential: false,
        bucket: FAC_BUCKET,
        path: tmPath,
      });
    }

    // Assessment Participant Copy — facilitator-documents/03_CERTIFICATION/
    const assessPath = `03_CERTIFICATION/LG_Assessment_Book${bookNum}_Participant_Copy.docx`;
    const assessUrl = await signedUrl(FAC_BUCKET, assessPath);
    bookDocs.push({
      name: `Assessment Participant Copy — Book ${bookNum}: ${bookName}`,
      url: assessUrl,
      confidential: false,
      bucket: FAC_BUCKET,
      path: assessPath,
    });

    // Answer Key — restricted-documents/03_CERTIFICATION/
    const akPath = ANSWER_KEYS[bookNum];
    if (akPath) {
      const akUrl = await signedUrl(RESTRICTED_BUCKET, akPath, 60); // 60s only — confidential
      bookDocs.push({
        name: `Trainer Answer Key — Book ${bookNum}: ${bookName}`,
        url: akUrl,
        confidential: true,
        bucket: RESTRICTED_BUCKET,
        path: akPath,
      });
    }

    if (bookDocs.length > 0) {
      trainerSections.push({
        title: `Book ${bookNum} — ${bookName}`,
        documents: bookDocs,
      });
    }
  }

  // General trainer documents (not book-specific)
  // trainer-documents bucket — exact paths verified 2026-03-29
  const generalTrainerDocs: Document[] = [
    {
      name: 'Certified Trainer Agreement',
      url: await signedUrl('trainer-documents', 'LG_Certified_Trainer_Agreement.docx'),
      confidential: false,
      bucket: 'trainer-documents',
      path: 'LG_Certified_Trainer_Agreement.docx',
    },
    {
      name: 'Certification Record Submission Template (CSV)',
      url: await signedUrl('trainer-documents', 'LG_Certification_Record_Template.csv'),
      confidential: false,
      bucket: 'trainer-documents',
      path: 'LG_Certification_Record_Template.csv',
    },
  ];
  trainerSections.push({ title: 'General Trainer Documents', documents: generalTrainerDocs });

  /* ════════════════════════════════════
     GROUP 2 — Facilitator Resources
     Trainers get full access, no cert gate
  ═════════════════════════════════════*/
  const facilitatorSections: Section[] = [];

  for (const secDef of FACILITATOR_SECTIONS) {
    const docs: Document[] = [];
    for (const docDef of secDef.docs) {
      const url = await signedUrl(FAC_BUCKET, docDef.path);
      // Include even if url is null — UI shows "unavailable" rather than hiding section entirely
      docs.push({
        name: docDef.name,
        url,
        confidential: false,
        bucket: FAC_BUCKET,
        path: docDef.path,
      });
    }
    facilitatorSections.push({ title: secDef.title, documents: docs });
  }

  return NextResponse.json({
    sections: [
      {
        groupTitle: 'Trainer Documents',
        groupDesc: 'Training manuals, assessment copies, and confidential answer keys for your authorized books.',
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

/* ── POST: log a confidential document download ── */
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
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.document_name) return NextResponse.json({ error: 'Missing document_name' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  await supabase.from('trainer_document_downloads').insert({
    trainer_id: profile?.id ?? null,
    document_name: body.document_name,
    ip_address: ip,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
