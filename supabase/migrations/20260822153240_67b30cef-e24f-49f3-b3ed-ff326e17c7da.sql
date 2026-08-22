SELECT vault.create_secret('a25eb4eea32f57bcb04868f7f7dadf1b269af65a979a785b293640d7f8549794', 'webhook_cron_secret', 'Auth token for the webhook-dispatch cron job');

SELECT cron.unschedule('webhook-dispatch-every-minute');

SELECT cron.schedule(
  'webhook-dispatch-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://eydjkasswyygiycitnml.supabase.co/functions/v1/webhook-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'webhook_cron_secret' LIMIT 1)
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);