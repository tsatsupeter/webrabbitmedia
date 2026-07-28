
CREATE TABLE public.identity_verification (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text,
  date_of_birth date,
  country text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  id_type text,
  id_number text,
  id_document_front_path text,
  id_document_back_path text,
  selfie_path text,
  status text NOT NULL DEFAULT 'draft',
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.identity_verification TO authenticated;
GRANT ALL ON public.identity_verification TO service_role;

ALTER TABLE public.identity_verification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own identity" ON public.identity_verification
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own identity" ON public.identity_verification
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own identity" ON public.identity_verification
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own identity" ON public.identity_verification
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_identity_verification_updated_at
  BEFORE UPDATE ON public.identity_verification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS: identity-docs bucket, scoped to auth.uid() as first path segment
CREATE POLICY "identity-docs users select own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "identity-docs users insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "identity-docs users update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "identity-docs users delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'identity-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
