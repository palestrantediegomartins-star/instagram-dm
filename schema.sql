-- ============================================================
-- Automação de DM do Instagram — schema do banco (Supabase)
-- Cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- ============================================================

-- Configuração e token da conta conectada (linha única, id = 1)
create table if not exists ig_settings (
  id int primary key default 1 check (id = 1),
  ig_user_id text,
  username text,
  access_token text,
  token_obtained_at timestamptz,
  token_expires_at timestamptz,
  hourly_cap int not null default 60,
  updated_at timestamptz default now()
);

insert into ig_settings (id) values (1) on conflict (id) do nothing;

-- Automações: palavra-chave -> mensagem com link
create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  keywords text[] not null,
  match_mode text not null default 'contains' check (match_mode in ('contains','exact')),
  message_text text not null,
  link_url text,
  button_text text,
  media_id text,
  reply_to_comments boolean not null default true,
  reply_to_dms boolean not null default true,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pessoas que já interagiram
create table if not exists contacts (
  igsid text primary key,
  username text,
  first_seen timestamptz default now(),
  last_interaction timestamptz default now()
);

-- Fila de envio, com trava anti-duplicata única no banco (dedupe_key)
create table if not exists send_queue (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('private_reply','dm')),
  automation_id uuid references automations(id) on delete set null,
  recipient_igsid text,
  comment_id text,
  dedupe_key text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz default now(),
  processing_at timestamptz,
  sent_at timestamptz
);

create unique index if not exists send_queue_dedupe on send_queue (dedupe_key);
create index if not exists send_queue_status_idx on send_queue (status, created_at);
create index if not exists send_queue_sent_at_idx on send_queue (sent_at) where status = 'sent';

-- Log de tudo que acontece
create table if not exists event_log (
  id bigint generated always as identity primary key,
  at timestamptz default now(),
  level text not null default 'info',
  event text not null,
  detail jsonb
);

create index if not exists event_log_at_idx on event_log (at desc);

-- Função que pega um lote da fila de forma atômica (sem corrida)
create or replace function claim_queue_batch(batch_size int)
returns setof send_queue
language sql
as $$
  update send_queue
  set status = 'processing', processing_at = now()
  where id in (
    select id from send_queue
    where status = 'pending'
    order by created_at
    limit batch_size
    for update skip locked
  )
  returning *;
$$;

-- Itens presos em 'processing' há mais de 10 min voltam pra fila
create or replace function requeue_stuck_items()
returns void
language sql
as $$
  update send_queue
  set status = 'pending'
  where status = 'processing'
    and processing_at < now() - interval '10 minutes'
    and sent_at is null;
$$;

-- Segurança: liga RLS em tudo (o app usa a service key, que passa por cima;
-- ninguém mais consegue ler nada)
alter table ig_settings enable row level security;
alter table automations enable row level security;
alter table contacts enable row level security;
alter table send_queue enable row level security;
alter table event_log enable row level security;
