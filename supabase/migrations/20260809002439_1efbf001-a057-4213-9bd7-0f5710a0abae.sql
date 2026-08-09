ALTER TABLE public.product_information
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.identity_verification
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.business_verification
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.bank_verification
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS additional_info_request text,
  ADD COLUMN IF NOT EXISTS additional_info_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS additional_info_response text,
  ADD COLUMN IF NOT EXISTS additional_info_responded_at timestamptz;

CREATE OR REPLACE FUNCTION public.on_verification_hold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_step text;
  v_biz text;
BEGIN
  IF NEW.status NOT IN ('on_hold','rejected') THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status
     AND OLD.rejection_reason IS NOT DISTINCT FROM NEW.rejection_reason THEN
    RETURN NEW;
  END IF;

  v_step := CASE TG_TABLE_NAME
    WHEN 'product_information'   THEN 'product information'
    WHEN 'identity_verification' THEN 'identity verification'
    WHEN 'business_verification' THEN 'business verification'
    WHEN 'bank_verification'     THEN 'bank verification'
    ELSE TG_TABLE_NAME
  END;

  SELECT name INTO v_biz FROM public.businesses WHERE id = NEW.business_id;

  INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
  VALUES (
    NEW.user_id,
    NEW.business_id,
    'verification',
    'Additional information required',
    'Your ' || v_step || ' is on hold: ' || coalesce(NEW.rejection_reason, 'our team needs more information.'),
    '/merchant/verification',
    false
  );

  PERFORM public.enqueue_email(
    'verification_on_hold', NEW.user_id, NEW.business_id,
    jsonb_build_object(
      'step', v_step,
      'reason', NEW.rejection_reason,
      'business_name', v_biz,
      'reviewed_at', coalesce(NEW.reviewed_at, now())
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hold_product_information ON public.product_information;
CREATE TRIGGER trg_hold_product_information AFTER UPDATE ON public.product_information
FOR EACH ROW EXECUTE FUNCTION public.on_verification_hold();

DROP TRIGGER IF EXISTS trg_hold_identity_verification ON public.identity_verification;
CREATE TRIGGER trg_hold_identity_verification AFTER UPDATE ON public.identity_verification
FOR EACH ROW EXECUTE FUNCTION public.on_verification_hold();

DROP TRIGGER IF EXISTS trg_hold_business_verification ON public.business_verification;
CREATE TRIGGER trg_hold_business_verification AFTER UPDATE ON public.business_verification
FOR EACH ROW EXECUTE FUNCTION public.on_verification_hold();

DROP TRIGGER IF EXISTS trg_hold_bank_verification ON public.bank_verification;
CREATE TRIGGER trg_hold_bank_verification AFTER UPDATE ON public.bank_verification
FOR EACH ROW EXECUTE FUNCTION public.on_verification_hold();

CREATE OR REPLACE FUNCTION public.on_additional_info_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.additional_info_request IS NULL
     OR OLD.additional_info_request IS NOT DISTINCT FROM NEW.additional_info_request THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, business_id, category, title, message, link, read)
  VALUES (
    NEW.user_id, NEW.id, 'verification',
    'Additional verification required',
    NEW.additional_info_request,
    '/merchant/verification', false
  );

  PERFORM public.enqueue_email(
    'verification_on_hold', NEW.user_id, NEW.id,
    jsonb_build_object(
      'step', 'additional information',
      'reason', NEW.additional_info_request,
      'business_name', NEW.name,
      'reviewed_at', coalesce(NEW.additional_info_requested_at, now())
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_additional_info_requested ON public.businesses;
CREATE TRIGGER trg_additional_info_requested AFTER UPDATE ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.on_additional_info_requested();