import { notFound } from "next/navigation";
import { db, Automation } from "@/lib/supabase";
import AutomationForm from "../form";
import { updateAutomation } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditAutomationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { data } = await db()
    .from("automations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const automation = data as Automation;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Editar: {automation.name}</h1>
      <AutomationForm
        action={updateAutomation.bind(null, id)}
        automation={automation}
        error={sp.erro}
      />
    </div>
  );
}
