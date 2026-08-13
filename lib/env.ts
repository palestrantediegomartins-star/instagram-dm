/** Leitura de variáveis de ambiente, sempre em tempo de execução (nunca no build). */
export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}
