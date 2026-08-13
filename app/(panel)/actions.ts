"use server";

import { revalidatePath } from "next/cache";
import { db, logEvent } from "@/lib/supabase";

export async function updateHourlyCap(formData: FormData): Promise<void> {
  const cap = Math.max(1, Math.min(200, Number(formData.get("hourly_cap") ?? 60)));
  const client = db();
  await client
    .from("ig_settings")
    .upsert({ id: 1, hourly_cap: cap, updated_at: new Date().toISOString() }, { onConflict: "id" });
  await logEvent(client, "info", "teto_por_hora_atualizado", { cap });
  revalidatePath("/");
}

export async function disconnectInstagram(): Promise<void> {
  const client = db();
  await client
    .from("ig_settings")
    .update({
      access_token: null,
      token_obtained_at: null,
      token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  await logEvent(client, "warn", "instagram_desconectado", {});
  revalidatePath("/");
}
