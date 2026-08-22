ALTER TABLE public.webhook_endpoints ADD COLUMN IF NOT EXISTS throttle_per_minute integer;

CREATE TABLE IF NOT EXISTS public.webhook_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  mode text not null check (mode in ('test','live')),
  alert_emails text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, mode)
);

GRANT SELECT ON public.webhook_settings TO authenticated;
GRANT ALL ON public.webhook_settings TO service_role;

ALTER TABLE public.webhook_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view webhook settings" ON public.webhook_settings;
CREATE POLICY "Members can view webhook settings"
ON public.webhook_settings FOR SELECT TO authenticated
USING (public.is_business_member(business_id));

DROP TRIGGER IF EXISTS webhook_settings_updated_at ON public.webhook_settings;
CREATE TRIGGER webhook_settings_updated_at
BEFORE UPDATE ON public.webhook_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();