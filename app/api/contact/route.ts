import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KIT_API_SECRET = process.env.KIT_API_SECRET!;
const KIT_BASE = "https://api.convertkit.com/v3";
const INSTITUTION_TAG_ID = 18231222;
const CONTACT_FORM_TAG_ID = 18231223;
const INSTITUTION_SEQUENCE_ID = 2701557;
const GENERAL_CONTACT_SEQUENCE_ID = 2701558;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

const inquiryLabel: Record<string, string> = {
  institution: "Institution / Organization",
  organization: "Institution / Organization",
  individual: "Individual / Family",
  facilitator: "Facilitator",
  media: "Media / Research",
  general: "General",
};

async function sendViaResend(name: string, email: string, label: string, message: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Live and Grieve™ <noreply@tripillarstudio.com>",
      to: ["wayne@tripillarstudio.com"],
      reply_to: email,
      subject: `New Contact Form Submission — ${label}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Inquiry Type: ${label}`,
        ``,
        `Message:`,
        message,
        ``,
        `---`,
        `Submitted via tripillarstudio.com/contact`,
      ].join("\n"),
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#2D3142;">
          <div style="background:#2D3142;padding:24px 32px;border-left:5px solid #B8942F;">
            <p style="color:#B8942F;font-family:Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px;">Live and Grieve™</p>
            <h1 style="color:#ffffff;font-size:20px;margin:0;">New Contact Form Submission</h1>
          </div>
          <div style="padding:28px 32px;background:#ffffff;border:1px solid #e5e7eb;border-top:none;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
              <tr><td style="padding:8px 0;font-size:13px;color:#6B7280;font-family:Helvetica,sans-serif;width:120px;">Name</td><td style="padding:8px 0;font-size:14px;color:#2D3142;font-family:Helvetica,sans-serif;font-weight:600;">${name}</td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#6B7280;font-family:Helvetica,sans-serif;">Email</td><td style="padding:8px 0;font-size:14px;font-family:Helvetica,sans-serif;"><a href="mailto:${email}" style="color:#B8942F;">${email}</a></td></tr>
              <tr><td style="padding:8px 0;font-size:13px;color:#6B7280;font-family:Helvetica,sans-serif;">Inquiry</td><td style="padding:8px 0;"><span style="display:inline-block;background:#FFF7ED;color:#B8942F;font-size:12px;font-family:Helvetica,sans-serif;font-weight:600;padding:3px 10px;border-radius:4px;border:1px solid #B8942F33;">${label}</span></td></tr>
            </table>
            <div style="background:#F8F4EE;border-left:3px solid #B8942F;padding:16px 20px;border-radius:0 6px 6px 0;">
              <p style="font-size:12px;color:#6B7280;font-family:Helvetica,sans-serif;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Message</p>
              <p style="font-size:14px;color:#2D3142;font-family:Helvetica,sans-serif;margin:0;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>
            <p style="margin-top:24px;font-size:12px;color:#9CA3AF;font-family:Helvetica,sans-serif;">Reply directly to this email to respond to ${name}.<br>Submitted via <a href="https://tripillarstudio.com/contact" style="color:#B8942F;">tripillarstudio.com/contact</a></p>
          </div>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  return await res.json();
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; inquiry_type?: string; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const inquiry_type = (body.inquiry_type || "general").trim();
  const message = (body.message || "").trim();

  if (!name) return NextResponse.json({ error: "validation", field: "name", message: "Please enter your name." }, { status: 400 });
  if (!email || !isValidEmail(email)) return NextResponse.json({ error: "invalid_email", message: "Please enter a valid email address." }, { status: 400 });
  if (!message || message.length < 10) return NextResponse.json({ error: "validation", field: "message", message: "Please include a message." }, { status: 400 });

  const isInstitution = inquiry_type === "institution" || inquiry_type === "organization";
  const label = inquiryLabel[inquiry_type] || inquiry_type;

  // 1. Save to Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  let submissionId: string | null = null;
  let emailError: string | null = null;

  try {
    const { data } = await supabase
      .from("contact_submissions")
      .insert({ name, email, inquiry_type, message })
      .select("id")
      .single();
    submissionId = data?.id ?? null;
  } catch (err) {
    console.error("Supabase save error:", err);
  }

  // 2. Send via Resend
  try {
    await sendViaResend(name, email, label, message);
    if (submissionId) {
      supabase.from("contact_submissions").update({ emailed_at: new Date().toISOString() }).eq("id", submissionId).then(() => {});
    }
  } catch (err: unknown) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error("Resend error:", emailError);
    if (submissionId) {
      supabase.from("contact_submissions").update({ email_error: emailError }).eq("id", submissionId).then(() => {});
    }
    if (!submissionId) {
      return NextResponse.json(
        { error: "email_failed", message: "Something went wrong. Please email us directly at wayne@tripillarstudio.com" },
        { status: 502 }
      );
    }
  }

  // 3. Kit subscribe + tag
  try {
    const sequenceId = isInstitution ? INSTITUTION_SEQUENCE_ID : GENERAL_CONTACT_SEQUENCE_ID;
    const tagId = isInstitution ? INSTITUTION_TAG_ID : CONTACT_FORM_TAG_ID;
    const kitPayload = JSON.stringify({ api_secret: KIT_API_SECRET, email, first_name: name.split(" ")[0] });
    const headers = { "Content-Type": "application/json" };
    await fetch(`${KIT_BASE}/courses/${sequenceId}/subscribe`, { method: "POST", headers, body: kitPayload });
    await fetch(`${KIT_BASE}/tags/${tagId}/subscribe`, { method: "POST", headers, body: kitPayload });
  } catch { /* non-fatal */ }

  return NextResponse.json({ status: "sent" });
}
