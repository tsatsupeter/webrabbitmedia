-- ============ RATES ============
CREATE TABLE public.sms_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL UNIQUE,
  unit text NOT NULL,
  unit_rate numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_rates TO authenticated;
GRANT ALL ON public.sms_rates TO service_role;
ALTER TABLE public.sms_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rates readable" ON public.sms_rates FOR SELECT TO authenticated USING (true);

INSERT INTO public.sms_rates (channel, unit, unit_rate, description) VALUES
  ('sms', 'segment', 0.035, 'Per 160-character SMS segment'),
  ('otp', 'message', 0.045, 'Per OTP message delivered'),
  ('voice', 'minute', 0.30, 'Per minute of outbound voice'),
  ('ussd', 'session', 0.05, 'Per USSD session');

-- ============ WALLET ============
CREATE TABLE public.sms_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  trial_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, mode)
);
GRANT SELECT, INSERT, UPDATE ON public.sms_wallets TO authenticated;
GRANT ALL ON public.sms_wallets TO service_role;
ALTER TABLE public.sms_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallets select" ON public.sms_wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own wallets insert" ON public.sms_wallets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sms_wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  entry_type text NOT NULL CHECK (entry_type IN ('topup','charge','refund','bonus')),
  channel text,
  amount numeric NOT NULL,
  balance_after numeric NOT NULL,
  description text,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sms_wallet_ledger TO authenticated;
GRANT ALL ON public.sms_wallet_ledger TO service_role;
ALTER TABLE public.sms_wallet_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ledger select" ON public.sms_wallet_ledger FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX sms_wallet_ledger_biz_idx ON public.sms_wallet_ledger (business_id, mode, created_at DESC);

-- ============ CONTACTS ============
CREATE TABLE public.sms_contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_contact_groups TO authenticated;
GRANT ALL ON public.sms_contact_groups TO service_role;
ALTER TABLE public.sms_contact_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own groups" ON public.sms_contact_groups FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sms_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  first_name text,
  last_name text,
  email text,
  birthday date,
  opted_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, phone)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_contacts TO authenticated;
GRANT ALL ON public.sms_contacts TO service_role;
ALTER TABLE public.sms_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own contacts" ON public.sms_contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sms_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.sms_contact_groups(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.sms_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, contact_id)
);
GRANT SELECT, INSERT, DELETE ON public.sms_group_members TO authenticated;
GRANT ALL ON public.sms_group_members TO service_role;
ALTER TABLE public.sms_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own group members" ON public.sms_group_members FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ SENDER IDS ============
CREATE TABLE public.sms_sender_ids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  sample_message text,
  use_case text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_sender_ids TO authenticated;
GRANT ALL ON public.sms_sender_ids TO service_role;
ALTER TABLE public.sms_sender_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sender ids" ON public.sms_sender_ids FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ CAMPAIGNS / MESSAGES ============
CREATE TABLE public.sms_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  name text NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  segments integer NOT NULL DEFAULT 1,
  recipients_count integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','queued','sending','completed','failed','cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_campaigns TO authenticated;
GRANT ALL ON public.sms_campaigns TO service_role;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns" ON public.sms_campaigns FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.sms_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  to_number text NOT NULL,
  sender_name text,
  message text NOT NULL,
  segments integer NOT NULL DEFAULT 1,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','rejected')),
  error_reason text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_messages TO authenticated;
GRANT ALL ON public.sms_messages TO service_role;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages" ON public.sms_messages FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX sms_messages_biz_idx ON public.sms_messages (business_id, mode, created_at DESC);

-- ============ OTP ============
CREATE TABLE public.sms_otp_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL,
  sender_name text,
  template text NOT NULL DEFAULT 'Your verification code is {code}. It expires in {minutes} minutes.',
  code_length integer NOT NULL DEFAULT 6,
  expiry_minutes integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sms_otp_settings TO authenticated;
GRANT ALL ON public.sms_otp_settings TO service_role;
ALTER TABLE public.sms_otp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own otp settings" ON public.sms_otp_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.sms_otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','verified','expired','failed')),
  cost numeric NOT NULL DEFAULT 0,
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sms_otp_requests TO authenticated;
GRANT ALL ON public.sms_otp_requests TO service_role;
ALTER TABLE public.sms_otp_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own otp requests" ON public.sms_otp_requests FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ VOICE ============
CREATE TABLE public.voice_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  name text NOT NULL,
  source text NOT NULL DEFAULT 'tts' CHECK (source IN ('tts','audio')),
  script text,
  audio_path text,
  caller_id text,
  recipients_count integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','queued','dialing','completed','failed','cancelled')),
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_campaigns TO authenticated;
GRANT ALL ON public.voice_campaigns TO service_role;
ALTER TABLE public.voice_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own voice campaigns" ON public.voice_campaigns FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.voice_campaigns(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  to_number text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','ringing','answered','no_answer','busy','failed','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_calls TO authenticated;
GRANT ALL ON public.voice_calls TO service_role;
ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own voice calls" ON public.voice_calls FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ USSD ============
CREATE TABLE public.ussd_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ussd_codes TO authenticated;
GRANT ALL ON public.ussd_codes TO service_role;
ALTER TABLE public.ussd_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ussd codes" ON public.ussd_codes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ussd_menu_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.ussd_codes(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.ussd_menu_nodes(id) ON DELETE CASCADE,
  option_key text,
  label text NOT NULL,
  prompt text,
  action text NOT NULL DEFAULT 'menu' CHECK (action IN ('menu','message','input','end')),
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ussd_menu_nodes TO authenticated;
GRANT ALL ON public.ussd_menu_nodes TO service_role;
ALTER TABLE public.ussd_menu_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ussd nodes" ON public.ussd_menu_nodes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.ussd_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid REFERENCES public.ussd_codes(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  session_ref text,
  msisdn text NOT NULL,
  steps integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('active','completed','timeout','failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.ussd_sessions TO authenticated;
GRANT ALL ON public.ussd_sessions TO service_role;
ALTER TABLE public.ussd_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ussd sessions" ON public.ussd_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ SETTINGS ============
CREATE TABLE public.sms_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE UNIQUE,
  user_id uuid NOT NULL,
  default_sender text,
  delivery_reports boolean NOT NULL DEFAULT true,
  optout_keyword text NOT NULL DEFAULT 'STOP',
  callback_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sms_settings TO authenticated;
GRANT ALL ON public.sms_settings TO service_role;
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sms settings" ON public.sms_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ TRIGGERS ============
CREATE TRIGGER trg_sms_wallets_updated BEFORE UPDATE ON public.sms_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_groups_updated BEFORE UPDATE ON public.sms_contact_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_contacts_updated BEFORE UPDATE ON public.sms_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_sender_ids_updated BEFORE UPDATE ON public.sms_sender_ids FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_campaigns_updated BEFORE UPDATE ON public.sms_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_messages_updated BEFORE UPDATE ON public.sms_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_otp_settings_updated BEFORE UPDATE ON public.sms_otp_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_voice_campaigns_updated BEFORE UPDATE ON public.voice_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_voice_calls_updated BEFORE UPDATE ON public.voice_calls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ussd_codes_updated BEFORE UPDATE ON public.ussd_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ussd_nodes_updated BEFORE UPDATE ON public.ussd_menu_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_sms_settings_updated BEFORE UPDATE ON public.sms_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ WALLET FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.sms_ensure_wallet(_business_id uuid, _mode text)
RETURNS public.sms_wallets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_wallet public.sms_wallets;
  v_bonus numeric;
BEGIN
  SELECT user_id INTO v_owner FROM public.businesses WHERE id = _business_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized for this business';
  END IF;
  IF _mode NOT IN ('test','live') THEN
    RAISE EXCEPTION 'invalid mode';
  END IF;

  SELECT * INTO v_wallet FROM public.sms_wallets WHERE business_id = _business_id AND mode = _mode;
  IF FOUND THEN
    RETURN v_wallet;
  END IF;

  -- 50 free SMS trial credits, valued at the current SMS rate.
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
$$;

CREATE OR REPLACE FUNCTION public.sms_wallet_entry(
  _business_id uuid,
  _mode text,
  _entry_type text,
  _amount numeric,
  _channel text DEFAULT NULL,
  _description text DEFAULT NULL,
  _reference text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_balance numeric;
  v_delta numeric;
BEGIN
  SELECT user_id INTO v_owner FROM public.businesses WHERE id = _business_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized for this business';
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

  PERFORM public.sms_ensure_wallet(_business_id, _mode);

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
$$;

REVOKE ALL ON FUNCTION public.sms_ensure_wallet(uuid, text) FROM public;
REVOKE ALL ON FUNCTION public.sms_wallet_entry(uuid, text, text, numeric, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.sms_ensure_wallet(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sms_wallet_entry(uuid, text, text, numeric, text, text, text) TO authenticated;