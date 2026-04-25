import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

type DemoBody = {
  name?: string;
  email?: string;
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
  const mosqueId = crypto.randomUUID();
  const slug = createSlug(mosqueName);

  // 1. Save to demo_requests for record-keeping
  const { error: demoError } = await supabase.from("demo_requests").insert({
    name,
    email,
    mosque_name: mosqueName,
    city: city || null,
    country: country || null,
    notes: notes || null,
  });

  if (demoError) {
    console.error("Demo request insert failed:", demoError.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // 2. Create mosque record in pipeline
  const { data: mosqueRow, error: mosqueError } = await supabase
    .from("mosques")
    .insert({
      id: mosqueId,
      slug,
      name: mosqueName,
      city: city || null,
      state: country || null,
      email,
      onboarding_status: "pipeline",
    })
    .select("id, name")
    .single();

  if (mosqueError || !mosqueRow) {
    console.error("Mosque insert failed:", mosqueError?.message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  // 3. Create pipeline stage as "lead"
  const { error: stageError } = await supabase.from("pipeline_stages").insert({
    mosque_id: mosqueRow.id,
    stage: "lead",
    contact_name: name,
    contact_email: email,
    updated_at: new Date().toISOString(),
  });

  if (stageError) {
    console.error("Pipeline stage insert failed:", stageError.message);
  }

  // 4. Add a note if there's extra info
  const noteParts: string[] = [];
  noteParts.push(`Source: Demo request form`);
  if (country) noteParts.push(`Country: ${country}`);
  if (notes) noteParts.push(notes);

  if (noteParts.length > 0) {
    await supabase.from("mosque_notes").insert({
      mosque_id: String(mosqueRow.id),
      note: noteParts.join("\n"),
    });
  }

  // 5. Send email notification
  try {
    await resend.emails.send({
      from: "Sahla <noreply@sahla.app>",
      to: "info@sahla.co",
      subject: `New Demo Request — ${mosqueName}`,
      html: `
        <h2>New Demo Request</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">${name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Mosque</td><td style="padding:6px 12px;">${mosqueName}</td></tr>
          ${city ? `<tr><td style="padding:6px 12px;font-weight:bold;">City</td><td style="padding:6px 12px;">${city}</td></tr>` : ""}
          ${country ? `<tr><td style="padding:6px 12px;font-weight:bold;">Country</td><td style="padding:6px 12px;">${country}</td></tr>` : ""}
          ${notes ? `<tr><td style="padding:6px 12px;font-weight:bold;">Notes</td><td style="padding:6px 12px;">${notes}</td></tr>` : ""}
        </table>
      `,
    });
  } catch (err) {
    console.error("Failed to send demo notification email:", err);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
