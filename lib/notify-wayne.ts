/**
 * Fire-and-forget email notification to Wayne.
 * Non-fatal — never throws, never blocks a response.
 */
export async function notifyWayne(subject: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ember <ember@tripillarstudio.com>",
        to: "wayne@tripillarstudio.com",
        subject,
        text,
      }),
    });
  } catch (err) {
    console.error("[notifyWayne] email failed (non-fatal):", err);
  }
}
