import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const supabase = createAdminSupabaseClient();

  const [{ data }, { data: mosqueRows }] = await Promise.all([
    supabase.from("expenses").select("*").order("created_at"),
    supabase.from("mosques").select("id, name").order("name"),
  ]);

  const expenses = (data ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    name: e.name as string,
    cost: e.cost as number,
    frequency: e.frequency as string,
    category: e.category as string,
    vendor: (e.vendor as string) ?? "",
    notes: (e.notes as string) ?? "",
    status: (e.status as string) ?? "active",
    mosque_id: (e.mosque_id as string) ?? null,
  }));

  const mosques = (mosqueRows ?? []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    name: m.name as string,
  }));

  return (
    <div>
      <ExpensesClient initialExpenses={expenses} mosques={mosques} />
    </div>
  );
}
