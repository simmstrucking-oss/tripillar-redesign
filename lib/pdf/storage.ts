/**
 * Supabase Storage helpers for report PDFs.
 * Bucket: reports (private, service role only)
 * Path: reports/{type}/{entityId}/{slug}-{ts}.pdf
 * Signed URLs: 24hr TTL
 * Cache: stored in metrics_cache table keyed by "report:{type}:{entityId}"
 */
import { createClient } from '@supabase/supabase-js';

const BUCKET   = 'reports';
const TTL_SECS = 60 * 60 * 24;   // 24 hours
const TTL_MS   = TTL_SECS * 1000;

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface StoredReport {
  url:          string;
  path:         string;
  cached:       boolean;
  generated_at: string;
}

/** Cache key for metrics_cache */
function cacheKey(type: string, entityId: string) {
  return `report:${type}:${entityId}`;
}

/**
 * Return cached signed URL if still valid, else generate + upload + cache.
 */
export async function getOrGenerateReport(
  type:     string,
  entityId: string,
  slug:     string,
  generate: () => Promise<Buffer>,
): Promise<StoredReport> {
  const client = sb();
  const key    = cacheKey(type, entityId);

  // Check cache (metrics_cache: key → JSON {path, url, expires, generated_at})
  const { data: cached } = await client
    .from('metrics_cache')
    .select('value, updated_at')
    .eq('key', key)
    .single();

  if (cached?.value) {
    try {
      const c = JSON.parse(cached.value as string) as { path: string; url: string; expires: number; generated_at: string };
      if (c.expires > Date.now() + 5 * 60 * 1000) {
        return { url: c.url, path: c.path, cached: true, generated_at: c.generated_at };
      }
    } catch { /* stale/corrupt — regenerate */ }
  }

  // Generate
  const buf  = await generate();
  const path = `${type}/${entityId}/${slug}-${Date.now()}.pdf`;

  const { error: uploadErr } = await client.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: 'application/pdf', upsert: true });
  if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

  const { data: signed, error: signErr } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, TTL_SECS);
  if (signErr || !signed?.signedUrl) throw new Error(`Signed URL failed: ${signErr?.message}`);

  const now        = new Date().toISOString();
  const cacheValue = JSON.stringify({
    path,
    url:          signed.signedUrl,
    expires:      Date.now() + TTL_MS,
    generated_at: now,
  });

  await client.from('metrics_cache').upsert(
    { key, value: cacheValue, updated_at: now },
    { onConflict: 'key' }
  );

  // Also log to report_log for audit trail (using actual schema columns)
  await client.from('report_log').insert({
    report_type:           type,
    report_period:         entityId,
    generated_for_entity:  entityId,
    file_path:             path,
  }).then(() => {/* audit logged */}, () => {/* non-critical */});

  return { url: signed.signedUrl, path, cached: false, generated_at: now };
}

/** Force-invalidate cache so next call regenerates */
export async function invalidateReportCache(type: string, entityId: string) {
  const client = sb();
  await client.from('metrics_cache').delete().eq('key', cacheKey(type, entityId));
}
