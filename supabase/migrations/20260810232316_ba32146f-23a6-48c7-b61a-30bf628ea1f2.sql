CREATE TABLE public.software_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  project_type text NOT NULL,
  description text NOT NULL,
  budget text,
  timeline text,
  contact_email text,
  contact_phone text,
  status text NOT NULL DEFAULT 'new',
  admin_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.software_requests TO authenticated;
GRANT ALL ON public.software_requests TO service_role;

ALTER TABLE public.software_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own software requests"
  ON public.software_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY "Users create own software requests"
  ON public.software_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own software requests"
  ON public.software_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff update software requests"
  ON public.software_requests FOR UPDATE TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TRIGGER update_software_requests_updated_at
  BEFORE UPDATE ON public.software_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();