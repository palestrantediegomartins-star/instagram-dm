import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db, getSettings, logEvent, Automation } from "@/lib/supabase";
import { matchesKeywords } from "@/lib/normalize";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: verificação do webhook pela Meta (hub.challenge). */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");
  if (mode === "subscribe" && token === env("WEBHOOK_VERIFY_TOKEN") && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function validSignature(rawBody: string, header: string | null): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = crypto
    .createHmac("sha256", env("META_APP_SECRET"))
    .update(rawBody, "utf8")
    .digest("hex");
  const received = header.slice("sha256=".length);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(received, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

type CommentValue = {
  id?: string;
  text?: string;
  from?: { id?: string; username?: string };
  media?: { id?: string; media_product_type?: string };
  parent_id?: string;
};

type MessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { mid?: string; text?: string; is_echo?: boolean };
};

/** POST: eventos de comentários e mensagens. Responde 200 rápido, sempre. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{ field?: string; value?: CommentValue }>;
      messaging?: MessagingEvent[];
    }>;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  if (body.object !== "instagram" || !Array.isArray(body.entry)) {
    return NextResponse.json({ ok: true });
  }

  const client = db();
  try {
    const settings = await getSettings(client);
    const ownIds = new Set(
      [settings?.ig_user_id].filter((x): x is string => Boolean(x))
    );

    const { data: autos } = await client
      .from("automations")
      .select("*")
      .eq("active", true);
    const automations = (autos ?? []) as Automation[];

    for (const entry of body.entry) {
      if (entry.id) ownIds.add(entry.id);

      // ---- Comentários em posts/reels ----
      for (const change of entry.changes ?? []) {
        if (change.field !== "comments" || !change.value) continue;
        const v = change.value;
        const fromId = v.from?.id;
        const text = v.text ?? "";
        if (!v.id || !fromId || !text) continue;
        if (ownIds.has(fromId)) continue; // comentário da própria conta

        for (const a of automations) {
          if (!a.reply_to_comments) continue;
          if (a.media_id && a.media_id !== v.media?.id) continue;
          if (!matchesKeywords(text, a.keywords, a.match_mode)) continue;

          await client.from("contacts").upsert(
            {
              igsid: fromId,
              username: v.from?.username ?? null,
              last_interaction: new Date().toISOString(),
            },
            { onConflict: "igsid" }
          );

          // Anti-duplicata: 1 resposta por pessoa, por automação, por post.
          const dedupe = `pr:${a.id}:${fromId}:${v.media?.id ?? "any"}`;
          const { data: inserted } = await client
            .from("send_queue")
            .upsert(
              {
                kind: "private_reply",
                automation_id: a.id,
                recipient_igsid: fromId,
                comment_id: v.id,
                dedupe_key: dedupe,
                payload: {
                  text: a.message_text,
                  link_url: a.link_url,
                  button_text: a.button_text,
                  username: v.from?.username ?? null,
                },
              },
              { onConflict: "dedupe_key", ignoreDuplicates: true }
            )
            .select("id");

          if (inserted && inserted.length > 0) {
            await logEvent(client, "info", "comentario_enfileirado", {
              automation: a.name,
              comment_id: v.id,
              de: v.from?.username,
              texto: text.slice(0, 120),
            });
          }
          break; // uma automação por comentário
        }
      }

      // ---- Mensagens diretas recebidas ----
      for (const m of entry.messaging ?? []) {
        const senderId = m.sender?.id;
        const text = m.message?.text ?? "";
        if (!senderId || !text) continue;
        if (m.message?.is_echo) continue; // mensagem enviada por nós
        if (ownIds.has(senderId)) continue;

        for (const a of automations) {
          if (!a.reply_to_dms) continue;
          if (!matchesKeywords(text, a.keywords, a.match_mode)) continue;

          await client.from("contacts").upsert(
            { igsid: senderId, last_interaction: new Date().toISOString() },
            { onConflict: "igsid" }
          );

          // Anti-duplicata: 1 resposta por pessoa, por automação, por dia.
          const day = new Date().toISOString().slice(0, 10);
          const dedupe = `dm:${a.id}:${senderId}:${day}`;
          const { data: inserted } = await client
            .from("send_queue")
            .upsert(
              {
                kind: "dm",
                automation_id: a.id,
                recipient_igsid: senderId,
                dedupe_key: dedupe,
                payload: {
                  text: a.message_text,
                  link_url: a.link_url,
                  button_text: a.button_text,
                },
              },
              { onConflict: "dedupe_key", ignoreDuplicates: true }
            )
            .select("id");

          if (inserted && inserted.length > 0) {
            await logEvent(client, "info", "dm_enfileirada", {
              automation: a.name,
              de: senderId,
              texto: text.slice(0, 120),
            });
          }
          break;
        }
      }
    }
  } catch (e) {
    await logEvent(db(), "error", "webhook_erro", {
      erro: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json({ ok: true });
}
