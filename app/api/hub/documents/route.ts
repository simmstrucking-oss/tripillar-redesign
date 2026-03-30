import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

/* ── Auth helper ── */
const getUser = (req: NextRequest) => getUserFromRequest(req);

/* ── Document access matrix ── */

const BUCKET = 'facilitator-documents';

// Section definitions with their files
interface DocDef {
  name: string;
  path: string;
  /** If set, only accessible when this book number is in books_certified */
  requiresBook?: number;
  /** If true, only trainers can access */
  trainerOnly?: boolean;
}

interface SectionDef {
  title: string;
  folder: string;
  program_type: string;
  docs: DocDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: 'Program Overview',
    folder: '01_PROGRAM',
    program_type: 'adult',
    docs: [
      { name: 'LG_Participant_Appropriateness_Guide.docx', path: '01_PROGRAM/LG_Participant_Appropriateness_Guide.docx' },
      { name: 'LG_Program_Overview.docx', path: '01_PROGRAM/LG_Program_Overview.docx' },
      { name: 'LG_Self_Guided_Solo_Companion.docx', path: '01_PROGRAM/LG_Self_Guided_Solo_Companion.docx' },
      { name: 'LG_Specialized_Populations_Supplement.docx', path: '01_PROGRAM/LG_Specialized_Populations_Supplement.docx' },
    ],
  },
  {
    title: 'Certified Facilitator Reference Guide',
    folder: '02_FACILITATOR/CFRG',
    program_type: 'adult',
    docs: [
      { name: 'LG_Certified_Facilitator_Reference_Guide_Book1_FINAL.docx', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book1_FINAL.docx' },
      { name: 'LG_Certified_Facilitator_Reference_Guide_Book2_FINAL.docx', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book2_FINAL.docx' },
      { name: 'LG_Certified_Facilitator_Reference_Guide_Book3_FINAL.docx', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book3_FINAL.docx' },
      { name: 'LG_Certified_Facilitator_Reference_Guide_Book4_FINAL.docx', path: '02_FACILITATOR/LG_Certified_Facilitator_Reference_Guide_Book4_FINAL.docx' },
    ],
  },
  {
    title: 'Facilitator Manuals',
    folder: '02_FACILITATOR/FM',
    program_type: 'adult',
    docs: [
      { name: 'LG_Master_Facilitator_Manual_Book1_FINAL.docx', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book1_FINAL.docx', requiresBook: 1 },
      { name: 'LG_Master_Facilitator_Manual_Book2_FINAL.docx', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book2_FINAL.docx', requiresBook: 2 },
      { name: 'LG_Master_Facilitator_Manual_Book3_FINAL.docx', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book3_FINAL.docx', requiresBook: 3 },
      { name: 'LG_Master_Facilitator_Manual_Book4_FINAL.docx', path: '02_FACILITATOR/LG_Master_Facilitator_Manual_Book4_FINAL.docx', requiresBook: 4 },
    ],
  },
  {
    title: 'Facilitator Resources',
    folder: '02_FACILITATOR',
    program_type: 'adult',
    docs: [
      { name: 'LG_Facilitator_Code_of_Conduct.docx', path: '02_FACILITATOR/LG_Facilitator_Code_of_Conduct.docx' },
      { name: 'LG_Facilitator_Corrective_Action_Process.docx', path: '02_FACILITATOR/LG_Facilitator_Corrective_Action_Process.docx' },
      { name: 'LG_Facilitator_Inner_Work_Guide.docx', path: '02_FACILITATOR/LG_Facilitator_Inner_Work_Guide.docx' },
      { name: 'LG_Facilitator_Supervision_Framework.docx', path: '02_FACILITATOR/LG_Facilitator_Supervision_Framework.docx' },
      { name: 'LG_Virtual_Facilitation_Addendum.docx', path: '02_FACILITATOR/LG_Virtual_Facilitation_Addendum.docx' },
    ],
  },
  {
    title: 'Certification & Assessment',
    folder: '03_CERTIFICATION',
    program_type: 'adult',
    docs: [
      { name: 'LG_Certification_Acknowledgment_Form.docx', path: '03_CERTIFICATION/LG_Certification_Acknowledgment_Form.docx' },
      { name: 'LG_Assessment_Book1_Participant_Copy.docx', path: '03_CERTIFICATION/LG_Assessment_Book1_Participant_Copy.docx' },
      { name: 'LG_Assessment_Book2_Participant_Copy.docx', path: '03_CERTIFICATION/LG_Assessment_Book2_Participant_Copy.docx' },
      { name: 'LG_Assessment_Book3_Participant_Copy.docx', path: '03_CERTIFICATION/LG_Assessment_Book3_Participant_Copy.docx' },
      { name: 'LG_Assessment_Book4_Participant_Copy.docx', path: '03_CERTIFICATION/LG_Assessment_Book4_Participant_Copy.docx' },
    ],
  },
  {
    title: 'Training Manuals',
    folder: '03_TRAINING',
    program_type: 'adult',
    docs: [
      { name: 'LG_Facilitator_Certification_Training_Manual_Book1_FINAL.docx', path: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book1_FINAL.docx' },
      { name: 'LG_Facilitator_Certification_Training_Manual_Book2_FINAL.docx', path: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book2_FINAL.docx' },
      { name: 'LG_Facilitator_Certification_Training_Manual_Book3_FINAL.docx', path: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book3_FINAL.docx' },
      { name: 'LG_Facilitator_Certification_Training_Manual_Book4_FINAL.docx', path: '03_TRAINING/LG_Facilitator_Certification_Training_Manual_Book4_FINAL.docx' },
    ],
  },
  {
    title: 'Outcomes & Research',
    folder: '04_OUTCOMES',
    program_type: 'adult',
    docs: [
      { name: 'LG_Aggregate_Outcomes_Report_2024.docx', path: '04_OUTCOMES/LG_Aggregate_Outcomes_Report_2024.docx' },
      { name: 'LG_Case_Study_Community_Track.docx', path: '04_OUTCOMES/LG_Case_Study_Community_Track.docx' },
      { name: 'LG_Case_Study_Ministry_Track.docx', path: '04_OUTCOMES/LG_Case_Study_Ministry_Track.docx' },
      { name: 'LG_Case_Study_Professional_Track.docx', path: '04_OUTCOMES/LG_Case_Study_Professional_Track.docx' },
      { name: 'LG_Facilitator_Competency_Model.docx', path: '04_OUTCOMES/LG_Facilitator_Competency_Model.docx' },
      { name: 'LG_Fidelity_Monitoring_Checklist.docx', path: '04_OUTCOMES/LG_Fidelity_Monitoring_Checklist.docx' },
      { name: 'LG_Logic_Model.docx', path: '04_OUTCOMES/LG_Logic_Model.docx' },
      { name: 'LG_Outcomes_Research_Brief.docx', path: '04_OUTCOMES/LG_Outcomes_Research_Brief.docx' },
      { name: 'LG_Research_Brief.docx', path: '04_OUTCOMES/LG_Research_Brief.docx' },
      { name: 'LG_Standardized_Measures_Overview.docx', path: '04_OUTCOMES/LG_Standardized_Measures_Overview.docx' },
      { name: 'LG_Theory_of_Change.docx', path: '04_OUTCOMES/LG_Theory_of_Change.docx' },
    ],
  },
  {
    title: 'Forms & Templates',
    folder: '05_FORMS',
    program_type: 'adult',
    docs: [
      { name: 'LG_Crisis_Resources_Sheet.docx', path: '05_FORMS/LG_Crisis_Resources_Sheet.docx' },
      { name: 'LG_Critical_Incident_Report.docx', path: '05_FORMS/LG_Critical_Incident_Report.docx' },
      { name: 'LG_Facilitator_Reflection_Log.docx', path: '05_FORMS/LG_Facilitator_Reflection_Log.docx' },
      { name: 'LG_Group_Agreements.docx', path: '05_FORMS/LG_Group_Agreements.docx' },
      { name: 'LG_Session_Attendance_Log.docx', path: '05_FORMS/LG_Session_Attendance_Log.docx' },
      { name: 'LG_Session_Feedback_Form.docx', path: '05_FORMS/LG_Session_Feedback_Form.docx' },
    ],
  },
  {
    title: 'Trainer Pathway',
    folder: '02_FACILITATOR',
    program_type: 'adult',
    docs: [
      { name: 'LG_Trainer_Certification_Pathway.docx', path: '03_CERTIFICATION/LG_Trainer_Certification_Pathway.docx' },
      { name: 'LG_Scenario_Cards_Modules_8_9.docx', path: '02_FACILITATOR/LG_Scenario_Cards_Modules_8_9.docx', trainerOnly: true },
    ],
  },
  {
    title: 'Outcome Tracking Forms',
    folder: '04_OUTCOMES',
    program_type: 'adult',
    docs: [
      { name: 'LG_Outcome_Tracking_Pre_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Pre_Program.docx' },
      { name: 'LG_Outcome_Tracking_Post_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Post_Program.docx' },
      { name: 'LG_Outcome_Tracking_Book2_Pre_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Book2_Pre_Program.docx' },
      { name: 'LG_Outcome_Tracking_Book2_Post_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Book2_Post_Program.docx' },
      { name: 'LG_Outcome_Tracking_Book3_Pre_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Book3_Pre_Program.docx' },
      { name: 'LG_Outcome_Tracking_Book3_Post_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Book3_Post_Program.docx' },
      { name: 'LG_Outcome_Tracking_Book4_Pre_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Book4_Pre_Program.docx' },
      { name: 'LG_Outcome_Tracking_Book4_Post_Program.docx', path: '04_OUTCOMES/LG_Outcome_Tracking_Book4_Post_Program.docx' },
    ],
  },
];

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Look up facilitator profile
  const { data: profile, error: profErr } = await supabase
    .from('facilitator_profiles')
    .select('id, user_id, role, books_certified')
    .eq('user_id', user.id)
    .single();

  if (profErr || !profile) {
    return NextResponse.json({ error: 'Facilitator profile not found' }, { status: 404 });
  }

  const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];
  const isOwner = OWNER_EMAILS.includes(user.email ?? '');
  const certifiedBooks: number[] = isOwner ? [1,2,3,4] : (profile.books_certified ?? []);
  const isTrainer = isOwner || profile.role === 'trainer' || profile.role === 'super_admin';

  // Optional bucket filter
  const bucketFilter = req.nextUrl.searchParams.get('bucket');
  if (bucketFilter && bucketFilter !== BUCKET) {
    // Facilitators only have access to facilitator-documents bucket
    return NextResponse.json({ sections: [] });
  }

  const sections: {
    title: string;
    program_type: string;
    documents: {
      name: string;
      bucket: string;
      path: string;
      url: string | null;
      locked: boolean;
      lockReason: string | null;
    }[];
  }[] = [];

  // Collect all access log entries to batch insert
  const accessLogs: { user_id: string; document_name: string; bucket: string; role: string }[] = [];

  for (const section of SECTIONS) {
    const documents: typeof sections[number]['documents'] = [];

    for (const doc of section.docs) {
      // Trainer-only check
      if (doc.trainerOnly && !isTrainer) continue;

      // Book certification lock check — skip entirely, do not return locked docs
      if (doc.requiresBook && !certifiedBooks.includes(doc.requiresBook)) {
        continue;
      }

      // Generate signed URL
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(doc.path, 60);

      documents.push({
        name: doc.name,
        bucket: BUCKET,
        path: doc.path,
        url: signed?.signedUrl ?? null,
        locked: false,
        lockReason: null,
      });

      // Log access
      accessLogs.push({
        user_id: profile.user_id,
        document_name: doc.name,
        bucket: BUCKET,
        role: profile.role ?? 'unknown',
      });
    }

    if (documents.length > 0) {
      sections.push({ title: section.title, program_type: section.program_type, documents });
    }
  }

  // Batch insert access logs (fire-and-forget)
  if (accessLogs.length > 0) {
    supabase.from('document_access_log').insert(accessLogs).then(() => {});
  }

  return NextResponse.json({ sections });
}
