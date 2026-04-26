import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

type DemoBody = {
  name?: string;
  email?: string;
  phone?: string;
  mosqueName?: string;
  city?: string;
  country?: string;
  notes?: string;
};

function createSlug(name: string) {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "mosque";
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

export async function POST(req: Request) {
  let body: DemoBody;
  try {
    body = (await req.json()) as DemoBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const mosqueName = (body.mosqueName ?? "").trim();
  const city = (body.city ?? "").trim();
  const country = (body.country ?? "").trim();
  const notes = (body.notes ?? "").trim();

  if (!name || !email || !mosqueName) {
    return NextResponse.json(
      { error: "Name, email, and mosque name are required." },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabaseClient();
  const normalizedEmail = email.toLowerCase();
  const mosqueId = crypto.randomUUID();
  const slug = createSlug(mosqueName);

  // 0. Reject duplicates — if a mosque already exists with this email, tell
  //    the user they're on the list rather than silently creating a second row.
  const { data: existing, error: lookupError } = await supabase
    .from("mosques")
    .select("id, name")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    console.error("Waitlist duplicate lookup failed:", lookupError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  if (existing) {
    return NextResponse.json(
      {
        error: "You're already on the list.",
        alreadyJoined: true,
        mosqueName: existing.name,
      },
      { status: 409 }
    );
  }

  // 1. Create mosque record in pipeline as a lead
  const { data: mosqueRow, error: mosqueError } = await supabase
    .from("mosques")
    .insert({
      id: mosqueId,
      slug,
      name: mosqueName,
      city: city || null,
      country: country || null,
      email: normalizedEmail,
      onboarding_status: "pipeline",
    })
    .select("id, name")
    .single();

  if (mosqueError || !mosqueRow) {
    console.error("Mosque insert failed:", mosqueError);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // 2. Create pipeline stage as "lead"
  const { error: stageError } = await supabase.from("pipeline_stages").insert({
    mosque_id: mosqueRow.id,
    stage: "lead",
    contact_name: name,
    contact_email: normalizedEmail,
    contact_phone: phone || null,
    updated_at: new Date().toISOString(),
  });

  if (stageError) {
    console.error("Pipeline stage insert failed:", stageError.message);
  }

  // 3. Add a note tagging the source plus any free-text notes
  const noteParts: string[] = [];
  noteParts.push(`Source: Waitlist form`);
  if (notes) noteParts.push(notes);

  await supabase.from("mosque_notes").insert({
    mosque_id: String(mosqueRow.id),
    content: noteParts.join("\n"),
  });

  // 4. Notify the team
  try {
    await resend.emails.send({
      from: "Sahla <no-reply@sahla.co>",
      to: "info@sahla.co",
      replyTo: email,
      subject: `New Waitlist Signup — ${mosqueName}`,
      html: `
        <h2>New Waitlist Signup</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">${name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;"><a href="mailto:${email}">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:6px 12px;font-weight:bold;">Phone</td><td style="padding:6px 12px;"><a href="tel:${phone}">${phone}</a></td></tr>` : ""}
          <tr><td style="padding:6px 12px;font-weight:bold;">Mosque</td><td style="padding:6px 12px;">${mosqueName}</td></tr>
          ${city ? `<tr><td style="padding:6px 12px;font-weight:bold;">City</td><td style="padding:6px 12px;">${city}</td></tr>` : ""}
          ${country ? `<tr><td style="padding:6px 12px;font-weight:bold;">Country</td><td style="padding:6px 12px;">${country}</td></tr>` : ""}
          ${notes ? `<tr><td style="padding:6px 12px;font-weight:bold;">Notes</td><td style="padding:6px 12px;">${notes}</td></tr>` : ""}
        </table>
      `,
    });
  } catch (err) {
    console.error("Failed to send team notification email:", err);
  }

  // 5. Send the submitter their confirmation
  try {
    await resend.emails.send({
      from: "Sahla <no-reply@sahla.co>",
      to: email,
      replyTo: "info@sahla.co",
      subject: "You're on the Sahla waitlist",
      html: confirmationEmailHtml({ name, mosqueName }),
      text: confirmationEmailText({ name, mosqueName }),
    });
  } catch (err) {
    console.error("Failed to send waitlist confirmation email:", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

function confirmationEmailHtml({
  name,
  mosqueName,
}: {
  name: string;
  mosqueName: string;
}) {
  const firstName = name.split(/\s+/)[0] || name;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fffbf2;padding:32px 16px;color:#0a261e;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(13,38,30,0.06);border-radius:16px;padding:36px;">
        <div style="margin-bottom:24px;">
          <span style="display:inline-block;padding:4px 10px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#1a6b42;background:rgba(26,107,66,0.08);border-radius:999px;">Sahla</span>
        </div>
        <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#0a261e;">You're on the list, ${escapeHtml(firstName)}.</h1>
        <p style="font-size:15px;line-height:1.7;margin:0 0 16px;color:rgba(13,38,30,0.7);">
          We've reserved <strong>${escapeHtml(mosqueName)}</strong> for an upcoming onboarding wave.
          We onboard new mosques in small groups so each community gets the attention it deserves &mdash;
          you'll hear from us as soon as your spot opens.
        </p>
        <p style="font-size:15px;line-height:1.7;margin:0 0 24px;color:rgba(13,38,30,0.7);">
          In the meantime, if you'd like us to talk to your board, your imam, or anyone else on your team,
          just reply to this email and let us know who to loop in.
        </p>
        <div style="border-top:1px solid rgba(13,38,30,0.08);padding-top:20px;margin-top:24px;">
          <p style="font-size:13px;line-height:1.6;margin:0;color:rgba(13,38,30,0.5);">
            &mdash; The Sahla Team<br />
            <a href="mailto:info@sahla.co" style="color:#1a6b42;text-decoration:none;">info@sahla.co</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

function confirmationEmailText({
  name,
  mosqueName,
}: {
  name: string;
  mosqueName: string;
}) {
  const firstName = name.split(/\s+/)[0] || name;
  return [
    `You're on the list, ${firstName}.`,
    ``,
    `We've reserved ${mosqueName} for an upcoming onboarding wave. We onboard new mosques in small groups so each community gets the attention it deserves — you'll hear from us as soon as your spot opens.`,
    ``,
    `If you'd like us to talk to your board, your imam, or anyone else on your team, just reply to this email and let us know who to loop in.`,
    ``,
    `— The Sahla Team`,
    `info@sahla.co`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
