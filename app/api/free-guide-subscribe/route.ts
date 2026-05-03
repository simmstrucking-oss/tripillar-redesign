import { NextRequest, NextResponse } from "next/server";
import { sendMail, brandedHtml } from "@/lib/mailer";
import { notifyWayne } from "@/lib/notify-wayne";

const KIT_API_SECRET = process.env.KIT_API_SECRET!;
const KIT_BASE = "https://api.convertkit.com/v3";
const FREE_GUIDE_SEQUENCE_ID = 2701556; // Website — Free Guide Subscriber
const B2C_WELCOME_SEQUENCE_ID = 2701221; // Solo Companion — Welcome (B2C)
const FREE_GUIDE_TAG_ID = 18231221;     // free-guide-download
const WEBSITE_SUBSCRIBER_TAG_ID = 18231220; // website-subscriber

const PDF_URL =
  "https://wuwgbdjgsgtsmuctuhpt.supabase.co/storage/v1/object/public/public-resources/LG_Free_Guide_7_Things.pdf";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function sendFreeGuideEmail(email: string): Promise<void> {
  const html = brandedHtml(
    "Your free guide is here",
    `<p style="margin:0 0 16px;font-size:15px;color:#3a3330;line-height:1.7;">
      Thank you for requesting <strong>7 Things Nobody Tells You About Grief</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#3a3330;line-height:1.7;">
      Click the button below to download your free guide — no login required.
    </p>
    <p style="margin:0 0 28px;">
      <a href="${PDF_URL}"
         style="display:inline-block;background:#1c3028;color:#ffffff;padding:13px 28px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.02em;">
        Download Your Free Guide →
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#6b5f5a;line-height:1.7;">
      This guide shares what grief research actually says — and why what most people have been told
      about grief isn't working.
    </p>
    <p style="margin:0;font-size:14px;color:#6b5f5a;line-height:1.7;">
      — Wayne &amp; Jamie Simms<br>
      <span style="color:#a0948a;">Tri-Pillars™ LLC · Live and Grieve™</span>
    </p>`
  );

  await sendMail({
    to: email,
    subject: "Your free guide is here — 7 Things Nobody Tells You About Grief",
    html,
  });
}

export async function POST(req: NextRequest) {
  let body: { email?: string; firstName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    // Check if subscriber already exists
    const checkRes = await fetch(
      `${KIT_BASE}/subscribers?api_secret=${KIT_API_SECRET}&email_address=${encodeURIComponent(email)}`
    );
    const checkData = await checkRes.json();
    const existing = checkData.subscribers?.[0];
    const isAlreadyActive = existing && existing.state === "active";

    // Enroll in free guide sequence (Kit)
    const enrollRes = await fetch(
      `${KIT_BASE}/sequences/${FREE_GUIDE_SEQUENCE_ID}/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_secret: KIT_API_SECRET,
          email,
        }),
      }
    );

    const enrollData = await enrollRes.json();

    if (!enrollRes.ok) {
      console.error("Kit enroll error:", enrollData);
      return NextResponse.json(
        { error: "kit_error", message: "Something went wrong. Please try again." },
        { status: 502 }
      );
    }

    // Also enroll in B2C welcome sequence (fire-and-forget)
    fetch(`${KIT_BASE}/sequences/${B2C_WELCOME_SEQUENCE_ID}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_secret: KIT_API_SECRET, email }),
    }).catch(() => {});

    // Tag as free-guide-download + website-subscriber (fire-and-forget)
    const tagPromises = [FREE_GUIDE_TAG_ID, WEBSITE_SUBSCRIBER_TAG_ID].map((tagId) =>
      fetch(`${KIT_BASE}/tags/${tagId}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_secret: KIT_API_SECRET, email }),
      }).catch(() => {})
    );
    Promise.all(tagPromises).catch(() => {});

    // Send PDF delivery email — awaited so it completes before the lambda exits
    // Always send — both new and already_subscribed get the PDF link
    try {
      await sendFreeGuideEmail(email);
    } catch (err) {
      console.error("Free guide email send error:", err);
      // Don't fail the response — subscriber is in Kit, page shows download button
    }

    if (isAlreadyActive) {
      return NextResponse.json({ status: "already_subscribed" });
    }

    // Notify Wayne of new free guide download — non-fatal
    notifyWayne(
      `Free Guide Download — ${email}`,
      `Someone downloaded the free guide.\n\nEmail: ${email}\nDownloaded: ${new Date().toISOString()}`
    ).catch(() => {});

    return NextResponse.json({ status: "subscribed" });
  } catch (err) {
    console.error("Free guide subscribe error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
