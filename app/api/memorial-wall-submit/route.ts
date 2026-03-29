import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, relationship, tribute } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const trimmedName = name.trim().slice(0, 100);
    const trimmedRelationship = relationship?.trim().slice(0, 100) || null;
    const trimmedTribute = tribute?.trim().slice(0, 200) || null;

    // Insert with approved = false (default)
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
          from: "Tri-Pillars <ember@tripillarstudio.com>",
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
