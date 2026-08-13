import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Cliente Supabase com a service_role key — USO EXCLUSIVO NO SERVIDOR.
 * Nunca importar em componentes client.
 */
export function db(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Settings = {
  id: number;
  ig_user_id: string | null;
  username: string | null;
  access_token: string | null;
  token_obtained_at: string | null;
  token_expires_at: string | null;
  hourly_cap: number;
};

export type Automation = {
  id: string;
  name: string;
  keywords: string[];
  match_mode: "exact" | "contains";
  message_text: string;
  link_url: string | null;
  button_text: string | null;
  media_id: string | null;
  reply_to_comments: boolean;
  reply_to_dms: boolean;
  active: boolean;
  created_at: string;
};

export type QueueItem = {
  id: number;
  kind: "private_reply" | "dm";
  automation_id: string | null;
  recipient_igsid: string | null;
  comment_id: string | null;
  dedupe_key: string;
  payload: {
    text: string;
    link_url?: string | null;
    button_text?: string | null;
    username?: string | null;
  };
  status: string;
  attempts: number;
};

export async function getSettings(client?: SupabaseClient): Promise<Settings | null> {
  const c = client ?? db();
  const { data, error } = await c
    .from("ig_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data as Settings | null;
}

export async function logEvent(
  client: SupabaseClient,
  level: "info" | "warn" | "error",
  event: string,
  detail?: unknown
): Promise<void> {
  try {
    await client.from("event_log").insert({ level, event, detail: detail ?? null });
  } catch {
    // log nunca deve derrubar o fluxo principal
  }
}
