CREATE TABLE public.workspace_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_label text,
  target_user_id uuid,
  target_label text,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workspace_activity TO authenticated;
GRANT ALL ON public.workspace_activity TO service_role;

ALTER TABLE public.workspace_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read workspace activity"
  ON public.workspace_activity FOR SELECT TO authenticated
  USING (public.is_business_member(business_id));

CREATE POLICY "Admins read workspace activity"
  ON public.workspace_activity FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE INDEX workspace_activity_business_created_idx
  ON public.workspace_activity (business_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_activity;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER TABLE public.businesses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses;