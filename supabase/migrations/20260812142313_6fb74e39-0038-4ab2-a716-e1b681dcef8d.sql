ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS product text NOT NULL DEFAULT 'payments';

DO $$ BEGIN
  ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_product_check CHECK (product IN ('payments','messaging'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.sms_ensure_wallet_svc(_business_id uuid, _mode text)
RETURNS public.sms_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_wallet public.sms_wallets;
  v_bonus numeric;
BEGIN
  SELECT user_id INTO v_owner FROM public.businesses WHERE id = _business_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'business not found';
  END IF;
  IF _mode NOT IN ('test','live') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;

  SELECT * INTO v_wallet FROM public.sms_wallets WHERE business_id = _business_id AND mode = _mode;
  IF FOUND THEN
    RETURN v_wallet;
  END IF;

  SELECT round(50 * unit_rate, 4) INTO v_bonus FROM public.sms_rates WHERE channel = 'sms';
  v_bonus := coalesce(v_bonus, 0);

  INSERT INTO public.sms_wallets (business_id, user_id, mode, balance, trial_granted)
  VALUES (_business_id, v_owner, _mode, v_bonus, true)
  ON CONFLICT (business_id, mode) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_wallet;

  IF v_bonus > 0 THEN
    INSERT INTO public.sms_wallet_ledger (business_id, user_id, mode, entry_type, channel, amount, balance_after, description)
    VALUES (_business_id, v_owner, _mode, 'bonus', 'sms', v_bonus, v_wallet.balance, '50 free trial SMS credits');
  END IF;

  RETURN v_wallet;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sms_wallet_entry_svc(_business_id uuid, _mode text, _entry_type text, _amount numeric, _channel text DEFAULT NULL::text, _description text DEFAULT NULL::text, _reference text DEFAULT NULL::text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_balance numeric;
  v_delta numeric;
BEGIN
  SELECT user_id INTO v_owner FROM public.businesses WHERE id = _business_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'business not found';
  END IF;
  IF _entry_type NOT IN ('topup','charge','refund','bonus') THEN
    RAISE EXCEPTION 'invalid entry type';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;
  IF _entry_type = 'topup' AND _amount > 100000 THEN
    RAISE EXCEPTION 'top-up amount too large';
  END IF;

  PERFORM public.sms_ensure_wallet_svc(_business_id, _mode);

  v_delta := CASE WHEN _entry_type = 'charge' THEN -_amount ELSE _amount END;

  UPDATE public.sms_wallets
    SET balance = balance + v_delta, updated_at = now()
    WHERE business_id = _business_id AND mode = _mode
    RETURNING balance INTO v_balance;

  IF v_balance < 0 THEN
    RAISE EXCEPTION 'insufficient messaging credits';
  END IF;

  INSERT INTO public.sms_wallet_ledger (business_id, user_id, mode, entry_type, channel, amount, balance_after, description, reference)
  VALUES (_business_id, v_owner, _mode, _entry_type, _channel, _amount, v_balance, _description, _reference);

  RETURN v_balance;
END;
$function$;

REVOKE ALL ON FUNCTION public.sms_ensure_wallet_svc(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sms_wallet_entry_svc(uuid, text, text, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sms_ensure_wallet_svc(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.sms_wallet_entry_svc(uuid, text, text, numeric, text, text, text) TO service_role;