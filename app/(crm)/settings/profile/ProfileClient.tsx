"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageHeader from "../../_components/PageHeader";
import HelpButton from "../../_components/HelpButton";
import { useMosque } from "../../_lib/mock-mosque";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Karachi",
];

export default function ProfileClient() {
  const mosque = useMosque();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(mosque.name);
  const [appName, setAppName] = useState(mosque.appName);
  const [address, setAddress] = useState(mosque.address);
  const [city, setCity] = useState(mosque.city);
  const [state, setState] = useState(mosque.state);
  const [phone, setPhone] = useState(mosque.phone);
  const [email, setEmail] = useState(mosque.email);
  const [timezone, setTimezone] = useState(mosque.timezone);
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== mosque.name ||
    appName !== mosque.appName ||
    address !== mosque.address ||
    city !== mosque.city ||
    state !== mosque.state ||
    phone !== mosque.phone ||
    email !== mosque.email ||
    timezone !== mosque.timezone;

  function reset() {
    setName(mosque.name);
    setAppName(mosque.appName);
    setAddress(mosque.address);
    setCity(mosque.city);
    setState(mosque.state);
    setPhone(mosque.phone);
    setEmail(mosque.email);
    setTimezone(mosque.timezone);
    toast.success("Reverted to current values");
  }

  async function save() {
    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to save.");
      return;
    }
    if (!dirty) {
      toast("Nothing to save", { description: "Profile is already up to date." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          app_name: appName,
          address,
          city,
          state,
          phone,
          email,
          timezone,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      toast.success("Profile saved");
      router.refresh();
      queryClient.invalidateQueries({ queryKey: ["crm"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Mosque profile"
        description="Contact info + app branding name. These appear in your CRM sidebar, your mosque app's About screen, and on receipts."
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={reset} disabled={saving || !dirty}>
              <RotateCcw size={13} />
              Reset
            </Button>
            <Button onClick={save} disabled={saving || !dirty}>
              <Save size={13} />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        }
      />

      <div className="space-y-5">
        <Section title="Identity" description="What members see in the app.">
          <Field
            label="Mosque name"
            helpText="The full mosque name. Shown in the CRM sidebar + app About screen."
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field
            label="App display name"
            helpText="Short name shown on the App Store + iOS home screen. Often the mosque's nickname."
          >
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
          </Field>
        </Section>

        <Section title="Location" description="Used for prayer-times calculation and the app About screen.">
          <Field label="Street address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={state} onChange={(e) => setState(e.target.value)} />
            </Field>
          </div>
          <Field
            label="Timezone"
            helpText="Drives iqamah time calculations + push-notification scheduling."
          >
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-9 w-full rounded-lg border border-[#0A261E]/10 bg-white px-3 text-[13px] text-[#0A261E] outline-none focus-visible:border-[#0A261E]/30 focus-visible:ring-2 focus-visible:ring-[#0A261E]/15"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
              {/* Allow custom values that aren't in the dropdown. */}
              {timezone && !TIMEZONES.includes(timezone) ? (
                <option value={timezone}>{timezone}</option>
              ) : null}
            </select>
          </Field>
        </Section>

        <Section
          title="Contact"
          description="Used by Sahla support + appears on receipts and the app's contact card."
        >
          <Field label="Phone">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@mosque.org"
            />
          </Field>
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
      <header className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#0A261E]">{title}</h2>
        <p className="text-[12.5px] text-[#0A261E]/55">{description}</p>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  helpText,
  children,
}: {
  label: string;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-[12.5px] font-semibold text-[#0A261E]">{label}</Label>
        {helpText ? <HelpButton text={helpText} /> : null}
      </div>
      {children}
    </div>
  );
}
