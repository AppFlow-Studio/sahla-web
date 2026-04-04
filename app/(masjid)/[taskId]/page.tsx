import { ALL_TASKS } from "../components/onboarding-tasks";
import { notFound } from "next/navigation";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const task = ALL_TASKS.find((t) => t.id === taskId);

  if (!task) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${
            task.badge === "REQ"
              ? "bg-amber-100 text-amber-700"
              : "bg-stone-100 text-stone-500"
          }`}
        >
          {task.badge}
        </span>
        <span className="text-[11px] text-stone-400">{task.timeEstimate}</span>
      </div>
      <h1 className="text-[24px] font-bold text-stone-900">{task.label}</h1>
      <p className="mt-1 text-[14px] text-stone-500">{task.description}</p>

      {/* Placeholder for task-specific form panels (built in MS2/MS3) */}
      <div className="mt-8 rounded-xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
        <p className="text-[14px] text-stone-400">
          Task panel coming soon
        </p>
        <p className="mt-1 text-[12px] text-stone-300">
          This form will be built in a follow-up ticket
        </p>
      </div>
    </div>
  );
}
