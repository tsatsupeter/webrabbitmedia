ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS business_type text
  CHECK (business_type IN ('individual','registered'));