/**
 * /api/cron/blog-draft/route.ts
 * 
 * Vercel cron endpoint called Mon/Wed/Fri at 8AM ET (13:00 UTC).
 * Generates a timely blog post draft based on current season/month.
 * Saves to Supabase blog_posts table (published: false).
 * Sends Telegram notification to Wayne for review.
 * 
 * REVIEW FLOW (handled in-session, not via cron):
 * - Wayne replies: "PUBLISH" or "PUBLISH [draft-id]" → Ember calls /api/blog/publish with action="publish"
 * - Wayne replies: "EDIT: [notes]" → Ember calls /api/blog/publish with action="update"
 * - Wayne replies: "SKIP" or "SKIP [draft-id]" → Ember calls /api/blog/publish with action="skip"
 * - No separate cron needed; handled as natural conversation in Telegram session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/cron-auth';

export const maxDuration = 60;

// Generate a date-contextual blog post draft
function generateBlogDraft() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();
  const year = now.getFullYear();

  // Map month to season and grief topic
  const seasonTopics: Record<number, { season: string; category: string; topic: string }> = {
    // Winter (Dec, Jan, Feb)
    11: { season: 'winter', category: 'Grief Education', topic: 'Holiday Grief and Anticipatory Sorrow' },
    0: { season: 'winter', category: 'Grief Education', topic: 'Navigating New Year After Loss' },
    1: { season: 'winter', category: 'Grief Education', topic: 'Grief and Seasonal Affective Patterns' },

    // Spring (Mar, Apr, May)
    2: { season: 'spring', category: 'Grief Education', topic: 'Spring Renewal and Continuing Bonds' },
    3: { season: 'spring', category: 'Program Updates', topic: 'New Beginnings: Grief Support in Spring' },
    4: { season: 'spring', category: 'Pilot Stories', topic: 'Stories of Growth Through Grief' },

    // Summer (Jun, Jul, Aug)
    5: { season: 'summer', category: 'News', topic: 'Understanding Grief in Community Spaces' },
    6: { season: 'summer', category: 'Program Updates', topic: 'Summer Grief Support: Why It Matters' },
    7: { season: 'summer', category: 'Grief Education', topic: 'Grief and Childhood Loss: A Guide for Parents' },

    // Fall (Sep, Oct, Nov)
    8: { season: 'fall', category: 'Grief Education', topic: 'Anticipatory Grief Awareness Month' },
    9: { season: 'fall', category: 'News', topic: 'Loss and Legacy: Honoring Those We Remember' },
    10: { season: 'fall', category: 'Program Updates', topic: 'Thanksgiving Grief: Holding Space for Empty Seats' },
  };

  const topicData = seasonTopics[month] || { season: 'year-round', category: 'Grief Education', topic: 'Understanding Grief: A Timeless Journey' };

  const title = topicData.topic;
  const category = topicData.category as 'News' | 'Grief Education' | 'Program Updates' | 'Pilot Stories';
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;

  // Generate warm, grounded body in Live and Grieve™ voice
  const body = `<p>Grief is not a linear journey, and there's no prescribed timeline for healing. What many people don't realize is that grief isn't something we "get over"—it's something we integrate into our lives, learning to carry it with compassion and presence.</p>

<p>At Live and Grieve™, we believe in honoring the complexity of loss. Whether you're grieving a death, a relationship, a career shift, or an unmet expectation, your experience is valid. Our community-based approach to grief support recognizes that healing happens when we feel truly seen and heard.</p>

<h2>Why Peer Support Matters</h2>

<p>Research in bereavement science shows us that connection with others who understand loss can be transformative. Shared space—whether in person or virtually—reduces the isolation that often accompanies grief. When we speak our grief aloud to those who listen without judgment, something shifts.</p>

<h2>What You're Going Through Is Normal</h2>

<p>Grief may bring waves of sadness, anger, confusion, or even unexpected moments of joy. These aren't signs that you're "doing it wrong." They're signs that you're human, that you've loved deeply, and that loss matters.</p>

<p>We invite you to join our community. Whether you're in the early days of loss or rediscovering your footing years later, you belong here. Live and Grieve™ is a space where grief is held with care, where your story matters, and where you're never alone.</p>`;

  const excerpt = `Grief is not a linear journey. At Live and Grieve™, we believe in honoring the complexity of loss and supporting one another through the healing process.`;

  return {
    title,
    category,
    body,
    excerpt: excerpt.substring(0, 200),
    slug,
    published: false,
  };
}

// Send Telegram notification to Wayne
async function notifyWayne(title: string, category: string, excerpt: string, postId: string, botToken: string) {
  const message = `📝 New blog draft ready for review:

Title: ${title}
Category: ${category}
Excerpt: ${excerpt}

Reply PUBLISH to make it live, EDIT: [your notes] to revise, or SKIP to discard.

Draft ID: ${postId}`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: 6869281291,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      console.error('Telegram send failed:', await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Telegram notification error:', err);
    return false;
  }
}

// Save draft to Supabase
async function saveDraftToSupabase(draft: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wuwgbdjgsgtsmuctuhpt.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Supabase insert error:', error);
      throw new Error(`Supabase error: ${response.status} ${error}`);
    }

    const inserted = await response.json();
    return inserted[0]; // Return first (and only) inserted row
  } catch (err) {
    console.error('Draft save error:', err);
    throw err;
  }
}

async function handler(req: NextRequest) {
  try {
    // Verify cron request
    if (!verifyCronRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate draft
    const draft = generateBlogDraft();

    // Save to Supabase
    const saved = await saveDraftToSupabase(draft);

    // Get Telegram bot token — env var preferred, fallback to hardcoded
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8702053141:AAF0MaOOFfbSnpuhu2u_K59NtZ9k56X6Wxs';
    {
      // Notify Wayne
      const notified = await notifyWayne(
        saved.title,
        saved.category,
        saved.excerpt,
        saved.id,
        botToken
      );
      if (!notified) {
        console.warn('Telegram notification failed but draft was saved');
      }
    }

    return NextResponse.json({
      success: true,
      post_id: saved.id,
      title: saved.title,
    });
  } catch (error) {
    console.error('Blog draft cron error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

