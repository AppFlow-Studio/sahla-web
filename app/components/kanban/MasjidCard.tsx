import type { KanbanCard as KanbanCardModel } from "./types";

type Props = {
  card: KanbanCardModel;
};

function formatLocation(city: string, state: string | null | undefined) {
  const c = city.trim();
  const s = state?.trim();
  if (c && s) return `${c}, ${s}`;
  if (c) return c;
  if (s) return s;
  return "—";
}

export default function MasjidCard({ card }: Props) {
  const showOnboardingBar = card.stage === "onboarding";
  const progress = card.onboardingProgress ?? 0;

  return (
    <article className="flex w-full flex-col rounded-xl border border-green/10 bg-white p-4 shadow-sm transition-[border-color,box-shadow] hover:border-highlight/35 hover:shadow-md">
      <h3 className="text-[12.5px] leading-tight font-bold text-green">
        {card.mosqueName.trim() || "—"}
      </h3>
      <p className="mt-0.5 text-[11px] text-green/60">
        {formatLocation(card.city, card.state)}
      </p>
      <p className="mt-0.5 text-[11px] text-green/80">
        {card.contactName.trim() || "—"}
      </p>
      {showOnboardingBar ? (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-green/10">
            <div
              className="h-full rounded-full bg-highlight transition-[width]"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
              }}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}
