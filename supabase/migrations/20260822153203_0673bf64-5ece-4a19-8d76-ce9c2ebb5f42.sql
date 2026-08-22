CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'webhook-dispatch-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eydjkasswyygiycitnml.supabase.co/functions/v1/webhook-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);