import Link from "next/link";
import { db, Automation } from "@/lib/supabase";
import { deleteAutomation, toggleAutomation } from "./actions";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const { data } = await db()
    .from("automations")
    .select("*")
    .order("created_at", { ascending: false });
  const automations = (data ?? []) as Automation[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Automações</h1>
        <Link
          href="/automations/new"
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium"
        >
          + Nova automação
        </Link>
      </div>

      {automations.length === 0 && (
        <p className="text-slate-400">
          Nenhuma automação ainda. Crie a primeira: escolha uma palavra-chave e a
          mensagem com o seu link.
        </p>
      )}

      <ul className="space-y-3">
        {automations.map((a) => (
          <li
            key={a.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 flex-wrap"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {a.name}{" "}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    a.active
                      ? "bg-emerald-900/60 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {a.active ? "ativa" : "pausada"}
                </span>
              </p>
              <p className="text-sm text-slate-400 truncate">
                Palavras: {a.keywords.join(", ")}
                {a.media_id ? " · só em 1 post" : " · todos os posts"}
              </p>
            </div>
            <form action={toggleAutomation.bind(null, a.id, !a.active)}>
              <button className="text-sm border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5">
                {a.active ? "Pausar" : "Ativar"}
              </button>
            </form>
            <Link
              href={`/automations/${a.id}`}
              className="text-sm border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5"
            >
              Editar
            </Link>
            <form action={deleteAutomation.bind(null, a.id)}>
              <button className="text-sm text-red-400 border border-red-900 hover:border-red-700 rounded-lg px-3 py-1.5">
                Excluir
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
