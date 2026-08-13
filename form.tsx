import { Automation } from "@/lib/supabase";

/** Formulário compartilhado entre criar e editar (server component). */
export default function AutomationForm({
  action,
  automation,
  error,
}: {
  action: (formData: FormData) => Promise<void>;
  automation?: Automation;
  error?: string;
}) {
  const a = automation;
  return (
    <form action={action} className="space-y-5 max-w-xl">
      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
          {error === "preencha"
            ? "Preencha ao menos uma palavra-chave e a mensagem."
            : error}
        </p>
      )}

      <label className="block">
        <span className="text-sm text-slate-400">Nome da automação</span>
        <input
          name="name"
          defaultValue={a?.name ?? ""}
          placeholder="Ex.: Ebook de vendas"
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
        />
      </label>

      <label className="block">
        <span className="text-sm text-slate-400">
          Palavras-chave (separadas por vírgula)
        </span>
        <input
          name="keywords"
          required
          defaultValue={a?.keywords?.join(", ") ?? ""}
          placeholder="Ex.: quero, link, ebook"
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
        />
      </label>

      <label className="block">
        <span className="text-sm text-slate-400">Como casar a palavra-chave</span>
        <select
          name="match_mode"
          defaultValue={a?.match_mode ?? "contains"}
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
        >
          <option value="contains">
            O comentário CONTÉM a palavra (recomendado)
          </option>
          <option value="exact">O comentário é EXATAMENTE a palavra</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm text-slate-400">Mensagem da DM</span>
        <textarea
          name="message_text"
          required
          rows={4}
          defaultValue={a?.message_text ?? ""}
          placeholder="Ex.: Oi! Que bom que você tem interesse 😊 Aqui está o link que você pediu:"
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-slate-400">Link (opcional)</span>
          <input
            name="link_url"
            type="url"
            defaultValue={a?.link_url ?? ""}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-400">
            Texto do botão (opcional, máx. 20 letras)
          </span>
          <input
            name="button_text"
            maxLength={20}
            defaultValue={a?.button_text ?? ""}
            placeholder="Ex.: Baixar agora"
            className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm text-slate-400">
          Limitar a um post/reel específico (opcional — ID da mídia; deixe em
          branco pra valer em todos)
        </span>
        <input
          name="media_id"
          defaultValue={a?.media_id ?? ""}
          placeholder="Deixe em branco pra todos os posts"
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-2.5"
        />
      </label>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="reply_to_comments"
            defaultChecked={a?.reply_to_comments ?? true}
          />
          Responder comentários
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="reply_to_dms"
            defaultChecked={a?.reply_to_dms ?? true}
          />
          Responder DMs recebidas
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={a?.active ?? true} />
          Ativa
        </label>
      </div>

      <button className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 font-medium">
        Salvar automação
      </button>
    </form>
  );
}
