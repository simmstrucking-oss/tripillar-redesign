import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

const CONTEXT = {
  updated: '2026-03-31-v3',

  program: {
    name: 'Live and Grieve™',
    description: '52-week structured grief education program. Not therapy. Community-based peer support with trained facilitators. In-person or virtual (Virtual Facilitation Addendum included with every license). Three facilitator tracks: Community, Professional, Ministry.',
    locked_framework_sentence: 'Live and Grieve™ is grounded in six peer-reviewed frameworks. Three theoretical frameworks structure the program arc. Three applied practice frameworks shape every session.',
    research_foundation: 'Program grounded in 6 peer-reviewed frameworks — 3 theoretical (Dual Process Model: Stroebe & Schut, Tasks of Mourning: Worden, Continuing Bonds: Klass/Silverman/Nickman) + 3 applied practice (Meaning Reconstruction: Neimeyer, Self-Compassion: Neff, Companioning the Bereaved: Wolfelt)',
    framework_count: 6,
    theoretical_frameworks: [
      'Dual Process Model (Stroebe & Schut, 1999) — governs the oscillation between loss-orientation and restoration-orientation',
      "Worden's Tasks of Mourning (2009) — frames participant progress across four quarters",
      'Continuing Bonds Theory (Klass, Silverman & Nickman, 1996) — foundational rejection of let-go model; grief integrates rather than resolves',
    ],
    applied_practice_frameworks: [
      'Meaning Reconstruction (Neimeyer, 2001) — meaning-making arc through all four books',
      'Self-Compassion (Neff, 2011) — underlying every Living Forward Activity',
      'Companioning the Bereaved (Wolfelt, 2006) — witness not fixer, 80/20 listening rule',
    ],
    language_rule: 'LOCKED SSOT v1.1: Always reference SIX frameworks in the two-layer structure. NEVER say three frameworks without clarifying there are six. NEVER say six frameworks without noting the two-layer structure.',
    youth_track: 'Live and Grieve Youth™ (LGY) — Elementary (ages 8-12) and Middle/High (ages 13-17). 13-session structured peer support. Family Bridge component included — grieving caregivers directed to adult LG Books 1-4.',
    pilot: 'Hampshire County WV — May 2026. $500 flat. Three social workers. Pre/post outcome tracking.',
    closing_phrase: '"You carry it." — locked per SSOT v1.1. Never paraphrase.',
    revenue_projections: { '2026': '~$17,000', '2027': '~$75,000', '2028': '~$174,000', '2029': '~$346,000' },
    policy_ammunition: {
      hhs_report: 'HHS Report to Congress (Nov 2024): grief services "fragmented and inequitable" — need for less medicalized approach. First federal report on grief services.',
      medicare: '42 CFR 418.88 requires 13 months bereavement services post-death. LG satisfies this requirement. No licensed clinician required.',
      dsm5tr: 'DSM-5-TR PGD (2022) addition drew researcher criticism for pathologizing grief. LG is the non-pathologizing, research-aligned response.',
      samhsa: 'SAMHSA Dec 2024: Inaugural National Grief Awareness Week. $1.5B FY2025 State Opioid Response grants include grief support for surviving families.',
      employer_cost: '$225B annually in grief productivity losses. SHRM 2025: structured wellness programs at 39% of employers.',
    },
    trainer_economics: 'Cert fee $1,500/book. Net to Wayne: $405/person after $45 materials fulfillment allowance per Certified Trainer Agreement. 10 Trainers × 20 facilitators/yr = $81,000/yr net, zero delivery by Wayne.',
    group_use_license: 'Distinct product and revenue stream. Individual certified facilitators, single cohort, no organizational ILA required. Community leaders, faith ministers, private practice social workers.',
    virtual_delivery: 'Virtual Facilitation Addendum included with every license. National program. No geographic ceiling.',
    lgy_competitive_position: 'Only school-based program meeting all 5 simultaneously: (1) DPM/Worden/CBT grounded — not stage model; (2) age-differentiated curriculum, two tracks; (3) structured Family Bridge to caregivers; (4) licensed facilitator cert standard; (5) scalable licensing + NACG alignment docs.',
  },

  urls: {
    main_site: 'https://tripillarstudio.com',
    solo_companion: 'https://solo.tripillarstudio.com',
    login_portals: [
      '/login/facilitator',
      '/login/trainer',
      '/login/organization',
      '/login/participant',
    ],
    hub_routes: [
      '/facilitators/hub/dashboard',  // tabs: Overview, Documents, Cohorts, Codes, Feedback, Reports, Support, Incident, Reflections, Youth (LGY)
      '/trainers/hub/dashboard',      // tabs: My Certified Facilitators, My Training Events, My Impact, My Certification, Resources
      '/org/hub',                     // tabs: License, Facilitators, Cohorts, Reports, Support
    ],
    admin_routes: [
      '/admin/facilitators',
      '/admin/dashboard',
      '/admin/documents',
      '/admin/prospects',
      '/admin/agreements',
      '/admin/renewals',
    ],
    public_routes: [
      '/', '/program/adult', '/program/youth', '/facilitators', '/trainers',
      '/blog', '/about', '/contact', '/free-guide', '/start', '/memorial-wall',
      '/explore/[code]', '/sign/[token]',
    ],
    api_routes: [
      // Internal
      '/api/internal/context', '/api/internal/documents', '/api/internal/status',
      // Auth
      '/api/auth/login',
      // Hub (facilitator)
      '/api/hub/documents', '/api/hub/lgy-documents', '/api/hub/reflections',
      '/api/hub/cohorts/[id]/complete', '/api/hub/onboarding', '/api/hub/sign',
      '/api/hub/consultation-requests',
      // Trainer
      '/api/trainer/resources', '/api/trainer/lgy-resources', '/api/trainer/certifications',
      '/api/trainer/events', '/api/trainer/impact', '/api/trainer/fee-remittance',
      // Org
      '/api/org/onboarding', '/api/org/consultation', '/api/org/documents',
      '/api/org/license', '/api/org/facilitators', '/api/org/cohorts',
      '/api/org/cohorts/[id]', '/api/org/reports/generate',
      // Admin
      '/api/admin/documents', '/api/admin/facilitator-codes/[id]', '/api/admin/codes',
      '/api/create-facilitator', '/api/admin/run-migration',
      // Public
      '/api/redeem-code', '/api/memorial-wall-submit', '/api/free-guide-subscribe',
      '/api/webhook/stripe',
      // Cron
      '/api/cron/weekly', '/api/cron/monthly', '/api/cron/quarterly', '/api/cron/annual',
      '/api/reports/public',
    ],
  },

  supabase: {
    project_ref: 'wuwgbdjgsgtsmuctuhpt',
    project_url: 'https://wuwgbdjgsgtsmuctuhpt.supabase.co',
    tables: {
      // Core
      purchases: ['id', 'stripe_customer_id', 'stripe_subscription_id', 'stripe_payment_id', 'plan', 'status', 'email', 'purchased_at', 'payments_count'],
      user_data: ['id', 'email', 'created_at', 'last_seen'],
      user_profiles: ['id', 'user_id', 'display_name', 'created_at'],
      memorial_entries: ['id', 'name', 'relationship', 'tribute', 'submitted_at', 'approved'],
      contact_submissions: ['id', 'name', 'email', 'org', 'message', 'submitted_at'],
      // Facilitator
      facilitator_profiles: [
        'id', 'user_id', 'org_id', 'full_name', 'email', 'cert_id', 'cert_status', 'cert_renewal',
        'role', 'books_certified', 'certification_track', 'expires_at', 'created_at',
        'onboarding_complete', 'onboarding_step', 'dismissed_orientation',
        'trainer_cert_id', 'trainer_cert_issued', 'trainer_cert_renewal', 'trainer_status',
        'trainer_notes', 'supervised_delivery_completed',
        'books_authorized_to_train', 'is_publicly_listed',
        'lgy_certified_tracks', 'lgy_trainer', 'lgy_authorized_tracks',
      ],
      facilitator_signatures: ['id', 'facilitator_id', 'document_name', 'document_version', 'signed_at', 'ip_address', 'signature_text', 'pdf_generated', 'pdf_url'],
      facilitator_reflections: ['id', 'facilitator_id', 'content', 'week_number', 'created_at'],
      facilitator_documents: ['id', 'facilitator_id', 'file_name', 'storage_path', 'uploaded_at'],
      document_access_log: ['id', 'user_id', 'document_name', 'bucket', 'role', 'program_type', 'accessed_at'],
      trainer_document_downloads: ['id', 'trainer_id', 'document_name', 'program_type', 'ip_address', 'downloaded_at'],
      // Cohorts & Orgs
      organizations: [
        'id', 'name', 'type', 'contact_name', 'contact_email', 'created_at',
        'onboarding_complete', 'onboarding_progress', 'dismissed_orientation',
        'facilitator_candidate_name', 'facilitator_candidate_email',
        'target_cohort_date', 'training_requested',
      ],
      cohorts: ['id', 'facilitator_id', 'organization_id', 'name', 'book_number', 'start_date', 'end_date', 'status', 'total_enrolled', 'total_completed', 'dropout_reasons', 'facilitator_assessment', 'notable_outcomes', 'would_run_again', 'curriculum_feedback', 'summary_submitted_at'],
      cohort_outcomes: ['id', 'cohort_id', 'metric', 'value', 'recorded_at'],
      session_logs: ['id', 'facilitator_id', 'cohort_id', 'session_number', 'date', 'notes', 'attendance'],
      session_feedback_submissions: ['id', 'facilitator_id', 'cohort_id', 'session_number', 'participant_count', 'engagement_rating', 'challenges', 'wins', 'submitted_at'],
      critical_incident_reports: ['id', 'facilitator_id', 'incident_date', 'description', 'immediate_action', 'outcome', 'follow_up_needed', 'submitted_at'],
      consultation_requests: ['id', 'facilitator_id', 'subject', 'message', 'status', 'created_at'],
      // Access codes
      access_code_batches: ['id', 'facilitator_id', 'created_at', 'batch_size', 'prefix', 'expires_at', 'notes'],
      access_codes: ['id', 'batch_id', 'code', 'redeemed', 'redeemed_at', 'redeemed_by'],
      participant_access: ['id', 'user_id', 'access_type', 'scope', 'granted_at', 'expires_at'],
      // Prospects & agreements
      prospects: ['id', 'name', 'email', 'org', 'sector', 'status', 'notes', 'created_at'],
      prospect_codes: ['id', 'prospect_id', 'code', 'created_at', 'expires_at'],
      prospect_activity: ['id', 'prospect_id', 'action', 'created_at'],
      prospect_call_requests: ['id', 'prospect_id', 'requested_at', 'notes'],
      agreements: ['id', 'token', 'status', 'org_name', 'contact_name', 'contact_email', 'org_id', 'prospect_id', 'license_tier', 'signed_at'],
      // Trainer
      trainer_events: ['id', 'trainer_id', 'event_date', 'book_number', 'participant_count', 'fee_collected', 'notes', 'created_at'],
      trainer_certifications: ['id', 'trainer_id', 'facilitator_id', 'book_number', 'cert_date', 'cert_id', 'notes'],
      // Reporting & Solo
      metrics_cache: ['id', 'key', 'value', 'computed_at'],
      report_log: ['id', 'type', 'generated_at', 'generated_by'],
      journal_entries: ['id', 'user_id', 'week', 'content', 'created_at'],
      session_progress: ['id', 'user_id', 'week', 'day', 'completed_at'],
      tracker_ratings: ['id', 'user_id', 'week', 'day', 'rating', 'note', 'recorded_at'],
      announcements: ['id', 'title', 'body', 'published_at', 'expires_at', 'created_at'],
    },
    storage_buckets: {
      'facilitator-documents': {
        access: 'facilitator',
        description: 'Non-book docs only: forms, outcomes, certification materials, reference docs, LGY shared docs (5). Books removed 2026-03-30 — physical materials provided at training.',
        folders: ['01_PROGRAM', '02_FACILITATOR', '03_CERTIFICATION', '04_OUTCOMES', '05_FORMS', 'lgy'],
        file_count: 38,
      },
      'admin-documents': {
        access: 'admin-only',
        description: 'All books (FM1–4, CFRG1–4, TM1–4), KDP files, legal, sales, governance, LGY training manuals. Never shown to facilitators.',
        folders: ['01_PROGRAM', '02_FACILITATOR', '03_CERTIFICATION', '04_OUTCOMES', '05_LEGAL', '06_SALES', '07_KDP', 'lgy'],
      },
      'restricted-documents': {
        access: 'trainer-only (60s signed URLs)',
        description: 'Answer Keys Books 2–4 CONFIDENTIAL. Book 1 is admin-only embedded.',
        folders: ['03_CERTIFICATION'],
      },
      'trainer-documents': {
        access: 'trainer',
        description: 'Certified Trainer Agreement, Certification Record Template (CSV).',
      },
      'public-resources': {
        access: 'public',
        description: 'Free guide PDF and other public downloads.',
      },
    },
    db_indexes: 37,
  },

  book_names: {
    1: 'In The Quiet',
    2: 'Through The Weight',
    3: 'Toward the Light',
    4: 'With the Memory',
  },

  convertkit: {
    api_base: 'https://api.convertkit.com/v3',
    sequences: {
      solo_welcome: 2701221,
      solo_receipt_one_time: 2701223,
      solo_receipt_installment: 2701225,
      facilitator_welcome: 2701285,
      facilitator_first_session: 2701289,
      facilitator_weekly_checkin: 2701291,
      facilitator_monthly_checkin: 2701292,
      facilitator_quarterly_data: 2701294,
      facilitator_book1_completion: 2701295,
      facilitator_renewal_60d: 2701296,
      facilitator_renewal_30d: 2701298,
      facilitator_renewal_7d: 2701299,
      facilitator_anniversary: 2701300,
      website_newsletter: 2701551,
      website_free_guide: 2701556,
      website_institution_inquiry: 2701557,
      website_contact: 2701558,
      trainer_welcome: 2702325,
      trainer_fee_reminder: 2702351,
      trainer_renewal_60: 2702357,
      trainer_renewal_30: 2702359,
    },
    tags: {
      'solo-companion-purchaser-one-time': 18172165,
      'solo-companion-purchaser-installment': 18172166,
      'facilitator-active': 18199291,
      'facilitator-community': 18199292,
      'website-subscriber': 18231220,
      'free-guide-download': 18231221,
      'institution-inquiry': 18231222,
      'contact-form-submission': 18231223,
      'trainer-active': '(assigned on create-facilitator for role=trainer)',
    },
  },

  stripe: {
    products: [
      { name: 'Solo Companion — One-Time',    price: '$24.99',       payment_link: 'https://buy.stripe.com/bJe00ibyL0Bsgm81jJgYU06', price_id: 'price_1TGAqtCkNwRmFraLHZFB7v4s', plink_id: 'plink_1TGAqzCkNwRmFraLSBZkxCIz' },
      { name: 'Solo Companion — Installment', price: '$9.99/mo × 3', payment_link: 'https://buy.stripe.com/7sY6oGdGT6ZQ9XK7I7gYU04', price_id: 'price_1TFlRwCkNwRmFraLW4YJrvUm', plink_id: 'plink_1TFlRwCkNwRmFraLZyn5SUHm' },
      { name: 'Solo Companion — Supplement',  price: '$4.99',        payment_link: 'https://buy.stripe.com/fZubJ0auHgAq0na9QfgYU05', plink_id: 'plink_1TGALOCkNwRmFraL8CZDOCck' },
    ],
    deactivated: ['plink_1TGALMCkNwRmFraL1eDDzH9f ($29.99 old)'],
    webhook_endpoint: 'https://tripillarstudio.com/api/webhook/stripe',
    redirect_after_payment: 'https://solo.tripillarstudio.com/access?token=granted',
  },

  vercel_env_names: [
    'RESEND_API_KEY', 'SMTP_PASS', 'SMTP_USER', 'SMTP_PORT', 'SMTP_HOST',
    'NEXT_PUBLIC_SITE_URL', 'EMBER_EMAIL_PASSWORD', 'CRON_SECRET',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'ADMIN_SECRET', 'KIT_API_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL',
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'OWNER_ACCESS_KEY',
  ],

  cron_jobs: [
    { schedule: '0 9 * * 1',   route: '/api/cron/weekly',    description: 'Weekly facilitator session feedback digest to Wayne' },
    { schedule: '0 9 1 * *',   route: '/api/cron/monthly',   description: 'Monthly facilitator metrics summary' },
    { schedule: '0 9 1 */3 *', route: '/api/cron/quarterly', description: 'Quarterly program metrics PDF generation' },
    { schedule: '0 9 1 1 *',   route: '/api/cron/annual',    description: 'Annual program metrics PDF generation' },
  ],

  pricing: {
    solo_companion_one_time:    '$24.99',
    solo_companion_installment: '$9.99/mo × 3 months',
    solo_companion_supplement:  '$4.99',
    kdp_workbook_standard:      '$24.99',
    kdp_workbook_large_print:   '$34.99',
    kdp_bulk_org:               '$22.00/copy',
    facilitator_certification:  'inquiry only — no public pricing',
    trainer_fee:                '$450/participant',
  },

  completed_audits: {
    render_audit_2026_03_30: { files_tested: 38, pass: 38, fail: 0, note: 'facilitator-documents non-book docs only; all valid DOCX, clean CT, no encoding issues' },
    document_integrity_2026_03_29: { files_tested: 48, pass: 47, flag: 1, note: 'FLAG: LG_Certification_Record_Template.csv 283 bytes — headers-only template, expected' },
    language_audit_2026_03_30: { files_changed: 8, replacements: 22, note: 'Wayne/Jamie → Tri-Pillars™ or "your trainer" in all user-facing Hub text' },
  },

  pending_tasks: [
    'Kit sequences 2701221/2701223/2701225 — placeholder emails only, real copy not written',
    'Kit test subscribers (ember-test-*) — bulk-delete from Kit dashboard at Wayne\'s convenience',
    'Inner Work Guide inline in wizard Step 3 — inventory questions blank in source file, awaiting Wayne clarification',
    'TM1-LP KDP upload — pending Wayne manual action via Browser Relay',
    'TM3, TM4, CFRG1–4 KDP paperback editions — not started',
    '/api/hub/consultation-requests — confirm if still needed or superseded by org flow',
    'Solo Companion Books 2-4 content build',
    'Org Hub youth licensing',
    'Buffer: TikTok @liveandgrieve (10K) needs reconnecting — wrong account (@tri.pillars) was connected/removed',
    'Buffer: YouTube, X/Twitter, Jamie account pending',
    'Supabase storage: upload TP_v5_0 and LGY_v6 final clean files',
  ],
};

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(CONTEXT, { status: 200 });
}
