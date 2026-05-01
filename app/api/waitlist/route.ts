import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sahlaEmailHtml, escapeHtml } from "@/lib/email/template";

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
      html: sahlaEmailHtml({
        preheader: `${name} from ${mosqueName} just joined the waitlist`,
        body: `
          <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#B8922A;">New Signup</p>
          <h1 style="font-size:22px;font-weight:600;color:#0A261E;margin:0 0 24px;line-height:1.3;">${escapeHtml(mosqueName)}</h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;border:1px solid rgba(10,38,30,0.08);">
            <tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;width:90px;border-bottom:1px solid rgba(10,38,30,0.06);font-size:13px;">Name</td>
              <td style="padding:10px 16px;color:#0A261E;border-bottom:1px solid rgba(10,38,30,0.06);font-size:14px;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;border-bottom:1px solid rgba(10,38,30,0.06);font-size:13px;">Email</td>
              <td style="padding:10px 16px;border-bottom:1px solid rgba(10,38,30,0.06);font-size:14px;"><a href="mailto:${escapeHtml(email)}" style="color:#1a6b42;text-decoration:none;">${escapeHtml(email)}</a></td>
            </tr>
            ${phone ? `<tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;border-bottom:1px solid rgba(10,38,30,0.06);font-size:13px;">Phone</td>
              <td style="padding:10px 16px;border-bottom:1px solid rgba(10,38,30,0.06);font-size:14px;"><a href="tel:${escapeHtml(phone)}" style="color:#1a6b42;text-decoration:none;">${escapeHtml(phone)}</a></td>
            </tr>` : ""}
            <tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;${city || country || notes ? "border-bottom:1px solid rgba(10,38,30,0.06);" : ""}font-size:13px;">Mosque</td>
              <td style="padding:10px 16px;color:#0A261E;${city || country || notes ? "border-bottom:1px solid rgba(10,38,30,0.06);" : ""}font-size:14px;">${escapeHtml(mosqueName)}</td>
            </tr>
            ${city ? `<tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;${country || notes ? "border-bottom:1px solid rgba(10,38,30,0.06);" : ""}font-size:13px;">City</td>
              <td style="padding:10px 16px;color:#0A261E;${country || notes ? "border-bottom:1px solid rgba(10,38,30,0.06);" : ""}font-size:14px;">${escapeHtml(city)}</td>
            </tr>` : ""}
            ${country ? `<tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;${notes ? "border-bottom:1px solid rgba(10,38,30,0.06);" : ""}font-size:13px;">Country</td>
              <td style="padding:10px 16px;color:#0A261E;${notes ? "border-bottom:1px solid rgba(10,38,30,0.06);" : ""}font-size:14px;">${escapeHtml(country)}</td>
            </tr>` : ""}
            ${notes ? `<tr>
              <td style="padding:10px 16px;font-weight:600;color:#0A261E;font-size:13px;">Notes</td>
              <td style="padding:10px 16px;color:#0A261E;font-size:14px;">${escapeHtml(notes)}</td>
            </tr>` : ""}
          </table>
        `,
      }),
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
  return sahlaEmailHtml({
    preheader: `You're on the Sahla waitlist — we've reserved ${mosqueName}`,
    body: `
      <p style="margin:0 0 14px;color:#0A261E;font-size:15px;line-height:1.7;">
        Asalamu alaykum ${escapeHtml(firstName)},
      </p>
      <p style="margin:0 0 28px;color:rgba(10,38,30,0.7);font-size:15px;line-height:1.7;">
        Thank you for reserving <strong style="color:#0A261E;">${escapeHtml(mosqueName)}</strong>'s place on the Sahla waitlist.
        We've received your details and someone from our team will be in touch within three days.
      </p>

      <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#0A261E;">What happens next</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:0 0 2px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="100%" height="1" style="height:1px;font-size:1px;line-height:1px;background-color:#B8922A;">&nbsp;</td></tr></table></td>
        </tr>
        <tr>
          <td style="padding:18px 0;border-bottom:1px solid rgba(10,38,30,0.08);">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="top" style="padding-right:16px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;line-height:1;color:#B8922A;">1</td>
              <td valign="top" style="color:rgba(10,38,30,0.7);font-size:15px;line-height:1.7;">
                We'll reach out to schedule a short call with you &mdash; and anyone from your masjid's board who should be on it.
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 0;border-bottom:1px solid rgba(10,38,30,0.08);">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="top" style="padding-right:16px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;line-height:1;color:#B8922A;">2</td>
              <td valign="top" style="color:rgba(10,38,30,0.7);font-size:15px;line-height:1.7;">
                We'll walk through what your mosque's own app could look like, using a live Sahla app as a reference.
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="top" style="padding-right:16px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;line-height:1;color:#B8922A;">3</td>
              <td valign="top" style="color:rgba(10,38,30,0.7);font-size:15px;line-height:1.7;">
                If it's a fit, we'll begin onboarding. Most mosques are live in the App Store within two weeks.
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    `,
  });
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
    `Asalamu alaykum ${firstName},`,
    ``,
    `Thank you for reserving ${mosqueName}'s place on the Sahla waitlist. We've received your details and someone from our team will be in touch within three days.`,
    ``,
    `WHAT HAPPENS NEXT`,
    ``,
    `1. We'll reach out to schedule a short call with you — and anyone from your masjid's board who should be on it.`,
    ``,
    `2. We'll walk through what your mosque's own app could look like, using a live Sahla app as a reference.`,
    ``,
    `3. If it's a fit, we'll begin onboarding. Most mosques are live in the App Store within two weeks.`,
    ``,
    `— The Sahla Team`,
    `info@sahla.co`,
  ].join("\n");
}

