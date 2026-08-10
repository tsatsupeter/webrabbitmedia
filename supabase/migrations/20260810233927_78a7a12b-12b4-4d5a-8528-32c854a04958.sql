ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS gateway text NOT NULL DEFAULT 'liberte';

CREATE OR REPLACE FUNCTION public.platform_settings_validate_gateway()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.gateway NOT IN ('liberte','junipay') THEN
    RAISE EXCEPTION 'gateway must be liberte or junipay';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_settings_validate_gateway ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_validate_gateway
BEFORE INSERT OR UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.platform_settings_validate_gateway();