import { NextRequest, NextResponse } from "next/server";
import { verifyStateValue } from "@/lib/session";
import {
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getProfile,
  subscribeWebhooks,
} from "@/lib/ig";
import { db, logEvent } from "@/lib/supabase";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function backToPanel(param: string): NextResponse {
  return NextResponse.redirect(`${env("APP_URL")}/?${param}`);
}

/** Volta do OAuth: troca o código por token, salva e assina o webhook. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const state = sp.get("state");

  if (!(await verifyStateValue(state ?? undefined, env("SESSION_SECRET")))) {
    return backToPanel("erro=estado_invalido");
  }
  if (!code) {
    return backToPanel(`erro=${encodeURIComponent(sp.get("error_description") ?? "sem_codigo")}`);
  }

  const client = db();
  try {
    const redirectUri = `${env("APP_URL")}/api/auth/instagram/callback`;
    const short = await exchangeCodeForToken({
      clientId: env("META_APP_ID"),
      clientSecret: env("META_APP_SECRET"),
      redirectUri,
      code,
    });
    const long = await exchangeForLongLivedToken(
      env("META_APP_SECRET"),
      short.access_token
    );
    const profile = await getProfile(long.access_token);
    const igUserId = String(profile.user_id ?? profile.id ?? short.user_id);

    await client.from("ig_settings").upsert(
      {
        id: 1,
        ig_user_id: igUserId,
        username: profile.username ?? null,
        access_token: long.access_token,
        token_obtained_at: new Date().toISOString(),
        token_expires_at: new Date(Date.now() + long.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    await subscribeWebhooks(long.access_token);
    await logEvent(client, "info", "instagram_conectado", {
      username: profile.username,
      ig_user_id: igUserId,
    });
    return backToPanel("conectado=1");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logEvent(client, "error", "falha_conectar_instagram", { erro: msg });
    return backToPanel(`erro=${encodeURIComponent(msg.slice(0, 200))}`);
  }
}
