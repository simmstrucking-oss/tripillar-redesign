/**
 * /api/blog/publish/route.ts
 * 
 * POST endpoint to publish, update, or skip blog drafts.
 * Called by Ember in response to Wayne's Telegram replies:
 * - PUBLISH: sets published=true, published_at=now()
 * - SKIP: deletes the draft
 * - UPDATE: updates body, leaves published=false
 * 
 * Auth: x-admin-secret header must equal ADMIN_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Verify admin secret
    const adminSecret = process.env.ADMIN_SECRET || 'tripillar-admin-2024';
    const headerSecret = req.headers.get('x-admin-secret');
    if (headerSecret !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, body } = await req.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing id or action' },
        { status: 400 }
      );
    }

    if (!['publish', 'skip', 'update'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action; must be publish, skip, or update' },
        { status: 400 }
      );
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let result;
    let slug: string | null = null;

    if (action === 'publish') {
      // Get current draft to extract slug
      const { data: draft, error: fetchError } = await sb
        .from('blog_posts')
        .select('slug')
        .eq('id', id)
        .single();

      if (fetchError || !draft) {
        return NextResponse.json(
          { error: 'Draft not found' },
          { status: 404 }
        );
      }

      slug = draft.slug;

      // Publish: set published=true, published_at=now()
      const { error } = await sb
        .from('blog_posts')
        .update({ published: true, published_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = { success: true, action: 'publish', slug };
    } else if (action === 'skip') {
      // Skip: delete the draft
      const { error } = await sb
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = { success: true, action: 'skip', slug: null };
    } else if (action === 'update') {
      // Update: modify body, leave published=false
      if (!body) {
        return NextResponse.json(
          { error: 'body required for update action' },
          { status: 400 }
        );
      }

      const { data: draft, error: fetchError } = await sb
        .from('blog_posts')
        .select('slug')
        .eq('id', id)
        .single();

      if (fetchError || !draft) {
        return NextResponse.json(
          { error: 'Draft not found' },
          { status: 404 }
        );
      }

      slug = draft.slug;

      const { error } = await sb
        .from('blog_posts')
        .update({ body })
        .eq('id', id);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      result = { success: true, action: 'update', slug };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
