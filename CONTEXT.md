# tripillar-redesign — Session Context

**Last updated:** 2026-03-30
**Repo:** simmstrucking-oss/tripillar-redesign (Vercel auto-deploy, main branch)
**Sites:** tripillarstudio.com (Next.js 14) | solo.tripillarstudio.com (React 18.2 UMD)

## Full context lives in the API
Fetch at runtime:
- `GET /api/internal/context` — full schema, routes, tables, buckets, pricing, Kit, Stripe, Cron
- `GET /api/internal/status` — completed sessions, live features, pending tasks, live DB counts

Both routes require header: `x-cron-secret: <CRON_SECRET>`

## Current state (2026-03-30)
- Tasks 1–10 + Fixes 1–5 + LGY Parts 1–6: **complete**
- Trainer Tier: **complete** (Hub, public registry, Kit sequences, DB, answer keys)
- Org Hub: **complete** (5 tabs, onboarding, ILA e-signature, renewals)
- Prospect system: **complete** (/explore/[code], /admin/prospects, /admin/agreements)
- Book removal from facilitator-documents: **complete** (38 files deleted 2026-03-30)
- Onboarding wizard: **complete** (8 screens, DB step persistence)
- Language audit: **complete** (22 replacements, 8 files, Wayne/Jamie → Tri-Pillars™)
- Render audit: **38/38 PASS** (facilitator-documents non-book docs)
- DB indexes: **37 deployed**

## Pending
- Onboarding wizard Steps 3 + 6 inline content (awaiting Wayne clarification)
- Kit placeholder sequences need real email copy (2701221, 2701223, 2701225)
- KDP: TM1-LP upload (Browser Relay), TM3/TM4/CFRG1–4 not started
