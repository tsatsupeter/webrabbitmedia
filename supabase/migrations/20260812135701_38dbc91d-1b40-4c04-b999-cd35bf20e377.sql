ALTER TABLE public.sms_campaigns
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'bms',
  ADD COLUMN IF NOT EXISTS provider_campaign_id text,
  ADD COLUMN IF NOT EXISTS provider_response jsonb,
  ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE public.sms_messages
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

ALTER TABLE public.sms_sender_ids
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS provider_synced_at timestamptz;

ALTER TABLE public.voice_campaigns
  ADD COLUMN IF NOT EXISTS provider_campaign_id text,
  ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS provider_call_id text,
  ADD COLUMN IF NOT EXISTS provider_status text;

ALTER TABLE public.sms_otp_requests
  ADD COLUMN IF NOT EXISTS code_hash text,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_campaign_id text;

CREATE INDEX IF NOT EXISTS sms_campaigns_provider_campaign_id_idx ON public.sms_campaigns (provider_campaign_id);
CREATE INDEX IF NOT EXISTS sms_messages_campaign_idx ON public.sms_messages (campaign_id);
CREATE INDEX IF NOT EXISTS voice_calls_campaign_idx ON public.voice_calls (campaign_id);