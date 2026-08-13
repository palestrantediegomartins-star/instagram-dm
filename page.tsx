import { db, getSettings } from "@/lib/supabase";
import { updateHourlyCap, disconnectInstagram } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-sm font-medium text-slate-400 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ conectado?: string; erro?: string }>;
}) {
  const sp = await searchParams;
  const client = db();
  const settings = await getSettings(client).catch(() => null);
  const connected = Boolean(settings?.access_token);

  const [pending, sentToday, autosCount] = await Promise.all([
    client
      .from("send_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    client
      .from("send_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    client
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
  ]);

  const tokenExpiry = settings?.token_expires_at
    ? new Date(settings.token_expires_at).toLocaleDateString("pt-BR")
    : null;

  return (
    <div className="space-y-6">
      {sp.conectado && (
        <p className="rounded-lg bg-emerald-900/40 border border-emerald-700 px-4 py-3 text-sm text-emerald-300">
          Instagram conectado com sucesso! 🎉
        </p>
      )}
      {sp.erro && (
        <p className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-300">
          Erro ao conectar: {sp.erro}
        </p>
      )}

      <Card title="Conta do Instagram">
        {connected ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-lg font-semibold">@{settings?.username}</p>
              <p className="text-sm text-slate-400">
                Conectado · token renova sozinho{tokenExpiry ? ` (válido até ${tokenExpiry})` : ""}
              </p>
            </div>
            <form action={disconnectInstagram}>
              <button className="text-sm text-red-400 hover:text-red-300 border border-red-900 rounded-lg px-3 py-1.5">
                Desconectar
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-slate-300">Nenhuma conta conectada ainda.</p>
            <a
              href="/api/auth/instagram"
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium"
            >
              Conectar Instagram
            </a>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Automações ativas">
          <p className="text-3xl font-semibold">{autosCount.count ?? 0}</p>
          <Link
            href="/automations"
            className="text-sm text-emerald-400 hover:underline"
          >
            gerenciar →
          </Link>
        </Card>
        <Card title="DMs enviadas hoje">
          <p className="text-3xl font-semibold">{sentToday.count ?? 0}</p>
        </Card>
        <Card title="Na fila agora">
          <p className="text-3xl font-semibold">{pending.count ?? 0}</p>
        </Card>
      </div>

      <Card title="Proteção da conta — teto de envios por hora">
        <form action={updateHourlyCap} className="flex items-center gap-3">
          <input
            type="number"
            name="hourly_cap"
            min={1}
            max={200}
            defaultValue={settings?.hourly_cap ?? 60}
            className="w-24 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2"
          />
          <span className="text-sm text-slate-400">mensagens por hora, no máximo</span>
          <button className="ml-auto rounded-lg border border-slate-700 hover:border-slate-500 px-4 py-2 text-sm">
            Salvar
          </button>
        </form>
      </Card>
    </div>
  );
}
