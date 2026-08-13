-- ============================================================
-- Agendamento (pg_cron + pg_net): drena a fila a cada minuto
-- ATENÇÃO: troque __APP_URL__ e __CRON_SECRET__ antes de rodar.
-- (Eu, Claude, vou te entregar este arquivo já preenchido.)
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove agendamentos antigos com o mesmo nome (se existirem)
select cron.unschedule(jobid) from cron.job where jobname in ('drain-dm-queue','requeue-stuck');

-- A cada minuto: chama o app pra enviar o próximo lote de DMs
select cron.schedule(
  'drain-dm-queue',
  '* * * * *',
  $$
  select net.http_post(
    url := '__APP_URL__/api/queue/drain',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer __CRON_SECRET__"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- A cada 10 minutos: devolve pra fila itens travados
select cron.schedule(
  'requeue-stuck',
  '*/10 * * * *',
  $$ select requeue_stuck_items(); $$
);
