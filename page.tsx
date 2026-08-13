import AutomationForm from "../form";
import { createAutomation } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewAutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Nova automação</h1>
      <AutomationForm action={createAutomation} error={sp.erro} />
    </div>
  );
}
