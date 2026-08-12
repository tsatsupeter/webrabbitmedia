-- 1. Triple the messaging rate card
UPDATE public.sms_rates SET unit_rate = 0.105, updated_at = now() WHERE channel = 'sms';
UPDATE public.sms_rates SET unit_rate = 0.135, updated_at = now() WHERE channel = 'otp';
UPDATE public.sms_rates SET unit_rate = 0.90,  updated_at = now() WHERE channel = 'voice';
UPDATE public.sms_rates SET unit_rate = 0.15,  updated_at = now() WHERE channel = 'ussd';

-- 2. Remove the 50 free trial credits from wallet creation
CREATE OR REPLACE FUNCTION public.sms_ensure_wallet(_business_id uuid, _mode text)
RETURNS public.sms_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_wallet public.sms_wallets;
BEGIN
  SELECT user_id INTO v_owner FROM public.businesses WHERE id = _business_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'business not found';
  END IF;
  IF NOT public.is_business_member(_business_id) THEN
    RAISE EXCEPTION 'not authorized for this business';
  END IF;
  IF _mode NOT IN ('test','live') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;

  SELECT * INTO v_wallet FROM public.sms_wallets WHERE business_id = _business_id AND mode = _mode;
  IF FOUND THEN
    RETURN v_wallet;
  END IF;

  INSERT INTO public.sms_wallets (business_id, user_id, mode, balance, trial_granted)
  VALUES (_business_id, v_owner, _mode, 0, false)
  ON CONFLICT (business_id, mode) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_wallet;

  RETURN v_wallet;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sms_ensure_wallet_svc(_business_id uuid, _mode text)
RETURNS public.sms_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_wallet public.sms_wallets;
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

  INSERT INTO public.sms_wallets (business_id, user_id, mode, balance, trial_granted)
  VALUES (_business_id, v_owner, _mode, 0, false)
  ON CONFLICT (business_id, mode) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_wallet;

  RETURN v_wallet;
END;
$function$;

-- 3. Staff read access across messaging tables for the admin console
CREATE POLICY "Staff select sms wallets" ON public.sms_wallets FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select sms ledger" ON public.sms_wallet_ledger FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select sms campaigns" ON public.sms_campaigns FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select sms messages" ON public.sms_messages FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select sender ids" ON public.sms_sender_ids FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select otp requests" ON public.sms_otp_requests FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select voice campaigns" ON public.voice_campaigns FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select voice calls" ON public.voice_calls FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "Staff select ussd sessions" ON public.ussd_sessions FOR SELECT TO authenticated USING (public.is_staff());

-- 4. Admin write access: sender ID decisions and rate card edits
CREATE POLICY "Admins update sender ids" ON public.sms_sender_ids FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins update rates" ON public.sms_rates FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());