"use client";
import {useMemo} from "react";
import { defaultColumns} from "./types";
import type { KanbanCard, Stage} from "./types";
import MasjidCard from "./MasjidCard";
type Props = {
  cards : KanbanCard[];
}
const KanbanBoard = ({cards}: Props) => {
  const buckets = useMemo(() => {
    const next: Record<Stage, KanbanCard[]> = {
      lead: [],
      contacted: [],
      demo: [],
      contract: [],
      onboarding: [],
      live: [],
    };
    const validStages: Stage[] = [
      "lead",
      "contacted",
      "demo",
      "contract",
      "onboarding",
      "live",
    ];
    for (const card of cards) {
      const stage = validStages.includes(card.stage) ? card.stage : "lead";
      next[stage].push(card);
    }
    for (const stage of validStages) {
      next[stage].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }
    return next;
  }, [cards]);
 
  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="mb-4 flex justify-end">
        <button className="rounded-lg border border-[#161C22] bg-black px-4 py-2 text-white">
          + Add Lead
        </button>
      </div>
     <div className="mt-4">
      <div className="flex items-start gap-4 overflow-x-auto pb-8">
        {defaultColumns.map((column) => {
          const columnCards = buckets[column.id];
          return (
            <section key={column.id} className="flex min-w-[320px] shrink-0 flex-col">
              <header className="mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${column.dotClass}`}></span>
                <h2 className="text-sm font-medium text-foreground">{column.title}</h2>
                <span className="ml-auto rounded-full bg-foreground/10 px-2 py-0.5 text-xs tabular-nums text-tan-muted">
          {columnCards.length}
        </span>
              </header>
              <div
                className="  rounded-[10px] p-2 border border-white/5"
                style={{
                  background: "var(--bg-3)",
                }}
              >
                {columnCards.length === 0 ? (
                  <div className="flex min-h-[156px] items-center justify-center px-2 py-6 text-sm text-tan-muted">
                    Empty
                  </div>
                ) : (
                  <div className="flex w-full flex-col  gap-[5px] self-start">
                    {columnCards.map((card) => (
                      <MasjidCard key={String(card.id)} card={card} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        })
      }
      </div>
    </div>
    </div>
  );
};
export default KanbanBoard;
