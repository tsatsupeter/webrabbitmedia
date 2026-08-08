-- 1. Role enum + table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','support','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','support')
  )
$$;

DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read audit log" ON public.admin_audit_log;
CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins write audit log" ON public.admin_audit_log;
CREATE POLICY "Admins write audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND actor_id = auth.uid());

-- 3. Additive admin read policies
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'businesses','business_verification','identity_verification','bank_verification','product_information',
    'transactions','payouts','brands','api_keys','team_members','team_invites','platform_settings','profiles',
    'sms_campaigns','sms_messages','sms_wallets','sms_wallet_ledger','sms_contacts','sms_sender_ids',
    'sms_otp_requests','ussd_codes','ussd_sessions','voice_campaigns','voice_calls','notifications'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can view all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins can view all" ON public.%I FOR SELECT TO authenticated USING (public.is_admin())', t);
  END LOOP;
END $$;

-- 4. Admin update policies (full admins only)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'businesses','business_verification','identity_verification','bank_verification','product_information',
    'payouts','platform_settings','sms_sender_ids','ussd_codes'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can update all" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Admins can update all" ON public.%I FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),''admin'')) WITH CHECK (public.has_role(auth.uid(),''admin''))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE ON public.platform_settings TO authenticated;
GRANT UPDATE ON public.payouts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT INSERT ON public.admin_audit_log TO authenticated;

-- 5. Seed first admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM public.profiles WHERE email = 'tsatsupeter@gmail.com'
ON CONFLICT DO NOTHING;