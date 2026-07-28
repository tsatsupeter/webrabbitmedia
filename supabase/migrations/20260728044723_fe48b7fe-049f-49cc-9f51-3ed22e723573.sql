
CREATE TABLE public.business_verification (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  legal_name text,
  trading_name text,
  entity_type text,
  incorporation_date date,
  registration_number text,
  tax_id text,
  country text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  website text,
  support_email text,
  support_phone text,
  owner_name text,
  owner_role text,
  owner_dob date,
  owner_ownership_percent numeric,
  incorporation_doc_path text,
  tax_doc_path text,
  address_proof_path text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_verification TO authenticated;
GRANT ALL ON public.business_verification TO service_role;

ALTER TABLE public.business_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own business verif" ON public.business_verification
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own business verif" ON public.business_verification
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own business verif" ON public.business_verification
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own business verif" ON public.business_verification
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_business_verification_updated_at
  BEFORE UPDATE ON public.business_verification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
