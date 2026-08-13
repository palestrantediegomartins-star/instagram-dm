/**
 * Chamadas à API "Instagram com Login do Instagram" (graph.instagram.com v25.0).
 * Sem página do Facebook: o token é da própria conta profissional do Instagram.
 */
const GRAPH = "https://graph.instagram.com/v25.0";

export class IgApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`Instagram API ${status}: ${JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
  }
}

async function igPost(path: string, token: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new IgApiError(res.status, json);
  return json;
}

async function igGet(path: string, token: string): Promise<Record<string, unknown>> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${path}${sep}access_token=${encodeURIComponent(token)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new IgApiError(res.status, json);
  return json as Record<string, unknown>;
}

/** Resposta privada a um comentário (primeiro toque — fura a janela de 24h). */
export async function sendPrivateReply(
  token: string,
  commentId: string,
  text: string
): Promise<unknown> {
  return igPost(`/me/messages`, token, {
    recipient: { comment_id: commentId },
    message: { text },
  });
}

/** DM de texto simples. */
export async function sendDmText(
  token: string,
  igsid: string,
  text: string
): Promise<unknown> {
  return igPost(`/me/messages`, token, {
    recipient: { id: igsid },
    message: { text },
  });
}

/** DM com botão de link (template de botão). */
export async function sendDmButton(
  token: string,
  igsid: string,
  text: string,
  buttonTitle: string,
  url: string
): Promise<unknown> {
  return igPost(`/me/messages`, token, {
    recipient: { id: igsid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons: [{ type: "web_url", url, title: buttonTitle.slice(0, 20) }],
        },
      },
    },
  });
}

/** Assina os webhooks de comentários e mensagens pra conta conectada. */
export async function subscribeWebhooks(token: string): Promise<unknown> {
  const res = await fetch(
    `${GRAPH}/me/subscribed_apps?subscribed_fields=comments,messages&access_token=${encodeURIComponent(token)}`,
    { method: "POST" }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new IgApiError(res.status, json);
  return json;
}

/** Perfil da conta conectada. */
export async function getProfile(
  token: string
): Promise<{ id?: string; user_id?: string; username?: string }> {
  return (await igGet(`/me?fields=id,user_id,username`, token)) as {
    id?: string;
    user_id?: string;
    username?: string;
  };
}

/** Troca o código do OAuth por um token de curta duração. */
export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<{ access_token: string; user_id: string | number }> {
  const form = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: params.redirectUri,
    code: params.code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new IgApiError(res.status, json);
  return json as { access_token: string; user_id: string | number };
}

/** Troca o token curto por um de longa duração (~60 dias). */
export async function exchangeForLongLivedToken(
  clientSecret: string,
  shortToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(shortToken)}`
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new IgApiError(res.status, json);
  return json as { access_token: string; expires_in: number };
}

/** Renova um token de longa duração (precisa ter mais de 24h de vida). */
export async function refreshLongLivedToken(
  token: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new IgApiError(res.status, json);
  return json as { access_token: string; expires_in: number };
}
