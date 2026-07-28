
-- 1. api_keys.mode
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'test'
  CHECK (mode IN ('test','live'));

-- 2. platform_settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE,
  commission_bps int NOT NULL DEFAULT 1500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own platform settings"
  ON public.platform_settings FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));

-- 3. transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  api_key_id uuid,
  mode text NOT NULL CHECK (mode IN ('test','live')),
  provider text NOT NULL DEFAULT 'payswitch',
  type text NOT NULL CHECK (type IN ('collection','payout')),
  channel text NOT NULL CHECK (channel IN ('momo','card','bank')),
  provider_transaction_id text NOT NULL,
  provider_reference text,
  subscriber_number text,
  account_number text,
  account_bank text,
  r_switch text,
  description text,
  customer_email text,
  gross_amount numeric(14,2) NOT NULL,
  fee_amount numeric(14,2) NOT NULL DEFAULT 0,
  net_amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'GHS',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','failed','reversed')),
  provider_code text,
  provider_reason text,
  raw_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, provider_transaction_id)
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_tx_business_created ON public.transactions (business_id, created_at DESC);
CREATE INDEX idx_tx_business_mode ON public.transactions (business_id, mode);

CREATE TRIGGER trg_tx_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
