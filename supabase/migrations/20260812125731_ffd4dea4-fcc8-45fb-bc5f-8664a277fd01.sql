CREATE TABLE public.business_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_email text NOT NULL,
  to_user_id uuid,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.business_transfers TO authenticated;
GRANT ALL ON public.business_transfers TO service_role;

ALTER TABLE public.business_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view transfers for own business"
ON public.business_transfers FOR SELECT TO authenticated
USING (
  from_user_id = auth.uid()
  OR lower(to_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  OR to_user_id = auth.uid()
);

CREATE POLICY "Owner can create transfers for own business"
ON public.business_transfers FOR INSERT TO authenticated
WITH CHECK (
  from_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Owner can cancel own pending transfer"
ON public.business_transfers FOR UPDATE TO authenticated
USING (from_user_id = auth.uid() AND status = 'pending')
WITH CHECK (from_user_id = auth.uid() AND status IN ('pending','cancelled'));

CREATE POLICY "Staff can view transfers"
ON public.business_transfers FOR SELECT TO authenticated
USING (public.is_staff());

CREATE INDEX idx_business_transfers_token ON public.business_transfers (token);
CREATE INDEX idx_business_transfers_business_status ON public.business_transfers (business_id, status);
CREATE INDEX idx_business_transfers_email ON public.business_transfers (lower(to_email));

CREATE TRIGGER trg_business_transfers_updated
BEFORE UPDATE ON public.business_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();