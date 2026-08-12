ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS messaging_emails boolean NOT NULL DEFAULT true;

-- Payments: in-app notification alongside the existing email
CREATE OR REPLACE FUNCTION public.notify_transaction_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type <> 'collection' THEN RETURN NEW; END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'payment', 'Payment received',
      'You received ' || NEW.currency || ' ' || NEW.gross_amount || ' from ' || coalesce(NEW.subscriber_number, 'a customer') || '.',
      '/merchant/transactions/payments', false);
  ELSIF NEW.status = 'failed' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'payment', 'Payment failed',
      coalesce(NEW.provider_reason, 'A payment attempt could not be completed.'),
      '/merchant/transactions/payments', false);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_transaction_status ON public.transactions;
CREATE TRIGGER trg_notify_transaction_status
AFTER UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.notify_transaction_status();

-- Sender IDs: notification + email on decision
CREATE OR REPLACE FUNCTION public.notify_sender_id_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'messaging', 'Sender ID approved',
      'Your sender ID "' || NEW.name || '" is approved and ready to use.', '/sms/sender-ids', false);
    PERFORM public.enqueue_email('sender_id_approved', NEW.user_id, NEW.business_id,
      jsonb_build_object('sender_name', NEW.name));
  ELSIF NEW.status IN ('rejected','declined') THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'messaging', 'Sender ID declined',
      'Your sender ID "' || NEW.name || '" was declined: ' || coalesce(NEW.rejection_reason, 'no reason provided.'),
      '/sms/sender-ids', false);
    PERFORM public.enqueue_email('sender_id_rejected', NEW.user_id, NEW.business_id,
      jsonb_build_object('sender_name', NEW.name, 'reason', NEW.rejection_reason));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_sender_id_decision ON public.sms_sender_ids;
CREATE TRIGGER trg_notify_sender_id_decision
AFTER UPDATE ON public.sms_sender_ids
FOR EACH ROW EXECUTE FUNCTION public.notify_sender_id_decision();

-- Wallet: top-up receipt + low balance warning
CREATE OR REPLACE FUNCTION public.notify_sms_wallet_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.mode <> 'live' THEN RETURN NEW; END IF;

  IF NEW.entry_type = 'topup' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'messaging', 'Messaging credits added',
      'GHS ' || NEW.amount || ' was added to your messaging wallet. New balance: GHS ' || NEW.balance_after || '.',
      '/sms/wallet', false);
    PERFORM public.enqueue_email('wallet_topup', NEW.user_id, NEW.business_id,
      jsonb_build_object('amount', NEW.amount, 'balance', NEW.balance_after));
  ELSIF NEW.entry_type = 'charge' AND NEW.balance_after < 20 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.business_id = NEW.business_id
        AND n.category = 'messaging'
        AND n.title = 'Low messaging balance'
        AND n.created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
      VALUES (NEW.user_id, NEW.business_id, 'messaging', 'Low messaging balance',
        'Your messaging wallet is down to GHS ' || NEW.balance_after || '. Top up to keep sending.',
        '/sms/wallet', false);
      PERFORM public.enqueue_email('wallet_low_balance', NEW.user_id, NEW.business_id,
        jsonb_build_object('balance', NEW.balance_after));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_sms_wallet_entry ON public.sms_wallet_ledger;
CREATE TRIGGER trg_notify_sms_wallet_entry
AFTER INSERT ON public.sms_wallet_ledger
FOR EACH ROW EXECUTE FUNCTION public.notify_sms_wallet_entry();

-- Campaigns: finished / failed
CREATE OR REPLACE FUNCTION public.notify_sms_campaign_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status IN ('sent','completed') THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'messaging', 'Campaign sent',
      '"' || NEW.name || '" was sent to ' || NEW.recipients_count || ' recipients.',
      '/sms/campaigns', false);
    PERFORM public.enqueue_email('campaign_sent', NEW.user_id, NEW.business_id,
      jsonb_build_object('campaign_name', NEW.name, 'recipients', NEW.recipients_count, 'cost', NEW.cost));
  ELSIF NEW.status = 'failed' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (NEW.user_id, NEW.business_id, 'messaging', 'Campaign failed',
      coalesce(NEW.failure_reason, 'The campaign could not be delivered.'),
      '/sms/campaigns', false);
    PERFORM public.enqueue_email('campaign_failed', NEW.user_id, NEW.business_id,
      jsonb_build_object('campaign_name', NEW.name, 'reason', NEW.failure_reason));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_sms_campaign_status ON public.sms_campaigns;
CREATE TRIGGER trg_notify_sms_campaign_status
AFTER UPDATE ON public.sms_campaigns
FOR EACH ROW EXECUTE FUNCTION public.notify_sms_campaign_status();