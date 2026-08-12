CREATE TABLE public.sms_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'live',
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  network text NOT NULL,
  msisdn text NOT NULL,
  gateway text NOT NULL DEFAULT 'liberte',
  reference text NOT NULL UNIQUE,
  provider_reference text,
  status text NOT NULL DEFAULT 'pending',
  provider_code text,
  provider_reason text,
  credited_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_topups TO authenticated;
GRANT ALL ON public.sms_topups TO service_role;

ALTER TABLE public.sms_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view topups"
  ON public.sms_topups FOR SELECT TO authenticated
  USING (public.is_business_member(business_id) OR public.is_staff());

CREATE TRIGGER trg_sms_topups_updated
BEFORE UPDATE ON public.sms_topups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sms_topups_business ON public.sms_topups (business_id, created_at DESC);

-- Browser-callable wallet function may no longer mint credits.
CREATE OR REPLACE FUNCTION public.sms_wallet_entry(_business_id uuid, _mode text, _entry_type text, _amount numeric, _channel text DEFAULT NULL::text, _description text DEFAULT NULL::text, _reference text DEFAULT NULL::text)
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
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized for this business';
  END IF;
  IF _entry_type <> 'charge' THEN
    RAISE EXCEPTION 'credits can only be added by a confirmed payment';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'amount must be positive';
  END IF;

  PERFORM public.sms_ensure_wallet(_business_id, _mode);

  v_delta := -_amount;

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