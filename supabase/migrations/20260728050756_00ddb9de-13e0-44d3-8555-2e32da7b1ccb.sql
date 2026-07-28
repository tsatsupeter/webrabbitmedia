CREATE TABLE public.bank_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  user_id uuid NOT NULL,
  account_holder_name text,
  account_number text,
  routing_code text,
  routing_type text,
  bank_name text,
  branch_name text,
  branch_address text,
  country text,
  currency text,
  proof_doc_path text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_verification TO authenticated;
GRANT ALL ON public.bank_verification TO service_role;

ALTER TABLE public.bank_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own bank verif" ON public.bank_verification
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bank verif" ON public.bank_verification
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bank verif" ON public.bank_verification
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bank verif" ON public.bank_verification
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_bank_verification_updated_at
  BEFORE UPDATE ON public.bank_verification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();