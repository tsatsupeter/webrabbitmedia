CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  mode text NOT NULL DEFAULT 'test',
  events text[] NOT NULL DEFAULT ARRAY['collection.approved','collection.failed']::text[],
  description text,
  secret_hash text NOT NULL,
  secret_last4 text NOT NULL,
  status text NOT NULL DEFAULT 'enabled',
  disabled_reason text,
  failure_streak integer NOT NULL DEFAULT 0,
  last_delivery_at timestamptz,
  last_status_code integer,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_endpoints_mode_chk CHECK (mode IN ('test','live')),
  CONSTRAINT webhook_endpoints_status_chk CHECK (status IN ('enabled','disabled'))
);

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  mode text NOT NULL,
  type text NOT NULL,
  resource_type text,
  resource_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 6,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  response_code integer,
  response_body text,
  error text,
  duration_ms integer,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_deliveries_status_chk CHECK (status IN ('pending','succeeded','failed'))
);

CREATE INDEX webhook_endpoints_business_idx ON public.webhook_endpoints (business_id, mode);
CREATE INDEX webhook_events_business_idx ON public.webhook_events (business_id, created_at DESC);
CREATE INDEX webhook_deliveries_business_idx ON public.webhook_deliveries (business_id, created_at DESC);
CREATE INDEX webhook_deliveries_due_idx ON public.webhook_deliveries (status, next_attempt_at);

GRANT SELECT ON public.webhook_endpoints TO authenticated;
GRANT ALL ON public.webhook_endpoints TO service_role;
GRANT SELECT ON public.webhook_events TO authenticated;
GRANT ALL ON public.webhook_events TO service_role;
GRANT SELECT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_select" ON public.webhook_endpoints
FOR SELECT TO authenticated USING (public.is_business_member(business_id) OR public.is_staff());

CREATE POLICY "webhook_events_select" ON public.webhook_events
FOR SELECT TO authenticated USING (public.is_business_member(business_id) OR public.is_staff());

CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries
FOR SELECT TO authenticated USING (public.is_business_member(business_id) OR public.is_staff());

CREATE TRIGGER webhook_endpoints_updated_at BEFORE UPDATE ON public.webhook_endpoints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER webhook_deliveries_updated_at BEFORE UPDATE ON public.webhook_deliveries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();