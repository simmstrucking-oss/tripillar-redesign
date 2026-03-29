import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';

const CONTEXT = {
  updated: '2026-03-29',

  urls: {
    main_site: 'https://tripillarstudio.com',
    solo_companion: 'https://solo.tripillarstudio.com',
    hub_routes: [
      '/facilitators/hub',
      '/facilitators/login',
      '/facilitators/register',
      '/facilitators/hub/dashboard',
      '/facilitators/hub/documents',
      '/facilitators/hub/cohorts',
      '/facilitators/hub/announcements',
      '/facilitators/hub/reports',
      '/facilitators/hub/support',
    ],
    admin_routes: [
      '/admin/facilitators',
      '/admin/dashboard',
      '/admin/documents',
    ],
    public_routes: [
      '/',
      '/program/adult',
      '/program/youth',
      '/facilitators',
      '/blog',
      '/about',
      '/contact',
      '/free-guide',
      '/start',
      '/memorial',
    ],
    api_routes: [
      '/api/internal/context',
      '/api/internal/documents',
      '/api/internal/status',
      '/api/hub/documents',
      '/api/hub/reflections',
      '/api/hub/cohorts/[id]/complete',
      '/api/hub/consultation-requests',
      '/api/admin/documents',
      '/api/admin/facilitator-codes/[id]',
      '/api/admin/codes',
      '/api/create-facilitator',
      '/api/redeem-code',
      '/api/memorial-wall-submit',
      '/api/free-guide-subscribe',
      '/api/webhook/stripe',
      '/api/cron/weekly',
      '/api/cron/monthly',
      '/api/cron/quarterly',
      '/api/cron/annual',
      '/api/reports/public',
    ],
  },

  supabase: {
    project_ref: 'wuwgbdjgsgtsmuctuhpt',
    project_url: 'https://wuwgbdjgsgtsmuctuhpt.supabase.co',
    tables: {
      access_code_batches: ['id', 'facilitator_id', 'created_at', 'batch_size', 'prefix', 'expires_at', 'notes'],
      access_codes: ['id', 'batch_id', 'code', 'redeemed', 'redeemed_at', 'redeemed_by'],
      announcements: ['id', 'title', 'body', 'published_at', 'expires_at', 'created_at'],
      cohort_outcomes: ['id', 'cohort_id', 'metric', 'value', 'recorded_at'],
      cohorts: ['id', 'facilitator_id', 'org_id', 'name', 'book_number', 'start_date', 'end_date', 'status',
        'total_enrolled', 'total_completed', 'dropout_reasons', 'facilitator_assessment',
        'notable_outcomes', 'would_run_again', 'curriculum_feedback', 'summary_submitted_at'],
      consultation_requests: ['id', 'facilitator_id', 'subject', 'message', 'status', 'created_at'],
      contact_submissions: ['id', 'name', 'email', 'org', 'message', 'submitted_at'],
      critical_incident_reports: ['id', 'facilitator_id', 'incident_date', 'description', 'immediate_action',
        'outcome', 'follow_up_needed', 'submitted_at'],
      document_access_log: ['id', 'user_id', 'document_name', 'bucket', 'role', 'accessed_at'],
      facilitator_documents: ['id', 'facilitator_id', 'file_name', 'storage_path', 'uploaded_at'],
      facilitator_profiles: ['id', 'user_id', 'org_id', 'first_name', 'last_name', 'email', 'cert_id',
        'certification_track', 'books_certified', 'status', 'expires_at', 'created_at'],
      facilitator_reflections: ['id', 'facilitator_id', 'content', 'week_number', 'created_at'],
      journal_entries: ['id', 'user_id', 'week', 'content', 'created_at'],
      memorial_entries: ['id', 'name', 'relationship', 'tribute', 'submitted_at', 'approved'],
      metrics_cache: ['id', 'key', 'value', 'computed_at'],
      organizations: ['id', 'name', 'type', 'contact_name', 'contact_email', 'created_at'],
      participant_access: ['id', 'user_id', 'access_type', 'scope', 'granted_at', 'expires_at'],
      purchases: ['id', 'stripe_customer_id', 'stripe_subscription_id', 'stripe_payment_id',
        'plan', 'status', 'email', 'purchased_at', 'payments_count'],
      report_log: ['id', 'type', 'generated_at', 'generated_by'],
      session_feedback_submissions: ['id', 'facilitator_id', 'cohort_id', 'session_number', 'participant_count',
        'engagement_rating', 'challenges', 'wins', 'submitted_at'],
      session_logs: ['id', 'facilitator_id', 'cohort_id', 'session_number', 'date', 'notes', 'attendance'],
      session_progress: ['id', 'user_id', 'week', 'day', 'completed_at'],
      tracker_ratings: ['id', 'user_id', 'week', 'day', 'rating', 'note', 'recorded_at'],
      user_data: ['id', 'email', 'created_at', 'last_seen'],
      user_profiles: ['id', 'user_id', 'display_name', 'created_at'],
    },
    storage_buckets: {
      'facilitator-documents': { access: 'facilitator', description: 'FMs, CFRGs, forms, outcomes — gated by books_certified' },
      'admin-documents':       { access: 'admin-only',  description: 'WBs, KDP files, legal, sales, governance — never shown to facilitators' },
      'restricted-documents':  { access: 'restricted',  description: '4 Answer Key CONFIDENTIAL files — admin-only, never in Hub UI' },
      'public-resources':      { access: 'public',      description: 'Free guide PDF and other public downloads' },
    },
  },

  convertkit: {
    api_base: 'https://api.convertkit.com/v3',
    sequences: {
      solo_welcome:                 2701221,
      solo_receipt_one_time:        2701223,
      solo_receipt_installment:     2701225,
      facilitator_welcome:          2701285,
      facilitator_first_session:    2701289,
      facilitator_weekly_checkin:   2701291,
      facilitator_monthly_checkin:  2701292,
      facilitator_quarterly_data:   2701294,
      facilitator_book1_completion: 2701295,
      facilitator_renewal_60d:      2701296,
      facilitator_renewal_30d:      2701298,
      facilitator_renewal_7d:       2701299,
      facilitator_anniversary:      2701300,
      website_newsletter:           2701551,
      website_free_guide:           2701556,
      website_institution_inquiry:  2701557,
      website_contact:              2701558,
    },
    tags: {
      'solo-companion-purchaser-one-time':    18172165,
      'solo-companion-purchaser-installment': 18172166,
      'facilitator-active':                   18199291,
      'facilitator-community':                18199292,
      'website-subscriber':                   18231220,
      'free-guide-download':                  18231221,
      'institution-inquiry':                  18231222,
      'contact-form-submission':              18231223,
    },
  },

  stripe: {
    products: [
      { name: 'Solo Companion — One-Time',    price: '$24.99',       payment_link: 'https://buy.stripe.com/bJe00ibyL0Bsgm81jJgYU06', price_id: 'price_1TGAqtCkNwRmFraLHZFB7v4s', plink_id: 'plink_1TGAqzCkNwRmFraLSBZkxCIz' },
      { name: 'Solo Companion — Installment', price: '$9.99/mo × 3', payment_link: 'https://buy.stripe.com/7sY6oGdGT6ZQ9XK7I7gYU04', price_id: 'price_1TFlRwCkNwRmFraLW4YJrvUm', plink_id: 'plink_1TFlRwCkNwRmFraLZyn5SUHm' },
      { name: 'Solo Companion — Supplement',  price: '$4.99',        payment_link: 'https://buy.stripe.com/fZubJ0auHgAq0na9QfgYU05', price_id: null, plink_id: null },
    ],
    deactivated: [
      { name: 'Solo Companion $29.99 (old)', plink_id: 'plink_1TGALMCkNwRmFraL1eDDzH9f' },
    ],
    webhook_endpoint: 'https://tripillarstudio.com/api/webhook/stripe',
    redirect_after_payment: 'https://solo.tripillarstudio.com/access?token=granted',
  },

  vercel_env_names: [
    'RESEND_API_KEY',
    'SMTP_PASS',
    'SMTP_USER',
    'SMTP_PORT',
    'SMTP_HOST',
    'NEXT_PUBLIC_SITE_URL',
    'EMBER_EMAIL_PASSWORD',
    'CRON_SECRET',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'ADMIN_SECRET',
    'KIT_API_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
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
  },

  pending_tasks: [
    'Kit sequences 2701221/2701223/2701225 — placeholder emails only, real copy not written',
    'Kit test subscribers (ember-test-*) — bulk-delete from Kit dashboard at Wayne\'s convenience',
    '/api/hub/consultation-requests — confirm if still needed or superseded',
    'TM1-LP KDP upload — pending Wayne manual action via Browser Relay',
    'TM3, TM4, CFRG1–4 KDP paperback editions — not started',
  ],
};

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(CONTEXT, { status: 200 });
}
