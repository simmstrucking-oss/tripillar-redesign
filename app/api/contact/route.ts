import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const KIT_API_SECRET = process.env.KIT_API_SECRET!;
const KIT_BASE = "https://api.convertkit.com/v3";
const INSTITUTION_TAG_ID = 18231222;       // institution-inquiry
const CONTACT_FORM_TAG_ID = 18231223;      // contact-form-submission
const INSTITUTION_SEQUENCE_ID = 2701557;   // Website — Institution Inquiry
const GENERAL_CONTACT_SEQUENCE_ID = 2701558; // Website — General Contact

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "mail.privateemail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || "ember@tripillarstudio.com",
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    inquiry_type?: string;
    message?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const inquiry_type = (body.inquiry_type || "general").trim();
  const message = (body.message || "").trim();

  // Validate
  if (!name) {
    return NextResponse.json(
      { error: "validation", field: "name", message: "Please enter your name." },
      { status: 400 }
    );
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email address." },
      { status: 400 }
    );
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { error: "validation", field: "message", message: "Please include a message." },
      { status: 400 }
    );
  }

  const isInstitution =
    inquiry_type === "institution" || inquiry_type === "organization";

  const inquiryLabel: Record<string, string> = {
    institution: "Institution / Organization",
    organization: "Institution / Organization",
    individual: "Individual / Family",
    facilitator: "Facilitator",
    media: "Media / Research",
    general: "General",
  };
  const label = inquiryLabel[inquiry_type] || inquiry_type;

  // 1. Send notification email to Wayne
  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: '"Live and Grieve\u2122" <ember@tripillarstudio.com>',
      to: "wayne@tripillarstudio.com",
      replyTo: email,
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
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #2D3142;">
          <div style="background: #2D3142; padding: 24px 32px; border-left: 5px solid #B8942F;">
            <p style="color: #B8942F; font-family: Helvetica, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 6px;">Live and Grieve™</p>
            <h1 style="color: #ffffff; font-size: 20px; margin: 0;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 28px 32px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #6B7280; font-family: Helvetica, sans-serif; width: 120px; vertical-align: top;">Name</td>
                <td style="padding: 8px 0; font-size: 14px; color: #2D3142; font-family: Helvetica, sans-serif; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #6B7280; font-family: Helvetica, sans-serif; vertical-align: top;">Email</td>
                <td style="padding: 8px 0; font-size: 14px; color: #2D3142; font-family: Helvetica, sans-serif;"><a href="mailto:${email}" style="color: #B8942F;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 13px; color: #6B7280; font-family: Helvetica, sans-serif; vertical-align: top;">Inquiry Type</td>
                <td style="padding: 8px 0;">
                  <span style="display: inline-block; background: #FFF7ED; color: #B8942F; font-size: 12px; font-family: Helvetica, sans-serif; font-weight: 600; padding: 3px 10px; border-radius: 4px; border: 1px solid #B8942F33;">${label}</span>
                </td>
              </tr>
            </table>
            <div style="background: #F8F4EE; border-left: 3px solid #B8942F; padding: 16px 20px; border-radius: 0 6px 6px 0;">
              <p style="font-size: 12px; color: #6B7280; font-family: Helvetica, sans-serif; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Message</p>
              <p style="font-size: 14px; color: #2D3142; font-family: Helvetica, sans-serif; margin: 0; line-height: 1.7; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #9CA3AF; font-family: Helvetica, sans-serif;">
              Reply directly to this email to respond to ${name}.<br>
              Submitted via <a href="https://tripillarstudio.com/contact" style="color: #B8942F;">tripillarstudio.com/contact</a>
            </p>
          </div>
        </div>
      `,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("SMTP error:", msg);
    return NextResponse.json(
      { error: "email_failed", detail: msg, message: "Something went wrong sending your message. Please try emailing us directly." },
      { status: 502 }
    );
  }

  // 2. Kit — subscribe + tag (fire-and-forget, don't fail the response)
  try {
    const sequenceId = isInstitution
      ? INSTITUTION_SEQUENCE_ID
      : GENERAL_CONTACT_SEQUENCE_ID;
    const tagId = isInstitution ? INSTITUTION_TAG_ID : CONTACT_FORM_TAG_ID;

    await fetch(`${KIT_BASE}/courses/${sequenceId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_secret: KIT_API_SECRET,
        email,
        first_name: name.split(" ")[0],
      }),
    });

    fetch(`${KIT_BASE}/tags/${tagId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_secret: KIT_API_SECRET,
        email,
        first_name: name.split(" ")[0],
      }),
    }).catch(() => {});
  } catch {
    // Kit failure doesn't block success response
  }

  return NextResponse.json({ status: "sent" });
}
