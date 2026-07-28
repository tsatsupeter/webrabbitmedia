
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  bank_id uuid REFERENCES public.bank_verification(id) ON DELETE SET NULL,
  name text NOT NULL,
  mode text NOT NULL DEFAULT 'test',
  currency text NOT NULL DEFAULT 'GHS',
  gross_amount numeric NOT NULL DEFAULT 0,
  fees numeric NOT NULL DEFAULT 0,
  tax_deducted numeric NOT NULL DEFAULT 0,
  currency_conversion numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Bank Transfer',
  status text NOT NULL DEFAULT 'pending',
  provider_reference text,
  notes text,
  initiated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own payouts" ON public.payouts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_payouts_business_mode ON public.payouts(business_id, mode, initiated_at DESC);

ALTER TABLE public.transactions ADD COLUMN payout_id uuid REFERENCES public.payouts(id) ON DELETE SET NULL;
CREATE INDEX idx_transactions_payout_id ON public.transactions(payout_id);
