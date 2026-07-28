CREATE OR REPLACE FUNCTION public.notify_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.businesses WHERE id = NEW.business_id;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'success' THEN
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