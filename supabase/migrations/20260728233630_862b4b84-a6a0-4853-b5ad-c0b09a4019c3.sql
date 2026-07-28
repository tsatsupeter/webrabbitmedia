-- 1. Ensure pg_net is available for outbound HTTP from triggers.
create extension if not exists pg_net with schema extensions;

-- 2. Helper: fire-and-forget POST to the send-email edge function.
create or replace function public.enqueue_email(
  _event text,
  _user_id uuid,
  _business_id uuid,
  _data jsonb
) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_url text := 'https://eydjkasswyygiycitnml.supabase.co/functions/v1/send-email';
  v_secret text;
begin
  -- Shared secret is provided via a project-level GUC set from the vault
  -- (see set_config below). Skip send if unset — the edge function also
  -- guards on the secret, so silent no-op is safe.
  begin
    v_secret := current_setting('app.email_hook_secret', true);
  exception when others then
    v_secret := null;
  end;
  if v_secret is null or v_secret = '' then
    raise log 'enqueue_email skipped: app.email_hook_secret not configured';
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

revoke all on function public.enqueue_email(text, uuid, uuid, jsonb) from public;

-- 3. Transactions: fire on pending -> approved/failed for collections.
create or replace function public.email_on_transaction_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.type <> 'collection' then
    return new;
  end if;
  if old.status is not distinct from new.status then
    return new;
  end if;
  if new.status = 'approved' then
    perform public.enqueue_email(
      'payment_received', new.user_id, new.business_id,
      to_jsonb(new)
    );
  elsif new.status = 'failed' then
    perform public.enqueue_email(
      'payment_failed', new.user_id, new.business_id,
      to_jsonb(new)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_email_transaction_status on public.transactions;
create trigger trg_email_transaction_status
after update of status on public.transactions
for each row execute function public.email_on_transaction_status();

-- 4. Payouts: fire on pending -> success/failed.
create or replace function public.email_on_payout_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_dest text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;
  if new.status not in ('success','failed') then
    return new;
  end if;

  select coalesce(bv.bank_name || ' ••' || right(bv.account_number, 4), new.payment_method)
    into v_dest
  from public.bank_verification bv
  where bv.id = new.bank_id;

  if new.status = 'success' then
    perform public.enqueue_email(
      'payout_completed', new.user_id, new.business_id,
      to_jsonb(new) || jsonb_build_object('destination', coalesce(v_dest, new.payment_method))
    );
  else
    perform public.enqueue_email(
      'payout_failed', new.user_id, new.business_id,
      to_jsonb(new) || jsonb_build_object('destination', coalesce(v_dest, new.payment_method))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_email_payout_status on public.payouts;
create trigger trg_email_payout_status
after update of status on public.payouts
for each row execute function public.email_on_payout_status();

-- 5. Businesses: fire on non-approved -> approved.
create or replace function public.email_on_business_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status and new.status = 'approved' then
    perform public.enqueue_email(
      'business_approved', new.user_id, new.id,
      jsonb_build_object('business_name', new.name)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_email_business_approved on public.businesses;
create trigger trg_email_business_approved
after update of status on public.businesses
for each row execute function public.email_on_business_approved();

-- 6. Verification submissions: draft -> submitted across four tables.
create or replace function public.email_on_verification_submitted()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_step text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;
  if new.status <> 'submitted' then
    return new;
  end if;

  v_step := case tg_table_name
    when 'product_information'   then 'product information'
    when 'identity_verification' then 'identity verification'
    when 'business_verification' then 'business verification'
    when 'bank_verification'     then 'bank verification'
    else tg_table_name
  end;

  perform public.enqueue_email(
    'verification_submitted', new.user_id, new.business_id,
    jsonb_build_object(
      'step', v_step,
      'submitted_at', coalesce(new.submitted_at, now())
    )
  );
  return new;
end;
$$;

drop trigger if exists trg_email_product_information_submitted on public.product_information;
create trigger trg_email_product_information_submitted
after update of status on public.product_information
for each row execute function public.email_on_verification_submitted();

drop trigger if exists trg_email_identity_verification_submitted on public.identity_verification;
create trigger trg_email_identity_verification_submitted
after update of status on public.identity_verification
for each row execute function public.email_on_verification_submitted();

drop trigger if exists trg_email_business_verification_submitted on public.business_verification;
create trigger trg_email_business_verification_submitted
after update of status on public.business_verification
for each row execute function public.email_on_verification_submitted();

drop trigger if exists trg_email_bank_verification_submitted on public.bank_verification;
create trigger trg_email_bank_verification_submitted
after update of status on public.bank_verification
for each row execute function public.email_on_verification_submitted();
