
CREATE TABLE public.product_information (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  websites text[] NOT NULL DEFAULT '{}',
  description text,
  category text,
  receive_methods text[] NOT NULL DEFAULT '{}',
  receive_flow text,
  delivery_level text,
  risks text[] NOT NULL DEFAULT '{}',
  integrations text[] NOT NULL DEFAULT '{}',
  acquisitions text[] NOT NULL DEFAULT '{}',
  other_acquisition text,
  socials text[] NOT NULL DEFAULT '{}',
  stage text,
  payment_platform text,
  status text NOT NULL DEFAULT 'draft',
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_information TO authenticated;
GRANT ALL ON public.product_information TO service_role;

ALTER TABLE public.product_information ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own product info" ON public.product_information
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own product info" ON public.product_information
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own product info" ON public.product_information
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own product info" ON public.product_information
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_product_information_updated_at
  BEFORE UPDATE ON public.product_information
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
