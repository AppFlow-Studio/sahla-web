"use client";

import { usePreview } from "./OnboardingPreviewContext";
import AppPreviewPanel from "@/components/ui/skiper-ui/AppPreviewPanel";

export default function OnboardingPhonePreview() {
  const { appName, brandColor, accentColor, logoUrl, programCategories, programs } =
    usePreview();

  return (
    <aside
      className="hidden xl:flex w-[380px] shrink-0 justify-center sticky top-0 h-screen overflow-y-auto py-10 pr-6"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex flex-col items-center gap-4">
        <AppPreviewPanel
          appName={appName}
          brandColor={brandColor}
          accentColor={accentColor}
          logoUrl={logoUrl ?? undefined}
          programCategories={programCategories}
          programs={programs}
        />
        <EditsSummary
          appName={appName}
          brandColor={brandColor}
          accentColor={accentColor}
          logoUrl={logoUrl}
          categoryTitles={programCategories.map((c) => c.title)}
          programNames={programs.map((p) => p.name)}
        />
      </div>
    </aside>
  );
}

/** Live rundown of what the admin has customized so far — mirrors the phone. */
function EditsSummary({
  appName,
  brandColor,
  accentColor,
  logoUrl,
  categoryTitles,
  programNames,
}: {
  appName: string;
  brandColor: string;
  accentColor: string;
  logoUrl: string | null;
  categoryTitles: string[];
  programNames: string[];
}) {
  return (
    <div className="w-[280px] rounded-2xl border border-stone-200 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-stone-400">
          Your edits · live
        </p>
      </div>

      <dl className="mt-3 space-y-2.5 text-[12px]">
        <Row label="App name">
          <span className="flex min-w-0 items-center gap-1.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-4 w-4 shrink-0 rounded object-cover ring-1 ring-black/5"
              />
            ) : null}
            <span className="truncate font-medium text-stone-800">{appName || "—"}</span>
          </span>
        </Row>

        <Row label="Brand color">
          <Swatch color={brandColor} />
        </Row>

        <Row label="Accent color">
          <Swatch color={accentColor} />
        </Row>

        <Row label="Categories">
          {categoryTitles.length > 0 ? (
            <span className="min-w-0 truncate font-medium text-stone-800">
              <span className="text-stone-400">{categoryTitles.length} · </span>
              {categoryTitles.join(", ")}
            </span>
          ) : (
            <span className="text-stone-400">None yet</span>
          )}
        </Row>

        <Row label="Programs">
          {programNames.length > 0 ? (
            <span className="min-w-0 truncate font-medium text-stone-800">
              <span className="text-stone-400">{programNames.length} · </span>
              {programNames.join(", ")}
            </span>
          ) : (
            <span className="text-stone-400">None yet</span>
          )}
        </Row>
      </dl>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-stone-400">{label}</dt>
      <dd className="flex min-w-0 justify-end text-right">{children}</dd>
    </div>
  );
}

function Swatch({ color }: { color: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10"
        style={{ background: color }}
      />
      <span className="tabular-nums text-stone-600">{color.toUpperCase()}</span>
    </span>
  );
}
