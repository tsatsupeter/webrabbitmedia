ALTER TABLE public.bank_verification
  ADD COLUMN IF NOT EXISTS destination_type text NOT NULL DEFAULT 'bank',
  ADD COLUMN IF NOT EXISTS momo_network text,
  ADD COLUMN IF NOT EXISTS account_name_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.bank_verification_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.destination_type NOT IN ('bank','momo') THEN
    RAISE EXCEPTION 'destination_type must be bank or momo';
  END IF;

  IF NEW.destination_type = 'momo' THEN
    IF NEW.momo_network IS NULL OR NEW.momo_network NOT IN ('MTN','TELECEL','AT','GMONEY') THEN
      RAISE EXCEPTION 'momo_network must be one of MTN, TELECEL, AT, GMONEY';
    END IF;
    IF NEW.status = 'submitted' THEN
      IF coalesce(NEW.account_number,'') !~ '^0[0-9]{9}$' THEN
        RAISE EXCEPTION 'wallet number must be a 10-digit number starting with 0';
      END IF;
      IF coalesce(NEW.account_holder_name,'') = '' THEN
        RAISE EXCEPTION 'account holder name required';
      END IF;
    END IF;
  ELSE
    NEW.momo_network := NULL;
    IF NEW.status = 'submitted' THEN
      IF coalesce(NEW.account_number,'') = ''
         OR coalesce(NEW.bank_name,'') = ''
         OR coalesce(NEW.account_holder_name,'') = '' THEN
        RAISE EXCEPTION 'bank name, account number and account holder name are required';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bank_verification_validate ON public.bank_verification;
CREATE TRIGGER trg_bank_verification_validate
BEFORE INSERT OR UPDATE ON public.bank_verification
FOR EACH ROW EXECUTE FUNCTION public.bank_verification_validate();