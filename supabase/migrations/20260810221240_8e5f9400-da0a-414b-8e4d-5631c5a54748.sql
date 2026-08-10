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
      'Live payments enabled',
      'Congratulations — ' || NEW.name || ' is approved. You can now switch to Live mode and accept real payments.',
      '/merchant',
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_business_approved() FROM anon, authenticated, public;