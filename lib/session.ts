/**
 * Sessão do painel: cookie assinado com HMAC-SHA256 (Web Crypto, funciona em
 * Node e no Edge/middleware — sem Buffer). Valor: "<expiraEmMs>.<assinaturaBase64url>".
 */
const COOKIE_NAME = "panel_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const b64 =
    s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(secret: string, payload: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(sig);
}

async function verifyPayload(
  secret: string,
  payload: string,
  sigB64: string
): Promise<boolean> {
  try {
    const key = await hmacKey(secret);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromB64url(sigB64),
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

function parseValue(value: string | undefined): { exp: string; sig: string } | null {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return null;
  return { exp, sig };
}

export async function createSessionValue(secret: string): Promise<string> {
  const exp = Date.now() + THIRTY_DAYS_MS;
  return `${exp}.${await signPayload(secret, `panel:${exp}`)}`;
}

export async function verifySessionValue(
  value: string | undefined,
  secret: string
): Promise<boolean> {
  const parsed = parseValue(value);
  if (!parsed) return false;
  return verifyPayload(secret, `panel:${parsed.exp}`, parsed.sig);
}

/** "state" temporário do OAuth (válido por 10 minutos). */
export async function createStateValue(secret: string): Promise<string> {
  const exp = Date.now() + 10 * 60 * 1000;
  return `${exp}.${await signPayload(secret, `state:${exp}`)}`;
}

export async function verifyStateValue(
  value: string | undefined,
  secret: string
): Promise<boolean> {
  const parsed = parseValue(value);
  if (!parsed) return false;
  return verifyPayload(secret, `state:${parsed.exp}`, parsed.sig);
}

export const SESSION_COOKIE = COOKIE_NAME;
