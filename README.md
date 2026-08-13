# Automação de DM do Instagram

Quando alguém comenta uma palavra-chave num post ou reels (ou manda ela por DM),
a pessoa recebe automaticamente uma mensagem direta com o seu link. Substituto
do ManyChat, sem mensalidade.

## Como funciona

1. A Meta avisa o app (webhook) quando chega um comentário ou DM.
2. O app confere a assinatura, compara com as palavras-chave das automações
   e coloca a resposta numa fila no banco (com trava anti-duplicata).
3. A cada minuto, o `pg_cron` do Supabase chama `/api/queue/drain`, que envia
   as mensagens respeitando um teto por hora (proteção da conta).
4. O primeiro toque em quem comentou é uma **resposta privada ao comentário**,
   que a Meta permite fora da janela de 24h.

## Stack

- Next.js (App Router, TypeScript) + Tailwind, na Vercel
- Supabase (Postgres + pg_cron + pg_net)
- API "Instagram com Login do Instagram" (`graph.instagram.com` v25.0)

## Variáveis de ambiente

Veja `.env.example`.

## Banco

Rode `supabase/schema.sql` e depois `supabase/cron.sql` (com URL e segredo
preenchidos) no SQL Editor do Supabase.
