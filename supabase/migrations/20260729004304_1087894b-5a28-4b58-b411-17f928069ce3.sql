
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  logo_path text,
  statement_descriptor text,
  url text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX brands_one_primary_per_business
  ON public.brands(business_id) WHERE is_primary;
CREATE INDEX brands_business_id_idx ON public.brands(business_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands TO authenticated;
GRANT ALL ON public.brands TO service_role;

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select brands" ON public.brands
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert brands" ON public.brands
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update brands" ON public.brands
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete brands" ON public.brands
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure first brand for a business is primary automatically.
CREATE OR REPLACE FUNCTION public.brands_ensure_first_primary()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE business_id = NEW.business_id) THEN
    NEW.is_primary := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER brands_ensure_first_primary_tr
  BEFORE INSERT ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.brands_ensure_first_primary();

-- When a brand becomes primary, demote other primaries for the same business.
CREATE OR REPLACE FUNCTION public.brands_enforce_single_primary()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.brands
      SET is_primary = false
      WHERE business_id = NEW.business_id
        AND id <> NEW.id
        AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER brands_enforce_single_primary_tr
  AFTER INSERT OR UPDATE OF is_primary ON public.brands
  FOR EACH ROW WHEN (NEW.is_primary)
  EXECUTE FUNCTION public.brands_enforce_single_primary();

-- Auto-seed a primary brand for each new business.
CREATE OR REPLACE FUNCTION public.seed_primary_brand_for_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.brands (business_id, user_id, name, is_primary)
  VALUES (NEW.id, NEW.user_id, NEW.name, true)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_primary_brand_after_business
  AFTER INSERT ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.seed_primary_brand_for_business();

-- Backfill: every existing business without brands gets one primary brand.
INSERT INTO public.brands (business_id, user_id, name, is_primary)
SELECT b.id, b.user_id, b.name, true
FROM public.businesses b
WHERE NOT EXISTS (SELECT 1 FROM public.brands br WHERE br.business_id = b.id);
