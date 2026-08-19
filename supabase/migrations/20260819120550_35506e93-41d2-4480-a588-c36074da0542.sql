-- ============ Web Rabbit Studio ============

CREATE TABLE public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid not null,
  title text not null default 'New project',
  goal text,
  project_type text,
  status text not null default 'draft',
  brief jsonb not null default '{}'::jsonb,
  estimate_min numeric not null default 0,
  estimate_max numeric not null default 0,
  weeks_min integer not null default 0,
  weeks_max integer not null default 0,
  currency text not null default 'GHS',
  contact_email text,
  contact_phone text,
  proposal jsonb,
  proposal_sent_at timestamptz,
  approved_at timestamptz,
  change_request text,
  admin_note text,
  submitted_at timestamptz,
  launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_projects TO authenticated;
GRANT ALL ON public.studio_projects TO service_role;
ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_projects_select" ON public.studio_projects FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (business_id IS NOT NULL AND public.is_business_member(business_id)) OR public.is_staff());
CREATE POLICY "studio_projects_insert" ON public.studio_projects FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (business_id IS NULL OR public.is_business_member(business_id)));
CREATE POLICY "studio_projects_update" ON public.studio_projects FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (business_id IS NOT NULL AND public.is_business_editor(business_id)) OR public.is_staff())
  WITH CHECK (user_id = auth.uid() OR (business_id IS NOT NULL AND public.is_business_editor(business_id)) OR public.is_staff());
CREATE POLICY "studio_projects_delete_draft" ON public.studio_projects FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');
CREATE TRIGGER trg_studio_projects_updated BEFORE UPDATE ON public.studio_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Milestones -------------------------------------------------------------
CREATE TABLE public.studio_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  title text not null,
  description text,
  amount numeric not null default 0,
  currency text not null default 'GHS',
  due_date date,
  status text not null default 'pending',
  order_index integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_milestones TO authenticated;
GRANT ALL ON public.studio_milestones TO service_role;
ALTER TABLE public.studio_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_milestones_select" ON public.studio_milestones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)) OR public.is_staff())));
CREATE POLICY "studio_milestones_staff_write" ON public.studio_milestones FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_studio_milestones_updated BEFORE UPDATE ON public.studio_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages ---------------------------------------------------------------
CREATE TABLE public.studio_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  author_id uuid,
  author_label text,
  author_role text not null default 'client',
  body text not null,
  attachment_path text,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.studio_messages TO authenticated;
GRANT ALL ON public.studio_messages TO service_role;
ALTER TABLE public.studio_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_messages_select" ON public.studio_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)) OR public.is_staff())));
CREATE POLICY "studio_messages_insert" ON public.studio_messages FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)) OR public.is_staff())));

-- Files ------------------------------------------------------------------
CREATE TABLE public.studio_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  uploaded_by uuid,
  uploader_role text not null default 'client',
  label text,
  path text not null,
  kind text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, DELETE ON public.studio_files TO authenticated;
GRANT ALL ON public.studio_files TO service_role;
ALTER TABLE public.studio_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_files_select" ON public.studio_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)) OR public.is_staff())));
CREATE POLICY "studio_files_insert" ON public.studio_files FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)) OR public.is_staff())));
CREATE POLICY "studio_files_delete_own" ON public.studio_files FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_staff());

-- Invoices ---------------------------------------------------------------
CREATE TABLE public.studio_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  milestone_id uuid references public.studio_milestones(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  user_id uuid not null,
  amount numeric not null,
  currency text not null default 'GHS',
  description text,
  status text not null default 'due',
  due_date date,
  reference text not null unique,
  provider_reference text,
  gateway text,
  msisdn text,
  network text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.studio_invoices TO authenticated;
GRANT ALL ON public.studio_invoices TO service_role;
ALTER TABLE public.studio_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_invoices_select" ON public.studio_invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (business_id IS NOT NULL AND public.is_business_member(business_id)) OR public.is_staff());
CREATE POLICY "studio_invoices_staff_write" ON public.studio_invoices FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE TRIGGER trg_studio_invoices_updated BEFORE UPDATE ON public.studio_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Events (timeline) ------------------------------------------------------
CREATE TABLE public.studio_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  actor_id uuid,
  actor_label text,
  type text not null,
  message text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.studio_events TO authenticated;
GRANT ALL ON public.studio_events TO service_role;
ALTER TABLE public.studio_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio_events_select" ON public.studio_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)) OR public.is_staff())));
CREATE POLICY "studio_events_insert" ON public.studio_events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.studio_projects p WHERE p.id = project_id
    AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_editor(p.business_id)) OR public.is_staff())));

CREATE INDEX idx_studio_projects_user ON public.studio_projects(user_id, created_at DESC);
CREATE INDEX idx_studio_projects_business ON public.studio_projects(business_id);
CREATE INDEX idx_studio_messages_project ON public.studio_messages(project_id, created_at);
CREATE INDEX idx_studio_events_project ON public.studio_events(project_id, created_at DESC);
CREATE INDEX idx_studio_milestones_project ON public.studio_milestones(project_id, order_index);
CREATE INDEX idx_studio_invoices_project ON public.studio_invoices(project_id, created_at DESC);

-- Notifications on status change ----------------------------------------
CREATE OR REPLACE FUNCTION public.notify_studio_project_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_msg text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'proposal_sent' THEN
    v_title := 'Proposal ready';
    v_msg := 'We have sent a proposal for "' || NEW.title || '". Review and approve it to get started.';
  ELSIF NEW.status = 'in_progress' THEN
    v_title := 'Project started';
    v_msg := 'Work has started on "' || NEW.title || '".';
  ELSIF NEW.status = 'in_review' THEN
    v_title := 'Ready for your review';
    v_msg := '"' || NEW.title || '" is ready for your review.';
  ELSIF NEW.status = 'launched' THEN
    v_title := 'Project launched';
    v_msg := '"' || NEW.title || '" is live. Your handover pack is in the Files tab.';
  ELSIF NEW.status = 'reviewing' THEN
    v_title := 'Brief received';
    v_msg := 'We are reviewing your brief for "' || NEW.title || '".';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
  VALUES (NEW.user_id, NEW.business_id, 'studio', v_title, v_msg, '/studio/projects/' || NEW.id, false);

  PERFORM public.enqueue_email('studio_status', NEW.user_id, NEW.business_id,
    jsonb_build_object('project', NEW.title, 'status', NEW.status, 'headline', v_title, 'body', v_msg,
                       'link', '/studio/projects/' || NEW.id));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_studio_project_status AFTER UPDATE ON public.studio_projects
  FOR EACH ROW EXECUTE FUNCTION public.notify_studio_project_status();

-- Notification when the team replies ------------------------------------
CREATE OR REPLACE FUNCTION public.notify_studio_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p public.studio_projects;
BEGIN
  IF NEW.author_role <> 'staff' THEN RETURN NEW; END IF;
  SELECT * INTO p FROM public.studio_projects WHERE id = NEW.project_id;
  IF p.id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
  VALUES (p.user_id, p.business_id, 'studio', 'New message from Web Rabbit',
    left(NEW.body, 160), '/studio/projects/' || p.id, false);

  PERFORM public.enqueue_email('studio_message', p.user_id, p.business_id,
    jsonb_build_object('project', p.title, 'body', NEW.body, 'link', '/studio/projects/' || p.id));
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_studio_message AFTER INSERT ON public.studio_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_studio_message();

-- Notification when an invoice is raised ---------------------------------
CREATE OR REPLACE FUNCTION public.notify_studio_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'studio', 'New invoice',
      NEW.currency || ' ' || NEW.amount || ' is due for your project.', '/studio/projects/' || NEW.project_id, false);
    PERFORM public.enqueue_email('studio_invoice', NEW.user_id, NEW.business_id,
      jsonb_build_object('amount', NEW.amount, 'currency', NEW.currency, 'description', NEW.description,
                         'link', '/studio/projects/' || NEW.project_id));
  ELSIF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'studio', 'Payment received',
      'Thanks — we received ' || NEW.currency || ' ' || NEW.amount || '.', '/studio/projects/' || NEW.project_id, false);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_studio_invoice AFTER INSERT OR UPDATE ON public.studio_invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_studio_invoice();

-- Migrate legacy software_requests --------------------------------------
INSERT INTO public.studio_projects
  (user_id, business_id, title, project_type, status, brief, contact_email, contact_phone, admin_note, submitted_at, created_at)
SELECT
  sr.user_id,
  sr.business_id,
  coalesce(nullif(sr.project_type, ''), 'Project request'),
  sr.project_type,
  CASE WHEN sr.status = 'new' THEN 'submitted'
       WHEN sr.status = 'closed' THEN 'launched'
       ELSE 'reviewing' END,
  jsonb_build_object('description', sr.description, 'budget', sr.budget, 'timeline', sr.timeline, 'legacy', true),
  sr.contact_email,
  sr.contact_phone,
  sr.admin_note,
  sr.created_at,
  sr.created_at
FROM public.software_requests sr;

-- Realtime ---------------------------------------------------------------
ALTER TABLE public.studio_messages REPLICA IDENTITY FULL;
ALTER TABLE public.studio_projects REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.studio_projects;

-- Storage policies for the studio-files bucket ---------------------------
CREATE POLICY "studio_files_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'studio-files' AND (
    public.is_staff() OR EXISTS (
      SELECT 1 FROM public.studio_projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)))
    )));
CREATE POLICY "studio_files_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-files' AND (
    public.is_staff() OR EXISTS (
      SELECT 1 FROM public.studio_projects p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND (p.user_id = auth.uid() OR (p.business_id IS NOT NULL AND public.is_business_member(p.business_id)))
    )));
CREATE POLICY "studio_files_remove" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'studio-files' AND (owner = auth.uid() OR public.is_staff()));