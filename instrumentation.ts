/**
 * instrumentation.ts — Next.js 15 instrumentation hook
 * Initializes Sentry on the server (Node.js and Edge runtimes).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
