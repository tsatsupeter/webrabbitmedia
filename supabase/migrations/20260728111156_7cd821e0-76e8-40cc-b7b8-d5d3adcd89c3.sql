CREATE TABLE public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL,
  api_key_id uuid NOT NULL,
  endpoint text NOT NULL,
  key text NOT NULL,
  request_hash text NOT NULL,
  status_code int,
  response_body jsonb,
  transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (business_id, endpoint, key)
);
GRANT ALL ON public.idempotency_keys TO service_role;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.idempotency_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idempotency_keys_gc_idx ON public.idempotency_keys (created_at);