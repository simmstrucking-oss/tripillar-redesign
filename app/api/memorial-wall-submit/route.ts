import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple in-memory rate limit: max 3 submissions per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { name, relationship, tribute, website } = body;

    // Honeypot: bots fill the hidden `website` field, humans leave it blank
    if (website && website.trim().length > 0) {
      // Silently succeed — don't tip off bots
      return NextResponse.json({ success: true, message: "Thank you." });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    // Basic content validation
    const trimmedName = name.trim().slice(0, 100);
    const trimmedRelationship = relationship?.trim().slice(0, 100) || null;
    const trimmedTribute = tribute?.trim().slice(0, 200) || null;

    // Reject if name looks like a URL or script injection
    if (/https?:\/\/|<script|javascript:/i.test(trimmedName)) {
      return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from("memorial_entries")
      .insert({
        name: trimmedName,
        relationship: trimmedRelationship,
        tribute: trimmedTribute,
      });

    if (dbError) {
      console.error("Memorial insert error:", dbError);
      return NextResponse.json({ error: "Failed to save submission." }, { status: 500 });
    }

    // Send notification email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tri-Pillars™ LLC <ember@tripillarstudio.com>",
          to: ["wayne@tripillarstudio.com"],
          subject: `New memorial wall submission: ${trimmedName}`,
          html: `
            <p>A new name has been submitted for the memorial wall and is pending your approval.</p>
            <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
              <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Name:</td><td>${trimmedName}</td></tr>
              ${trimmedRelationship ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;">Relationship:</td><td>${trimmedRelationship}</td></tr>` : ""}
              ${trimmedTribute ? `<tr><td style="padding:4px 12px 4px 0;font-weight:600;">Tribute:</td><td>${trimmedTribute}</td></tr>` : ""}
            </table>
            <p style="margin-top:16px;">To approve, set <code>approved = true</code> in the <a href="https://supabase.com/dashboard/project/wuwgbdjgsgtsmuctuhpt/editor">Supabase dashboard</a> under the <strong>memorial_entries</strong> table.</p>
          `,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Thank you. ${trimmedName} will be added after review.`,
    });
  } catch (err) {
    console.error("Memorial submit error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
