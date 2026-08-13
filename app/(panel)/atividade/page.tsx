import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  comentario_enfileirado: "Comentário casou com palavra-chave — DM na fila",
  dm_enfileirada: "DM recebida casou com palavra-chave — resposta na fila",
  mensagem_enviada: "Mensagem enviada",
  falha_envio: "Falha ao enviar (vai tentar de novo)",
  token_renovado: "Token do Instagram renovado",
  falha_renovar_token: "Falha ao renovar o token",
  instagram_conectado: "Instagram conectado",
  instagram_desconectado: "Instagram desconectado",
  falha_conectar_instagram: "Falha ao conectar o Instagram",
  webhook_erro: "Erro ao processar evento recebido",
  automacao_criada: "Automação criada",
  automacao_atualizada: "Automação atualizada",
  automacao_excluida: "Automação excluída",
  teto_por_hora_atualizado: "Teto de envios por hora atualizado",
  falha_pegar_lote: "Erro interno na fila",
};

export default async function ActivityPage() {
  const { data } = await db()
    .from("event_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(100);

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Atividade (últimos 100 eventos)</h1>
      {rows.length === 0 && (
        <p className="text-slate-400">Nada por aqui ainda.</p>
      )}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  r.level === "error"
                    ? "text-red-400"
                    : r.level === "warn"
                      ? "text-amber-400"
                      : "text-emerald-400"
                }
              >
                ●
              </span>
              <span className="flex-1">{LABELS[r.event] ?? r.event}</span>
              <span className="text-slate-500">
                {new Date(r.at).toLocaleString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                })}
              </span>
            </div>
            {r.detail && (
              <pre className="mt-1 ml-6 text-xs text-slate-500 whitespace-pre-wrap break-all">
                {JSON.stringify(r.detail)}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
