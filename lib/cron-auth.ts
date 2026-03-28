/**
 * lib/cron-auth.ts — verify Vercel cron requests
 * Vercel sets Authorization: Bearer <CRON_SECRET> on cron invocations.
 * Also allows x-admin-secret for manual test triggers.
 */
import { NextRequest } from 'next/server';

export function verifyCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Vercel cron header
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  // Admin secret (for manual triggers / testing)
  const adminSecret = process.env.ADMIN_SECRET ?? '';
  if (req.headers.get('x-admin-secret') === adminSecret) return true;

  return false;
}
