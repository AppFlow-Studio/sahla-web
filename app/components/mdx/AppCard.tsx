import { IconBrandAppstore, IconBrandGooglePlay } from "@tabler/icons-react";

export type AppCardProps = {
  name: string;
  iconUrl: string;
  description: string;
  appStoreUrl?: string;
  playStoreUrl?: string;
};

/** /apps gallery. */
export function AppCard({ name, iconUrl, description, appStoreUrl, playStoreUrl }: AppCardProps) {
  return (
    <div className="not-prose flex flex-col gap-4 rounded-2xl border border-edge bg-card p-6">
      <div className="flex items-center gap-4">
        <img src={iconUrl} alt="" className="size-12 rounded-xl" />
        <p className="text-[16px] font-semibold text-ink">{name}</p>
      </div>

      <p className="text-[14px] leading-[1.6] text-ink/60">{description}</p>

      {(appStoreUrl || playStoreUrl) && (
        <div className="mt-1 flex flex-wrap gap-2">
          {appStoreUrl && (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-[12px] font-medium text-ink/70 transition-colors duration-200 hover:border-ink/30 hover:text-ink"
            >
              <IconBrandAppstore size={15} />
              App Store
            </a>
          )}
          {playStoreUrl && (
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-edge px-4 py-2 text-[12px] font-medium text-ink/70 transition-colors duration-200 hover:border-ink/30 hover:text-ink"
            >
              <IconBrandGooglePlay size={15} />
              Google Play
            </a>
          )}
        </div>
      )}
    </div>
  );
}
