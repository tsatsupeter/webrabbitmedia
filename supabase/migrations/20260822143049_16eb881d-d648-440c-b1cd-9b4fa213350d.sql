CREATE TABLE public.docs_chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.docs_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.docs_chat_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL DEFAULT '',
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX docs_chat_threads_user_idx ON public.docs_chat_threads (user_id, updated_at DESC);
CREATE INDEX docs_chat_messages_thread_idx ON public.docs_chat_messages (thread_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_chat_threads TO authenticated;
GRANT ALL ON public.docs_chat_threads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.docs_chat_messages TO authenticated;
GRANT ALL ON public.docs_chat_messages TO service_role;

ALTER TABLE public.docs_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docs_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own threads" ON public.docs_chat_threads FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "own messages" ON public.docs_chat_messages FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());