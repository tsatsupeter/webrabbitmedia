CREATE TABLE public.webhook_endpoint_secrets (
  endpoint_id uuid PRIMARY KEY REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.webhook_endpoint_secrets TO service_role;

ALTER TABLE public.webhook_endpoint_secrets ENABLE ROW LEVEL SECURITY;