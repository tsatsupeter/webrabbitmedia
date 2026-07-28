CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  website_url text NOT NULL,
  product_category text NOT NULL,
  location text NOT NULL,
  referral_source text NOT NULL,
  monetization_note text,
  disclaimer_accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own businesses" ON public.businesses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own businesses" ON public.businesses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own businesses" ON public.businesses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own businesses" ON public.businesses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX businesses_user_id_idx ON public.businesses(user_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_business_id uuid;