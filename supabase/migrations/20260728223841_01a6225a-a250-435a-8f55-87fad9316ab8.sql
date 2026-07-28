
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  tx_emails boolean NOT NULL DEFAULT true,
  product_emails boolean NOT NULL DEFAULT true,
  security_emails boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prefs" ON public.notification_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_notif_prefs_updated BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manage members" ON public.team_members FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE POLICY "member reads own row" ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_team_members_updated BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- team_invites
CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invites TO authenticated;
GRANT ALL ON public.team_invites TO service_role;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manage invites" ON public.team_invites FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()));
CREATE TRIGGER trg_team_invites_updated BEFORE UPDATE ON public.team_invites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
