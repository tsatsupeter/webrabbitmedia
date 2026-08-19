
-- ============ developer_profiles ============
CREATE TABLE public.developer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  headline text,
  skills text[] NOT NULL DEFAULT '{}',
  seniority text NOT NULL DEFAULT 'mid',
  rate numeric NOT NULL DEFAULT 0,
  rate_unit text NOT NULL DEFAULT 'hour',
  currency text NOT NULL DEFAULT 'GHS',
  portfolio_url text,
  github_url text,
  linkedin_url text,
  availability text NOT NULL DEFAULT 'part_time',
  pitch text,
  avatar_url text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  source text NOT NULL DEFAULT 'applied',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.developer_profiles TO authenticated;
GRANT ALL ON public.developer_profiles TO service_role;
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

-- ============ helper functions ============
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.developer_profiles
    WHERE user_id = auth.uid() AND status = 'approved'
  )
$$;

-- ============ project_assignments ============
CREATE TABLE public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  developer_id uuid NOT NULL,
  developer_profile_id uuid REFERENCES public.developer_profiles(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'developer',
  pay_type text NOT NULL DEFAULT 'fixed',
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  hours numeric NOT NULL DEFAULT 0,
  note text,
  status text NOT NULL DEFAULT 'active',
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX project_assignments_one_lead
  ON public.project_assignments (project_id)
  WHERE role = 'lead' AND status = 'active';

CREATE UNIQUE INDEX project_assignments_unique_active
  ON public.project_assignments (project_id, developer_id)
  WHERE status = 'active';

CREATE INDEX project_assignments_dev_idx ON public.project_assignments (developer_id, status);

GRANT SELECT ON public.project_assignments TO authenticated;
GRANT ALL ON public.project_assignments TO service_role;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_developer(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments a
    JOIN public.developer_profiles d ON d.user_id = a.developer_id
    WHERE a.project_id = _project_id
      AND a.developer_id = auth.uid()
      AND a.status = 'active'
      AND d.status = 'approved'
  )
$$;

-- ============ developer_invites ============
CREATE TABLE public.developer_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  note text,
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.developer_invites TO authenticated;
GRANT ALL ON public.developer_invites TO service_role;
ALTER TABLE public.developer_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY developer_invites_staff ON public.developer_invites
  FOR SELECT TO authenticated USING (public.is_staff());

-- ============ developer_earnings ============
CREATE TABLE public.developer_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.project_assignments(id) ON DELETE SET NULL,
  project_id uuid NOT NULL REFERENCES public.studio_projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.studio_milestones(id) ON DELETE SET NULL,
  developer_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GHS',
  description text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  reference text,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX developer_earnings_dev_idx ON public.developer_earnings (developer_id, status);

GRANT SELECT ON public.developer_earnings TO authenticated;
GRANT ALL ON public.developer_earnings TO service_role;
ALTER TABLE public.developer_earnings ENABLE ROW LEVEL SECURITY;

-- ============ policies ============
CREATE POLICY developer_profiles_select_own ON public.developer_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

CREATE POLICY developer_profiles_select_teammates ON public.developer_profiles
  FOR SELECT TO authenticated
  USING (
    status = 'approved' AND EXISTS (
      SELECT 1 FROM public.project_assignments a
      JOIN public.studio_projects p ON p.id = a.project_id
      WHERE a.developer_id = developer_profiles.user_id
        AND a.status = 'active'
        AND (
          p.user_id = auth.uid()
          OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id))
          OR public.is_project_developer(p.id)
        )
    )
  );

CREATE POLICY developer_profiles_insert_own ON public.developer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY developer_profiles_update_own ON public.developer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY developer_profiles_staff_all ON public.developer_profiles
  FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE POLICY project_assignments_select ON public.project_assignments
  FOR SELECT TO authenticated
  USING (
    developer_id = auth.uid()
    OR public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.studio_projects p
      WHERE p.id = project_assignments.project_id
        AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)))
    )
    OR public.is_project_developer(project_id)
  );

CREATE POLICY developer_earnings_select ON public.developer_earnings
  FOR SELECT TO authenticated
  USING (developer_id = auth.uid() OR public.is_staff());

-- ============ additive studio access for assigned developers ============
CREATE POLICY studio_projects_select_dev ON public.studio_projects
  FOR SELECT TO authenticated USING (public.is_project_developer(id));

CREATE POLICY studio_milestones_select_dev ON public.studio_milestones
  FOR SELECT TO authenticated USING (public.is_project_developer(project_id));

CREATE POLICY studio_files_select_dev ON public.studio_files
  FOR SELECT TO authenticated USING (public.is_project_developer(project_id));

CREATE POLICY studio_files_insert_dev ON public.studio_files
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.is_project_developer(project_id));

CREATE POLICY studio_messages_select_dev ON public.studio_messages
  FOR SELECT TO authenticated USING (public.is_project_developer(project_id));

CREATE POLICY studio_messages_insert_dev ON public.studio_messages
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_project_developer(project_id));

CREATE POLICY studio_events_select_dev ON public.studio_events
  FOR SELECT TO authenticated USING (public.is_project_developer(project_id));

CREATE POLICY studio_events_insert_dev ON public.studio_events
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_developer(project_id));

-- ============ updated_at triggers ============
CREATE TRIGGER trg_developer_profiles_updated BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_developer_invites_updated BEFORE UPDATE ON public.developer_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_project_assignments_updated BEFORE UPDATE ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_developer_earnings_updated BEFORE UPDATE ON public.developer_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ notifications ============
CREATE OR REPLACE FUNCTION public.notify_developer_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, category, title, message, link, read)
    VALUES (NEW.user_id, 'developer', 'You are in',
      'Your Web Rabbit developer application was approved. Your workspace is ready.', '/dev', false);
    PERFORM public.enqueue_email('developer_approved', NEW.user_id, NULL,
      jsonb_build_object('name', NEW.display_name));
  ELSIF NEW.status = 'declined' THEN
    INSERT INTO public.notifications (user_id, category, title, message, link, read)
    VALUES (NEW.user_id, 'developer', 'Application declined',
      coalesce(NEW.rejection_reason, 'Your developer application was not approved at this time.'),
      '/developers/apply', false);
    PERFORM public.enqueue_email('developer_declined', NEW.user_id, NULL,
      jsonb_build_object('name', NEW.display_name, 'reason', NEW.rejection_reason));
  ELSIF NEW.status = 'suspended' THEN
    INSERT INTO public.notifications (user_id, category, title, message, link, read)
    VALUES (NEW.user_id, 'developer', 'Account suspended',
      'Your developer account has been suspended. Contact Web Rabbit for details.', '/dev', false);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_developer_application
  AFTER UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_developer_application();

CREATE OR REPLACE FUNCTION public.notify_project_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title text;
BEGIN
  SELECT title INTO v_title FROM public.studio_projects WHERE id = NEW.project_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO public.notifications (user_id, category, title, message, link, read)
    VALUES (NEW.developer_id, 'developer', 'New assignment',
      'You have been assigned to "' || coalesce(v_title, 'a project') || '" as ' || NEW.role || '.',
      '/dev/projects/' || NEW.project_id, false);
    PERFORM public.enqueue_email('developer_assigned', NEW.developer_id, NULL,
      jsonb_build_object('project', v_title, 'role', NEW.role,
                         'link', '/dev/projects/' || NEW.project_id));
    INSERT INTO public.studio_events (project_id, actor_id, actor_label, type, message)
    VALUES (NEW.project_id, NEW.assigned_by, 'Web Rabbit', 'assignment',
      'Developer assigned as ' || NEW.role || '.');
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status <> 'active' THEN
    INSERT INTO public.notifications (user_id, category, title, message, link, read)
    VALUES (NEW.developer_id, 'developer', 'Assignment ended',
      'You are no longer assigned to "' || coalesce(v_title, 'a project') || '".', '/dev/projects', false);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_project_assignment
  AFTER INSERT OR UPDATE ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_project_assignment();

CREATE OR REPLACE FUNCTION public.notify_developer_earning()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'paid') THEN
    INSERT INTO public.notifications (user_id, category, title, message, link, read)
    VALUES (NEW.developer_id, 'developer', 'Payment sent',
      NEW.currency || ' ' || NEW.amount || ' has been paid to you.', '/dev/earnings', false);
    PERFORM public.enqueue_email('developer_paid', NEW.developer_id, NULL,
      jsonb_build_object('amount', NEW.amount, 'currency', NEW.currency,
                         'reference', NEW.reference, 'description', NEW.description));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_developer_earning
  AFTER INSERT OR UPDATE ON public.developer_earnings
  FOR EACH ROW EXECUTE FUNCTION public.notify_developer_earning();
