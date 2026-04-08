import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

const BUCKET = 'facilitator-documents';
const OWNER_EMAILS = ['wayne@tripillarstudio.com', 'jamie@tripillarstudio.com'];

/* ─────────────────────────────────────────────────────────────────────────
   BOOKS ARE NOT SERVED DIGITALLY THROUGH THE HUB.
   FM, CFRG, TM, and all LGY session/training manuals are physical materials
   provided at certification training. This route serves non-book docs only.
──────────────────────────────────────────────────────────────────────────*/

interface DocDef {
  name: string;
  path: string;
  trainerOnly?: boolean;
}
interface SectionDef {
  title: string;
  program_type: string;
  docs: DocDef[];
}

const SECTIONS: SectionDef[] = [
  {
    title: 'Program Reference',
    program_type: 'adult',
    docs: [
      { name: 'Participant Appropriateness Guide',    path: '01_PROGRAM/LG_Participant_Appropriateness_Guide.docx' },
      { name: 'Program Overview',                      path: '01_PROGRAM/LG_Program_Overview.docx' },
      { name: 'Self-Guided Solo Companion Guide',      path: '01_PROGRAM/LG_Self_Guided_Solo_Companion.docx' },
      { name: 'Specialized Populations Supplement',    path: '01_PROGRAM/LG_Specialized_Populations_Supplement.docx' },
    ],
  },
  {
    title: 'Facilitator Resources',
    program_type: 'adult',
    docs: [
      { name: 'Facilitator Code of Conduct',           path: '02_FACILITATOR/LG_Facilitator_Code_of_Conduct.docx' },
      { name: 'Facilitator Inner Work Guide',          path: '02_FACILITATOR/LG_Facilitator_Inner_Work_Guide.docx' },
      { name: 'Facilitator Supervision Framework',     path: '02_FACILITATOR/LG_Facilitator_Supervision_Framework.docx' },
      { name: 'Facilitator Corrective Action Process', path: '02_FACILITATOR/LG_Facilitator_Corrective_Action_Process.docx' },
      { name: 'Virtual Facilitation Addendum',         path: '02_FACILITATOR/LG_Virtual_Facilitation_Addendum.docx' },
    ],
  },
  {
    title: 'Certification',
    program_type: 'adult',
    docs: [
      { name: 'Certification Acknowledgment Form',       path: '03_CERTIFICATION/LG_Certification_Acknowledgment_Form.docx' },
      { name: 'Trainer Certification Pathway',           path: '03_CERTIFICATION/LG_Trainer_Certification_Pathway.docx' },
      { name: 'Assessment — Book 1 (Participant Copy)',  path: '03_CERTIFICATION/LG_Assessment_Book1_Participant_Copy.docx' },
      { name: 'Assessment — Book 2 (Participant Copy)',  path: '03_CERTIFICATION/LG_Assessment_Book2_Participant_Copy.docx' },
      { name: 'Assessment — Book 3 (Participant Copy)',  path: '03_CERTIFICATION/LG_Assessment_Book3_Participant_Copy.docx' },
      { name: 'Assessment — Book 4 (Participant Copy)',  path: '03_CERTIFICATION/LG_Assessment_Book4_Participant_Copy.docx' },
    ],
  },
  {
    title: 'Outcome Tracking',
    program_type: 'adult',
    docs: [
      { name: 'Outcome Tracking — Pre-Program (Book 1)',  path: '04_OUTCOMES/LG_Outcome_Tracking_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 1)', path: '04_OUTCOMES/LG_Outcome_Tracking_Post_Program.docx' },
      { name: 'Outcome Tracking — Pre-Program (Book 2)',  path: '04_OUTCOMES/LG_Outcome_Tracking_Book2_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 2)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book2_Post_Program.docx' },
      { name: 'Outcome Tracking — Pre-Program (Book 3)',  path: '04_OUTCOMES/LG_Outcome_Tracking_Book3_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 3)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book3_Post_Program.docx' },
      { name: 'Outcome Tracking — Pre-Program (Book 4)',  path: '04_OUTCOMES/LG_Outcome_Tracking_Book4_Pre_Program.docx' },
      { name: 'Outcome Tracking — Post-Program (Book 4)', path: '04_OUTCOMES/LG_Outcome_Tracking_Book4_Post_Program.docx' },
      { name: 'Facilitator Cohort Summary',               path: '04_OUTCOMES/LG_Outcome_Facilitator_Cohort_Summary.docx' },
      { name: 'Outcomes Research Brief',                  path: '04_OUTCOMES/LG_Outcomes_Research_Brief.docx' },
      { name: 'Program Evaluation Summary Template',      path: '04_OUTCOMES/LG_Program_Evaluation_Summary_Template.docx' },
      { name: 'Outcomes — Instruction Guide',         path: '04_OUTCOMES/LG_Outcomes_01_Instruction_Guide.docx' },
      { name: 'Outcomes — Pre-Program Form (Print)',   path: '04_OUTCOMES/LG_Outcomes_02_PreProgram_Form.docx' },
      { name: 'Outcomes — Weekly Session Log (Print)', path: '04_OUTCOMES/LG_Outcomes_03_Weekly_Session_Log.docx' },
      { name: 'Outcomes — Mid-Program Pulse (Print)',  path: '04_OUTCOMES/LG_Outcomes_04_MidProgram_Pulse.docx' },
      { name: 'Outcomes — Post-Program Form (Print)',  path: '04_OUTCOMES/LG_Outcomes_05_PostProgram_Form.docx' },
      { name: 'Outcomes — Cohort Summary (Print)',     path: '04_OUTCOMES/LG_Outcomes_06_Facilitator_Cohort_Summary.docx' },
      { name: 'Outcomes — 90-Day Follow-Up (Print)',   path: '04_OUTCOMES/LG_Outcomes_07_90Day_Followup.docx' },
    ],
  },
  {
    title: 'Forms & Templates',
    program_type: 'adult',
    docs: [
      { name: 'Crisis Resources Sheet',         path: '05_FORMS/LG_Crisis_Resources_Sheet.docx' },
      { name: 'Critical Incident Report',        path: '05_FORMS/LG_Critical_Incident_Report.docx' },
      { name: 'Facilitator Reflection Log',      path: '05_FORMS/LG_Facilitator_Reflection_Log.docx' },
      { name: 'Group Agreements',                path: '05_FORMS/LG_Group_Agreements.docx' },
      { name: 'Session Attendance Log',          path: '05_FORMS/LG_Session_Attendance_Log.docx' },
      { name: 'Session Feedback Form',           path: '05_FORMS/LG_Session_Feedback_Form.docx' },
      { name: 'Scenario Cards — Modules 8 & 9', path: '05_FORMS/LG_Scenario_Cards_Modules_8_9.docx', trainerOnly: true },
    ],
  },
];

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: profile, error: profErr } = await supabase
    .from('facilitator_profiles')
    .select('id, user_id, role, books_certified')
    .eq('user_id', user.id)
    .single();

  if (profErr || !profile) {
    return NextResponse.json({ error: 'Facilitator profile not found' }, { status: 404 });
  }

  const isOwner = OWNER_EMAILS.includes(user.email ?? '');
  const isTrainer = isOwner || profile.role === 'trainer' || profile.role === 'super_admin';

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

  const accessLogs: { user_id: string; document_name: string; bucket: string; role: string }[] = [];

  for (const section of SECTIONS) {
    const documents: typeof sections[number]['documents'] = [];

    for (const doc of section.docs) {
      if (doc.trainerOnly && !isTrainer) continue;

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

  if (accessLogs.length > 0) {
    supabase.from('document_access_log').insert(accessLogs).then(() => {});
  }

  return NextResponse.json({
    sections,
    physicalMaterialsNotice: 'Physical program materials are provided at certification training. Digital access coming soon.',
  });
}
