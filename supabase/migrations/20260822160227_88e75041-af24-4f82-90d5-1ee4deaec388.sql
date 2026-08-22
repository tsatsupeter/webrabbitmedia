ALTER TABLE public.webhook_endpoints
  ADD COLUMN IF NOT EXISTS custom_headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS transformation_code text,
  ADD COLUMN IF NOT EXISTS transformation_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.webhook_deliveries
  ADD COLUMN IF NOT EXISTS transform_error text,
  ADD COLUMN IF NOT EXISTS replay_of uuid;

CREATE INDEX IF NOT EXISTS webhook_deliveries_endpoint_created_idx
  ON public.webhook_deliveries (endpoint_id, created_at DESC);