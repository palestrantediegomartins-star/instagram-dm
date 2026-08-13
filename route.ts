import { NextRequest, NextResponse } from "next/server";
import { db, getSettings, logEvent, QueueItem } from "@/lib/supabase";
import {
  sendPrivateReply,
  sendDmText,
  sendDmButton,
  refreshLongLivedToken,
  IgApiError,
} from "@/lib/ig";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PER_RUN = 5; // chamado a cada minuto pelo pg_cron
const MAX_ATTEMPTS = 3;

function buildText(p: QueueItem["payload"], withButton: boolean): string {
  let text = p.text;
  if (p.link_url && !withButton) text = `${text}\n\n${p.link_url}`;
  return text.slice(0, 1000);
}

/** Drena a fila de envio. Chamado pelo pg_cron do Supabase com o segredo. */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env("CRON_SECRET")}`) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const client = db();
  const settings = await getSettings(client);
  if (!settings?.access_token) {
    return NextResponse.json({ ok: false, reason: "instagram_nao_conectado" });
  }
  let accessToken: string = settings.access_token;

  // ---- Renovação do token (quando faltar menos de 10 dias) ----
  try {
    const obtained = settings.token_obtained_at
      ? new Date(settings.token_obtained_at).getTime()
      : 0;
    const expires = settings.token_expires_at
      ? new Date(settings.token_expires_at).getTime()
      : 0;
    const oldEnough = Date.now() - obtained > 24 * 3600 * 1000;
    const expiringSoon = expires > 0 && expires - Date.now() < 10 * 24 * 3600 * 1000;
    if (oldEnough && expiringSoon) {
      const r = await refreshLongLivedToken(accessToken);
      await client
        .from("ig_settings")
        .update({
          access_token: r.access_token,
          token_obtained_at: new Date().toISOString(),
          token_expires_at: new Date(Date.now() + r.expires_in * 1000).toISOString(),
        })
        .eq("id", 1);
      accessToken = r.access_token;
      await logEvent(client, "info", "token_renovado", { expira_em_s: r.expires_in });
    }
  } catch (e) {
    await logEvent(client, "warn", "falha_renovar_token", {
      erro: e instanceof Error ? e.message : String(e),
    });
  }

  // ---- Teto de envios por hora ----
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count: sentLastHour } = await client
    .from("send_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", oneHourAgo);
  const cap = settings.hourly_cap ?? 60;
  const remaining = Math.max(0, cap - (sentLastHour ?? 0));
  if (remaining === 0) {
    return NextResponse.json({ ok: true, skipped: "teto_por_hora_atingido", cap });
  }

  // ---- Pega um lote da fila (atômico, sem corrida entre execuções) ----
  const batchSize = Math.min(MAX_PER_RUN, remaining);
  const { data: batch, error: claimErr } = await client.rpc("claim_queue_batch", {
    batch_size: batchSize,
  });
  if (claimErr) {
    await logEvent(client, "error", "falha_pegar_lote", { erro: claimErr.message });
    return NextResponse.json({ ok: false, error: claimErr.message }, { status: 500 });
  }

  const items = (batch ?? []) as QueueItem[];
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    const p = item.payload;
    try {
      if (item.kind === "private_reply" && item.comment_id) {
        // Primeiro toque: resposta privada ao comentário (fura a janela de 24h).
        await sendPrivateReply(
          accessToken,
          item.comment_id,
          buildText(p, false)
        );
      } else if (item.recipient_igsid) {
        if (p.link_url && p.button_text) {
          try {
            await sendDmButton(
              accessToken,
              item.recipient_igsid,
              buildText(p, true),
              p.button_text,
              p.link_url
            );
          } catch {
            await sendDmText(
              accessToken,
              item.recipient_igsid,
              buildText(p, false)
            );
          }
        } else {
          await sendDmText(
            accessToken,
            item.recipient_igsid,
            buildText(p, false)
          );
        }
      } else {
        throw new Error("item da fila sem destinatário");
      }

      await client
        .from("send_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", item.id);
      sent++;
      await logEvent(client, "info", "mensagem_enviada", {
        kind: item.kind,
        para: p.username ?? item.recipient_igsid,
        queue_id: item.id,
      });
    } catch (e) {
      const attempts = item.attempts + 1;
      const isFinal = attempts >= MAX_ATTEMPTS;
      const msg =
        e instanceof IgApiError
          ? JSON.stringify(e.body).slice(0, 500)
          : e instanceof Error
            ? e.message
            : String(e);
      await client
        .from("send_queue")
        .update({
          status: isFinal ? "failed" : "pending",
          attempts,
          last_error: msg,
        })
        .eq("id", item.id);
      failed++;
      await logEvent(client, isFinal ? "error" : "warn", "falha_envio", {
        queue_id: item.id,
        tentativa: attempts,
        erro: msg,
      });
    }
  }

  return NextResponse.json({ ok: true, processed: items.length, sent, failed });
}
