CREATE OR REPLACE FUNCTION public.notify_business_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
    VALUES (
      NEW.user_id,
      NEW.id,
      'approval',
      'Business approved',
      'Your business is approved for live payments and payouts.',
      '/merchant',
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_payout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.businesses WHERE id = NEW.business_id;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'paid' THEN
      INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
      VALUES (v_user_id, NEW.business_id, 'payout', 'Payout completed', 'Your payout of ' || NEW.currency || ' ' || NEW.net_amount || ' has been sent.', '/merchant/payouts/history', false);
    ELSIF NEW.status = 'failed' THEN
      INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
      VALUES (v_user_id, NEW.business_id, 'payout', 'Payout failed', 'Your payout could not be processed. Please check your bank details or contact support.', '/merchant/payouts', false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_approved_notification ON public.businesses;
CREATE TRIGGER business_approved_notification
AFTER UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.notify_business_approved();

DROP TRIGGER IF EXISTS payout_notification ON public.payouts;
CREATE TRIGGER payout_notification
AFTER UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.notify_payout();