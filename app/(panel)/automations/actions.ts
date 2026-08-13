"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, logEvent } from "@/lib/supabase";

function parseForm(formData: FormData) {
  const keywords = String(formData.get("keywords") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const linkUrl = String(formData.get("link_url") ?? "").trim();
  const buttonText = String(formData.get("button_text") ?? "").trim();
  const mediaId = String(formData.get("media_id") ?? "").trim();
  return {
    name: String(formData.get("name") ?? "").trim() || "Sem nome",
    keywords,
    match_mode:
      String(formData.get("match_mode")) === "exact" ? "exact" : "contains",
    message_text: String(formData.get("message_text") ?? "").trim(),
    link_url: linkUrl || null,
    button_text: buttonText || null,
    media_id: mediaId || null,
    reply_to_comments: formData.get("reply_to_comments") === "on",
    reply_to_dms: formData.get("reply_to_dms") === "on",
    active: formData.get("active") === "on",
    updated_at: new Date().toISOString(),
  };
}

export async function createAutomation(formData: FormData): Promise<void> {
  const values = parseForm(formData);
  if (values.keywords.length === 0 || !values.message_text) {
    redirect("/automations/new?erro=preencha");
  }
  const client = db();
  const { error } = await client.from("automations").insert(values);
  if (error) redirect(`/automations/new?erro=${encodeURIComponent(error.message)}`);
  await logEvent(client, "info", "automacao_criada", { name: values.name });
  revalidatePath("/automations");
  redirect("/automations");
}

export async function updateAutomation(
  id: string,
  formData: FormData
): Promise<void> {
  const values = parseForm(formData);
  const client = db();
  const { error } = await client.from("automations").update(values).eq("id", id);
  if (error)
    redirect(`/automations/${id}?erro=${encodeURIComponent(error.message)}`);
  await logEvent(client, "info", "automacao_atualizada", { name: values.name });
  revalidatePath("/automations");
  redirect("/automations");
}

export async function deleteAutomation(id: string): Promise<void> {
  const client = db();
  await client.from("automations").delete().eq("id", id);
  await logEvent(client, "warn", "automacao_excluida", { id });
  revalidatePath("/automations");
  redirect("/automations");
}

export async function toggleAutomation(id: string, active: boolean): Promise<void> {
  await db().from("automations").update({ active }).eq("id", id);
  revalidatePath("/automations");
}
