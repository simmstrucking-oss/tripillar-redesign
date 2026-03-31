/**
 * sentry.server.config.ts — Sentry server-side initialization
 * Captures API route failures, unhandled promise rejections, and Node errors.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of traces
  tracesSampleRate: 0.1,

  // Don't capture in development
  enabled: process.env.NODE_ENV === 'production',

  // Before send: redact secrets
  beforeSend(event) {
    // Strip webhook secrets, Stripe keys, Supabase tokens from breadcrumbs
    const bcs = event.breadcrumbs?.values;
    if (bcs && Array.isArray(bcs)) {
      bcs.forEach((bc: {data?: {body?: unknown}}) => {
        if (bc.data?.body && typeof bc.data.body === 'string') {
          bc.data.body = bc.data.body.replace(
            /(sk_live_|whsec_|Bearer\s+eyJ)[^\s&"']{4,}/g,
            '[REDACTED]'
          );
        }
      });
    }
    return event;
  },
});
