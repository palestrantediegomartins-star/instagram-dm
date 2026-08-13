"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionValue, SESSION_COOKIE } from "@/lib/session";
import { env } from "@/lib/env";
import crypto from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a, "utf8").digest();
  const hb = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const password = String(formData.get("password") ?? "");
  if (!password || !safeEqual(password, env("PANEL_PASSWORD"))) {
    return { error: "Senha incorreta. Tente de novo." };
  }
  const value = await createSessionValue(env("SESSION_SECRET"));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
