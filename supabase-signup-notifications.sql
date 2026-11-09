-- Solo backend: eseguire nel SQL Editor di Supabase, mai nell'hosting statico.
-- Il servizio resta disattivato finche il mittente Brevo non e verificato
-- e la chiave API non e salvata in Vault come campetto_brevo_api_key.
begin;
create extension if not exists http with schema extensions;
create extension if not exists pg_cron;
create schema if not exists campetto_private;
revoke all on schema campetto_private from public, anon, authenticated;

create table if not exists campetto_private.email_settings (
  singleton boolean primary key default true check (singleton),
  enabled boolean not null default false,
  recipient text not null,
  sender_email text not null,
  sender_name text not null default 'Campetto'
);
insert into campetto_private.email_settings (recipient, sender_email)
values ('jmt23@hotmail.it', 'jesustavarez2009@gmail.com')
on conflict (singleton) do nothing;

create table if not exists campetto_private.signup_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  confirmed_at timestamptz not null,
  queued_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  status text not null default 'queued' check (status in ('queued','accepted','review')),
  accepted_at timestamptz,
  last_http_status integer
);
alter table campetto_private.email_settings enable row level security;
alter table campetto_private.signup_notifications enable row level security;
revoke all on all tables in schema campetto_private from public, anon, authenticated;

create or replace function campetto_private.queue_signup_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is not null and new.email_confirmed_at is not null then
    if tg_op = 'INSERT' then
      insert into campetto_private.signup_notifications (user_id,email,confirmed_at)
      values (new.id,new.email,new.email_confirmed_at) on conflict (user_id) do nothing;
    elsif old.email_confirmed_at is null then
      insert into campetto_private.signup_notifications (user_id,email,confirmed_at)
      values (new.id,new.email,new.email_confirmed_at) on conflict (user_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function campetto_private.queue_signup_notification() from public, anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='campetto_new_confirmed_user' and tgrelid='auth.users'::regclass) then
    create trigger campetto_new_confirmed_user after insert or update of email_confirmed_at
    on auth.users for each row execute function campetto_private.queue_signup_notification();
  end if;
end $$;

-- L'HTTP sincrono gira nel job, fuori dalla registrazione: nessuna chiave
-- resta nelle code di pg_net. Destinatario e URL non arrivano dal browser.
create or replace function campetto_private.send_signup_notifications()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  cfg campetto_private.email_settings%rowtype;
  item campetto_private.signup_notifications%rowtype;
  api_key text;
  result extensions.http_response;
  response_json jsonb;
  sent_count integer := 0;
begin
  if not pg_try_advisory_xact_lock(474031, 1) then return 0; end if;
  select * into cfg from campetto_private.email_settings where singleton;
  if not found or not cfg.enabled then return 0; end if;
  select decrypted_secret into api_key from vault.decrypted_secrets
    where name='campetto_brevo_api_key' limit 1;
  if coalesce(api_key,'')='' then return 0; end if;
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '5000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '2000');
  for item in select * from campetto_private.signup_notifications
    where status='queued' and next_attempt_at<=now()
    order by queued_at limit 5 for update skip locked
  loop
    -- Brevo protegge dagli invii duplicati per 30 minuti. I tentativi
    -- ambigui piu vecchi restano da controllare, senza reinvio automatico.
    if item.attempts>=4 or item.first_attempt_at<now()-interval '25 minutes' then
      update campetto_private.signup_notifications set status='review' where id=item.id;
      continue;
    end if;
    update campetto_private.signup_notifications set attempts=attempts+1,
      first_attempt_at=coalesce(first_attempt_at,now()), next_attempt_at=now()+interval '2 minutes'
      where id=item.id;
    begin
      select * into result from extensions.http(row(
        'POST','https://api.brevo.com/v3/smtp/email',
        array[extensions.http_header('api-key',api_key),extensions.http_header('Accept','application/json')],
        'application/json',jsonb_build_object(
          'sender',jsonb_build_object('email',cfg.sender_email,'name',cfg.sender_name),
          'to',jsonb_build_array(jsonb_build_object('email',cfg.recipient)),
          'headers',jsonb_build_object('idempotencyKey',item.id::text),
          'subject','Campetto: nuova iscrizione confermata',
          'textContent',format(E'Una persona ha confermato il proprio account Campetto.\n\nEmail: %s\nConferma: %s\n\nGestisci gli utenti nel pannello Supabase.',item.email,item.confirmed_at)
        )::text
      )::extensions.http_request);
      begin response_json:=result.content::jsonb; exception when others then response_json:='{}'::jsonb; end;
      if result.status between 200 and 299 or (response_json->>'code'='duplicate_parameter' and response_json->>'message' ilike '%idempotency%') then
        update campetto_private.signup_notifications set status='accepted',accepted_at=now(),last_http_status=result.status where id=item.id;
        sent_count:=sent_count+1;
      elsif result.status=429 or result.status>=500 then
        update campetto_private.signup_notifications set last_http_status=result.status where id=item.id;
      else
        update campetto_private.signup_notifications set status='review',last_http_status=result.status where id=item.id;
      end if;
    exception when others then
      -- Nessun messaggio di errore esterno viene registrato: potrebbe
      -- contenere dati del trasporto. Il job riprova entro la finestra sicura.
      null;
    end;
  end loop;
  perform extensions.http_reset_curlopt();
  return sent_count;
end;
$$;
revoke all on function campetto_private.send_signup_notifications() from public, anon, authenticated;
select cron.schedule('campetto-signup-notifications','*/2 * * * *','select campetto_private.send_signup_notifications();');
commit;
