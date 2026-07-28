-- Private schema for internal config the API roles must never see.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to service_role;

create table if not exists app_private.config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on app_private.config from public, anon, authenticated;
grant select, insert, update, delete on app_private.config to service_role;

-- Seed a random email-hook secret if one isn't already stored.
insert into app_private.config (key, value)
values ('email_hook_secret', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

-- Rewire enqueue_email to source the secret from the private table.
create or replace function public.enqueue_email(
  _event text,
  _user_id uuid,
  _business_id uuid,
  _data jsonb
) returns void
language plpgsql
security definer
set search_path = public, extensions, app_private
as $$
declare
  v_url text := 'https://eydjkasswyygiycitnml.supabase.co/functions/v1/send-email';
  v_secret text;
begin
  select value into v_secret from app_private.config where key = 'email_hook_secret';
  if v_secret is null or v_secret = '' then
    raise log 'enqueue_email skipped: no secret configured';
    return;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webrabbit-email-secret', v_secret
    ),
    body := jsonb_build_object(
      'event', _event,
      'user_id', _user_id,
      'business_id', _business_id,
      'data', coalesce(_data, '{}'::jsonb)
    )
  );
end;
$$;

-- Lock down execute on every email-related SECURITY DEFINER helper: only the
-- trigger owner (postgres) needs to call them, never end users.
revoke all on function public.enqueue_email(text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.email_on_transaction_status() from public, anon, authenticated;
revoke all on function public.email_on_payout_status() from public, anon, authenticated;
revoke all on function public.email_on_business_approved() from public, anon, authenticated;
revoke all on function public.email_on_verification_submitted() from public, anon, authenticated;

-- Expose a service-role-only reader the edge function can call over PostgREST.
create or replace function public.get_email_hook_secret()
returns text
language sql
security definer
set search_path = app_private
as $$
  select value from app_private.config where key = 'email_hook_secret';
$$;

revoke all on function public.get_email_hook_secret() from public, anon, authenticated;
grant execute on function public.get_email_hook_secret() to service_role;
