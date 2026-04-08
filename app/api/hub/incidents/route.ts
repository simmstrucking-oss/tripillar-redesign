import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      facilitator_id,
      facilitator_name,
      cert_id,
      cohort_id,
      incident_date,
      session_number,
      description,
      action_taken,
      followup_planned,
      participant_status,
    } = body;

    if (!facilitator_id || !incident_date || !description || !participant_status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Normalize participant_status to match DB CHECK constraint values
    const STATUS_MAP: Record<string, string> = {
      "stable":                    "Stable",
      "referred to professional":  "Referred to professional",
      "referred":                  "Referred to professional",
      "unknown":                   "Unknown",
      "911 called":                "911 called",
      "911":                       "911 called",
    };
    const normalizedStatus =
      STATUS_MAP[String(participant_status).toLowerCase().trim()] ?? participant_status;

    const validStatuses = ["Stable", "Referred to professional", "Unknown", "911 called"];
    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: `participant_status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("critical_incident_reports")
      .insert({
        facilitator_id,
        cohort_id: cohort_id || null,
        incident_date,
        session_number: session_number || null,
        description,
        action_taken: action_taken || null,
        followup_planned: followup_planned || null,
        participant_status: normalizedStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
    }

    // Send Resend notification to Wayne
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Ember <ember@tripillarstudio.com>",
            to: "wayne@tripillarstudio.com",
            subject: `CRITICAL INCIDENT REPORT — ${facilitator_name} — ${incident_date}`,
            text: `CRITICAL INCIDENT REPORT\n\nFacilitator: ${facilitator_name}\nCert ID: ${cert_id}\nDate of Incident: ${incident_date}\nSession Number: ${session_number || "N/A"}\nParticipant Status: ${participant_status}\n\nDescription:\n${description}\n\nAction Taken During Session:\n${action_taken || "None reported"}\n\nFollow-up Action Planned:\n${followup_planned || "None reported"}\n\nSubmitted: ${new Date().toISOString()}\nReport ID: ${data.id}`,
          }),
        });
      } catch (emailErr) {
        console.error("Email send failed (non-fatal):", emailErr);
      }
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Admin endpoint to get all incidents count
  const authHeader = req.headers.get("authorization");
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("critical_incident_reports")
    .select("id, incident_date, participant_status, submitted_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ count: data.length, incidents: data });
}
