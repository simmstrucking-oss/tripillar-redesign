import { NextRequest, NextResponse } from "next/server";

const KIT_API_SECRET = process.env.KIT_API_SECRET!;
const KIT_BASE = "https://api.convertkit.com/v3";
const FREE_GUIDE_SEQUENCE_ID = 2701556; // Website — Free Guide Subscriber
const B2C_WELCOME_SEQUENCE_ID = 2701221; // Solo Companion — Welcome (B2C)
const FREE_GUIDE_TAG_ID = 18231221;     // free-guide-download
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
    // Check if subscriber already exists
    const checkRes = await fetch(
      `${KIT_BASE}/subscribers?api_secret=${KIT_API_SECRET}&email_address=${encodeURIComponent(email)}`
    );
    const checkData = await checkRes.json();
    const existing = checkData.subscribers?.[0];
    const isAlreadyActive = existing && existing.state === "active";

    // Enroll in free guide sequence
    const enrollRes = await fetch(
      `${KIT_BASE}/courses/${FREE_GUIDE_SEQUENCE_ID}/subscribe`,
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
    fetch(`${KIT_BASE}/courses/${B2C_WELCOME_SEQUENCE_ID}/subscribe`, {
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

    if (isAlreadyActive) {
      return NextResponse.json({ status: "already_subscribed" });
    }

    return NextResponse.json({ status: "subscribed" });
  } catch (err) {
    console.error("Free guide subscribe error:", err);
    return NextResponse.json(
      { error: "server_error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
