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
    <article
      className="kanban-card flex w-full flex-col rounded-lg border p-4 shadow-sm transition-[border-color] hover:border-foreground/25"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <h3 className="text-[12.5px] leading-tight font-bold text-foreground">
        {card.mosqueName.trim() || "—"}
      </h3>
      <p className="mt-0.5 text-[11px] text-tan-muted">
        {formatLocation(card.city, card.state)}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: "var(--t2)" }}>
        {card.contactName.trim() || "—"}
      </p>
      {showOnboardingBar ? (
        <div className="mt-2">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full bg-blue-400 transition-[width]"
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
