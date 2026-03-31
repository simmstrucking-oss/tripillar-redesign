/**
 * GET /api/blog/action?id=<post_id>&action=publish|skip&token=<admin_secret_hash>
 *
 * One-click blog approval from email links. Wayne clicks a link in the draft
 * notification email — no Telegram required, no manual conversation needed.
 *
 * Actions:
 *   publish  — sets published=true, published_at=now
 *   skip     — sets status='skipped' (or deletes if you prefer)
 *
 * Security: token must equal sha256(ADMIN_SECRET + post_id)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId  = searchParams.get('id');
  const action  = searchParams.get('action');
  const token   = searchParams.get('token');

  if (!postId || !action || !token) {
    return new NextResponse('Missing parameters', { status: 400 });
  }
  if (!['publish', 'skip'].includes(action)) {
    return new NextResponse('Invalid action', { status: 400 });
  }

  // Verify token = sha256(ADMIN_SECRET + postId)
  const adminSecret = process.env.ADMIN_SECRET ?? '';
  const expected = await sha256(adminSecret + postId);
  if (token !== expected) {
    return new NextResponse('Invalid token', { status: 403 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (action === 'publish') {
    const { error } = await sb
      .from('blog_posts')
      .update({ published: true, published_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      console.error('[blog/action] Publish error:', error);
      return new NextResponse(`Failed to publish: ${error.message}`, { status: 500 });
    }

    return new NextResponse(`
      <html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;text-align:center;color:#1c3028;">
        <h2 style="color:#1c3028;">✅ Published</h2>
        <p>The blog post has been published to tripillarstudio.com/blog.</p>
        <a href="https://www.tripillarstudio.com/blog" style="color:#B8942F;">View blog →</a>
      </body></html>
    `, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }

  if (action === 'skip') {
    const { error } = await sb
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('[blog/action] Skip/delete error:', error);
      return new NextResponse(`Failed to delete draft: ${error.message}`, { status: 500 });
    }

    return new NextResponse(`
      <html><body style="font-family:sans-serif;max-width:500px;margin:60px auto;text-align:center;color:#1c3028;">
        <h2 style="color:#1c3028;">🗑️ Draft Skipped</h2>
        <p>The draft has been removed. A new one will be generated next scheduled run.</p>
      </body></html>
    `, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }
}
