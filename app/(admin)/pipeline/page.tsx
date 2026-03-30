import KanbanBoard from "@/app/components/kanban/KanbanBoard";
import type { KanbanCard } from "@/app/components/kanban/types";

// For P1 we can keep this as a server component and
// pass plain data into the client KanbanBoard.
export default function PipelinePage() {
  const MOCK_CARDS: KanbanCard[] = [
    {
      id: "1",
      mosqueName: "Masjid Al-Rahman",
      city: "New York",
      state: "NY",
      contactName: "John Doe",
      stage: "lead",
      onboardingProgress: null,
      updatedAt: "2026-03-30T12:00:00.000Z",
    },
    {
      id: "2",
      mosqueName: "Masjid Mosab",
      city: "New York",
      state: "NY",
      contactName: "John Doe",
      stage: "demo",
      onboardingProgress: null,
      updatedAt: "2026-03-29T15:00:00.000Z",
    },
    {
      id: "3",
      mosqueName: "Masjid al-Huda",
      city: "Brunswick",
      state: "NJ",
      contactName: "Moe Money",
      stage: "onboarding",
      onboardingProgress: 60,
      updatedAt: "2026-03-30T09:30:00.000Z",
    },
    {
      id: "4",
      mosqueName: "Masjid MAS SI",
      city: "Staten Island",
      state: "NY",
      contactName: "John Doe",
      stage: "lead",
      onboardingProgress: null,
      updatedAt: "2026-03-30T12:00:00.000Z",
    }
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-tan-light">Pipeline</h1>
      <p className="mt-2 text-tan-muted">
        Mosque onboarding pipeline. Track leads and progress here.
      </p>
      <KanbanBoard cards={MOCK_CARDS} />
    </div>
  );
}
