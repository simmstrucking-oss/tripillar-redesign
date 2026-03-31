/**
 * sentry.client.config.ts — Sentry browser-side initialization
 * Captures unhandled JS errors, failed fetches, and UI interactions.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of sessions for performance tracing (free plan friendly)
  tracesSampleRate: 0.1,

  // Capture replays for errors only
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  // Don't capture in development
  enabled: process.env.NODE_ENV === 'production',

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText:    true,
      blockAllMedia:  true,
    }),
  ],

  // Before send: redact sensitive fields
  beforeSend(event) {
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      for (const key of ['password', 'token', 'stripe', 'secret', 'api_key']) {
        if (data[key]) data[key] = '[REDACTED]';
      }
    }
    return event;
  },
});
