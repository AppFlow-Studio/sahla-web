import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at");

  const expenses = (data ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    name: e.name as string,
    cost: e.cost as number,
    frequency: e.frequency as string,
    category: e.category as string,
  }));

  return (
    <div>
      <ExpensesClient initialExpenses={expenses} />
    </div>
  );
}
