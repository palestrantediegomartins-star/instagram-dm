import { NextRequest, NextResponse } from "next/server";
import { createStateValue } from "@/lib/session";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
].join(",");

/** Inicia o fluxo "Conectar Instagram" (protegido pelo middleware do painel). */
export async function GET(_req: NextRequest) {
  const state = await createStateValue(env("SESSION_SECRET"));
  const redirectUri = `${env("APP_URL")}/api/auth/instagram/callback`;
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", env("META_APP_ID"));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  return NextResponse.redirect(url.toString());
}
