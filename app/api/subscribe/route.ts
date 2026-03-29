import { NextRequest, NextResponse } from "next/server";

const KIT_API_SECRET = process.env.KIT_API_SECRET!;
const KIT_BASE = "https://api.convertkit.com/v3";
const NEWSLETTER_SEQUENCE_ID = 2701551; // Website — General Newsletter
const WEBSITE_SUBSCRIBER_TAG_ID = 18231220; // website-subscriber

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: NextRequest) {
  let body: { email?: string };
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
    // 1. Check if subscriber already exists and is active
    const checkRes = await fetch(
      `${KIT_BASE}/subscribers?api_secret=${KIT_API_SECRET}&email_address=${encodeURIComponent(email)}`
    );
    const checkData = await checkRes.json();
    const existing = checkData.subscribers?.[0];
    const isAlreadyActive =
      existing &&
      (existing.state === "active" || existing.state === "inactive");

    // 2. Enroll in sequence (creates subscriber if new, re-enrolls if existing)
    const enrollRes = await fetch(
      `${KIT_BASE}/courses/${NEWSLETTER_SEQUENCE_ID}/subscribe`,
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

    // 3. Tag as website-subscriber (fire-and-forget)
    fetch(`${KIT_BASE}/tags/${WEBSITE_SUBSCRIBER_TAG_ID}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_secret: KIT_API_SECRET, email }),
    }).catch(() => {});

    if (isAlreadyActive) {
      return NextResponse.json({ status: "already_subscribed" });
    }

    return NextResponse.json({ status: "subscribed" });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
