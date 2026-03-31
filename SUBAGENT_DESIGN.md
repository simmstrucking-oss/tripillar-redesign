# Tri-Pillars™ LLC — Subagent Design Spec
**Last updated:** 2026-03-30

Four specialized agents that Ember can spawn or orchestrate for background tasks.

---

## Agent 1 — Monitoring Agent (Haiku)

**Purpose:** Platform health surveillance, alerting, and weekly reporting.
**Model:** claude-haiku-4-5-20251001
**Trigger:** Scheduled (3x daily cron) or on-demand

### Health Check Schedule
| Time (CT) | UTC | Vercel Cron |
|-----------|-----|-------------|
| 7:00 AM | 12:00 UTC | `0 12 * * *` |
| 1:00 PM | 18:00 UTC | `0 18 * * *` |
| 9:00 PM | 02:00 UTC | `0 2 * * *`  |

### Full Check List

**Site Routes (expected: HTTP 200)**
- tripillarstudio.com
- tripillarstudio.com/about
- tripillarstudio.com/our-approach
- tripillarstudio.com/program/adult
- tripillarstudio.com/program/youth
- tripillarstudio.com/facilitators
- tripillarstudio.com/institutions
- tripillarstudio.com/contact
- tripillarstudio.com/start
- tripillarstudio.com/free-guide
- tripillarstudio.com/memorial-wall
- tripillarstudio.com/blog
- tripillarstudio.com/trainers
- tripillarstudio.com/login/facilitator
- tripillarstudio.com/login/organization
- tripillarstudio.com/login/trainer
- tripillarstudio.com/login/participant
- solo.tripillarstudio.com
- solo.tripillarstudio.com/gate

**API Routes (expected status)**
- /api/internal/status → 200 (with x-admin-secret)
- /api/internal/context → 200 (with x-admin-secret)
- /api/hub/documents → 401 unauthenticated
- /api/admin/facilitators → 401 unauthenticated

**Vercel Deployment Check**
- Call Vercel API → confirm latest production deployment state = READY
- If ERROR or stuck BUILDING → immediate alert

**GitHub ↔ Vercel Sync Check**
- Read latest commit SHA from GitHub main branch
- Compare to Vercel production deployment commit SHA
- If out of sync → alert: "GitHub and Vercel are out of sync — a push may not have deployed correctly"

**Supabase Check**
- HEAD /rest/v1/facilitator_profiles with service role key
- Must return HTTP 200 or 206
- If timeout or error → immediate alert

**Kit Sequence Check**
- Ping Kit v3 API for sequence IDs: 2701285 (Facilitator Welcome) and 2702325 (Trainer Welcome)
- Sequences must exist and be retrievable
- If either missing or API returns error → alert Wayne

**Stripe Products Check**
- Fetch price_1TGAqtCkNwRmFraLHZFB7v4s (Solo Companion One-Time $24.99)
- Fetch price_1TFlRwCkNwRmFraLW4YJrvUm (Solo Companion Installment $9.99/mo)
- Both must have active=true and expected unit_amount
- If inactive or price changed → immediate alert

### Alert Rules
- **All pass** → silent. No email.
- **Any failure** → immediate Resend email to wayne@tripillarstudio.com
  - Subject: `PLATFORM ALERT — [check name] — [time CT]`
  - Body: failure table with category, check name, detail, consecutive count
- **3 consecutive failures on same check** → escalation email
  - Subject: `CRITICAL — [check name] — 3 consecutive failures`
  - Body: red critical banner + failure table
- **Consecutive tracking** stored in Supabase `health_check_log` table
- **health_check_log schema:** id, checked_at, total_checks, total_failures, failure_names[], healthy

### Monday Weekly Brief Contribution
- Total checks run this week
- Total passes / failures
- Health score percentage
- Timestamped list of any failures with which checks failed

### Required Env Vars
- ADMIN_SECRET, CRON_SECRET — auth
- SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL — DB check
- RESEND_API_KEY — alert emails
- KIT_API_SECRET — Kit check
- STRIPE_SECRET_KEY — Stripe check
- VERCEL_TOKEN — Vercel deployment check (add to Vercel env)
- GITHUB_TOKEN — GitHub sync check (add to Vercel env)

### Known Gap
VERCEL_TOKEN and GITHUB_TOKEN are not yet in Vercel env vars. Vercel and GitHub checks
will skip gracefully (pass with "skipping" note) until Wayne adds them.
To add: Vercel dashboard → Settings → Environment Variables → add VERCEL_TOKEN and GITHUB_TOKEN.

---

## Agent 2 — Content Agent (Sonnet)

**Purpose:** Blog drafts, social post generation, content calendar.
**Model:** claude-sonnet-4-6
**Trigger:** Mon/Wed/Fri 8AM ET cron or on-demand

### Capabilities
- Seasonal blog draft generation → Supabase blog_posts (published: false)
- One-click Publish/Skip via /api/blog/action (token-secured email buttons)
- Social post previews (Facebook, X thread, TikTok caption) in approval email
- Content calendar generation when Wayne provides weekly topic

### Blog Draft Review Flow
1. Cron generates draft + saves to Supabase
2. Approval email sent to wayne@tripillarstudio.com with:
   - Draft title, excerpt, social previews
   - ✅ Publish Now button (one-click, opens confirmation page)
   - 🗑️ Skip Draft button (deletes draft, no email)
3. Or reply to Ember on Telegram: EDIT: [notes] to request changes

---

## Agent 3 — Data Agent (Haiku)

**Purpose:** Reporting queries, cohort summaries, prospect digests.
**Model:** claude-haiku-4-5-20251001
**Trigger:** Daily 8AM CT (prospect digest) or on-demand

### Capabilities
- Daily prospect activity digest (views, call requests) — emails only when activity exists
- Cohort completion → auto PDF summary (planned)
- Weekly/monthly/quarterly/annual reports (existing crons)

### Known Gap
Data Agent needs a read-only Supabase role scoped to reporting tables only.
Currently uses service_role for all queries. Low risk today (small team), medium risk at scale.

---

## Agent 4 — Builder-Ember (Sonnet)

**Purpose:** Feature development, migrations, skill builds.
**Model:** claude-sonnet-4-6
**Trigger:** On-demand from Wayne via Telegram

### Capabilities
- New feature implementation
- DB migrations (Supabase API or migration files)
- Skill creation and deployment
- Integration wiring (Kit, Stripe, Resend, Supabase)

### Hard Rules
- Never automate: ConvertKit UI, Author Central, Stripe dashboard, TikTok uploads
- Never delete files without showing Wayne the full list first
- Never touch /wp-json/ (WordPress is decommissioned)
- Risk classification before any action: LOW/MEDIUM/HIGH
- HIGH risk → stop and report to Wayne before executing

---

## Env Vars Needed in Vercel (Not Yet Set)

| Var | Purpose | Where to add |
|-----|---------|-------------|
| VERCEL_TOKEN | Vercel deployment checks | Vercel → Settings → Env Vars |
| GITHUB_TOKEN | GitHub sync checks | Vercel → Settings → Env Vars |
| EMBER_EMAIL_PASSWORD | Namecheap SMTP mailer | Vercel → Settings → Env Vars |
| STRIPE_SECRET_KEY | Stripe product checks | Vercel → Settings → Env Vars |
| CRON_SECRET | Cron auth | Vercel → Settings → Env Vars |
