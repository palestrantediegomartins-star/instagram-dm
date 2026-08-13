/** Normaliza texto pra comparação de palavra-chave: minúsculas, sem acentos, sem espaços nas pontas. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Verifica se o texto casa com alguma das palavras-chave.
 * - "exact": o texto inteiro (normalizado) é igual à palavra-chave.
 * - "contains": o texto contém a palavra-chave.
 */
export function matchesKeywords(
  text: string,
  keywords: string[],
  mode: "exact" | "contains"
): boolean {
  const t = norm(text);
  if (!t) return false;
  return keywords.some((k) => {
    const nk = norm(k);
    if (!nk) return false;
    return mode === "exact" ? t === nk : t.includes(nk);
  });
}
